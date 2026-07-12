import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bike,
  Upload,
  FileText,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  CreditCard,
  Briefcase,
  Loader2,
  CheckCircle,
  X,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// RiderApplication.jsx — dedicated Rider Sign-Up
//
// One form collects the account (name/email/password) + contact/KYC info +
// documents (photo + license), submits as multipart to POST /api/riders/register,
// which creates a rider account in "pending" state and logs the rider in
// immediately. They land on the rider dashboard, shown in a pending state until
// an admin approves.
// ---------------------------------------------------------------------------

const passwordOk = (p) => p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p);

export const RiderApplication = () => {
  const { user, isAuthenticated, registerRider } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    address: '',
    nid: '',
    experience: '',
    expYears: '1',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [license, setLicense] = useState(null);
  const [licenseName, setLicenseName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Profile photo must be an image (PNG/JPG).');
    if (file.size > 5 * 1024 * 1024) return setError('Profile photo must be under 5MB.');
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleLicenseChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))
      return setError('Driving license must be a PDF file.');
    if (file.size > 5 * 1024 * 1024) return setError('License PDF must be under 5MB.');
    setLicense(file);
    setLicenseName(file.name);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.nid.trim())
      return setError('Please fill in your name, email, phone, and NID.');
    if (!passwordOk(form.password))
      return setError('Password must be at least 8 characters with an uppercase letter, a lowercase letter, and a number.');
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    if (!photo) return setError('Please upload a profile photo.');
    if (!license) return setError('Please upload your driving license (PDF).');

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('email', form.email.trim());
      fd.append('password', form.password);
      fd.append('phone', form.phone.trim());
      fd.append('address', form.address.trim());
      fd.append('nid', form.nid.trim());
      fd.append('experience', form.experience.trim());
      fd.append('expYears', form.expYears);
      fd.append('photo', photo);
      fd.append('license', license);
      await registerRider(fd);
      navigate('/rider', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already a rider → send to the portal
  if (isAuthenticated && user?.role === 'rider') {
    return (
      <CenteredCard
        icon={<CheckCircle className="w-8 h-8 text-green-500" />}
        tint="bg-green-500/10"
        title="You're already a rider"
        text="Head to the Rider Portal to manage your deliveries and approval status."
        cta={{ to: '/rider', label: 'Go to Rider Portal' }}
      />
    );
  }

  // Admins manage riders, they don't apply
  if (isAuthenticated && user?.role === 'admin') {
    return (
      <CenteredCard
        icon={<User className="w-8 h-8 text-indigo-500" />}
        tint="bg-indigo-500/10"
        title="Administrator account"
        text="Admins review rider applications from the dashboard rather than applying."
        cta={{ to: '/admin/rider-applications', label: 'Review Applications' }}
      />
    );
  }

  const inputCls =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm';
  const labelCls = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
          <Bike className="w-7 h-7 text-primary-500" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
          Become a Barcode Rider
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2 max-w-md mx-auto">
          Sign up as a delivery rider in one step. We create your account instantly — you can log in
          right away, and an admin will approve your profile shortly.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8"
      >
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Account */}
        <section className="space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input required value={form.name} onChange={set('name')} placeholder="Your full name" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="8+ chars, upper, lower, number"
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Re-enter your password"
                  className={inputCls}
                />
              </div>
              {form.confirm.length > 0 && (
                <p className={`mt-1.5 text-[11px] flex items-center gap-1.5 ${form.password === form.confirm ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {form.password === form.confirm ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {form.password === form.confirm ? 'Passwords match' : "Passwords don't match"}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Contact & KYC */}
        <section className="space-y-5 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Contact & Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+8801700000000" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>National ID (NID)</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input required value={form.nid} onChange={set('nid')} placeholder="e.g. 19954203120…" className={inputCls + ' font-mono'} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input value={form.address} onChange={set('address')} placeholder="House, road, area, city" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Years of Experience</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <select value={form.expYears} onChange={set('expYears')} className={inputCls + ' cursor-pointer appearance-none'}>
                  <option value="0">No experience (fresh start)</option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="5">5+ Years</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Experience (brief)</label>
              <input value={form.experience} onChange={set('experience')} placeholder="e.g. 2 years at Foodpanda" className={inputCls.replace('pl-10', 'pl-4')} />
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="space-y-5 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photo */}
            <div>
              <label className={labelCls}>Profile Photo (image)</label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 relative h-40">
                {photoPreview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img src={photoPreview} alt="Preview" className="max-h-full max-w-full rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Upload Photo</span>
                    <span className="text-[10px] text-neutral-400 mt-1">PNG, JPG (max 5MB)</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            {/* License */}
            <div>
              <label className={labelCls}>Driving License (PDF)</label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 relative h-40">
                {license ? (
                  <div className="text-center flex flex-col items-center justify-center">
                    <FileCheck className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate max-w-[200px] block">{licenseName}</span>
                    <button
                      type="button"
                      onClick={() => { setLicense(null); setLicenseName(''); }}
                      className="mt-2 text-xs text-red-500 hover:underline"
                    >
                      Remove PDF
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <FileText className="w-6 h-6 text-neutral-400 mb-2" />
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Upload License</span>
                    <span className="text-[10px] text-neutral-400 mt-1">PDF only (max 5MB)</span>
                    <input type="file" accept="application/pdf" onChange={handleLicenseChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/10 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating your rider account…
            </>
          ) : (
            'Sign Up as a Rider'
          )}
        </button>

        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          Already have a rider account?{' '}
          <Link to="/login" className="text-primary-500 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

// Small shared card for the "already rider / admin" states
const CenteredCard = ({ icon, tint, title, text, cta }) => (
  <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-8 shadow-xl text-center"
    >
      <div className={`w-16 h-16 rounded-2xl ${tint} flex items-center justify-center mx-auto mb-6`}>{icon}</div>
      <h1 className="font-display text-2xl font-extrabold text-neutral-800 dark:text-white tracking-tight">{title}</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">{text}</p>
      <Link
        to={cta.to}
        className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 font-bold text-sm text-white shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
      >
        {cta.label}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </motion.div>
  </div>
);

export default RiderApplication;
