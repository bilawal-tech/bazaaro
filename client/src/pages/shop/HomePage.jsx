import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  getAllProducts,
  selectProducts,
  selectLoading,
} from '../../redux/slices/productSlice';
import ProductCard from '../../components/products/ProductCard';
import Loader from '../../components/common/Loader';

function HomePage() {
  const dispatch  = useDispatch();
  const products  = useSelector(selectProducts);
  const loading   = useSelector(selectLoading);

  // Hook Initialization
  useEffect(() => {
    dispatch(getAllProducts({ limit: 8 }));
  }, [dispatch]);

  // Loading Check
  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-white text-[#1B4332]">

      {/* Hero Section — Transitioned to #1B4332 & #2D6A4F with #F4A261 Accents */}
      <section className="relative min-h-[500px] flex items-center bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-[#95D5B2]/10 rounded-full blur-[120px] -top-20 -left-20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
          <div className="max-w-xl">
            <span className="inline-block bg-[#F4A261] text-white text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wide shadow-sm">
              New Arrivals 2026
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              Shop Premium <span className="text-[#F4A261]">Products</span> Online
            </h1>
            <p className="text-slate-200 text-base mb-8 font-medium">
              Pakistan ka best ecommerce store. <br />
              Quality products — fast delivery.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/shop" className="bg-[#F4A261] hover:bg-white text-white hover:text-[#1B4332] font-black px-8 py-3.5 rounded-xl transition duration-300 shadow-lg active:scale-[0.98] uppercase text-xs tracking-wider">
                Shop Now
              </Link>
              <Link to="/shop" className="border border-white/20 text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-xl transition duration-300 text-xs uppercase tracking-wider">
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar — Clean background matching #1B4332 */}
      <section className="py-8 bg-[#1B4332] border-b border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            {/* Stats Array Map Logic */}
            {[
              { number: '10K+', label: 'Products' },
              { number: '50K+', label: 'Customers' },
              { number: '99%', label: 'Satisfied' },
              { number: '24/7', label: 'Support' },
            ].map((stat, index) => (
              <div key={index} className="border-r border-white/5 last:border-none">
                <p className="text-[#95D5B2] text-3xl font-black tracking-tight">
                  {stat.number}
                </p>
                <p className="text-slate-300 text-xs uppercase tracking-wider font-bold mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
            
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-[#1B4332] text-3xl font-black tracking-tight">Featured Products</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Top picked premium products for you</p>
            </div>
            <Link to="/shop" className="text-[#2D6A4F] font-bold text-sm hover:text-[#1B4332] hover:underline underline-offset-4 transition">
              View All Products →
            </Link>
          </div>

          {/* Featured Products Grid Logic */}
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-500 font-medium">
                No products found in the catalog
              </p>
            </div>
          )}

        </div>
      </section>

      {/* Promo Banner — Matching the primary header card structure */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] rounded-2xl p-10 md:p-14 text-center relative overflow-hidden shadow-xl">
            <div className="absolute w-[300px] h-[300px] bg-[#95D5B2]/5 rounded-full blur-[80px] -bottom-20 -right-20 pointer-events-none"></div>
            <span className="inline-block bg-[#F4A261] text-white text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wider shadow-sm">
              Special Offer
            </span>
            <h2 className="text-white text-3xl md:text-4xl font-black tracking-tight mb-3">
              Get 20% Off Your First Order
            </h2>
            <p className="text-slate-200 font-medium mb-8">
              Use core activation code: <span className="text-[#F4A261] font-black underline underline-offset-4">WELCOME20</span>
            </p>
            <Link to="/register" className="inline-block bg-[#F4A261] hover:bg-white text-white hover:text-[#1B4332] font-black px-10 py-3.5 rounded-xl transition duration-300 shadow-md active:scale-[0.98] uppercase text-xs tracking-wider">
              Join Now & Save
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default HomePage;