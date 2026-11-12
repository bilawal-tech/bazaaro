import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // 👈 Page navigation ke liye use kiya
import { FiShoppingBag, FiPlus, FiEdit3, FiTrash2, FiLayers } from 'react-icons/fi';
import {
  getAllProducts,
  deleteProduct,
  selectProducts,
  selectLoading,
} from '../../redux/slices/productSlice';
import Loader from '../../components/common/Loader';

// Base image, warna pehli variant image, warna placeholder
function adminImage(product) {
  const first = product.images?.[0]?.url || product.variants?.find(v => v.image)?.image;
  return first ? `http://localhost:5000${first}` : '/placeholder.png';
}

function AdminProducts() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate(); // 👈 Navigation trigger instance
  const products    = useSelector(selectProducts) || [];
  const loading     = useSelector(selectLoading);

  useEffect(() => {
    dispatch(getAllProducts({ limit: 50 }));
  }, [dispatch]);

  // Create aur edit dono ab ek hi form page par hote hain (variants ke saath)
  const openCreatePage = () => navigate('/admin/products/create');
  const openEditPage = (product) => navigate(`/admin/products/${product._id}/edit`);

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
            onClick={openCreatePage}
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
                          src={adminImage(product)}
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

                      {/* Pricing block: discount ho to wohi asli price, purani price kati hui */}
                      <td className="p-4 font-black text-slate-900 tabular-nums">
                        {product.variants?.length > 1 && (
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">From</span>
                        )}
                        Rs. {(product.discountPrice > 0 && product.discountPrice < product.price
                          ? product.discountPrice
                          : product.price
                        )?.toLocaleString()}
                        {product.discountPrice > 0 && product.discountPrice < product.price && (
                          <span className="block text-[10px] text-slate-400 font-normal line-through">
                            Rs. {product.price?.toLocaleString()}
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
                          {product.variants?.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-bold">
                              · {product.variants.length} color{product.variants.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Control operations utilities */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditPage(product)}
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

      </div>
    </div>
  );
}

export default AdminProducts;