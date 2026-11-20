import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiStar } from 'react-icons/fi';
import { addToCart } from '../../redux/slices/cartSlice';
import { getImageUrl } from '../../utils/imageUrl';

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Variants wale product mein color/size chuni jati hai, is liye detail page par bhejo
  const variantList = product.variants || [];
  const hasVariants = variantList.length > 0;
  const sizeCount = variantList.reduce((n, v) => n + (v.sizes?.length || 0), 0);
  const showFrom = sizeCount > 1;

  const handleAddToCart = () => {
    if (hasVariants) {
      navigate(`/product/${product._id}`);
      return;
    }
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
  };

  // Discount
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  // Image: product ki, warna pehle variant ki
  const firstImage =
    product.images?.[0] ||
    variantList.find((v) => v.image)?.image ||
    variantList.flatMap((v) => v.sizes || []).find((s) => s.image)?.image;

  const outOfStock = product.stock === 0;
  const hasReviews = (product.numReviews || 0) > 0;

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:shadow-pop">

      {/* Image */}
      <Link to={`/product/${product._id}`} className="relative block aspect-square overflow-hidden bg-surface">
        <img
          src={getImageUrl(firstImage)}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.png';
          }}
        />

        {hasDiscount && (
          <span className="badge-sale absolute left-3 top-3 shadow-sm">-{discountPercent}%</span>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="badge bg-ink text-white">Out of stock</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-ink transition hover:text-brand-700">
            {product.name}
          </h3>
        </Link>

        {/* Rating sirf tab jab reviews hon, warna "0 (0)" ajeeb lagta hai */}
        {hasReviews && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-ink-soft">
            <FiStar size={13} className="fill-accent-400 text-accent-400" aria-hidden="true" />
            <span className="font-medium text-ink">{product.ratings}</span>
            <span>({product.numReviews})</span>
          </div>
        )}

        <div className="mt-auto pt-3">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-semibold text-ink">
              {showFrom && <span className="mr-1 text-xs font-normal text-ink-faint">From</span>}
              Rs. {displayPrice?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-sm text-ink-faint line-through">
                Rs. {product.price?.toLocaleString()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="btn-primary w-full"
          >
            {outOfStock ? 'Unavailable' : hasVariants ? 'Select options' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
