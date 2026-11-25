import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/common/AuthShell';
import API from '../../services/api';

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ password }) => {
    setError('');
    try {
      await API.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password });
      toast.success('Password updated. Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong, please try again');
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you have not used before"
      footer={<><Link to="/forgot-password" className="link">Request a new link</Link> · <Link to="/login" className="link">Sign in</Link></>}
    >
      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="password" className="label">New password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className={`input ${errors.password ? 'border-red-400' : ''}`}
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Use at least 6 characters' } })}
          />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            className={`input ${errors.confirmPassword ? 'border-red-400' : ''}`}
            {...register('confirmPassword', {
              required: 'Confirm your password',
              validate: (v) => v === getValues('password') || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
          {isSubmitting ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  );
}

export default ResetPasswordPage;
