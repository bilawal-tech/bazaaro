import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  getAllProducts,
  deleteProduct,
  selectProducts,
  selectLoading,
} from '../../redux/slices/productSlice';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { AdminPage, AdminHeader, Panel, DataTable, EmptyRow } from '../../components/admin/AdminUI';

// Base image, warna pehli variant image, warna placeholder
function adminImage(product) {
  const first = product.images?.[0]?.url || product.variants?.find(v => v.image)?.image;
  return first ? `http://localhost:5000${first}` : '/placeholder.png';
}

function AdminProducts() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const products    = useSelector(selectProducts) || [];
  const loading     = useSelector(selectLoading);
  const [toDelete, setToDelete] = useState(null); // product jise delete karna hai

  useEffect(() => {
    dispatch(getAllProducts({ limit: 50 }));
  }, [dispatch]);

  // Create aur edit dono ek hi form page par hote hain (variants ke saath)
  const openCreatePage = () => navigate('/admin/products/create');
  const openEditPage = (product) => navigate(`/admin/products/${product._id}/edit`);

  const confirmDelete = async () => {
    const product = toDelete;
    setToDelete(null);
    const result = await dispatch(deleteProduct(product._id));
    // Error ka toast Toast.jsx dikha deta hai
    if (!deleteProduct.rejected.match(result)) toast.success('Product deleted');
  };

  if (loading) return <Loader />;

  return (
    <AdminPage>
      <AdminHeader
        title="Products"
        subtitle="Add, edit or remove products and check stock."
        actions={
          <button type="button" onClick={openCreatePage} className="btn-primary btn-sm">
            <FiPlus size={16} /> Add product
          </button>
        }
      />

      <Panel flush>
        <DataTable
          minWidth={0}
          columns={[
            { label: 'Product' },
            { label: 'Category', hideOnMobile: true },
            { label: 'Price' },
            { label: 'Stock', hideOnMobile: true },
            { label: '', align: 'right' },
          ]}
        >
          {products.length > 0 ? products.map((product) => {
            const onSale = product.discountPrice > 0 && product.discountPrice < product.price;
            const low = product.stock <= 5;
            return (
              <tr key={product._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={adminImage(product)}
                      alt=""
                      className="hidden h-10 w-10 shrink-0 rounded-md border border-slate-200 bg-slate-50 object-cover sm:block"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-medium text-slate-900">{product.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {product.brand || 'No brand'}
                        <span className="sm:hidden"> · {product.stock} in stock</span>
                      </p>
                    </div>
                  </div>
                </td>

                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                  {product.category?.name || 'Unassigned'}
                </td>

                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  {product.variants?.length > 1 && <span className="block text-xs text-slate-500">From</span>}
                  <span className="font-medium text-slate-900">
                    Rs. {(onSale ? product.discountPrice : product.price)?.toLocaleString()}
                  </span>
                  {onSale && (
                    <span className="block text-xs text-slate-400 line-through">Rs. {product.price?.toLocaleString()}</span>
                  )}
                </td>

                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <span className={`h-2 w-2 rounded-full ${low ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <span className="tabular-nums">{product.stock} units</span>
                  </span>
                  {product.variants?.length > 0 && (
                    <span className="block text-xs text-slate-500">
                      {product.variants.length} color{product.variants.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </td>

                <td className="px-2 py-3 text-right sm:px-4">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => openEditPage(product)}
                      aria-label={`Edit ${product.name}`}
                      className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <FiEdit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(product)}
                      aria-label={`Delete ${product.name}`}
                      className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }) : <EmptyRow cols={5} text="No products yet. Add your first product." />}
        </DataTable>
      </Panel>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this product?"
        message={`"${toDelete?.name || 'This product'}" will be removed from the store.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </AdminPage>
  );
}

export default AdminProducts;
