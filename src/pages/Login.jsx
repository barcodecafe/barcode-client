import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn as LogInIcon, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Bike, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';

// ---------------------------------------------------------------------------
// Login.jsx — one component, three role-segregated doors:
//   /login        → variant="user"   (customers only)
//   /admin/login  → variant="admin"  (administrators only)
//   /rider/login  → variant="rider"  (delivery riders only)
//
// Credentials are verified by the server; the role gate is enforced here: if
// someone signs in at the wrong door (e.g. an admin at /login), we sign them
// straight back out and point them to the correct portal.
// ---------------------------------------------------------------------------
const VARIANTS = {
  user: {
    role: 'user',
    icon: LogInIcon,
    badge: 'Customer',
    title: 'Welcome back',
    subtitle: 'Log in to pick up your favorites and order history.',
    home: '/',
    standalone: false,
    signupPrompt: "Don't have an account?",
    signupTo: '/signup',
    signupLabel: 'Sign up',
  },
  admin: {
    role: 'admin',
    icon: ShieldCheck,
    badge: 'Administrator',
    title: 'Admin Portal',
    subtitle: 'Sign in to manage the Barcode dashboard.',
    home: '/admin',
    standalone: true,
    signupPrompt: null, // admins are provisioned internally — no public signup
  },
  rider: {
    role: 'rider',
    icon: Bike,
    badge: 'Delivery Rider',
    title: 'Rider Portal',
    subtitle: 'Sign in to view and manage your deliveries.',
    home: '/rider',
    standalone: true,
    signupPrompt: 'Want to ride with us?',
    signupTo: '/rider-application',
    signupLabel: 'Apply now',
  },
};

const LOGIN_ROUTE = { admin: '/admin/login', rider: '/rider/login', user: '/login' };
const wrongDoorMessage = (role) =>
  `You signed in with ${role === 'admin' ? 'an administrator' : role === 'rider' ? 'a rider' : 'a customer'} account. Please use the ${role} login below.`;

export const Login = ({ variant = 'user' }) => {
  const cfg = VARIANTS[variant] || VARIANTS.user;
  const Icon = cfg.icon;

  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [wrongDoor, setWrongDoor] = useState(null); // { message, to }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWrongDoor(null);
    setIsSubmitting(true);
    try {
      const loggedInUser = await login({ email, password });

      // Role gate: right credentials, wrong door → sign back out and redirect.
      if (loggedInUser.role !== cfg.role) {
        await logout();
        setWrongDoor({ message: wrongDoorMessage(loggedInUser.role), to: LOGIN_ROUTE[loggedInUser.role] || '/login' });
        return;
      }

      // ProtectedRoute may have sent them here with a return target.
      const redirectTo = location.state?.from || cfg.home;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-primary-500" />
        </div>
        <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
          {cfg.badge} Access
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
          {cfg.title}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2">{cfg.subtitle}</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {wrongDoor && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{wrongDoor.message}</span>
            </div>
            <Link
              to={wrongDoor.to}
              className="mt-2 inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300 hover:underline"
            >
              Go to the correct login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/10 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in...
              </>
            ) : (
              variant === 'user' ? 'Log In' : `Log in to ${cfg.badge} Portal`
            )}
          </button>
        </form>

        {cfg.signupPrompt && (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
            {cfg.signupPrompt}{' '}
            <Link to={cfg.signupTo} className="text-primary-500 font-semibold hover:underline">
              {cfg.signupLabel}
            </Link>
          </p>
        )}
      </div>
    </motion.div>
  );

  // Standalone portals (admin/rider) render full-screen with a back-to-site
  // link; the customer login lives inside the public layout (navbar present).
  if (cfg.standalone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-neutral-50 dark:bg-neutral-950">
        <Link
          to="/"
          className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-primary-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Barcode
        </Link>
        {card}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      {card}
    </div>
  );
};

export default Login;
