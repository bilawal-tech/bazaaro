const Product = require('../models/Product');

// ── Basic helpers ─────────────────────────────
const hasVariants = (product) =>
  Array.isArray(product.variants) && product.variants.length > 0;

// Discount sirf tab maan-na jab 0 se bara aur price se chota ho
const effectivePrice = (obj) =>
  obj.discountPrice > 0 && obj.discountPrice < obj.price
    ? obj.discountPrice
    : obj.price;

const imageUrl = (img) => (typeof img === 'string' ? img : img?.url || '');

// ── Variant dhoondna ──────────────────────────
function findVariantSize(product, color, size) {
  const variant = product.variants.find((v) => v.color === color);
  const sizeDoc = variant?.sizes.find((s) => s.size === size);
  return { variant, sizeDoc };
}

// Cart/order ki ek line ko product se resolve karo.
// Price aur stock hamesha DB se aate hain, client se kabhi nahi.
function resolveLine(product, color, size) {
  if (!hasVariants(product)) {
    // Purane products jinka variant nahi: product level price/stock
    return {
      ok: true,
      color: null,
      size: null,
      unitPrice: effectivePrice(product),
      stock: product.stock,
      image: imageUrl(product.images?.[0]),
      variantised: false,
    };
  }

  if (!color || !size) {
    return { ok: false, error: `Please select color and size for ${product.name}` };
  }

  const { variant, sizeDoc } = findVariantSize(product, color, size);
  if (!variant || !sizeDoc) {
    return { ok: false, error: `${product.name} (${color} / ${size}) is not available` };
  }

  return {
    ok: true,
    color,
    size,
    unitPrice: effectivePrice(sizeDoc),
    stock: sizeDoc.stock,
    image: sizeDoc.image || variant.image || imageUrl(product.images?.[0]),
    variantised: true,
  };
}

// ── Atomic stock reserve / release ────────────
// Ek document par ek hi update, aur filter mein stock check, is liye
// do log ek saath order karein to stock minus mein nahi ja sakta.
// Top-level `stock` bhi saath saath update hota hai (variants ka total).
async function reserveOne(line) {
  const { productId, color, size, quantity } = line;

  if (!line.variantised) {
    const r = await Product.updateOne(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    );
    return r.modifiedCount === 1;
  }

  const r = await Product.updateOne(
    {
      _id: productId,
      variants: {
        $elemMatch: {
          color,
          sizes: { $elemMatch: { size, stock: { $gte: quantity } } },
        },
      },
    },
    { $inc: { 'variants.$[v].sizes.$[s].stock': -quantity, stock: -quantity } },
    { arrayFilters: [{ 'v.color': color }, { 's.size': size }] }
  );
  return r.modifiedCount === 1;
}

async function releaseOne(line) {
  const { productId, color, size, quantity } = line;

  if (!line.variantised) {
    await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
    return;
  }

  await Product.updateOne(
    {
      _id: productId,
      variants: { $elemMatch: { color, 'sizes.size': size } },
    },
    { $inc: { 'variants.$[v].sizes.$[s].stock': quantity, stock: quantity } },
    { arrayFilters: [{ 'v.color': color }, { 's.size': size }] }
  );
}

// Saari lines reserve karo. Koi ek fail ho to jo ho chuki thin wapas karo.
async function reserveStock(lines) {
  const done = [];
  for (const line of lines) {
    const ok = await reserveOne(line);
    if (!ok) {
      await releaseStock(done);
      return { ok: false, failed: line };
    }
    done.push(line);
  }
  return { ok: true };
}

async function releaseStock(lines) {
  for (const line of lines) {
    await releaseOne(line);
  }
}

// Order items se lines banao (cancel par stock wapas dene ke liye)
function linesFromOrderItems(orderItems) {
  return orderItems.map((item) => ({
    productId: item.product,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
    variantised: !!(item.color && item.size),
  }));
}

// ── Admin se aane wale variants ko validate + build karo ──
// files: multer ki files. Naming:
//   variant_{i}_image, variant_{i}_size_{j}_image
// Update par agar nayi file nahi aayi to payload ki purani image rakhi jati hai.
function buildVariants(variantsData, files = []) {
  if (!Array.isArray(variantsData)) {
    throw new Error('Variants must be an array');
  }

  const seenColors = new Set();

  return variantsData.map((variant, i) => {
    const color = String(variant.color || '').trim();
    if (!color) throw new Error(`Variant ${i + 1}: color is required`);
    if (seenColors.has(color.toLowerCase())) {
      throw new Error(`Variant ${i + 1}: duplicate color "${color}"`);
    }
    seenColors.add(color.toLowerCase());

    if (!Array.isArray(variant.sizes) || variant.sizes.length === 0) {
      throw new Error(`Variant "${color}": at least one size is required`);
    }

    const variantFile = files.find((f) => f.fieldname === `variant_${i}_image`);
    const seenSizes = new Set();

    const sizes = variant.sizes.map((s, j) => {
      const sizeName = String(s.size || '').trim();
      if (!sizeName) throw new Error(`Variant "${color}": size name is required`);
      if (seenSizes.has(sizeName.toLowerCase())) {
        throw new Error(`Variant "${color}": duplicate size "${sizeName}"`);
      }
      seenSizes.add(sizeName.toLowerCase());

      const price = Number(s.price);
      const stock = Number(s.stock);
      const costPrice = Number(s.costPrice) || 0;
      const discountPrice = Number(s.discountPrice) || 0;

      if (!(price > 0)) throw new Error(`${color} / ${sizeName}: price must be greater than 0`);
      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error(`${color} / ${sizeName}: stock must be a whole number, 0 or more`);
      }
      if (discountPrice !== 0 && discountPrice >= price) {
        throw new Error(`${color} / ${sizeName}: discount price must be less than price`);
      }

      const sizeFile = files.find((f) => f.fieldname === `variant_${i}_size_${j}_image`);

      return {
        size: sizeName,
        stock,
        price,
        costPrice,
        discountPrice,
        image: sizeFile ? `/uploads/products/${sizeFile.filename}` : s.image || null,
      };
    });

    return {
      color,
      image: variantFile ? `/uploads/products/${variantFile.filename}` : variant.image || null,
      sizes,
    };
  });
}

module.exports = {
  hasVariants,
  effectivePrice,
  imageUrl,
  findVariantSize,
  resolveLine,
  reserveStock,
  releaseStock,
  linesFromOrderItems,
  buildVariants,
};
