import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  getProfile,
  updateProfile,
  selectUser,
} from '../../redux/slices/authSlice';

const inputClass = (hasError) => `input ${hasError ? 'border-red-400' : ''}`;

function ProfilePage() {
  const dispatch = useDispatch();
  const authUser = useSelector(selectUser);
  // Login ke baad state { token, user } hoti hai
  const profile = authUser?.user || authUser;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '', phone: '', street: '', city: '', zip: '',
      currentPassword: '', newPassword: '', confirmPassword: '',
    },
  });

  // Page khulte hi server se taaza profile lo
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  // Profile badle (load ya save ke baad) to form dobara bharo. Password fields khali.
  const signature = JSON.stringify([profile?.name, profile?.phone, profile?.address]);
  useEffect(() => {
    if (!profile) return;
    reset({
      name:   profile.name || '',
      phone:  profile.phone || '',
      street: profile.address?.street || '',
      city:   profile.address?.city || '',
      zip:    profile.address?.zip || '',
      currentPassword: '', newPassword: '', confirmPassword: '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, reset]);

  const onSubmit = async (data) => {
    const payload = {
      name:  data.name.trim(),
      phone: data.phone.trim(),
      address: {
        street: data.street.trim(),
        city:   data.city.trim(),
        zip:    data.zip.trim(),
      },
    };
    if (data.newPassword) {
      payload.currentPassword = data.currentPassword;
      payload.newPassword = data.newPassword;
    }

    const res = await dispatch(updateProfile(payload));
    if (res.error) {
      toast.error(res.payload || 'Could not update profile');
    } else {
      toast.success('Profile updated');
    }
  };

  if (!profile) return null;

  return (
    <div className="bg-surface">
      <div className="container-page max-w-2xl py-8 sm:py-12">

        <div className="mb-6">
          <h1 className="page-title">My profile</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage your details and password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Personal details</h2>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" value={profile.email || ''} disabled className="input" />
              <p className="mt-1 text-xs text-ink-faint">Email cannot be changed.</p>
            </div>

            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" className={inputClass(errors.name)} {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" className={inputClass(errors.phone)} {...register('phone', { required: 'Phone number is required' })} />
              {errors.phone && <p className="field-error">{errors.phone.message}</p>}
            </div>
          </section>

          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Default address</h2>
            <div>
              <label htmlFor="street" className="label">Street</label>
              <input id="street" className="input" {...register('street')} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="label">City</label>
                <input id="city" className="input" {...register('city')} />
              </div>
              <div>
                <label htmlFor="zip" className="label">Postal code</label>
                <input id="zip" className="input" {...register('zip')} />
              </div>
            </div>
          </section>

          {/* Google-only account ka password nahi hota */}
          {profile?.hasPassword !== false && (
          <section className="card space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">Change password</h2>
              <p className="mt-1 text-sm text-ink-soft">Leave blank to keep your current password.</p>
            </div>

            <div>
              <label htmlFor="currentPassword" className="label">Current password</label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                className={inputClass(errors.currentPassword)}
                {...register('currentPassword', {
                  validate: (v, form) => !form.newPassword || !!v || 'Enter your current password',
                })}
              />
              {errors.currentPassword && <p className="field-error">{errors.currentPassword.message}</p>}
            </div>

            <div>
              <label htmlFor="newPassword" className="label">New password</label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className={inputClass(errors.newPassword)}
                {...register('newPassword', { minLength: { value: 6, message: 'Use at least 6 characters' } })}
              />
              {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm new password</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={inputClass(errors.confirmPassword)}
                {...register('confirmPassword', {
                  validate: (v, form) => v === form.newPassword || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
            </div>
          </section>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
