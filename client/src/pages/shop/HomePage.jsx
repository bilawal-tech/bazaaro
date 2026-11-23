import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiTruck, FiDollarSign, FiPackage, FiArrowRight, FiSearch, FiShoppingCart } from 'react-icons/fi';
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
import API from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const STEPS = [
  { icon: <FiSearch size={20} />,       title: 'Choose',  text: 'Browse the store and pick what you like.' },
  { icon: <FiShoppingCart size={20} />, title: 'Order',   text: 'Add to cart and enter your delivery address.' },
  { icon: <FiDollarSign size={20} />,   title: 'Pay on delivery', text: 'Pay cash when your order arrives.' },
];

const onSale = (p) => p.discountPrice > 0 && p.discountPrice < p.price;

function HomePage() {
  const dispatch      = useDispatch();
  const products      = useSelector(selectProducts);
  const loading       = useSelector(selectLoading);
  const totalProducts = useSelector(selectTotalProducts);
  const categories    = useSelector(selectCategories);
  const user          = useSelector(selectUser);

  const [deals, setDeals]       = useState([]);
  const [topRated, setTopRated]  = useState([]);

  useEffect(() => {
    dispatch(getAllProducts({ limit: 8 }));
  }, [dispatch]);

  // Deals aur top rated: server par discount filter nahi, is liye taaza products mein se
  // discount wale chun lete hain. Fail ho to section bas chhup jata hai.
  useEffect(() => {
    let cancelled = false;
    API.get('/products?page=1&limit=24&sortby=-createdAt')
      .then(({ data }) => { if (!cancelled) setDeals((data.products || []).filter(onSale).slice(0, 4)); })
      .catch(() => {});
    API.get('/products?page=1&limit=8&sortby=-ratings')
      .then(({ data }) => { if (!cancelled) setTopRated((data.products || []).filter(p => p.numReviews > 0).slice(0, 4)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat._id}`}
                className="card group flex items-center gap-3 p-3 transition hover:border-brand-700 hover:shadow-pop"
              >
                {cat.image ? (
                  <img src={getImageUrl(cat.image)} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-surface object-cover sm:h-14 sm:w-14" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-lg font-semibold text-brand-800 sm:h-14 sm:w-14 sm:text-xl">
                    {cat.name?.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink group-hover:text-brand-800 sm:text-base">{cat.name}</span>
                <FiArrowRight size={16} className="hidden shrink-0 text-ink-faint transition group-hover:translate-x-0.5 sm:block" />
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

      {/* Deals */}
      {deals.length > 0 && (
        <section className="container-page pb-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">On sale</h2>
              <p className="mt-1 text-sm text-ink-soft">Products with a lower price right now</p>
            </div>
            <Link to="/shop" className="link flex shrink-0 items-center gap-1 text-sm">
              View all <FiArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {deals.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </section>
      )}

      {/* Top rated */}
      {topRated.length > 0 && (
        <section className="container-page pb-14">
          <div className="mb-6">
            <h2 className="section-title">Top rated</h2>
            <p className="mt-1 text-sm text-ink-soft">Highest rated by customers</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {topRated.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-surface">
        <div className="container-page py-14">
          <h2 className="section-title mb-8 text-center">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card flex flex-col items-center p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                  {step.icon}
                </span>
                <p className="mt-4 text-sm font-medium text-ink-faint">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sign-up banner: sirf unko jinhon ne account nahi banaya */}
      {!user && (
        <section className="container-page py-14">
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
