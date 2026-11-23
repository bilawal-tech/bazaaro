// Demo data: 2 categories + 6 products (variants ke saath).
// Chalao:      node scripts/seedDemo.js
// Sirf check:  node scripts/seedDemo.js --dry   (database mein kuch nahi likhta)
// Dobara chalane se duplicate nahi banta (naam se check hota hai).
// Images: server/uploads/products mein jo files hain wahi cycle karke lagti hain.
// Ye sirf test data hai (naam "Demo" se shuru), asli products baad mein admin se banao.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const DRY = process.argv.includes('--dry');

// Uploads folder ki images
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
const imageFiles = fs.existsSync(uploadDir)
  ? fs.readdirSync(uploadDir).filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
  : [];
let imgCursor = 0;
const nextImage = () =>
  imageFiles.length ? `/uploads/products/${imageFiles[imgCursor++ % imageFiles.length]}` : undefined;

const size = (size, stock, price, discountPrice = 0) => ({
  size, stock, price, costPrice: Math.round(price * 0.7), discountPrice,
});

function variant(color, sizes) {
  const images = [nextImage(), nextImage()].filter(Boolean);
  return { color, image: images[0], images, sizes };
}

const CATEGORIES = [
  { name: 'Demo Clothing', description: 'Demo category for testing' },
  { name: 'Demo Accessories', description: 'Demo category for testing' },
];

const PRODUCTS = [
  {
    name: 'Demo Cotton T-Shirt', brand: 'Bazaaro', category: 'Demo Clothing',
    description: 'Soft cotton t-shirt in three colors.',
    variants: [
      variant('Black', [size('S', 10, 1200), size('M', 12, 1200), size('L', 8, 1200, 999)]),
      variant('White', [size('S', 6, 1200), size('M', 0, 1200), size('L', 5, 1200)]),
      variant('Navy',  [size('M', 9, 1300, 1100), size('L', 4, 1300, 1100)]),
    ],
  },
  {
    name: 'Demo Denim Jeans', brand: 'Bazaaro', category: 'Demo Clothing',
    description: 'Slim fit denim jeans.',
    variants: [
      variant('Blue',  [size('30', 7, 3200), size('32', 10, 3200), size('34', 6, 3200, 2800)]),
      variant('Black', [size('32', 5, 3400), size('34', 0, 3400)]),
    ],
  },
  {
    name: 'Demo Running Shoes', brand: 'Bazaaro', category: 'Demo Clothing',
    description: 'Lightweight running shoes.',
    variants: [
      variant('Grey', [size('40', 4, 5500), size('42', 6, 5500, 4999), size('44', 3, 5500)]),
      variant('Red',  [size('41', 2, 5800), size('43', 5, 5800)]),
    ],
  },
  {
    name: 'Demo Leather Wallet', brand: 'Bazaaro', category: 'Demo Accessories',
    description: 'Genuine leather wallet.',
    variants: [
      variant('Brown', [size('Standard', 15, 1800, 1500)]),
      variant('Black', [size('Standard', 11, 1800)]),
    ],
  },
  {
    name: 'Demo Backpack', brand: 'Bazaaro', category: 'Demo Accessories',
    description: 'Water resistant everyday backpack.',
    variants: [
      variant('Olive', [size('20L', 8, 4200), size('30L', 5, 4800, 4300)]),
    ],
  },
  {
    // Variants ke baghair simple product (price/stock product level par)
    name: 'Demo Steel Water Bottle', brand: 'Bazaaro', category: 'Demo Accessories',
    description: 'Insulated steel bottle, 750ml.',
    price: 1500, discountPrice: 1299, costPrice: 900, stock: 40, unitType: 'unit',
    images: [nextImage()].filter(Boolean).map((url) => ({ url })),
    variants: [],
  },
];

async function main() {
  if (!DRY) {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set (server/.env)');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected:', mongoose.connection.name);
  }
  console.log(`Images found in uploads/products: ${imageFiles.length}`);

  const catIds = {};
  for (const c of CATEGORIES) {
    let doc = DRY ? null : await Category.findOne({ name: c.name });
    if (!doc) {
      doc = new Category(c);
      if (DRY) await doc.validate(); else await doc.save();
      console.log(`${DRY ? '[dry] ' : ''}category created: ${c.name}`);
    } else {
      console.log(`category exists: ${c.name}`);
    }
    catIds[c.name] = doc._id;
  }

  for (const p of PRODUCTS) {
    if (!DRY && (await Product.findOne({ name: p.name }))) {
      console.log(`product exists: ${p.name}`);
      continue;
    }
    const doc = new Product({ ...p, category: catIds[p.category] });
    if (DRY) {
      await doc.validate();
      console.log(`[dry] ok: ${p.name} -> price ${doc.price}, stock ${doc.stock}, variants ${doc.variants.length}`);
    } else {
      await doc.save();
      console.log(`product created: ${p.name} (price ${doc.price}, stock ${doc.stock})`);
    }
  }

  if (!DRY) await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});