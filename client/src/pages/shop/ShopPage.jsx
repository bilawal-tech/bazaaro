import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FiSliders, FiX, FiSearch, FiPackage } from 'react-icons/fi';
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
import { ProductGridSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Pagination  from '../../components/common/Pagination';

const DEFAULT_FILTERS = {
  search: '', category: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1, limit: 12,
};

const sortOptions = [
  { label: 'Latest',          value: '-createdAt' },
  { label: 'Price: low to high', value: 'price'   },
  { label: 'Price: high to low', value: '-price'  },
  { label: 'Top rated',       value: '-ratings'   },
];

function ShopPage() {
  const dispatch    = useDispatch();
  const products    = useSelector(selectProducts);
  const loading     = useSelector(selectLoading);
  const totalPages  = useSelector(selectTotalPages);
  const currentPage = useSelector(selectCurrentPage);
  const total       = useSelector(selectTotalProducts);
  const categories  = useSelector(selectCategories);

  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false); // mobile par filters ka panel

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort:     searchParams.get('sort')     || '-createdAt',
    page:     1,
    limit:    12,
  });

  // Navbar ki search, category ya sort link se URL badle (jab hum pehle se /shop par hon)
  // to filters bhi badlein. (Render ke dauran state adjust karna: React ka recommended tareeqa.)
  const urlSearch   = searchParams.get('search')   || '';
  const urlCategory = searchParams.get('category') || '';
  const urlSort     = searchParams.get('sort')     || '-createdAt';
  const urlKey      = `${urlSearch}|${urlCategory}|${urlSort}`;
  const [seenUrlKey, setSeenUrlKey] = useState(urlKey);
  if (seenUrlKey !== urlKey) {
    setSeenUrlKey(urlKey);
    setFilters(prev => ({ ...prev, search: urlSearch, category: urlCategory, sort: urlSort, page: 1 }));
  }

  // Pehli fetch ke baad hi "kuch nahi mila" dikhao, warna pehle frame par jhalak aati hai
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    dispatch(getAllProducts(filters)).finally(() => setLoaded(true));
    dispatch(getAllCategories());
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const activeFilterCount =
    (filters.search ? 1 : 0) + (filters.category ? 1 : 0) +
    (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);

  // Filters ka content: desktop sidebar aur mobile panel dono mein wahi
  const filtersPanel = (
    <div className="space-y-6">
      <div>
        <label htmlFor="filter-search" className="label">Search</label>
        <input
          id="filter-search"
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Search products"
          className="input"
        />
      </div>

      <div>
        <p className="label">Category</p>
        <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
          {[{ _id: '', name: 'All categories' }, ...categories].map((cat) => {
            const active = filters.category === cat._id;
            return (
              <button
                key={cat._id || 'all'}
                type="button"
                onClick={() => handleFilterChange('category', cat._id)}
                className={`truncate rounded-lg px-3 py-2 text-left text-sm transition ${
                  active
                    ? 'bg-brand-800 font-medium text-white'
                    : 'text-ink-soft hover:bg-surface hover:text-ink'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="label">Price (Rs.)</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="input"
          />
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="input"
          />
        </div>
      </div>

      <button type="button" onClick={resetFilters} className="btn-secondary w-full">
        Clear filters
      </button>
    </div>
  );

  return (
    <div className="bg-white">
      <div className="container-page py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="page-title">All products</h1>
          <p className="mt-1 text-sm text-ink-soft">{total} products</p>
        </div>

        <div className="flex gap-8">

          {/* Desktop sidebar */}
          <aside className="hidden w-60 shrink-0 md:block">
            <div className="card sticky top-32 p-5">
              {filtersPanel}
            </div>
          </aside>

          {/* Products */}
          <div className="min-w-0 flex-1">

            {/* Top strip: mobile par Filters button, sort har jagah */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                className="btn-secondary btn-sm md:hidden"
              >
                {showFilters ? <FiX size={16} /> : <FiSliders size={16} />}
                Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>

              <p className="hidden text-sm text-ink-soft md:block">
                Page {currentPage} of {totalPages || 1}
              </p>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="hidden text-sm text-ink-soft sm:block">Sort by</label>
                <select
                  id="sort"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input w-auto cursor-pointer py-2"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile filters panel */}
            {showFilters && (
              <div className="card mb-5 p-4 md:hidden">
                {filtersPanel}
              </div>
            )}

            {!loaded || loading ? (
              <ProductGridSkeleton count={filters.limit || 12} className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3" />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              activeFilterCount > 0 ? (
                <EmptyState
                  icon={<FiSearch size={28} />}
                  title={filters.search ? `No results for "${filters.search}"` : 'No products matched your filters'}
                  text="Check the spelling, try a different word, or remove some filters."
                >
                  <button type="button" onClick={resetFilters} className="btn-primary">
                    Clear filters
                  </button>
                </EmptyState>
              ) : (
                <EmptyState icon={<FiPackage size={28} />} title="No products yet" text="New products are on the way. Please check back soon." />
              )
            )}

            <Pagination page={currentPage} totalPages={totalPages} onChange={handlePageChange} />

          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopPage;
