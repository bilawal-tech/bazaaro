import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  loginUser,
  selectUser,
  selectLoading,
  selectError,
} from '../../redux/slices/authSlice';

function LoginPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector(selectUser);
  const loading   = useSelector(selectLoading);
  const error     = useSelector(selectError);

  // ── React Hook Form ───────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // ── Already logged in → redirect ──────────
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // ── Submit Handler ─────────────────────────
  const onSubmit = (data) => {
    if (loading) return;
    
    dispatch(loginUser({
      email:    data.email,
      password: data.password,
    }));
  };

  return (
    /* Outer Background set to Pure White for maximum high-contrast aesthetic grid separation */
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Subtle Soft Glow Background Aesthetics matching brand colors */}
      <div className="absolute w-[600px] h-[600px] bg-[#2D6A4F]/5 rounded-full blur-[140px] -top-40 -left-40 pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] bg-[#F4A261]/5 rounded-full blur-[140px] -bottom-40 -right-40 pointer-events-none"></div>

      {/* Form Card Container: Premium Luxury Forest Greens Frame Structure */}
      <div className="bg-gradient-to-br from-[#1B4332] via-[#132A20] to-[#2D6A4F] w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden relative z-10 text-white">

        {/* ── Header ── */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-white/5 bg-black/10">
          
          <Link to="/" className="text-3xl font-black tracking-tight inline-flex items-center gap-2 mb-3 select-none">
            <span>🛍️</span>
            <span className="text-white font-extrabold">ZillionMall</span>
          </Link>
          
          <h1 className="text-white text-xl font-extrabold tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-300 text-xs mt-1 font-medium">
            Access your secure dashboard & shopping panel
          </p>
        </div>

        {/* ── Form Body ── */}
        <div className="px-8 py-8">

          {/* Inline Error Container */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-4 py-3 rounded-xl mb-5 flex items-center gap-2 font-bold">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email Field */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                className={`
                  w-full px-4 py-3 bg-black/20 rounded-xl border text-sm outline-none text-white font-medium
                  placeholder-slate-400 transition duration-300 focus:ring-4 focus:ring-[#95D5B2]/10
                  ${errors.email
                    ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                    : 'border-white/10 focus:border-[#95D5B2]'
                  }
                `}
                {...register('email', {
                  required: 'Email statement is required',
                  pattern: {
                    value:   /^\S+@\S+\.\S+$/,
                    message: 'Please provide a valid email structure',
                  },
                })}
              />
              {errors.email && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-bold">
                  <span>•</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className={`
                  w-full px-4 py-3 bg-black/20 rounded-xl border text-sm outline-none text-white font-medium
                  placeholder-slate-400 transition duration-300 focus:ring-4 focus:ring-[#95D5B2]/10
                  ${errors.password
                    ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                    : 'border-white/10 focus:border-[#95D5B2]'
                  }
                `}
                {...register('password', {
                  required:  'Password field is required',
                  minLength: {
                    value:   6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              {errors.password && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-bold">
                  <span>•</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Secure Coral Action Trigger Button (#F4A261) */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full bg-[#F4A261] text-white hover:bg-white hover:text-[#1B4332] text-xs font-black py-3.5 rounded-xl shadow-lg
                transition duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                mt-4 tracking-wider uppercase
              "
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing Auth...
                </span>
              ) : (
                'Secure Sign In'
              )}
            </button>

          </form>

          {/* Core Register Redirection */}
          <p className="text-center text-xs text-slate-400 mt-8 pt-4 border-t border-white/5 font-medium">
            New to our marketplace?{' '}
            <Link
              to="/register"
              className="text-[#F4A261] font-black hover:underline underline-offset-4 transition"
            >
              Create Account Here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;