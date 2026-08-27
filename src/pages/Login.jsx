import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn as LogInIcon, Phone, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Bike, ArrowLeft, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';

const VARIANTS = {
  user: {
    role: 'user',
    icon: LogInIcon,
    badge: 'Customer',
    title: 'Welcome back',
    subtitle: 'Log in with your mobile number or email to pick up your favorites.',
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
    subtitle: 'Sign in with your email or mobile number to manage the Barcode dashboard.',
    standalone: true,
    signupPrompt: null,
  },
  rider: {
    role: 'rider',
    icon: Bike,
    badge: 'Delivery Rider',
    title: 'Rider Portal',
    subtitle: 'Sign in with your email or mobile number to view and manage your deliveries.',
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

  const { login, logout, user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (user?.role === 'rider') {
        navigate('/rider', { replace: true });
      } else if (variant === 'user') {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, user, navigate, variant]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [wrongDoor, setWrongDoor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWrongDoor(null);
    setIsSubmitting(true);

    const sanitizedIdentifier = identifier.trim();

    try {
      const isEmail = sanitizedIdentifier.includes('@');
      const payload = isEmail
        ? { email: sanitizedIdentifier.toLowerCase(), password }
        : { phone: sanitizedIdentifier.replace(/\s+/g, ''), password };

      const loggedInUser = await login(payload);

      const isActorAdmin = ['admin', 'super_admin', 'superadmin'].includes(
        String(loggedInUser?.role || '').toLowerCase()
      );

      const hasAccess =
        (cfg.role === 'admin' && isActorAdmin) ||
        (cfg.role === 'rider' && loggedInUser.role === 'rider') ||
        (cfg.role === 'user' && loggedInUser.role === 'user');

      // Role Check Logic
      if (!hasAccess) {
        if (variant === 'rider' && loggedInUser.riderApprovalStatus === 'pending') {
          await logout();
          Swal.fire({
            icon: 'info',
            title: 'Application Under Review',
            text: 'Your rider application has been submitted and is currently under review by our admin team. You will be able to access the Rider Portal once approved.',
            confirmButtonText: 'Understood',
            confirmButtonColor: '#f59e0b',
          });
          return;
        }

        if (variant === 'rider' && loggedInUser.riderApprovalStatus === 'rejected') {
          await logout();
          Swal.fire({
            icon: 'error',
            title: 'Application Not Approved',
            text: 'Your rider application was not approved. Please contact Barcode support for further assistance or apply again.',
            confirmButtonText: 'Understood',
            confirmButtonColor: '#ef4444',
          });
          return;
        }

        if (variant === 'user' && (loggedInUser.role === 'rider' || isActorAdmin)) {
          const targetPortal = loggedInUser.role === 'rider' ? '/rider' : '/admin';
          
          Swal.fire({
            icon: 'info',
            title: 'Redirecting...',
            text: `Welcome! Redirecting you to the ${isActorAdmin ? 'ADMIN' : 'RIDER'} portal.`,
            timer: 1200,
            showConfirmButton: false,
          });

          navigate(targetPortal, { replace: true });
          return;
        }

        await logout();
        const roleLabel = isActorAdmin ? 'admin' : loggedInUser.role;
        const doorMsg = wrongDoorMessage(roleLabel);
        setWrongDoor({ message: doorMsg, to: LOGIN_ROUTE[roleLabel] || '/login' });

        Swal.fire({
          icon: 'warning',
          title: 'Incorrect Portal',
          text: doorMsg,
          confirmButtonText: 'Understood',
          confirmButtonColor: '#f97316',
        });
        return;
      }

      // Success Path
      const searchRedirect = new URLSearchParams(location.search).get('redirect');
      const defaultHome = loggedInUser.role === 'rider' ? '/rider' : isActorAdmin ? '/admin' : '/';
      let redirectTo = searchRedirect || location.state?.from || defaultHome;

      if (isActorAdmin && !redirectTo.startsWith('/admin')) {
        redirectTo = '/admin';
      } else if (loggedInUser.role === 'rider' && !redirectTo.startsWith('/rider')) {
        redirectTo = '/rider';
      }

      Swal.fire({
        icon: 'success',
        title: 'Welcome Back!',
        text: `Logged in successfully as ${loggedInUser?.name || cfg.badge}.`,
        timer: 1200,
        showConfirmButton: false,
      });

      navigate(redirectTo, { replace: true });
    } catch (err) {
      const errMsg = getAuthErrorMessage(err);
      setError(errMsg);

      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: errMsg,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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
          {cfg.role === 'user' ? (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Mobile Number / Email
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="phone"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="01813616130 or user@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. name@example.com or 018XXXXXXXX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary-500 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
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