import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/common/AuthShell';
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
    <AuthShell
      title="Sign in"
      subtitle="Welcome back to Bazaaro"
      footer={<>New here? <Link to="/register" className="link">Create an account</Link></>}
    >
      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className={`input ${errors.email ? 'border-red-400' : ''}`}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
            })}
          />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            className={`input ${errors.password ? 'border-red-400' : ''}`}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
