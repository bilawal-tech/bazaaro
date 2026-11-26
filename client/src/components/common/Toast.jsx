import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

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

// Redux ke errors (login fail, cart fail, ...) ko wahi react-hot-toast dikhata hai jo baqi pages
// use karte hain, taake poori site mein ek hi toast ka andaz ho (pehle yahan alag dabba tha).
// Kuch dikhta nahi, bas Redux ko dekhta hai.
// Pages ko apne thunk ke error ka toast alag se nahi lagana, wo yahan se aa jata hai.
function Toast() {
  const dispatch = useDispatch();

  const aError   = useSelector(authError);
  const aSuccess = useSelector(authSuccess);
  const pError   = useSelector(productError);
  const cError   = useSelector(selectCartError);
  const oError   = useSelector(selectOrderError);

  const error = aError || pError || cError || oError;

  useEffect(() => {
    if (!error) return undefined;

    // Ek hi id: naya error aaye to purana toast badal jata hai, dher nahi lagta
    toast.error(typeof error === 'string' ? error : 'Something went wrong', { id: 'api-error' });

    const timer = setTimeout(() => {
      dispatch(clearAuthError());
      dispatch(clearProductError());
      dispatch(clearCartError());
      dispatch(clearOrderError());
    }, 3500);
    return () => clearTimeout(timer);
  }, [error, dispatch]);

  // Auth ka success flag (Login/Profile ke baad) bas saaf karna hai. Toast ki zaroorat nahi,
  // har page apna feedback khud deta hai ("Profile updated", "Account created", ...).
  useEffect(() => {
    if (!aSuccess) return undefined;
    const timer = setTimeout(() => dispatch(clearAuthSuccess()), 3500);
    return () => clearTimeout(timer);
  }, [aSuccess, dispatch]);

  return null;
}

export default Toast;
