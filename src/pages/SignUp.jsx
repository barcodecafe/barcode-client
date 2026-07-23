import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';

// Password rules (সবার জন্য প্রযোজ্য)
const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
];

const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/;
const STRICT_EMAIL = /^[^\s@.][^\s@]*@[^\s@.]+(?:\.[^\s@.]+)+$/;

export const SignUp = ({ defaultRole = 'user' }) => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role] = useState(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUser = role === 'user';

  // Live password validation
  const passwordChecks = PASSWORD_RULES.map((r) => ({ label: r.label, passed: r.test(password) }));
  const passwordScore = passwordChecks.filter((c) => c.passed).length;
  const isPasswordValid = passwordScore === PASSWORD_RULES.length;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Live validation
  const emailValid = STRICT_EMAIL.test(email.trim());
  const phoneValid = BD_PHONE.test(phone.trim());

  // Submit button state: User এর জন্য emailValid চেক করার দরকার নেই
  const canSubmit =
    name.trim() &&
    phoneValid &&
    isPasswordValid &&
    passwordsMatch &&
    (!isUser ? emailValid : true) &&
    !isSubmitting;

  const strengthLabel = passwordScore <= 2 ? 'Weak' : passwordScore === 3 ? 'Medium' : 'Strong';
  const strengthColor =
    passwordScore <= 2 ? 'text-red-500' : passwordScore === 3 ? 'text-amber-500' : 'text-green-600 dark:text-green-400';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Admin/Rider এর জন্য Email চেক
    if (!isUser && !emailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!phoneValid) {
      setError('Please enter a valid Bangladeshi mobile number.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all the password requirements below.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 🎯 PAYLOAD LOGIC:
      // User: { name, phone, password, role }
      // Admin/Rider: { name, email, phone, password, role }
      const payload = isUser
        ? {
            name: name.trim(),
            phone: phone.trim(),
            password,
            role,
          }
        : {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            role,
          };

      const newUser = await register(payload);
      if (newUser?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (newUser?.role === 'rider') {
        navigate('/rider', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-primary-500" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white capitalize">
            {role === 'admin' ? 'Create Admin Account' : role === 'rider' ? 'Create Rider Account' : 'Create your account'}
          </h1>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field (সবার জন্য) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Email Field (শুধুমাত্র Admin & Rider এর জন্য) */}
            {!isUser && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
                {email.length > 0 && !emailValid && (
                  <p className="mt-1.5 text-[11px] flex items-center gap-1.5 text-red-500">
                    <X className="w-3 h-3" /> Please enter a valid email address
                  </p>
                )}
              </div>
            )}

            {/* Mobile Number Field (সবার জন্য) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="phone"
                  type="tel"
                  required
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712345678"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
              {phone.length > 0 && (
                <p className={`mt-1.5 text-[11px] flex items-center gap-1.5 ${phoneValid ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {phoneValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {phoneValid ? 'Looks good' : 'Enter a valid Bangladeshi mobile number'}
                </p>
              )}
            </div>

            {/* Password Field (সবার জন্য) */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1 flex-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < passwordScore
                              ? passwordScore <= 2
                                ? 'bg-red-400'
                                : passwordScore === 3
                                  ? 'bg-amber-400'
                                  : 'bg-green-500'
                              : 'bg-neutral-200 dark:bg-neutral-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[11px] font-semibold ${strengthColor}`}>{strengthLabel}</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {passwordChecks.map((c) => (
                      <li
                        key={c.label}
                        className={`flex items-center gap-1.5 text-[11px] ${
                          c.passed ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {c.passed ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password Field (সবার জন্য) */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
              {confirmPassword.length > 0 && (
                <p
                  className={`mt-1.5 text-[11px] flex items-center gap-1.5 ${
                    passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {passwordsMatch ? 'Passwords match' : "Passwords don't match"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/10 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
            Already have an account?{' '}
            <Link
              to={role === 'admin' ? '/admin/login' : role === 'rider' ? '/rider/login' : '/login'}
              className="text-primary-500 font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;