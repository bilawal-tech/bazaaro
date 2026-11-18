import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  getProfile,
  updateProfile,
  selectUser,
} from '../../redux/slices/authSlice';

const inputClass = (hasError) =>
  `w-full px-4 py-2.5 bg-white rounded-xl border text-sm outline-none text-slate-800 font-medium transition focus:ring-4 focus:ring-[#2D6A4F]/10 ${
    hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#2D6A4F]'
  }`;

const labelClass = 'block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1';

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
    <div className="min-h-screen py-16 bg-slate-50 text-slate-800 antialiased">
      <div className="max-w-2xl mx-auto px-4">

        <div className="mb-8">
          <h1 className="text-[#1B4332] text-2xl font-black tracking-tight">My Profile</h1>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">
            Manage your details and password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

          {/* Personal */}
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-slate-800 text-sm font-black uppercase tracking-wider">
              Personal Details
            </h2>

            <div>
              <label className={labelClass}>Email</label>
              <input
                value={profile.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-500 font-medium cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className={labelClass}>Full Name</label>
              <input
                className={inputClass(errors.name)}
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass(errors.phone)}
                {...register('phone', { required: 'Phone number is required' })}
              />
              {errors.phone && (
                <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-slate-800 text-sm font-black uppercase tracking-wider">
              Default Address
            </h2>
            <div>
              <label className={labelClass}>Street</label>
              <input className={inputClass(false)} {...register('street')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input className={inputClass(false)} {...register('city')} />
              </div>
              <div>
                <label className={labelClass}>Zip</label>
                <input className={inputClass(false)} {...register('zip')} />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-slate-800 text-sm font-black uppercase tracking-wider">
                Change Password
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">Leave blank to keep your current password.</p>
            </div>

            <div>
              <label className={labelClass}>Current Password</label>
              <input
                type="password"
                autoComplete="current-password"
                className={inputClass(errors.currentPassword)}
                {...register('currentPassword', {
                  validate: (v, form) => !form.newPassword || !!v || 'Enter your current password',
                })}
              />
              {errors.currentPassword && (
                <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                className={inputClass(errors.newPassword)}
                {...register('newPassword', {
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />
              {errors.newPassword && (
                <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                className={inputClass(errors.confirmPassword)}
                {...register('confirmPassword', {
                  validate: (v, form) => v === form.newPassword || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1B4332] hover:bg-[#132A20] text-white text-xs font-black py-3.5 rounded-xl uppercase tracking-widest transition disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
