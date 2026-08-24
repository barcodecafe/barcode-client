import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { RiderLayout } from '../layouts/RiderLayout'; 

import { Home } from '../pages/Home';
import { Branches } from '../pages/Branches';
import BranchDetail from '../pages/BranchDetail';
import { Brands } from '../pages/Brands';
import { BrandLayout } from '../layouts/BrandLayout';
import { BrandHome } from '../pages/BrandHome';
import { BrandBranches } from '../pages/BrandBranches';
import { BrandBranchDetail } from '../pages/BrandBranchDetail';
import { BrandMenu } from '../pages/BrandMenu';
import { BrandAbout } from '../pages/BrandAbout';
import { Menu } from '../pages/Menu';
import { DishDetail } from '../pages/DishDetail';
import { About } from '../pages/About';
import { Login } from '../pages/Login';
import { SignUp } from '../pages/SignUp';

// ⚡ Lazy-loaded secondary & utility pages for instant initial bundle loading
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const Profile = lazy(() => import('../pages/Profile').then((m) => ({ default: m.Profile })));
const Checkout = lazy(() => import('../pages/Checkout').then((m) => ({ default: m.Checkout })));
const OrderTracking = lazy(() => import('../pages/OrderTracking').then((m) => ({ default: m.OrderTracking })));
const PaymentResult = lazy(() => import('../pages/PaymentResult').then((m) => ({ default: m.PaymentResult })));
const PaymentDemo = lazy(() => import('../pages/PaymentDemo').then((m) => ({ default: m.PaymentDemo })));
const PublicMembership = lazy(() => import('../pages/PublicMembership').then((m) => ({ default: m.PublicMembership })));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('../pages/TermsOfService').then((m) => ({ default: m.TermsOfService })));
const RiderApplication = lazy(() => import('../pages/RiderApplication').then((m) => ({ default: m.RiderApplication })));

// 🚚 Lazy-loaded Rider pages
const RiderOverview = lazy(() => import('../pages/rider/RiderOverview'));
const RiderOrders = lazy(() => import('../pages/rider/RiderOrders').then((m) => ({ default: m.RiderOrders })));
const RiderSettlement = lazy(() => import('../pages/rider/RiderSettlement'));

// 🛡️ Lazy-loaded Admin pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminDishes = lazy(() => import('../pages/admin/AdminDishes').then((m) => ({ default: m.AdminDishes })));
const AdminBranches = lazy(() => import('../pages/admin/AdminBranches').then((m) => ({ default: m.AdminBranches })));
const AdminBrands = lazy(() => import('../pages/admin/AdminBrands').then((m) => ({ default: m.AdminBrands })));
const AdminRegions = lazy(() => import('../pages/admin/AdminRegions').then((m) => ({ default: m.AdminRegions })));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers })));
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })));
const AdminHero = lazy(() => import('../pages/admin/AdminHero').then((m) => ({ default: m.AdminHero })));
const AdminAbout = lazy(() => import('../pages/admin/AdminAbout').then((m) => ({ default: m.AdminAbout })));
const AdminPolicies = lazy(() => import('../pages/admin/AdminPolicies').then((m) => ({ default: m.AdminPolicies })));
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews').then((m) => ({ default: m.AdminReviews })));
const AdminRiders = lazy(() => import('../pages/admin/AdminRiders').then((m) => ({ default: m.AdminRiders })));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminRidersFleet = lazy(() => import('../pages/admin/AdminRidersFleet'));
const AdminAddRider = lazy(() => import('../pages/admin/AdminAddRider'));
const AdminFreeDelivery = lazy(() => import('../pages/admin/AdminFreeDelivery'));

import { CartProvider } from '../context/CartContext';
import { BranchProvider } from '../context/BranchContext';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { FulfillmentProvider } from '../context/FulfillmentContext';
import { FulfillmentSelectorModal } from '../components/FulfillmentSelectorModal';
import { ScrollToTop } from '../components/ScrollToTop';
import { NormalizePath } from '../components/NormalizePath';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { OrderProvider } from '../context/OrderContext';
import { Toaster } from 'react-hot-toast';

const PageFallbackSpinner = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const AppRoutes = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FavoritesProvider>
          <FulfillmentProvider>
            <CartProvider>
              <BranchProvider>
              <OrderProvider>
                <ScrollToTop />
                <NormalizePath />
                <FulfillmentSelectorModal />
                <Toaster 
                  position="top-right" 
                  containerStyle={{ zIndex: 999999 }}
                  toastOptions={{ 
                    duration: 4000,
                    style: { zIndex: 999999 }
                  }} 
                />
                <Suspense fallback={<PageFallbackSpinner />}>
                  <Routes>
                  {/* Public / User Routes */}
                  <Route path="/" element={<RootLayout />}>
                    <Route index element={<Home />} />
                    <Route path="branches" element={<Branches />} />
                    <Route path="branches/:id" element={<BranchDetail />} />
                    <Route path="brands" element={<Brands />} />
                    <Route path="menu" element={<Menu />} />
                    <Route path="menu/:id" element={<DishDetail />} />
                    <Route path="dish/:id" element={<DishDetail />} />
                    <Route path="food/:id" element={<DishDetail />} />
                    <Route path="about" element={<About />} />
                    <Route path="login" element={<Login variant="user" />} />
                    <Route path="signup" element={<SignUp />} />
                    <Route path="forgot-password" element={<ForgotPassword />} /> 
                    <Route path="admin-signup" element={<SignUp defaultRole="admin" />} />
                    <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="rider-application" element={<RiderApplication />} />
                    <Route path="order-tracking/:id" element={<OrderTracking />} />
                    
                    {/* 📄 নতুন পলিসি রাউটস */}
                    <Route path="privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="terms-of-service" element={<TermsOfService />} />

                    <Route path="payment/success" element={<PaymentResult variant="success" />} />
                    <Route path="payment/fail" element={<PaymentResult variant="fail" />} />
                    <Route path="payment/cancel" element={<PaymentResult variant="cancel" />} />
                    <Route path="payment/demo" element={<PaymentDemo />} />
                    <Route path="*" element={<div className="p-16 text-center text-2xl font-bold">404 - Page Not Found</div>} />
                  </Route>

                  {/* Brand microsites */}
                  <Route path="/brands/:slug" element={<BrandLayout />}>
                    <Route index element={<BrandHome />} />
                    <Route path="branches" element={<BrandBranches />} />
                    <Route path="branches/:id" element={<BrandBranchDetail />} />
                    <Route path="menu" element={<BrandMenu />} />
                    <Route path="about" element={<BrandAbout />} />
                    <Route path="menu/:id" element={<DishDetail />} />
                    <Route path="dish/:id" element={<DishDetail />} />
                    <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="terms-of-service" element={<TermsOfService />} />
                    <Route path="rider-application" element={<RiderApplication />} />
                  </Route>

                  {/* 🪪 Public Digital Membership Verification (Accessible to everyone, non-redirected) */}
                  <Route path="/membership/:id" element={<PublicMembership />} />
                  <Route path="/membership-verify/:id" element={<PublicMembership />} />

                  {/* Role Login Portals */}
                  <Route path="/admin/login" element={<Login variant="admin" />} />
                  <Route path="/rider/login" element={<Login variant="rider" />} />

                  {/* 🚚 Rider Portal (Nested Sub-routes) */}
                  <Route
                    path="/rider"
                    element={
                      <ProtectedRoute requireRider>
                        <RiderLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<RiderOverview />} />
                    <Route path="orders" element={<RiderOrders />} />
                    <Route path="settlement" element={<RiderSettlement />} />
                  </Route>

                  {/* 🛡️ Admin Dashboard */}
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
                    <Route path="fleet-overview" element={<AdminRidersFleet />} />
                    <Route path="add-rider" element={<AdminAddRider />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="free-delivery" element={<AdminFreeDelivery />} />
                    <Route path="hero" element={<AdminHero />} />
                    <Route path="about" element={<AdminAbout />} />
                    <Route path="policies" element={<AdminPolicies />} />
                    <Route path="rider-applications" element={<AdminRiders />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Routes>
              </Suspense>
              </OrderProvider>
            </BranchProvider>
          </CartProvider>
          </FulfillmentProvider>
        </FavoritesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default AppRoutes;