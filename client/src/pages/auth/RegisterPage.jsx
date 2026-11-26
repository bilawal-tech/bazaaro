import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/common/AuthShell';
import GoogleButton from '../../components/common/GoogleButton';
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
      toast.success('Account created. Please sign in.');
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

  const inputClass = (name) => `input ${errors[name] ? 'border-red-400' : ''}`;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up to place and track orders"
      footer={<>Already have an account? <Link to="/login" className="link">Sign in</Link></>}
    >
      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className={inputClass('name')}
            {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'Use at least 3 characters' } })}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className={inputClass('email')}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: 'Enter a valid email address' },
            })}
          />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="label">Phone number</label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="03xx-xxxxxxx"
            className={inputClass('phone')}
            {...register('phone', { required: 'Phone number is required', minLength: { value: 10, message: 'Enter a valid phone number' } })}
          />
          {errors.phone && <p className="field-error">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className={inputClass('password')}
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Use at least 6 characters' } })}
          />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            className={inputClass('confirmPassword')}
            {...register('confirmPassword', {
              required: 'Confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary btn-lg mt-2 w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <GoogleButton />
    </AuthShell>
  );
}

export default RegisterPage;
