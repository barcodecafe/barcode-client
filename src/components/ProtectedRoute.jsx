import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// ProtectedRoute.jsx
//
// Gate for /admin/*. Three states:
//   1. Auth not hydrated yet (page refresh) → small loading spinner, avoids
//      a flash-redirect to /login before getCurrentUser() resolves.
//   2. Not authenticated → redirect to /login, remembering where they were
//      headed via location state so Login.jsx can send them back after.
//   3. Authenticated but not an admin → friendly "access restricted" screen
//      instead of a redirect loop or blank page.
// ---------------------------------------------------------------------------
export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireRider = false,
  permission = null,
}) => {
  const { isAuthenticated, isAdmin, isSuperAdmin, hasPermission, user, isAuthLoaded } = useAuth();
  const location = useLocation();

  if (!isAuthLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Send visitors to the login that matches the area they were trying to reach.
    const loginPath = requireAdmin || requireSuperAdmin ? '/admin/login' : requireRider ? '/rider/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location.pathname + location.search }} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-amber-500" />
        </div>
        <h1 className="font-display text-xl font-bold text-neutral-800 dark:text-neutral-100">
          Super Admin Access Required
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm">
          This section is strictly reserved for the Super Administrator.
        </p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="font-display text-xl font-bold text-neutral-800 dark:text-neutral-100">
          Access Restricted
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm">
          This area is reserved for administrators and authorized staff. If you believe this is a mistake, contact the Barcode team.
        </p>
      </div>
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-amber-500" />
        </div>
        <h1 className="font-display text-xl font-bold text-neutral-800 dark:text-neutral-100">
          Module Access Denied
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm">
          You do not have permission to view or manage this module. Please contact your Super Administrator.
        </p>
      </div>
    );
  }

  if (requireRider && user?.role !== 'rider') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="font-display text-xl font-bold text-neutral-800 dark:text-neutral-100">
          Access Restricted
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm">
          This area is reserved for delivery riders. Please log in with a rider account to access this page.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
