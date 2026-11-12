import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSingleProduct,
  selectProduct,
  selectLoading,
  addReview,
  clearProduct,
} from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { selectUser } from '../../redux/slices/authSlice';
import Loader from '../../components/common/Loader';

function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const productData = useSelector(selectProduct);
  const loading = useSelector(selectLoading);
  const user = useSelector(selectUser);

  const product = productData?.product ? productData.product : productData;

  // ── State ──────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  // Selection product ke saath bandhi hai; naya product aane par defaults dobara banenge
  const [selection, setSelection] = useState({ pid: null, color: '', size: '' });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const BACKEND_URL = 'http://localhost:5000';

  // ── On Mount ───────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
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
    setActiveImage(null);
  };

  const handleSizeChange = (size) => {
    setSelection({ pid: product._id, color: selectedColor, size });
    setQuantity(1);
    setActiveImage(null);
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

  if (loading) return <Loader />;
  if (!product || !product._id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-gray-600 mb-4">Product not found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 rounded-lg border border-gray-300 hover:border-green-500 transition"
        >
          ← Go Back
        </button>
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
  const mainImage =
    activeImage || currentSize?.image || variantImages[0] || product.images?.[0];

  // ── Handlers ───────────────────────────────
  const handleAddToCart = () => {
    if (!user) {
      alert('Please login first');
      navigate('/login');
      return;
    }

    if (hasVariants && (!selectedColor || !selectedSize)) {
      alert('Please select color and size');
      return;
    }

    dispatch(addToCart({
      productId: product._id,
      quantity,
      color: selectedColor,
      size: selectedSize,
    })).then((res) => {
      if (!res.error) {
        alert('✅ Item added to cart!');
      } else {
        alert(res.payload || 'Failed to add to cart');
      }
    });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login first');
      navigate('/login');
      return;
    }

    if (!comment.trim()) {
      alert('Please write a review');
      return;
    }

    dispatch(addReview({
      productId: product._id,
      reviewData: { rating, comment },
    })).then((res) => {
      if (!res.error) {
        alert('✅ Review submitted!');
        setComment('');
        setShowReview(false);
      } else {
        alert('Failed to submit review');
      }
    });
  };

  return (
    <div className="min-h-screen py-12 bg-white">
      <div className="max-w-5xl mx-auto px-4">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-gray-600 hover:text-green-600 text-sm"
        >
          ← Back
        </button>

        {/* Main */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 rounded-xl p-6 border border-gray-200">

          {/* LEFT — Gallery */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="rounded-xl overflow-hidden h-96 border border-gray-200 flex items-center justify-center bg-gray-50">
              <img
                src={getValidImageUrl(mainImage)}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {/* Base images */}
              {product.images && product.images.map((img, idx) => (
                <button
                  key={`base-${idx}`}
                  onClick={() => setActiveImage(img)}
                  className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300 hover:border-green-500 flex-shrink-0"
                >
                  <img
                    src={getValidImageUrl(img)}
                    alt={`img-${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

              {/* Selected color ki images */}
              {variantImages.map((img, idx) => (
                <button
                  key={`variant-${idx}`}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                    mainImage === img ? 'border-green-500' : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  <img
                    src={getValidImageUrl(img)}
                    alt={`${selectedColor} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Info */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Brand & Category */}
              <div className="flex gap-2 flex-wrap mb-3">
                {product.brand && (
                  <span className="text-xs px-3 py-1 rounded-lg bg-blue-100 text-blue-700">
                    {product.brand}
                  </span>
                )}
                {product.category && (
                  <span className="text-xs px-3 py-1 rounded-lg bg-green-100 text-green-700">
                    {product.category?.name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-gray-900 text-2xl font-bold mb-3">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-yellow-400">★</span>
                <span className="text-gray-900 font-semibold">
                  {product.ratings || 0}
                </span>
                <span className="text-gray-600 text-sm">
                  ({product.numReviews || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-green-600 text-2xl font-bold">
                  Rs. {displayPrice?.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-gray-500 text-sm line-through">
                    Rs. {currentPrice?.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm mb-4">
                {product.description}
              </p>

              {/* Colors */}
              {uniqueColors.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-700 text-xs font-semibold mb-2">Colors:</p>
                  <div className="flex gap-2 flex-wrap">
                    {uniqueColors.map(color => {
                      const variantForColor = product.variants?.find(v => v.color === color);
                      const isOutOfStock = variantForColor?.sizes?.every(s => s.stock === 0);

                      return (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          disabled={isOutOfStock}
                          className={`px-3 py-1 rounded-lg text-sm border transition relative ${
                            selectedColor === color
                              ? 'border-green-500 text-green-600'
                              : isOutOfStock
                              ? 'border-gray-300 text-gray-400 line-through cursor-not-allowed'
                              : 'border-gray-300 text-gray-700 hover:border-green-500'
                          }`}
                        >
                          {color}
                          {isOutOfStock && <span className="ml-1">✕</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {sizesForColor.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-700 text-xs font-semibold mb-2">Sizes:</p>
                  <div className="flex gap-2 flex-wrap">
                    {sizesForColor.map(sz => (
                      <button
                        key={sz.size}
                        onClick={() => handleSizeChange(sz.size)}
                        disabled={sz.stock === 0}
                        className={`px-3 py-1 rounded-lg text-sm border transition relative ${
                          selectedSize === sz.size
                            ? 'border-green-500 text-green-600'
                            : sz.stock === 0
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:border-green-500'
                        }`}
                      >
                        {sz.size}
                        {sz.stock === 0 && <span className="ml-1">—</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-3 mb-6">
                <p className="text-gray-700 text-xs font-semibold">Qty:</p>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <span className={`text-xs px-3 py-1 rounded-lg ${
                  currentStock > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {currentStock > 0 ? `${currentStock} available` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:opacity-50"
            >
              {currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 font-bold text-lg">
              Reviews ({product.numReviews || 0})
            </h2>
            {user && (
              <button
                onClick={() => setShowReview(!showReview)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {showReview ? 'Close' : '✎ Write'}
              </button>
            )}
          </div>

          {showReview && (
            <form
              onSubmit={handleReviewSubmit}
              className="rounded-xl p-4 mb-4 border border-gray-200 bg-gray-50 space-y-3"
            >
              <div>
                <p className="text-gray-700 text-sm mb-2">Rating:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                    >
                      {star <= rating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                required
                className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none border border-gray-300 focus:border-green-500"
              />

              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Submit
              </button>
            </form>
          )}

          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-3">
              {product.reviews.map((review, idx) => (
                <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 font-medium text-sm">
                      {review.name}
                    </span>
                    <span className="text-yellow-400">
                      {'★'.repeat(review.rating)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No reviews yet</p>
          )}
        </div>

      </div>
    </div>
  );
}

export default ProductDetailPage;