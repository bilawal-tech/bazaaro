import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import {
  FiShoppingCart, FiMenu, FiX, FiSearch, FiChevronDown,
  FiShield, FiUser, FiPackage, FiLogOut,
} from 'react-icons/fi';
import { selectUser, logout } from '../../redux/slices/authSlice';
import { selectTotalQuantity, getCart } from '../../redux/slices/cartSlice';
import { getAllCategories, selectCategories, selectCatLoading } from '../../redux/slices/categorySlice';
import Logo from './Logo';

// Server sirf yeh sort fields jaanta hai: createdAt, price, name, ratings, stock.
// "-createdAt" = naye products pehle.
const NEW_ARRIVALS_LINK = '/shop?sort=-createdAt';

const adminLinks = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Products',  to: '/admin/products' },
  { label: 'Orders',    to: '/admin/orders' },
  { label: 'Users',     to: '/admin/users' },
];

function SearchForm({ value, onChange, onSubmit, placeholder, className = '' }) {
  return (
    <form onSubmit={onSubmit} role="search" className={`relative ${className}`}>
      <FiSearch
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="input pl-9"
      />
    </form>
  );
}

function Navbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useSelector(selectUser);
  const cartCount = useSelector(selectTotalQuantity);

  const categories   = useSelector(selectCategories);
  const isCatLoading = useSelector(selectCatLoading);

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    dispatch(getAllCategories());
  }, [dispatch]);

  // Login ke baad (ya page refresh par) cart load karo taake badge sahi count dikhaye.
  const isLoggedIn = !!user;
  useEffect(() => {
    if (isLoggedIn) dispatch(getCart());
  }, [dispatch, isLoggedIn]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    dispatch(logout());
    closeMenu();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchVal.trim();
    if (term) {
      navigate(`/shop?search=${encodeURIComponent(term)}`);
      setSearchVal('');
      closeMenu();
    }
  };

  // Auth state flat bhi ho sakti hai aur nested bhi
  const isAdmin  = user?.role === 'admin' || user?.user?.role === 'admin';
  const userName = user?.user?.name || user?.name || '';
  const initial  = (userName[0] || 'U').toUpperCase();

  // Active link ki pehchan
  const onShop         = location.pathname === '/shop';
  const onNewArrivals  = onShop && location.search.includes('sort=-createdAt');
  const shopActive     = onShop && !location.search.includes('sort=');

  const navLink = (active) =>
    `text-sm font-medium transition hover:text-brand-700 ${active ? 'text-brand-800' : 'text-ink-soft'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">

      {/* Announcement bar: sirf wo baatein jo store mein sach mein hain */}
      <div className="bg-brand-800 px-4 py-2 text-center text-xs font-medium text-brand-50">
        Free delivery over Rs. 1,000 · Cash on delivery
      </div>

      <div className="container-page">
        <div className="flex h-16 items-center gap-3 lg:gap-8">

          {/* Mobile menu button */}
          <button
            type="button"
            className="-ml-2 rounded-lg p-2 text-ink hover:bg-surface lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <Logo />

          {/* Desktop links */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            <Link to="/shop" className={navLink(shopActive)}>Shop</Link>

            {/* Categories: hover par ya keyboard focus par khulta hai */}
            <div className="group relative">
              <button
                type="button"
                className={`flex items-center gap-1 py-5 ${navLink(false)}`}
                aria-haspopup="true"
              >
                Categories
                <FiChevronDown
                  size={14}
                  className="transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                />
              </button>
              <div className="invisible absolute left-0 top-full z-50 pt-0 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="card max-h-72 min-w-[220px] overflow-y-auto p-1.5 shadow-pop">
                  {isCatLoading ? (
                    <span className="block px-3 py-2 text-sm text-ink-faint">Loading…</span>
                  ) : categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <Link
                        key={cat._id}
                        to={`/shop?category=${cat._id}`}
                        className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface hover:text-brand-700"
                      >
                        {cat.name}
                      </Link>
                    ))
                  ) : (
                    <span className="block px-3 py-2 text-sm text-ink-faint">No categories yet</span>
                  )}
                </div>
              </div>
            </div>

            <Link to={NEW_ARRIVALS_LINK} className={navLink(onNewArrivals)}>New Arrivals</Link>
          </nav>

          {/* Desktop search */}
          <SearchForm
            value={searchVal}
            onChange={setSearchVal}
            onSubmit={handleSearch}
            placeholder="Search products"
            className="mx-auto hidden w-full max-w-md md:block"
          />

          {/* Right side: cart + account */}
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link
              to="/cart"
              aria-label={`Cart, ${cartCount} items`}
              className="relative rounded-lg p-2.5 text-ink hover:bg-surface"
            >
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-400 px-1 text-xs font-bold text-brand-950">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                {/* Mobile: seedha profile par */}
                <Link
                  to="/profile"
                  aria-label="Profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-800 text-sm font-semibold text-white md:hidden"
                >
                  {initial}
                </Link>

                {/* Desktop: dropdown */}
                <div className="group relative hidden md:block">
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-label="Account menu"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-800 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    {initial}
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="card w-52 p-1.5 shadow-pop">
                      {userName && (
                        <p className="truncate px-3 py-2 text-sm font-semibold text-ink">{userName}</p>
                      )}
                      <Link to="/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface">
                        <FiPackage size={16} className="text-ink-faint" /> My orders
                      </Link>
                      <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface">
                        <FiUser size={16} className="text-ink-faint" /> Profile
                      </Link>
                      <hr className="my-1 border-line" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiLogOut size={16} /> Log out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm hidden md:inline-flex">Sign in</Link>
                <Link to="/register" className="btn-primary btn-sm hidden md:inline-flex">Create account</Link>
                <Link to="/login" className="btn-primary btn-sm md:hidden">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin bar: halka, simple (sirf admin ko nazar aati hai) */}
      {isAdmin && (
        <div className="border-t border-line bg-surface">
          <div className="container-page">
            <div className="flex h-10 items-center gap-6 overflow-x-auto whitespace-nowrap text-sm">
              <span className="flex items-center gap-1.5 font-medium text-ink-faint">
                <FiShield size={14} /> Admin
              </span>
              {adminLinks.map((l) => {
                const active = l.to === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(l.to);
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`flex h-full items-center border-b-2 font-medium transition ${
                      active
                        ? 'border-brand-700 text-brand-800'
                        : 'border-transparent text-ink-soft hover:text-ink'
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile search */}
      <div className="border-t border-line px-4 py-2.5 md:hidden">
        <SearchForm
          value={searchVal}
          onChange={setSearchVal}
          onSubmit={handleSearch}
          placeholder="Search products"
        />
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="border-t border-line bg-white px-4 py-3 shadow-pop lg:hidden" aria-label="Mobile">
          <div className="flex flex-col">
            <Link to="/shop" onClick={closeMenu} className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-surface">
              Shop
            </Link>
            <Link to={NEW_ARRIVALS_LINK} onClick={closeMenu} className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-surface">
              New Arrivals
            </Link>

            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-surface [&::-webkit-details-marker]:hidden">
                Categories
                <FiChevronDown size={18} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="ml-3 flex flex-col border-l border-line pl-3">
                {isCatLoading ? (
                  <span className="px-3 py-2 text-sm text-ink-faint">Loading…</span>
                ) : categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/shop?category=${cat._id}`}
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-surface hover:text-ink"
                    >
                      {cat.name}
                    </Link>
                  ))
                ) : (
                  <span className="px-3 py-2 text-sm text-ink-faint">No categories yet</span>
                )}
              </div>
            </details>
          </div>

          <hr className="my-3 border-line" />

          {user ? (
            <div className="flex flex-col">
              <Link to="/orders" onClick={closeMenu} className="flex items-center gap-2 rounded-lg px-3 py-3 text-base text-ink hover:bg-surface">
                <FiPackage size={18} className="text-ink-faint" /> My orders
              </Link>
              <Link to="/profile" onClick={closeMenu} className="flex items-center gap-2 rounded-lg px-3 py-3 text-base text-ink hover:bg-surface">
                <FiUser size={18} className="text-ink-faint" /> Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-base text-red-600 hover:bg-red-50"
              >
                <FiLogOut size={18} /> Log out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" onClick={closeMenu} className="btn-secondary">Sign in</Link>
              <Link to="/register" onClick={closeMenu} className="btn-primary">Create account</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

export default Navbar;
