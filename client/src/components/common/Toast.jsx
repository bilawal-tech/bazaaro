import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef } from 'react';

// Auth Selectors & Actions
import {
  selectError   as authError,
  selectSuccess as authSuccess,
  clearError    as clearAuthError,
  clearSuccess  as clearAuthSuccess,
} from '../../redux/slices/authSlice';

// Product Selectors & Actions
import {
  selectError   as productError,
  clearError    as clearProductError,
} from '../../redux/slices/productSlice';

// Cart Selectors & Actions
import {
  selectCartError,
  clearError as clearCartError,
} from '../../redux/slices/cartSlice';

// Order Selectors & Actions
import {
  selectOrderError,
  clearError as clearOrderError,
} from '../../redux/slices/orderSlice';

function Toast() {
  const dispatch = useDispatch();
  const timerRef = useRef(null);

  const [message, setMessage] = useState('');
  const [type, setType] = useState('error');
  const [isVisible, setIsVisible] = useState(false);

  // ── Redux Global State State ──────────────
  const aError   = useSelector(authError);
  const aSuccess = useSelector(authSuccess);
  const pError   = useSelector(productError);
  const cError   = useSelector(selectCartError);
  const oError   = useSelector(selectOrderError);

  //Action Pipeline
  const showToast = (msg, toastType = 'error') => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setMessage(msg);
    setType(toastType);
    setIsVisible(true);

    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      setMessage('');
      
      //clear the error
      if (toastType === 'error') {
        dispatch(clearAuthError());
        dispatch(clearProductError());
        dispatch(clearCartError());
        dispatch(clearOrderError());
      } else {
        dispatch(clearAuthSuccess());
      }
    }, 3500); 
  };

  // Watch Systems 
  useEffect(() => {
    const error = aError || pError || cError || oError;
    if (error) {
      showToast(error, 'error');
    }
  }, [aError, pError, cError, oError]);

  useEffect(() => {
    if (aSuccess) {
      const successMessage = typeof aSuccess === 'string' ? aSuccess : 'Authentication verified successfully.';
      showToast(successMessage, 'success');
    }
  }, [aSuccess]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-6 right-6 z-[9999] 
      min-w-[300px] max-w-md 
      px-5 py-4 rounded-xl shadow-2xl 
      text-white text-xs font-semibold uppercase tracking-wider
      flex items-center gap-3.5 
      backdrop-blur-md transition-all duration-300 transform animate-fade-in-up
      ${type === 'error' 
        ? 'bg-rose-950/95 border border-rose-500/30 text-rose-200' 
        : 'bg-emerald-950/95 border border-emerald-500/30 text-emerald-200'
      }
    `}>
      <span className={`text-lg flex items-center justify-center p-1 rounded-lg ${type === 'error' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
        {type === 'error' ? '⚠️' : '✨'}
      </span>
      <p className="flex-1 normal-case font-medium text-sm leading-relaxed tracking-normal text-slate-100">
        {message}
      </p>
    </div>
  );
}

export default Toast;