import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLayers, FiTag, FiHeart, FiChevronDown, FiShield, FiPackage, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { selectUser, logout } from '../../redux/slices/authSlice';
import { selectTotalQuantity } from '../../redux/slices/cartSlice';
import { getAllCategories, selectCategories, selectCatLoading } from '../../redux/slices/categorySlice';

function Navbar() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const user        = useSelector(selectUser);
  const cartCount   = useSelector(selectTotalQuantity);
  
  const categories   = useSelector(selectCategories);
  const isCatLoading = useSelector(selectCatLoading);

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    dispatch(getAllCategories());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?search=${searchVal}`);
      setSearchVal('');
    }
  };

  // ── 💡 SAFE ADMIN CHECK (Supports flat or nested auth states) ──
  const isAdmin = user?.role === 'admin' || user?.user?.role === 'admin';

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-slate-100 transition-all duration-300">
      
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#1B4332] text-white py-1.5 px-6 text-center text-[11px] font-bold tracking-wide">
        Your one-stop destination for home essentials, electronics, and apparel.
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* 2. Main Navbar Rows */}
        <div className="grid grid-cols-3 items-center h-16 gap-4">

          {/* LEFT COLUMN: Main Navigation Links */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>

            <div className="hidden lg:flex items-center gap-4 text-[11px] font-black uppercase tracking-wider text-slate-700">
              <Link to="/" className="hover:text-[#2D6A4F] transition">Home</Link>
              <Link to="/shop" className="hover:text-[#2D6A4F] transition">Shop</Link>
              
              {/* Categories Dropdown */}
              <div className="relative group flex items-center h-full">
                <button className="hover:text-[#2D6A4F] flex items-center gap-0.5 cursor-pointer py-2">
                  Categories <FiChevronDown size={12} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute left-0 top-full mt-0 min-w-[180px] bg-white border border-slate-200 shadow-xl rounded-b-lg py-1 hidden group-hover:block z-50 max-h-60 overflow-y-auto">
                  {isCatLoading ? (
                    <span className="block px-4 py-1.5 text-slate-400 font-medium text-[11px]">Loading...</span>
                  ) : categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <Link
                        key={cat._id}
                        to={`/shop?category=${cat._id}`}
                        className="block px-4 py-1.5 text-slate-800 hover:bg-slate-50 hover:text-[#2D6A4F] transition font-bold text-[11px]"
                      >
                        {cat.name}
                      </Link>
                    ))
                  ) : (
                    <span className="block px-4 py-1.5 text-slate-400 font-medium text-[11px]">No Categories</span>
                  )}
                </div>
              </div>

              <Link to="/shop" className="hover:text-[#2D6A4F] transition">Trending</Link>
              <Link to="/shop?sort=newest" className="hover:text-[#2D6A4F] transition flex items-center gap-0.5 whitespace-nowrap">
                <FiTag size={11} className="text-[#2D6A4F]" /> New Arrivals
              </Link>
            </div>
          </div>

          {/* CENTER COLUMN: Brand Typography Identity */}
          <div className="flex justify-center select-none">
            <Link to="/" className="text-xl font-black tracking-tight flex items-center gap-1.5 whitespace-nowrap group">
              <span className="text-xl transition-transform group-hover:scale-110 duration-200">🛍️</span>
              <span className="font-black tracking-tighter">
                <span className="text-slate-900">Zillion</span>
                <span className="text-[#2D6A4F]">Mall</span>
              </span>
            </Link>
          </div>

          {/* RIGHT COLUMN: Action Utilities Search, Cart, Account */}
          <div className="flex items-center justify-end gap-2.5">
            
            {/* Search Form Panel */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xs items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:border-[#2D6A4F] focus-within:bg-white transition duration-200"
            >
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search items..."
                className="px-2 py-1.5 text-[11px] bg-transparent outline-none w-full text-slate-800 placeholder-slate-400 font-bold"
              />
              <button
                type="submit"
                className="p-2 bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition px-3"
              >
                <FiSearch size={12} />
              </button>
            </form>

            {/* Quick Badge Link (Hidden on small screens since subnavbar is active) */}
            {isAdmin && (
              <span className="hidden xl:inline-block text-[9px] bg-amber-500/10 text-amber-600 font-black px-2 py-1 rounded border border-amber-500/20 uppercase tracking-wider">
                Admin Mode
              </span>
            )}

            {/* Shopping Cart Indicator */}
            <Link 
              to="/cart" 
              className="relative flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition text-slate-800"
            >
              <FiShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F4A261] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Dropdown Structure */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 transition">
                  <div className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-[9px] uppercase">
                    {user?.user?.name?.[0] || user?.name?.[0] || 'U'}
                  </div>
                </button>

                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 shadow-xl rounded-lg py-1 hidden group-hover:block z-50">
                  <Link to="/orders" className="block px-4 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition">My Orders</Link>
                  <Link to="/profile" className="block px-4 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition">Profile</Link>
                  <hr className="border-slate-100 my-1" />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-1.5 text-[11px] font-black text-rose-600 hover:bg-rose-50 transition">Logout</button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-[11px] font-black bg-slate-900 text-white hover:bg-[#2D6A4F] px-3 py-1.5 rounded-lg transition duration-200 shadow-sm uppercase tracking-wide"
              >
                Join
              </Link>
            )}

          </div>
        </div>
      </div>

      {/* ── 💡 NEW: PROFESSIONAL ADMIN SUB-NAVBAR DIV (4 LI ELEMENTS) ── */}
      {isAdmin && (
        <div className="bg-[#132A20] text-white border-t border-white/5 shadow-inner">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-9 text-[10px] font-black uppercase tracking-wider overflow-x-auto scrollbar-none">
              
              {/* Left Indicator Label */}
              <div className="flex items-center gap-1 text-[#F4A261] whitespace-nowrap">
                <FiShield size={11} className="animate-pulse" /> 
                <span>Control Panel:</span>
              </div>

              {/* Right Menu Links List */}
              <ul className="flex items-center gap-6 h-full">
                <li>
                  <Link 
                    to="/admin" 
                    className="hover:text-[#F4A261] transition-colors duration-150 py-2 block border-b-2 border-transparent hover:border-[#F4A261]"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/products" 
                    className="hover:text-[#F4A261] transition-colors duration-150 py-2 block border-b-2 border-transparent hover:border-[#F4A261]"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/orders" 
                    className="hover:text-[#F4A261] transition-colors duration-150 py-2 block border-b-2 border-transparent hover:border-[#F4A261]"
                  >
                    Orders
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/users" 
                    className="hover:text-[#F4A261] transition-colors duration-150 py-2 block border-b-2 border-transparent hover:border-[#F4A261]"
                  >
                    Users
                  </Link>
                </li>
              </ul>

            </div>
          </div>
        </div>
      )}

      {/* Mobile Input Field View */}
      <div className="md:hidden bg-white px-6 pb-3 border-t border-slate-100">
        <form onSubmit={handleSearch} className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mt-2">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search matching products..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs outline-none text-slate-800 placeholder-slate-400 font-medium"
          />
          <button type="submit" className="px-3 bg-[#2D6A4F] text-white">
            <FiSearch size={13} />
          </button>
        </form>
      </div>

      {/* Mobile Responsive Drawer Overlay */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-6 py-3 space-y-2 shadow-lg">
          
          {/* Mobile Admin Utilities Links Panel */}
          {isAdmin && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 space-y-1.5 mb-2">
              <p className="text-[9px] font-black text-amber-700 tracking-wider uppercase mb-1">🛡️ Admin Quick Access</p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold uppercase">
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="bg-white text-slate-800 p-1.5 rounded border border-slate-100 text-center">Dashboard</Link>
                <Link to="/admin/products" onClick={() => setMenuOpen(false)} className="bg-white text-slate-800 p-1.5 rounded border border-slate-100 text-center">Products</Link>
                <Link to="/admin/orders" onClick={() => setMenuOpen(false)} className="bg-white text-slate-800 p-1.5 rounded border border-slate-100 text-center">Orders</Link>
                <Link to="/admin/users" onClick={() => setMenuOpen(false)} className="bg-white text-slate-800 p-1.5 rounded border border-slate-100 text-center">Users</Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 font-bold text-[11px] uppercase tracking-wide">
            <Link to="/" onClick={() => setMenuOpen(false)} className="bg-slate-50 text-slate-800 p-2 rounded-lg text-center border border-slate-200">Home</Link>
            <Link to="/shop" onClick={() => setMenuOpen(false)} className="bg-[#2D6A4F] text-white p-2 rounded-lg text-center">Browse Shop</Link>
          </div>
          {user ? (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="w-full bg-slate-50 text-rose-600 p-2 rounded-lg font-bold text-[11px] text-center border border-slate-200"
            >
              Logout
            </button>
          ) : (
            <div className="flex flex-col gap-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full bg-slate-50 text-slate-700 p-2 rounded-lg text-center text-[11px] font-bold border border-slate-200">Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="w-full bg-[#2D6A4F] text-white p-2 rounded-lg text-center text-[11px] font-black">Create Account</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;