import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  getAllProducts,
  selectProducts,
  selectLoading,
  selectTotalPages,
  selectCurrentPage,
  selectTotalProducts,
} from '../../redux/slices/productSlice';
import {
  getAllCategories,
  selectCategories,
} from '../../redux/slices/categorySlice';
import ProductCard from '../../components/products/ProductCard';
import Loader      from '../../components/common/Loader';

function ShopPage() {
  const dispatch    = useDispatch();
  const products    = useSelector(selectProducts);
  const loading     = useSelector(selectLoading);
  const totalPages  = useSelector(selectTotalPages);
  const currentPage = useSelector(selectCurrentPage);
  const total       = useSelector(selectTotalProducts);
  const categories  = useSelector(selectCategories);

  const [searchParams, setSearchParams] = useSearchParams();

 
  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort:     searchParams.get('sort')     || '-createdAt',
    page:     1,
    limit:    12,
  });

  // Fetch Products
  useEffect(() => {
    dispatch(getAllProducts(filters));
    dispatch(getAllCategories());
  }, [dispatch, filters]);

  //Filter Change Handler
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // reset to page 1
    }));
  };

  // ── Page Change ───────────────────────────
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  // ── Sort Options ──────────────────────────
  const sortOptions = [
    { label: 'Latest',         value: '-createdAt' },
    { label: 'Price: Low-High',value: 'price'      },
    { label: 'Price: High-Low',value: '-price'     },
    { label: 'Top Rated',      value: '-ratings'   },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Page Header ── */}
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h1 className="text-[#1B4332] text-2xl font-black tracking-tight">
            All Products
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {total} products found in catalog
          </p>
        </div>

        <div className="flex gap-6">

          {/* ── Sidebar Filters — Dark Forest Green Card (#1B4332) ── */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="rounded-2xl p-4 border border-[#2D6A4F]/20 bg-[#1B4332] shadow-md sticky top-24">

              {/* Search Box */}
              <div className="mb-5">
                <label className="text-slate-200 text-[11px] font-black uppercase tracking-wider mb-2 block">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none border border-[#2D6A4F] bg-[#112a20] placeholder-slate-400 font-bold focus:border-[#F4A261] transition"
                />
              </div>

              {/* Categories */}
              <div className="mb-5">
                <label className="text-slate-200 text-[11px] font-black uppercase tracking-wider mb-2 block">
                  Category
                </label>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className={`text-left text-xs px-3 py-2 rounded-lg font-bold transition whitespace-nowrap overflow-hidden text-ellipsis ${
                      filters.category === ''
                        ? 'bg-[#F4A261] text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-[#2D6A4F]/40'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => handleFilterChange('category', cat._id)}
                      className={`text-left text-xs px-3 py-2 rounded-lg font-bold transition whitespace-nowrap overflow-hidden text-ellipsis ${
                        filters.category === cat._id
                          ? 'bg-[#F4A261] text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-[#2D6A4F]/40'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range inputs */}
              <div className="mb-6">
                <label className="text-slate-200 text-[11px] font-black uppercase tracking-wider mb-2 block">
                  Price Range
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="Min PKR"
                  className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none border border-[#2D6A4F] bg-[#112a20] placeholder-slate-400 font-bold mb-2 focus:border-[#F4A261] transition"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="Max PKR"
                  className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none border border-[#2D6A4F] bg-[#112a20] placeholder-slate-400 font-bold focus:border-[#F4A261] transition"
                />
              </div>

              {/* Reset Controller */}
              <button
                onClick={() => setFilters({
                  search: '', category: '', minPrice: '',
                  maxPrice: '', sort: '-createdAt', page: 1, limit: 12
                })}
                className="w-full py-2 rounded-xl text-xs font-black text-rose-400 border border-rose-900/30 bg-rose-950/20 hover:bg-rose-900/40 transition tracking-wide uppercase"
              >
                Clear Filters
              </button>

            </div>
          </aside>

          {/* ── Products Viewport ── */}
          <div className="flex-1">

            {/* Top Sorting Operations Strip */}
            <div className="flex items-center justify-between mb-6 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
              <p className="text-slate-500 font-bold text-xs">
                Page {currentPage} of {totalPages}
              </p>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#1B4332] font-black border border-slate-200 bg-white outline-none focus:border-[#2D6A4F] transition shadow-sm cursor-pointer"
              >
                {sortOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Core Loading / Grid Layout Execution */}
            {loading ? (
              <Loader />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <p className="text-slate-500 font-bold text-base">
                  No products matched your filters
                </p>
                <button
                  onClick={() => setFilters({
                    search: '', category: '', minPrice: '',
                    maxPrice: '', sort: '-createdAt', page: 1, limit: 12
                  })}
                  className="text-[#F4A261] text-xs font-black mt-2 hover:underline tracking-wide uppercase"
                >
                  Reset parameters
                </button>
              </div>
            )}

            {/* ── Pagination Elements — Custom styled array wrappers ── */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 border-t border-slate-100 pt-6">
                {/* Previous trigger block */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-xs font-black text-[#1B4332] bg-slate-50 border border-slate-200 hover:border-[#2D6A4F] disabled:opacity-40 disabled:hover:border-slate-200 transition"
                >
                  ← Previous
                </button>

                {/* Page digits map loop */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                      page === currentPage
                        ? 'bg-[#F4A261] text-white shadow-md'
                        : 'bg-slate-50 text-[#1B4332] border border-slate-200 hover:border-[#2D6A4F]'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next trigger block */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl text-xs font-black text-[#1B4332] bg-slate-50 border border-slate-200 hover:border-[#2D6A4F] disabled:opacity-40 disabled:hover:border-slate-200 transition"
                >
                  Next →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopPage;