import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // 👈 Page navigation ke liye use kiya
import { FiShoppingBag, FiPlus, FiEdit3, FiTrash2, FiLayers, FiDollarSign, FiX } from 'react-icons/fi';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  selectProducts,
  selectLoading,
} from '../../redux/slices/productSlice';
import {
  getAllCategories,
  selectCategories,
} from '../../redux/slices/categorySlice';
import Loader from '../../components/common/Loader';

function AdminProducts() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate(); // 👈 Navigation trigger instance
  const products    = useSelector(selectProducts) || [];
  const categories  = useSelector(selectCategories) || [];
  const loading     = useSelector(selectLoading);

  const [showModal,    setShowModal]    = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [formData,     setFormData]     = useState({
    name: '', brand: '', description: '', costPrice: '', price: '',
    discountPrice: '', category: '', stock: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]); // 👈 Multer edit sync files array

  useEffect(() => {
    dispatch(getAllProducts({ limit: 50 }));
    dispatch(getAllCategories());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const openCreateModal = () => {
    // Modal open karne ke bajaye ab direct new upload screen page path par redirect karega
    navigate('/admin/products/create');
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    setFormData({
      name:          product.name,
      brand:         product.brand || '',
      description:   product.description,
      costPrice:     product.costPrice || '',
      price:         product.price,
      discountPrice: product.discountPrice || '',
      category:      product.category?._id || '',
      stock:         product.stock,
    });
    setSelectedFiles([]); // Reset uploads cache state
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Multipart FormData structure setup binary asset synchronization ke liye
    const formPayload = new FormData();
    formPayload.append('name', formData.name);
    formPayload.append('brand', formData.brand);
    formPayload.append('description', formData.description);
    formPayload.append('costPrice', Number(formData.costPrice));
    formPayload.append('price', Number(formData.price));
    formPayload.append('discountPrice', Number(formData.discountPrice) || 0);
    formPayload.append('category', formData.category);
    formPayload.append('stock', Number(formData.stock));

    if (selectedFiles.length > 0) {
      for (let i = 0; i < selectedFiles.length; i++) {
        formPayload.append('images', selectedFiles[i]);
      }
    }

    if (editingId) {
      dispatch(updateProduct({ id: editingId, productData: formPayload }));
    }

    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you absolutely sure you want to delete this product?')) {
      dispatch(deleteProduct(id));
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen py-12 bg-slate-50 text-slate-800 antialiased">
      <div className="max-w-6xl mx-auto px-6">

        {/* ── HEADER PANEL ── */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-200/60 pb-5">
          <div>
            <h1 className="text-[#1B4332] text-2xl font-black tracking-tight flex items-center gap-2">
              <FiShoppingBag className="text-[#2D6A4F]" size={24} /> Products Directory
            </h1>
            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">
              Create, edit, and manage catalog stock status counts
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition duration-200 flex items-center gap-1.5 shadow-sm shadow-[#2D6A4F]/20"
          >
            <FiPlus size={14} /> Add Product
          </button>
        </div>

        {/* ── CLEAN PRODUCTION PRODUCTS TABLE ── */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4 pl-6">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock Inventory</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50/40 transition">
                      
                      {/* Product identity */}
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <img
                          src={product.images && product.images.length > 0 ? `http://localhost:5000${product.images[0].url}` : 'https://via.placeholder.com/150'}
                          alt={product.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-slate-100 shadow-sm"
                        />
                        <div>
                          <p className="text-slate-900 font-black text-sm tracking-tight">{product.name}</p>
                          {product.brand && <p className="text-[11px] text-[#2D6A4F] font-bold">{product.brand}</p>}
                          <p className="text-[10px] text-slate-400 font-mono tracking-wider">ID: {product._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </td>

                      {/* Category Label */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F] bg-[#1B4332]/5 px-2.5 py-1 rounded-md">
                          <FiLayers size={10} /> {product.category?.name || 'Unassigned'}
                        </span>
                      </td>

                      {/* Pricing block */}
                      <td className="p-4 font-black text-slate-900 tabular-nums">
                        Rs. {product.price?.toLocaleString()}
                        {product.discountPrice > 0 && (
                          <span className="block text-[10px] text-slate-400 font-normal line-through">
                            Rs. {product.discountPrice.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Stock availability rendering */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 5 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-xs tabular-nums font-bold">
                            {product.stock} units
                          </span>
                        </div>
                      </td>

                      {/* Control operations utilities */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-slate-500 hover:text-[#2D6A4F] hover:bg-[#1B4332]/5 rounded-lg transition"
                            title="Edit Product"
                          >
                            <FiEdit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400 text-xs">
                      No products available inside database store.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── DIALOG OVERLAY MODAL FORM ── */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden animate-slideUp">
              
              {/* Modal Head Header */}
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-slate-900 font-black text-sm tracking-tight">
                    Modify Store Item
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Fill out specifications fields below
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Form container code core logic execution */}
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Item Heading Label</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Dining Chair"
                      required
                      className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 font-bold text-slate-800 outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Brand Name</label>
                    <input
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g. Outfitter"
                      className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 font-bold text-slate-800 outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Product Specifications Narrative</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe size, materials composition..."
                    rows={3}
                    required
                    className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 font-medium text-slate-800 outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Cost Price</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-slate-400 text-xs font-bold">Rs.</span>
                      <input
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleChange}
                        placeholder="3000"
                        required
                        className="pl-8 pr-2 py-2 w-full rounded-xl text-xs bg-slate-50 border border-slate-200/80 font-bold text-slate-800 outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Retail Price</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-slate-400 text-xs font-bold">Rs.</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="4500"
                        required
                        className="pl-8 pr-2 py-2 w-full rounded-xl text-xs bg-slate-50 border border-slate-200/80 font-bold text-slate-800 outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Old Price</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-slate-400 text-xs font-bold">Rs.</span>
                      <input
                        type="number"
                        name="discountPrice"
                        value={formData.discountPrice}
                        onChange={handleChange}
                        placeholder="5200"
                        className="pl-8 pr-2 py-2 w-full rounded-xl text-xs bg-slate-50 border border-slate-200/80 font-bold text-slate-800 outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Category Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 font-bold text-slate-700 outline-none focus:border-[#2D6A4F] focus:bg-white transition cursor-pointer"
                    >
                      <option value="">Select Catalog Option</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Initial Stock Units</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="e.g. 25"
                      required
                      className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 font-bold text-slate-800 outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Upload Item Assets Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200/80 text-slate-600 outline-none focus:border-[#2D6A4F] cursor-pointer"
                  />
                </div>

                {/* Footer buttons configurations drawer */}
                <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition duration-200"
                  >
                    Cancel Operations
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#2D6A4F] hover:bg-[#1B4332] text-white uppercase tracking-wider transition duration-200"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminProducts;