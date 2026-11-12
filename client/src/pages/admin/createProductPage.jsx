import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  createProduct,
  updateProduct,
  getSingleProduct,
  clearProduct,
  selectProduct,
  selectLoading,
} from '../../redux/slices/productSlice';
import Loader from '../../components/common/Loader';
import {
  getAllCategories,
  selectCategories,
  createCategory,
} from '../../redux/slices/categorySlice';

const BACKEND_URL = 'http://localhost:5000';

const blankSize = () => ({ size: '', stock: 0, price: 0, costPrice: 0, discountPrice: 0, image: null });
const blankVariant = () => ({
  id: Date.now() + Math.random(),
  color: '',
  sizes: [blankSize()],
  existingImages: [], // server par pehle se maujood images (edit mode)
  image: [],          // nayi files
  imagePreview: [],   // nayi files ke preview
});

// Create aur Edit dono isi form se hote hain. `product` ho to edit mode.
function ProductForm({ product }) {
  const isEdit = !!product;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector(selectCategories) || [];
  const loading = useSelector(selectLoading);

  // ── Main Form State ───────────────────────────
  // Price aur stock yahan nahi: woh har variant ki size par hote hain
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    description: product?.description || '',
    unitType: product?.unitType || 'unit',
    category: product?.category?._id || '',
    newCategoryName: '',
  });

  // ── Variants State ─────────────────────────────
  const [variants, setVariants] = useState(() =>
    product?.variants?.length
      ? product.variants.map((v, i) => ({
          id: Date.now() + i,
          color: v.color,
          sizes: v.sizes.map(sz => ({
            size: sz.size,
            stock: sz.stock ?? 0,
            price: sz.price ?? 0,
            costPrice: sz.costPrice ?? 0,
            discountPrice: sz.discountPrice ?? 0,
            image: sz.image || null,
          })),
          existingImages: v.images?.length ? v.images : (v.image ? [v.image] : []),
          image: [],
          imagePreview: [],
        }))
      : [blankVariant()]
  );

  const [isNewCategory, setIsNewCategory] = useState(false);
  const [errors, setErrors] = useState({});
  const [expandedVariant, setExpandedVariant] = useState(0);

  // ── Fetch Categories ──────────────────────────
  useEffect(() => {
    dispatch(getAllCategories());
    window.scrollTo(0, 0);
  }, [dispatch]);

  // ══════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Add new color variant
  const addVariant = () => {
    setVariants([...variants, blankVariant()]);
    toast.success('✅ New color variant added');
  };

  // Remove color variant
  const removeVariant = (variantId) => {
    setVariants(variants.filter(v => v.id !== variantId));
    toast.success('✅ Variant removed');
  };

  // Add size to variant
  const addSizeToVariant = (variantId) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          sizes: [
            ...v.sizes,
            blankSize()
          ]
        };
      }
      return v;
    }));
    toast.success('✅ New size added');
  };

  // Remove size from variant
  const removeSizeFromVariant = (variantId, sizeIndex) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          sizes: v.sizes.filter((_, idx) => idx !== sizeIndex)
        };
      }
      return v;
    }));
    toast.success('✅ Size removed');
  };

  // Handle variant color change
  const handleVariantColorChange = (variantId, value) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return { ...v, color: value };
      }
      return v;
    }));
  };

  // Handle size field change
  const handleSizeChange = (variantId, sizeIndex, field, value) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        const newSizes = [...v.sizes];
        newSizes[sizeIndex] = {
          ...newSizes[sizeIndex],
          [field]: field === 'size' ? value : Number(value)
        };
        return { ...v, sizes: newSizes };
      }
      return v;
    }));
  };

  // Handle MULTIPLE variant images upload
  const handleVariantImagesChange = (variantId, files) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          image: [...(v.image || []), ...newFiles],
          imagePreview: [...(v.imagePreview || []), ...newPreviews]
        };
      }
      return v;
    }));
    toast.success(`✅ ${newFiles.length} image(s) added`);
  };

  // Remove a mistakenly added variant image
  const removeVariantImage = (variantId, imageIndex) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          image: v.image.filter((_, idx) => idx !== imageIndex),
          imagePreview: v.imagePreview.filter((_, idx) => idx !== imageIndex)
        };
      }
      return v;
    }));
  };

  // Server par pehle se maujood image hatao (save par hi asar hoga)
  const removeExistingImage = (variantId, imageIndex) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return { ...v, existingImages: v.existingImages.filter((_, idx) => idx !== imageIndex) };
      }
      return v;
    }));
  };

  // ══════════════════════════════════════════════
  // VALIDATION
  // ══════════════════════════════════════════════

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (isNewCategory && !formData.newCategoryName.trim()) {
      newErrors.category = 'Category name is required';
    } else if (!isNewCategory && !formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (variants.length === 0) {
      newErrors.variants = 'At least one variant is required';
    } else {
      variants.forEach((variant, idx) => {
        if (!variant.color.trim()) {
          newErrors[`variant_${idx}_color`] = 'Color is required';
        }
        if (variant.existingImages.length + variant.image.length === 0) {
          newErrors[`variant_${idx}_image`] = 'At least one variant image is required';
        }
        if (variant.sizes.length === 0) {
          newErrors[`variant_${idx}_sizes`] = 'At least one size is required';
        } else {
          variant.sizes.forEach((sz, szIdx) => {
            if (!sz.size.trim()) {
              newErrors[`variant_${idx}_size_${szIdx}_size`] = 'Size is required';
            }
            if (!(sz.price > 0)) {
              newErrors[`variant_${idx}_size_${szIdx}_price`] = 'Valid price required';
            }
            if (!Number.isInteger(sz.stock) || sz.stock < 0) {
              newErrors[`variant_${idx}_size_${szIdx}_stock`] = 'Stock must be 0 or more (whole number)';
            }
            if (sz.discountPrice > 0 && sz.discountPrice >= sz.price) {
              newErrors[`variant_${idx}_size_${szIdx}_discount`] = 'Discount must be less than price';
            }
          });
        }
      });
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('❌ Please fix the errors above');
      return false;
    }
    return true;
  };

  // ══════════════════════════════════════════════
  // SUBMISSION
  // ══════════════════════════════════════════════

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let categoryId = formData.category;

      if (isNewCategory) {
        const res = await dispatch(
          createCategory({ name: formData.newCategoryName })
        ).unwrap();
        categoryId = res.category._id;
        toast.success('✅ Category created');
      }

      const payload = new FormData();

      // Basic fields
      payload.append('name', formData.name);
      payload.append('brand', formData.brand);
      payload.append('description', formData.description);
      payload.append('unitType', formData.unitType);
      payload.append('category', categoryId);

      // Variants: nayi files alag, baqi data JSON mein
      const processedVariants = variants.map((variant, variantIdx) => {
        variant.image.forEach((file) => {
          payload.append(`variant_${variantIdx}_image`, file);
        });

        return {
          color: variant.color.trim(),
          existingImages: variant.existingImages,
          sizes: variant.sizes.map((sz) => ({
            size: sz.size.trim(),
            stock: sz.stock,
            price: sz.price,
            costPrice: sz.costPrice,
            discountPrice: sz.discountPrice,
            image: sz.image,
          })),
        };
      });

      payload.append('variants', JSON.stringify(processedVariants));

      const result = isEdit
        ? await dispatch(updateProduct({ id: product._id, productData: payload })).unwrap()
        : await dispatch(createProduct(payload)).unwrap();

      if (result.success) {
        toast.success(isEdit ? '🎉 Product updated!' : '🎉 Product created successfully!');
        setTimeout(() => {
          navigate('/admin/products');
        }, 1200);
      }
    } catch (err) {
      toast.error(`❌ ${typeof err === 'string' ? err : 'Failed to save product'}`);
      console.error('Error:', err);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-white">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-gray-900 text-2xl font-bold">
            {isEdit ? 'Edit Product' : 'Create Product'}
          </h1>
          <button
            onClick={() => navigate('/admin/products')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">

          {/* BASIC INFO */}
          <div className="mb-6">
            <h2 className="text-gray-900 font-bold mb-4 text-lg">
              Basic Information
            </h2>

            <div className="mb-4">
              <label className="text-gray-700 text-sm block mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Cotton Shirt"
                className={`w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none border ${
                  errors.name
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 focus:border-green-500'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">⚠️ {errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-gray-700 text-sm block mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Nike"
                  className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none border border-gray-300 focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-gray-700 text-sm block mb-1">Unit Type</label>
                <select
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none border border-gray-300 focus:border-green-500"
                >
                  <option value="unit">Unit</option>
                  <option value="kg">KG</option>
                  <option value="gram">Gram</option>
                  <option value="liter">Liter</option>
                  <option value="packet">Packet</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-gray-700 text-sm block mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Product details..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none border border-gray-300 focus:border-green-500"
              />
            </div>
          </div>

          {/* CATEGORY */}
          <div className="mb-6">
            <h2 className="text-gray-900 font-bold mb-4 text-lg">Category</h2>

            {isNewCategory ? (
              <input
                type="text"
                name="newCategoryName"
                value={formData.newCategoryName}
                onChange={handleChange}
                placeholder="Enter category name"
                className={`w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none border ${
                  errors.category ? 'border-red-500 bg-red-50' : 'border-green-500'
                }`}
              />
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none border ${
                  errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-green-500'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            )}

            {errors.category && <p className="text-red-500 text-xs mt-1">⚠️ {errors.category}</p>}

            <button
              type="button"
              onClick={() => setIsNewCategory(!isNewCategory)}
              className="text-green-600 text-sm mt-2 hover:underline font-medium"
            >
              {isNewCategory ? '← Use Existing' : '+ New Category'}
            </button>
          </div>

          {/* VARIANTS */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900 font-bold text-lg">
                Color Variants *
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                + Add Color
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-gray-700">
              <p className="font-semibold mb-2">📋 How to use:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li><strong>Color</strong> — e.g., Red, Blue, Black</li>
                <li><strong>Variant Images</strong> — Photos of this color (You can select multiple)</li>
                <li><strong>Sizes</strong> — S, M, L, XL (different price/stock per size)</li>
              </ul>
            </div>

            {errors.variants && <p className="text-red-500 text-xs mb-3">⚠️ {errors.variants}</p>}

            {/* Variants */}
            <div className="space-y-3">
              {variants.map((variant, variantIdx) => (
                <div key={variant.id} className="border border-gray-200 rounded-lg overflow-hidden">

                  {/* Tab Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedVariant(expandedVariant === variantIdx ? -1 : variantIdx)}
                    className={`w-full px-4 py-3 text-left font-medium transition flex items-center justify-between ${
                      expandedVariant === variantIdx
                        ? 'bg-green-100 text-green-900'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {(variant.existingImages.length > 0 || variant.imagePreview.length > 0) && (
                        <img
                          src={variant.existingImages[0] ? `${BACKEND_URL}${variant.existingImages[0]}` : variant.imagePreview[0]}
                          alt={variant.color}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <span>
                        {variant.color ? `${variant.color}` : 'New Variant'} ({variant.sizes.length} size{variant.sizes.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <span>{expandedVariant === variantIdx ? '▼' : '▶'}</span>
                  </button>

                  {/* Content */}
                  {expandedVariant === variantIdx && (
                    <div className="p-4 bg-white border-t border-gray-200 space-y-4">

                      {/* Color */}
                      <div>
                        <label className="text-gray-700 text-sm block mb-1">Color Name *</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleVariantColorChange(variant.id, e.target.value)}
                          placeholder="e.g., Red"
                          className={`w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none border ${
                            errors[`variant_${variantIdx}_color`] ? 'border-red-500' : 'border-gray-300 focus:border-green-500'
                          }`}
                        />
                        {errors[`variant_${variantIdx}_color`] && (
                          <p className="text-red-500 text-xs mt-1">⚠️ {errors[`variant_${variantIdx}_color`]}</p>
                        )}
                      </div>

                      {/* Variant MULTIPLE Images */}
                      <div>
                        <label className="text-gray-700 text-sm block mb-1">Variant Images * (Select Multiple)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            handleVariantImagesChange(variant.id, e.target.files);
                            e.target.value = ''; // Reset the input to allow re-selection
                          }}
                          className="block w-full text-sm text-gray-600 mb-2"
                        />
                        
                        {/* Pehle se saved images (edit mode) */}
                        {variant.existingImages.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-3">
                            {variant.existingImages.map((url, idx) => (
                              <div key={url} className="relative w-20 h-20">
                                <img
                                  src={`${BACKEND_URL}${url}`}
                                  alt={`Saved ${idx + 1}`}
                                  className="w-full h-full rounded-lg object-cover border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(variant.id, idx)}
                                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md"
                                  title="Remove saved image"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Selected Images Preview Gallery */}
                        {variant.imagePreview && variant.imagePreview.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-3">
                            {variant.imagePreview.map((preview, idx) => (
                              <div key={idx} className="relative w-20 h-20 group">
                                <img
                                  src={preview}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-full rounded-lg object-cover border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeVariantImage(variant.id, idx)}
                                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md transition-opacity"
                                  title="Remove image"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {errors[`variant_${variantIdx}_image`] && (
                          <p className="text-red-500 text-xs mt-1">⚠️ {errors[`variant_${variantIdx}_image`]}</p>
                        )}
                      </div>

                      {/* Sizes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-gray-700 text-sm font-semibold">
                            Sizes for {variant.color || 'this color'} *
                          </label>
                          <button
                            type="button"
                            onClick={() => addSizeToVariant(variant.id)}
                            className="text-green-600 text-xs hover:underline font-medium"
                          >
                            + Add Size
                          </button>
                        </div>

                        {errors[`variant_${variantIdx}_sizes`] && (
                          <p className="text-red-500 text-xs mb-2">⚠️ {errors[`variant_${variantIdx}_sizes`]}</p>
                        )}

                        <div className="space-y-3">
                          {variant.sizes.map((size, sizeIdx) => (
                            <div key={sizeIdx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">

                              {/* Size */}
                              <input
                                type="text"
                                value={size.size}
                                onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'size', e.target.value)}
                                placeholder="Size (S, M, L, XL)"
                                className={`w-full px-2 py-1 rounded text-sm text-gray-900 outline-none border ${
                                  errors[`variant_${variantIdx}_size_${sizeIdx}_size`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />

                              {/* Prices */}
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="number"
                                  value={size.costPrice}
                                  onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'costPrice', e.target.value)}
                                  placeholder="Cost"
                                  className="px-2 py-1 rounded text-sm text-gray-900 outline-none border border-gray-300"
                                />
                                <input
                                  type="number"
                                  value={size.price}
                                  onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'price', e.target.value)}
                                  placeholder="Price *"
                                  className={`px-2 py-1 rounded text-sm text-gray-900 outline-none border ${
                                    errors[`variant_${variantIdx}_size_${sizeIdx}_price`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                                <input
                                  type="number"
                                  value={size.discountPrice}
                                  onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'discountPrice', e.target.value)}
                                  placeholder="Discount"
                                  className="px-2 py-1 rounded text-sm text-gray-900 outline-none border border-gray-300"
                                />
                              </div>

                              {errors[`variant_${variantIdx}_size_${sizeIdx}_discount`] && (
                                <p className="text-red-500 text-xs">⚠️ {errors[`variant_${variantIdx}_size_${sizeIdx}_discount`]}</p>
                              )}

                              {/* Stock */}
                              <input
                                type="number"
                                min="0"
                                value={size.stock}
                                onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'stock', e.target.value)}
                                placeholder="Stock"
                                className={`w-full px-2 py-1 rounded text-sm text-gray-900 outline-none border ${
                                  errors[`variant_${variantIdx}_size_${sizeIdx}_stock`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                              {errors[`variant_${variantIdx}_size_${sizeIdx}_stock`] && (
                                <p className="text-red-500 text-xs">⚠️ {errors[`variant_${variantIdx}_size_${sizeIdx}_stock`]}</p>
                              )}

                              {variant.sizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSizeFromVariant(variant.id, sizeIdx)}
                                  className="text-red-500 text-xs hover:text-red-700 font-medium pt-2 block"
                                >
                                  ✕ Remove Size
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remove Variant */}
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="w-full text-red-500 hover:text-red-700 font-medium text-sm py-2 border border-red-300 rounded-lg mt-4"
                        >
                          ✕ Remove This Color
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition disabled:opacity-50"
          >
            {loading ? '⏳ Saving...' : isEdit ? '✅ Save Changes' : '✅ Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Route wrapper: /admin/products/create  ya  /admin/products/:id/edit
function CreateProductPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const productData = useSelector(selectProduct);
  const loading = useSelector(selectLoading);
  const product = productData?.product ? productData.product : productData;

  useEffect(() => {
    if (id) dispatch(getSingleProduct(id));
    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, id]);

  if (id && (loading || !product?._id || product._id !== id)) return <Loader />;

  return <ProductForm key={id || 'new'} product={id ? product : null} />;
}

export default CreateProductPage;