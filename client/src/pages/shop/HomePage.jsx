import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiTruck, FiDollarSign, FiPackage, FiArrowRight } from 'react-icons/fi';
import {
  getAllProducts,
  selectProducts,
  selectLoading,
  selectTotalProducts,
} from '../../redux/slices/productSlice';
import { selectCategories } from '../../redux/slices/categorySlice';
import { selectUser } from '../../redux/slices/authSlice';
import ProductCard from '../../components/products/ProductCard';
import Loader from '../../components/common/Loader';

function HomePage() {
  const dispatch      = useDispatch();
  const products      = useSelector(selectProducts);
  const loading       = useSelector(selectLoading);
  const totalProducts = useSelector(selectTotalProducts);
  const categories    = useSelector(selectCategories);
  const user          = useSelector(selectUser);

  useEffect(() => {
    dispatch(getAllProducts({ limit: 8 }));
  }, [dispatch]);

  if (loading) return <Loader />;

  // Sirf wo baatein jo store mein sach mein hain:
  // product count database se, delivery rule Order model se (1000 se upar free), COD checkout par.
  const highlights = [
    { icon: <FiTruck size={20} />,      title: 'Free delivery',    text: 'On orders over Rs. 1,000' },
    { icon: <FiDollarSign size={20} />, title: 'Cash on delivery', text: 'Pay when your order arrives' },
    totalProducts > 0 && {
      icon: <FiPackage size={20} />,
      title: `${totalProducts} products`,
      text: 'In the store right now',
    },
  ].filter(Boolean);

  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="bg-brand-50">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
              Everyday products, <span className="text-brand-700">one store</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-soft">
              Home, electronics, clothing and more. Order online and pay when it arrives.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary btn-lg">Shop now</Link>
              <Link to="/shop?sort=-createdAt" className="btn-secondary btn-lg">New arrivals</Link>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {highlights.map((h) => (
              <li key={h.title} className="card flex items-center gap-4 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                  {h.icon}
                </span>
                <div>
                  <p className="font-semibold text-ink">{h.title}</p>
                  <p className="text-sm text-ink-soft">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container-page pt-14">
          <h2 className="section-title mb-5">Shop by category</h2>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat._id}`}
                className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand-700 hover:bg-brand-50 hover:text-brand-800"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="container-page py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Featured products</h2>
            <p className="mt-1 text-sm text-ink-soft">Latest additions to the store</p>
          </div>
          <Link to="/shop" className="link flex shrink-0 items-center gap-1 text-sm">
            View all <FiArrowRight size={16} />
          </Link>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface py-16 text-center">
            <p className="font-medium text-ink">No products yet</p>
            <p className="mt-1 text-sm text-ink-soft">Check back soon.</p>
          </div>
        )}
      </section>

      {/* Sign-up banner: sirf unko jinhon ne account nahi banaya */}
      {!user && (
        <section className="container-page pb-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand-800 p-8 sm:flex-row sm:items-center md:p-10">
            <div>
              <h2 className="text-2xl font-semibold text-white">Create an account to place orders</h2>
              <p className="mt-2 text-brand-200">Track every order from your profile.</p>
            </div>
            <Link to="/register" className="btn-accent btn-lg shrink-0">Create account</Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
