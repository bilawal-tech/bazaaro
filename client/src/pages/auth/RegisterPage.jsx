import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  registerUser,
  selectUser,
  selectLoading,
  selectError,
  selectSuccess,
  clearError,
  clearSuccess,
} from '../../redux/slices/authSlice';

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectUser);
  const loading  = useSelector(selectLoading);
  const error    = useSelector(selectError);
  const success  = useSelector(selectSuccess);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  // Already logged in → redirect
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Register success → login page
  useEffect(() => {
    if (success) {
      dispatch(clearSuccess());
      navigate('/login');
    }
  }, [success, navigate, dispatch]);

  // Clear error on unmount
  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  // Submit Handler
  const onSubmit = (data) => {
    if (loading) return;

    dispatch(registerUser({
      name:     data.name,
      email:    data.email,
      password: data.password,
      phone:    data.phone,
    }));
  };

  // Watch password for confirmation validation
  const password = watch('password');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Background Soft Ambient Light Blurs matching core brand palette */}
      <div className="absolute w-[500px] h-[500px] bg-[#2D6A4F]/5 rounded-full blur-[140px] -top-30 -right-20 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-[#F4A261]/5 rounded-full blur-[140px] -bottom-30 -left-20 pointer-events-none"></div>

      {/* Form Container: Balanced Premium Forest Greens Frame Structure */}
      <div className="bg-gradient-to-br from-[#1B4332] via-[#132A20] to-[#2D6A4F] w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden relative z-10 text-white">

        {/* ── Header ── */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-white/5 bg-black/10">
          <Link to="/" className="text-3xl font-black tracking-tight inline-flex items-center gap-2 mb-3 select-none">
            <span>🛍️</span>
            <span className="text-white font-extrabold">ZillionMall</span>
          </Link>
          <h1 className="text-white text-xl font-extrabold tracking-tight">
            Create Account
          </h1>
          <p className="text-slate-300 text-xs mt-1 font-medium">
            Join our secure global commerce hub today
          </p>
        </div>

        {/* ── Form Body ── */}
        <div className="px-8 py-7">

          {/* Error Wrapper */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-4 py-3 rounded-xl mb-4 flex items-center gap-2 font-bold">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name Field */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your Name"
                className={`
                  w-full px-4 py-2.5 bg-black/20 rounded-xl border text-sm outline-none text-white font-medium
                  placeholder-slate-400 transition duration-300 focus:ring-4 focus:ring-[#95D5B2]/10
                  ${errors.name
                    ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                    : 'border-white/10 focus:border-[#95D5B2]'
                  }
                `}
                {...register('name', {
                  required:  'Name is required',
                  minLength: {
                    value:   3,
                    message: 'Min 3 characters',
                  },
                })}
              />
              {errors.name && (
                <p className="text-rose-400 text-xs mt-1 flex items-center gap-1 font-bold">
                  <span>•</span> {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="xyz@gmail.com"
                className={`
                  w-full px-4 py-2.5 bg-black/20 rounded-xl border text-sm outline-none text-white font-medium
                  placeholder-slate-400 transition duration-300 focus:ring-4 focus:ring-[#95D5B2]/10
                  ${errors.email
                    ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                    : 'border-white/10 focus:border-[#95D5B2]'
                  }
                `}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value:   /^\S+@\S+\.\S+$/,
                    message: 'Invalid email format',
                  },
                })}
              />
              {errors.email && (
                <p className="text-rose-400 text-xs mt-1 flex items-center gap-1 font-bold">
                  <span>•</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="03xx-xxxxxxx"
                className={`
                  w-full px-4 py-2.5 bg-black/20 rounded-xl border text-sm outline-none text-white font-medium
                  placeholder-slate-400 transition duration-300 focus:ring-4 focus:ring-[#95D5B2]/10
                  ${errors.phone
                    ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                    : 'border-white/10 focus:border-[#95D5B2]'
                  }
                `}
                {...register('phone', {
                  required:  'Phone is required',
                  minLength: {
                    value:   10,
                    message: 'Invalid phone number',
                  },
                })}
              />
              {errors.phone && (
                <p className="text-rose-400 text-xs mt-1 flex items-center gap-1 font-bold">
                  <span>•</span> {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                className={`
                  w-full px-4 py-2.5 bg-black/20 rounded-xl border text-sm outline-none text-white font-medium
                  placeholder-slate-400 transition duration-300 focus:ring-4 focus:ring-[#95D5B2]/10
                  ${errors.password
                    ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                    : 'border-white/10 focus:border-[#95D5B2]'
                  }
                `}
                {...register('password', {
                  required:  'Password is required',
                  minLength: {
                    value:   6,
                    message: 'Min 6 characters',
                  },
                })}
              />
              {errors.password && (
                <p className="text-rose-400 text-xs mt-1 flex items-center gap-1 font-bold">
                  <span>•</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Repeat password"
                className={`
                  w-full px-4 py-2.5 bg-black/20 rounded-xl border text-sm outline-none text-white font-medium
                  placeholder-slate-400 transition duration-300 focus:ring-4 focus:ring-[#95D5B2]/10
                  ${errors.confirmPassword
                    ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                    : 'border-white/10 focus:border-[#95D5B2]'
                  }
                `}
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="text-rose-400 text-xs mt-1 flex items-center gap-1 font-bold">
                  <span>•</span> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Premium Coral Action Trigger Button (#F4A261) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full bg-[#F4A261] text-white hover:bg-white hover:text-[#1B4332] text-xs font-black py-3.5 rounded-xl shadow-lg
                  transition duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                  tracking-wider uppercase
                "
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

          </form>

          {/* Login Link Redirection */}
          <p className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-white/5 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#F4A261] font-black hover:underline underline-offset-4 transition"
            >
              Login here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default RegisterPage;