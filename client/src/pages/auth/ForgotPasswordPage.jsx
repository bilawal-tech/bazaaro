import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/common/AuthShell';
import API from '../../services/api';

function ForgotPasswordPage() {
  const [sent, setSent]   = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setError('');
    try {
      await API.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong, please try again');
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will email you a link to reset it"
      footer={<>Remembered it? <Link to="/login" className="link">Back to sign in</Link></>}
    >
      {sent ? (
        <div role="status" className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          If an account exists for that email, a reset link is on its way. The link works for 15 minutes.
          Check your spam folder if you do not see it.
        </div>
      ) : (
        <>
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
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: 'Enter a valid email address' },
                })}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export default ForgotPasswordPage;
