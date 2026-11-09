import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';

function ProductCard({ product }) {
  const dispatch = useDispatch();

  // base url
  const BACKEND_URL = "http://localhost:5000"; 

  // add to cart
  const handleAddToCart = () => {
    dispatch(addToCart({
      productId: product._id,
      quantity:  1,
    }));
  };

  // discount calc
  const hasDiscount = product.discountPrice > 0;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;

  // image handle
  const getProductImage = () => {
    if (!product.images || product.images.length === 0) {
      return '/placeholder.png';
    }

    const firstImage = product.images[0];
    
    // safe string extract
    // agar image object hai toh uski url/path property nikalega, warna khud string hoga
    const imageStr = typeof firstImage === 'object' 
      ? (firstImage.url || firstImage.path || '') 
      : firstImage;

    if (!imageStr) return '/placeholder.png';

    if (imageStr.startsWith('http')) {
      return imageStr;
    }
    const cleanPath = imageStr.startsWith('/') ? imageStr : `/${imageStr}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">

      {/* image area */}
      <Link to={`/product/${product._id}`}>
        <div className="relative overflow-hidden bg-slate-50 h-52 flex items-center justify-center">
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/placeholder.png';
            }}
          />

          {/* discount badge */}
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-[#F4A261] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              SAVE Rs. {(product.price - product.discountPrice).toLocaleString()}
            </span>
          )}

          {/* stock check */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-[#1B4332]/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-white font-black text-xs uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* product info */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* title */}
          <Link to={`/product/${product._id}`}>
            <h3 className="text-[#1B4332] font-bold text-sm mb-1.5 hover:text-[#2D6A4F] transition line-clamp-2 min-h-[40px] leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-slate-500 text-xs font-bold">
              {product.ratings || 0} <span className="text-slate-300 font-normal">({product.numReviews || 0})</span>
            </span>
          </div>
        </div>

        <div>
          {/* price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[#1B4332] text-lg font-black tracking-tight">
              Rs. {displayPrice?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-slate-400 text-xs line-through font-medium">
                Rs. {product.price?.toLocaleString()}
              </span>
            )}
          </div>

          {/* action btn */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 bg-[#1B4332] text-white hover:bg-[#F4A261] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm"
          >
            {product.stock === 0 ? 'Unavailable' : 'Add to Cart'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProductCard;