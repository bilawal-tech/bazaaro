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
import { FiArrowLeft, FiPlus, FiX, FiTrash2, FiImage, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { AdminPage, AdminHeader, Panel } from '../../components/admin/AdminUI';
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
    toast.success('New color variant added');
  };

  // Remove color variant
  const removeVariant = (variantId) => {
    setVariants(variants.filter(v => v.id !== variantId));
    toast.success('Variant removed');
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
    toast.success('New size added');
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
    toast.success('Size removed');
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
    toast.success(`${newFiles.length} image(s) added`);
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
      toast.error('Please fix the errors shown');
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
        toast.success('Category created');
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
        toast.success(isEdit ? 'Product updated!' : 'Product created successfully!');
        setTimeout(() => {
          navigate('/admin/products');
        }, 1200);
      }
    } catch (err) {
      toast.error(`${typeof err === 'string' ? err : 'Failed to save product'}`);
      console.error('Error:', err);
    }
  };

  const err = (key) => (errors[key] ? '!border-red-500' : '');
  const fieldError = (name) => (errors[name] ? <p className="field-error">{errors[name]}</p> : null);

  return (
    <AdminPage narrow>
      <AdminHeader
        title={isEdit ? 'Edit product' : 'Create product'}
        subtitle="Fill in the details, add colors and sizes, then save."
        actions={
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary btn-sm">
            <FiArrowLeft size={16} /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* BASIC INFO */}
        <Panel title="Basic information">
          <div className="space-y-4">
            <div>
              <label htmlFor="p-name" className="label">Product name *</label>
              <input
                id="p-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Cotton shirt"
                className={`input ${err('name')}`}
              />
              {fieldError('name')}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-brand" className="label">Brand</label>
                <input
                  id="p-brand"
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Nike"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="p-unit" className="label">Unit type</label>
                <select id="p-unit" name="unitType" value={formData.unitType} onChange={handleChange} className="input">
                  <option value="unit">Unit</option>
                  <option value="kg">KG</option>
                  <option value="gram">Gram</option>
                  <option value="liter">Liter</option>
                  <option value="packet">Packet</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="p-desc" className="label">Description</label>
              <textarea
                id="p-desc"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Product details"
                rows={3}
                className="input resize-none"
              />
            </div>
          </div>
        </Panel>

        {/* CATEGORY */}
        <Panel title="Category">
          {isNewCategory ? (
            <input
              type="text"
              name="newCategoryName"
              value={formData.newCategoryName}
              onChange={handleChange}
              placeholder="New category name"
              aria-label="New category name"
              className={`input ${err('category')}`}
            />
          ) : (
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              aria-label="Category"
              className={`input ${err('category')}`}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          )}
          {fieldError('category')}
          <button
            type="button"
            onClick={() => setIsNewCategory(!isNewCategory)}
            className="link mt-3 text-sm"
          >
            {isNewCategory ? 'Use an existing category' : '+ New category'}
          </button>
        </Panel>

        {/* VARIANTS */}
        <Panel
          title="Colors and sizes *"
          action={
            <button type="button" onClick={addVariant} className="btn-secondary btn-sm">
              <FiPlus size={16} /> Add color
            </button>
          }
        >
          <p className="mb-4 text-sm text-slate-500">
            Each color has its own photos. Each size has its own price and stock.
          </p>
          {fieldError('variants')}

          <div className="space-y-3">
            {variants.map((variant, variantIdx) => {
              const open = expandedVariant === variantIdx;
              const thumb = variant.existingImages[0]
                ? `${BACKEND_URL}${variant.existingImages[0]}`
                : variant.imagePreview[0];
              const hasError = Object.keys(errors).some(k => k.startsWith(`variant_${variantIdx}_`));
              return (
                <div key={variant.id} className={`overflow-hidden rounded-lg border ${hasError ? 'border-red-300' : 'border-slate-200'}`}>

                  <button
                    type="button"
                    onClick={() => setExpandedVariant(open ? -1 : variantIdx)}
                    aria-expanded={open}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                      open ? 'bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-400">
                          <FiImage size={16} />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">{variant.color || 'New color'}</span>
                        <span className="block text-xs text-slate-500">
                          {variant.sizes.length} size{variant.sizes.length !== 1 ? 's' : ''}
                          {hasError && <span className="text-red-600"> · needs attention</span>}
                        </span>
                      </span>
                    </span>
                    {open ? <FiChevronDown size={18} className="shrink-0 text-slate-500" /> : <FiChevronRight size={18} className="shrink-0 text-slate-500" />}
                  </button>

                  {open && (
                    <div className="space-y-5 border-t border-slate-200 bg-white p-4">

                      {/* Color */}
                      <div>
                        <label htmlFor={`color-${variant.id}`} className="label">Color name *</label>
                        <input
                          id={`color-${variant.id}`}
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleVariantColorChange(variant.id, e.target.value)}
                          placeholder="e.g., Red"
                          className={`input ${err(`variant_${variantIdx}_color`)}`}
                        />
                        {fieldError(`variant_${variantIdx}_color`)}
                      </div>

                      {/* Images */}
                      <div>
                        <label htmlFor={`img-${variant.id}`} className="label">Photos of this color * (you can pick several)</label>
                        <input
                          id={`img-${variant.id}`}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            handleVariantImagesChange(variant.id, e.target.files);
                            e.target.value = ''; // dobara wahi file chunne ke liye reset
                          }}
                          className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
                        />

                        {(variant.existingImages.length > 0 || variant.imagePreview.length > 0) && (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {variant.existingImages.map((url, idx) => (
                              <div key={url} className="relative h-20 w-20">
                                <img src={`${BACKEND_URL}${url}`} alt={`Saved ${idx + 1}`} className="h-full w-full rounded-lg border border-slate-200 object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(variant.id, idx)}
                                  aria-label="Remove saved image"
                                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-red-600"
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            ))}
                            {variant.imagePreview.map((preview, idx) => (
                              <div key={preview} className="relative h-20 w-20">
                                <img src={preview} alt={`New ${idx + 1}`} className="h-full w-full rounded-lg border border-brand-700 object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeVariantImage(variant.id, idx)}
                                  aria-label="Remove image"
                                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-red-600"
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {fieldError(`variant_${variantIdx}_image`)}
                      </div>

                      {/* Sizes */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="label !mb-0">Sizes for {variant.color || 'this color'} *</p>
                          <button type="button" onClick={() => addSizeToVariant(variant.id)} className="link text-sm">
                            + Add size
                          </button>
                        </div>
                        {fieldError(`variant_${variantIdx}_sizes`)}

                        <div className="space-y-3">
                          {variant.sizes.map((size, sizeIdx) => {
                            const k = `variant_${variantIdx}_size_${sizeIdx}`;
                            return (
                              <div key={sizeIdx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                                  <div className="col-span-2 sm:col-span-1">
                                    <label htmlFor={`${k}-size`} className="mb-1 block text-xs font-medium text-slate-600">Size *</label>
                                    <input
                                      id={`${k}-size`}
                                      type="text"
                                      value={size.size}
                                      onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'size', e.target.value)}
                                      placeholder="S, M, L"
                                      className={`input ${err(`${k}_size`)}`}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`${k}-cost`} className="mb-1 block text-xs font-medium text-slate-600">Cost</label>
                                    <input
                                      id={`${k}-cost`}
                                      type="number"
                                      value={size.costPrice}
                                      onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'costPrice', e.target.value)}
                                      className="input"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`${k}-price`} className="mb-1 block text-xs font-medium text-slate-600">Price *</label>
                                    <input
                                      id={`${k}-price`}
                                      type="number"
                                      value={size.price}
                                      onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'price', e.target.value)}
                                      className={`input ${err(`${k}_price`)}`}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`${k}-disc`} className="mb-1 block text-xs font-medium text-slate-600">Discount price</label>
                                    <input
                                      id={`${k}-disc`}
                                      type="number"
                                      value={size.discountPrice}
                                      onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'discountPrice', e.target.value)}
                                      className={`input ${err(`${k}_discount`)}`}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`${k}-stock`} className="mb-1 block text-xs font-medium text-slate-600">Stock</label>
                                    <input
                                      id={`${k}-stock`}
                                      type="number"
                                      min="0"
                                      value={size.stock}
                                      onChange={(e) => handleSizeChange(variant.id, sizeIdx, 'stock', e.target.value)}
                                      className={`input ${err(`${k}_stock`)}`}
                                    />
                                  </div>
                                </div>

                                {fieldError(`${k}_size`)}
                                {fieldError(`${k}_price`)}
                                {fieldError(`${k}_discount`)}
                                {fieldError(`${k}_stock`)}

                                {variant.sizes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSizeFromVariant(variant.id, sizeIdx)}
                                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-600"
                                  >
                                    <FiTrash2 size={14} /> Remove size
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="btn-secondary w-full !text-red-600 hover:!bg-red-50"
                        >
                          <FiTrash2 size={16} /> Remove this color
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        {/* SUBMIT */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary btn-lg">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary btn-lg">
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </AdminPage>
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