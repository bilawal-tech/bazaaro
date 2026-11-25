import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { googleLogin } from '../../redux/slices/authSlice';

// "or" line + Google ka official button. VITE_GOOGLE_CLIENT_ID na ho to kuch nahi dikhata.
// (GoogleOAuthProvider main.jsx mein lagta hai.)
function GoogleButton() {
  const dispatch = useDispatch();
  const boxRef = useRef(null);
  const [width, setWidth] = useState(320);

  // Google button ko fixed px width chahiye (200 se 400), card ke hisaab se lo
  useEffect(() => {
    if (boxRef.current) {
      setWidth(Math.min(400, Math.max(200, Math.floor(boxRef.current.clientWidth))));
    }
  }, []);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={boxRef} className="mt-5 flex justify-center">
        <GoogleLogin
          onSuccess={(res) => {
            if (res.credential) dispatch(googleLogin({ credential: res.credential }));
          }}
          onError={() => toast.error('Google sign-in failed. Please try again.')}
          text="continue_with"
          shape="rectangular"
          theme="outline"
          size="large"
          width={String(width)}
        />
      </div>
    </div>
  );
}

export default GoogleButton;
