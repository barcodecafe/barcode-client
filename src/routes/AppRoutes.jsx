import { Routes, Route } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { Home } from '../pages/Home';
import { Branches } from '../pages/Branches';
import BranchDetail from '../pages/BranchDetail';
import { Brands } from '../pages/Brands';
import { BrandLayout } from '../layouts/BrandLayout';
import { BrandHome } from '../pages/BrandHome';
import { BrandMenu } from '../pages/BrandMenu';
import { Menu } from '../pages/Menu';
import { DishDetail } from '../pages/DishDetail';
import { About } from '../pages/About';
import { Login } from '../pages/Login';
import { SignUp } from '../pages/SignUp';
import { Profile } from '../pages/Profile';
import { Checkout } from '../pages/Checkout';
import { OrderTracking } from '../pages/OrderTracking';
import { PaymentResult } from '../pages/PaymentResult';
import { PaymentDemo } from '../pages/PaymentDemo';
import { RiderDashboard } from '../pages/RiderDashboard';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminDishes } from '../pages/admin/AdminDishes';
import { AdminBranches } from '../pages/admin/AdminBranches';
import { AdminBrands } from '../pages/admin/AdminBrands';
import { AdminRegions } from '../pages/admin/AdminRegions';
import { AdminOrders } from '../pages/admin/AdminOrders';
import { AdminCustomers } from '../pages/admin/AdminCustomers';
import { AdminCoupons } from '../pages/admin/AdminCoupons';
import { AdminHero } from '../pages/admin/AdminHero';
import { AdminAbout } from '../pages/admin/AdminAbout';
import { RiderApplication } from '../pages/RiderApplication';
import { AdminRiders } from '../pages/admin/AdminRiders';
import { AdminSettings } from '../pages/admin/AdminSettings';
import { CartProvider } from '../context/CartContext';
import { BranchProvider } from '../context/BranchContext';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { ScrollToTop } from '../components/ScrollToTop';
import { ProtectedRoute } from '../components/ProtectedRoute';

// ---------------------------------------------------------------------------
// Provider order: Auth wraps everything (other providers may eventually
// need to know who's logged in — e.g. favorites/cart syncing to a real
// account). Favorites and Cart are independent of each other so their
// relative order doesn't matter.
//
// <ScrollToTop /> is mounted once here, inside the Router context but
// outside <Routes>, so it sees every route change app-wide (Navbar links,
// Footer Quick Links, search result clicks, programmatic navigate() calls,
// etc.) without needing to be wired into each page individually.
// ---------------------------------------------------------------------------
export const AppRoutes = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FavoritesProvider>
          <CartProvider>
           <BranchProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<RootLayout />}>
                <Route index element={<Home />} />
                <Route path="branches" element={<Branches />} />
                <Route path="branches/:id" element={<BranchDetail />} />
                <Route path="brands" element={<Brands />} />
                <Route path="menu" element={<Menu />} />
                <Route path="menu/:id" element={<DishDetail />} />
                <Route path="about" element={<About />} />
                <Route path="login" element={<Login variant="user" />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="admin-signup" element={<SignUp defaultRole="admin" />} />
                <Route path="profile" element={<Profile />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="rider-application" element={<RiderApplication />} />
                <Route path="order-tracking/:id" element={<OrderTracking />} />
                {/* Gateway return pages — the server redirects here after settling */}
                <Route path="payment/success" element={<PaymentResult variant="success" />} />
                <Route path="payment/fail" element={<PaymentResult variant="fail" />} />
                <Route path="payment/cancel" element={<PaymentResult variant="cancel" />} />
                <Route path="payment/demo" element={<PaymentDemo />} />
                <Route path="*" element={<div className="p-16 text-center text-2xl font-bold">404 - Page Not Found</div>} />
              </Route>

              {/* Brand microsites (public) — each brand's own themed nav/footer,
                  separate from the group's RootLayout shell. */}
              <Route path="/brands/:slug" element={<BrandLayout />}>
                <Route index element={<BrandHome />} />
                <Route path="menu" element={<BrandMenu />} />
              </Route>

              {/* Role-segregated login portals (public, outside RootLayout) */}
              <Route path="/admin/login" element={<Login variant="admin" />} />
              <Route path="/rider/login" element={<Login variant="rider" />} />

              {/* Rider Portal */}
              <Route
                path="/rider"
                element={
                  <ProtectedRoute requireRider>
                    <RiderDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard — protected, admin-role only. Separate from
                  RootLayout since it uses its own sidebar shell instead of the
                  public Navbar/Footer. */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dishes" element={<AdminDishes />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="regions" element={<AdminRegions />} />
                <Route path="branches" element={<AdminBranches />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="hero" element={<AdminHero />} />
                <Route path="about" element={<AdminAbout />} />
                <Route path="rider-applications" element={<AdminRiders />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
           </BranchProvider>
          </CartProvider>
        </FavoritesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};
export default AppRoutes;
