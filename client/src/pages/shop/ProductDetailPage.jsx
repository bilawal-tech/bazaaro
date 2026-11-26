import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiStar, FiMinus, FiPlus, FiEdit2 } from 'react-icons/fi';
import {
  getSingleProduct,
  selectProduct,
  selectLoading,
  addReview,
  clearProduct,
} from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { selectUser } from '../../redux/slices/authSlice';
import { ProductPageSkeleton } from '../../components/common/Skeleton';
import Spinner from '../../components/common/Spinner';
import ProductGallery from '../../components/products/ProductGallery';

function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const productData = useSelector(selectProduct);
  const loading = useSelector(selectLoading);
  const user = useSelector(selectUser);
  const [adding, setAdding] = useState(false);       // Add to cart chal raha hai
  const [reviewing, setReviewing] = useState(false);   // review submit ho raha hai

  const product = productData?.product ? productData.product : productData;

  // ── State ──────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  // Selection product ke saath bandhi hai; naya product aane par defaults dobara banenge
  const [selection, setSelection] = useState({ pid: null, color: '', size: '' });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReview, setShowReview] = useState(false);

  const BACKEND_URL = 'http://localhost:5000';

  // ── On Mount ───────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (id) {
      dispatch(getSingleProduct(id));
    }
    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, id]);

  // ── Get unique colors ─────────────────────
  const uniqueColors = product?.variants && Array.isArray(product.variants)
    ? product.variants.map(v => v.color).filter(Boolean)
    : [];

  // ── Get sizes for selected color ─────────
  const getSizesForColor = (color) => {
    const variant = product?.variants?.find(v => v.color === color);
    return variant?.sizes || [];
  };

  // ── Default: pehla in-stock color aur uski pehli in-stock size ──
  const defaultVariant = product?.variants?.length
    ? product.variants.find(v => v.sizes.some(s => s.stock > 0)) || product.variants[0]
    : null;
  const defaultSize = defaultVariant
    ? (defaultVariant.sizes.find(s => s.stock > 0) || defaultVariant.sizes[0])?.size || ''
    : '';

  const isCurrent = selection.pid === product?._id;
  const selectedColor = isCurrent ? selection.color : (defaultVariant?.color || '');
  const selectedSize  = isCurrent ? selection.size  : defaultSize;

  const sizesForColor = getSizesForColor(selectedColor);

  // ── Color badalne par us color ki pehli in-stock size chuno ──
  const handleColorChange = (color) => {
    const sizes = getSizesForColor(color);
    const firstSize = sizes.find(s => s.stock > 0) || sizes[0];
    setSelection({ pid: product._id, color, size: firstSize?.size || '' });
    setQuantity(1);
  };

  const handleSizeChange = (size) => {
    setSelection({ pid: product._id, color: selectedColor, size });
    setQuantity(1);
  };

  // ── Get valid image URL ──────────────────
  const getValidImageUrl = (imgObj) => {
    if (!imgObj) return '/placeholder.png';

    let imageStr = typeof imgObj === 'object'
      ? (imgObj.url || imgObj.path || '')
      : imgObj;

    if (!imageStr) return '/placeholder.png';
    if (imageStr.startsWith('http')) return imageStr;

    let cleanPath = imageStr.replace(/\\/g, '/');
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    return `${BACKEND_URL}${cleanPath}`;
  };

  if (loading) return <ProductPageSkeleton />;
  if (!product || !product._id) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <p className="mb-4 font-medium text-ink">Product not found</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go back</button>
      </div>
    );
  }

  // ── Get current size details ───────────────
  // Variants wale product mein stock/price sirf selected size ka hota hai.
  // `||` use nahi karte kyunke stock 0 bhi sahi value hai.
  const hasVariants = uniqueColors.length > 0;
  const currentSize = sizesForColor.find(s => s.size === selectedSize);
  const selectedVariant = product.variants?.find(v => v.color === selectedColor);
  const currentStock = hasVariants ? (currentSize?.stock ?? 0) : (product.stock ?? 0);
  const currentPrice = hasVariants ? (currentSize?.price ?? product.price) : product.price;
  const currentDiscountPrice = hasVariants ? (currentSize?.discountPrice ?? 0) : (product.discountPrice ?? 0);
  const hasDiscount = currentDiscountPrice > 0 && currentDiscountPrice < currentPrice;
  const displayPrice = hasDiscount ? currentDiscountPrice : currentPrice;
  // Selected color ki saari images (purane products ke liye single `image`)
  const variantImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : selectedVariant?.image ? [selectedVariant.image] : [];
  // Gallery ki tarteeb: selected size ki image, phir color ki images, phir product ki
  const galleryImages = [currentSize?.image, ...variantImages, ...(product.images || [])].filter(Boolean);

  // ── Handlers ───────────────────────────────
  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please sign in first');
      navigate('/login');
      return;
    }

    if (hasVariants && (!selectedColor || !selectedSize)) {
      toast.error('Select a color and size');
      return;
    }

    setAdding(true);
    dispatch(addToCart({
      productId: product._id,
      quantity,
      color: selectedColor,
      size: selectedSize,
    })).then((res) => {
      setAdding(false);
      // Error ka toast Toast.jsx dikha deta hai
      if (!res.error) toast.success('Added to cart');
    });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in first');
      navigate('/login');
      return;
    }

    if (!comment.trim()) {
      toast.error('Write a review first');
      return;
    }

    setReviewing(true);
    dispatch(addReview({
      productId: product._id,
      reviewData: { rating, comment },
    })).then((res) => {
      setReviewing(false);
      // Error ka toast Toast.jsx dikha deta hai
      if (!res.error) {
        toast.success('Review submitted');
        setComment('');
        setShowReview(false);
      }
    });
  };

  const discountPercent = hasDiscount
    ? Math.round(((currentPrice - currentDiscountPrice) / currentPrice) * 100)
    : 0;
  const hasReviews = (product.numReviews || 0) > 0;

  // Color / size button style (selected, out of stock, normal)
  const optionClass = (selected, disabled) =>
    `min-w-[44px] rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
      selected
        ? 'border-brand-800 bg-brand-800 text-white'
        : disabled
        ? 'cursor-not-allowed border-line bg-surface text-ink-faint line-through'
        : 'border-line bg-white text-ink hover:border-brand-700'
    }`;

  return (
    <div className="bg-white">
      <div className="container-page py-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 py-2 text-sm font-medium text-ink-soft hover:text-brand-700"
        >
          <FiArrowLeft size={16} /> Back
        </button>

        {/* Main */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">

          {/* LEFT: gallery (color ya size badalte hi key badalti hai, to image bhi badal jati hai) */}
          <ProductGallery
            key={`${product._id}|${selectedColor}|${selectedSize}`}
            images={galleryImages}
            name={product.name}
            toUrl={getValidImageUrl}
          />

          {/* RIGHT: info */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              {product.brand && <span className="badge-muted">{product.brand}</span>}
              {product.category?.name && <span className="badge-success">{product.category.name}</span>}
            </div>

            <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{product.name}</h1>

            {hasReviews && (
              <div className="mt-3 flex items-center gap-1.5 text-sm">
                <FiStar size={16} className="fill-accent-400 text-accent-400" aria-hidden="true" />
                <span className="font-semibold text-ink">{product.ratings}</span>
                <span className="text-ink-soft">({product.numReviews} reviews)</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-brand-800">
                Rs. {displayPrice?.toLocaleString()}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-ink-faint line-through">
                    Rs. {currentPrice?.toLocaleString()}
                  </span>
                  <span className="badge-sale">-{discountPercent}%</span>
                </>
              )}
            </div>

            {product.description && (
              <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {product.description}
              </p>
            )}

            <div className="mt-6 space-y-5 border-t border-line pt-6">

              {/* Colors */}
              {uniqueColors.length > 0 && (
                <div>
                  <p className="label">Color: <span className="font-normal text-ink-soft">{selectedColor}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map(color => {
                      const variantForColor = product.variants?.find(v => v.color === color);
                      const isOutOfStock = variantForColor?.sizes?.every(s => s.stock === 0);
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          disabled={isOutOfStock}
                          aria-pressed={selectedColor === color}
                          className={optionClass(selectedColor === color, isOutOfStock)}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {sizesForColor.length > 0 && (
                <div>
                  <p className="label">Size: <span className="font-normal text-ink-soft">{selectedSize}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {sizesForColor.map(sz => (
                      <button
                        key={sz.size}
                        onClick={() => handleSizeChange(sz.size)}
                        disabled={sz.stock === 0}
                        aria-pressed={selectedSize === sz.size}
                        className={optionClass(selectedSize === sz.size, sz.stock === 0)}
                      >
                        {sz.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + stock */}
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="label">Quantity</p>
                  <div className="inline-flex items-center rounded-lg border border-line">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="p-3 text-ink-soft hover:text-ink"
                    >
                      <FiMinus size={16} />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-medium" aria-live="polite">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                      aria-label="Increase quantity"
                      className="p-3 text-ink-soft hover:text-ink"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                </div>
                <span className={`${currentStock > 0 ? 'badge-success' : 'badge-danger'} self-end mb-2.5`}>
                  {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0 || adding}
                className="btn-primary btn-lg w-full"
              >
                {adding ? <><Spinner size={18} /> Adding…</> : currentStock === 0 ? 'Out of stock' : 'Add to cart'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-12 border-t border-line pt-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">Reviews ({product.numReviews || 0})</h2>
            {user && (
              <button onClick={() => setShowReview(!showReview)} className="btn-secondary btn-sm">
                {showReview ? 'Close' : <><FiEdit2 size={14} /> Write a review</>}
              </button>
            )}
          </div>

          {showReview && (
            <form onSubmit={handleReviewSubmit} className="card mb-5 space-y-4 p-5">
              <div>
                <p className="label">Your rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      className="p-0.5"
                    >
                      <FiStar
                        size={24}
                        className={star <= rating ? 'fill-accent-400 text-accent-400' : 'text-line'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="review-comment" className="label">Your review</label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product"
                  rows={3}
                  required
                  className="input"
                />
              </div>

              <button type="submit" disabled={reviewing} className="btn-primary">
                {reviewing ? <><Spinner /> Submitting…</> : 'Submit review'}
              </button>
            </form>
          )}

          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-3">
              {product.reviews.map((review, idx) => (
                <div key={idx} className="card p-4">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-ink">{review.name}</span>
                    <span className="flex" aria-label={`${review.rating} out of 5`}>
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <FiStar key={i} size={14} className="fill-accent-400 text-accent-400" />
                      ))}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No reviews yet. Be the first to share your experience.</p>
          )}
        </section>

      </div>
    </div>
  );
}

export default ProductDetailPage;
