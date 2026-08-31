import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';

// ⚡ Core Customer Pages (Lazy-loaded for optimum initial chunk size)
const Home = lazy(() => import('../pages/Home').then((m) => ({ default: m.Home || m.default })));
const Branches = lazy(() => import('../pages/Branches').then((m) => ({ default: m.Branches || m.default })));
const BranchDetail = lazy(() => import('../pages/BranchDetail').then((m) => ({ default: m.BranchDetail || m.default })));
const Brands = lazy(() => import('../pages/Brands').then((m) => ({ default: m.Brands || m.default })));
const BrandHome = lazy(() => import('../pages/BrandHome').then((m) => ({ default: m.BrandHome || m.default })));
const BrandBranches = lazy(() => import('../pages/BrandBranches').then((m) => ({ default: m.BrandBranches || m.default })));
const BrandBranchDetail = lazy(() => import('../pages/BrandBranchDetail').then((m) => ({ default: m.BrandBranchDetail || m.default })));
const BrandMenu = lazy(() => import('../pages/BrandMenu').then((m) => ({ default: m.BrandMenu || m.default })));
const BrandAbout = lazy(() => import('../pages/BrandAbout').then((m) => ({ default: m.BrandAbout || m.default })));
const Menu = lazy(() => import('../pages/Menu').then((m) => ({ default: m.Menu || m.default })));
const DishDetail = lazy(() => import('../pages/DishDetail').then((m) => ({ default: m.DishDetail || m.default })));
const About = lazy(() => import('../pages/About').then((m) => ({ default: m.About || m.default })));
const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login || m.default })));
const SignUp = lazy(() => import('../pages/SignUp').then((m) => ({ default: m.SignUp || m.default })));

// ⚡ Lazy-loaded Layouts
const AdminLayout = lazy(() => import('../layouts/AdminLayout').then((m) => ({ default: m.AdminLayout || m.default })));
const RiderLayout = lazy(() => import('../layouts/RiderLayout').then((m) => ({ default: m.RiderLayout || m.default })));
const BrandLayout = lazy(() => import('../layouts/BrandLayout').then((m) => ({ default: m.BrandLayout || m.default })));

// ⚡ Lazy-loaded secondary & utility pages for instant initial bundle loading
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword || m.default })));
const Profile = lazy(() => import('../pages/Profile').then((m) => ({ default: m.Profile || m.default })));
const Checkout = lazy(() => import('../pages/Checkout').then((m) => ({ default: m.Checkout || m.default })));
const OrderTracking = lazy(() => import('../pages/OrderTracking').then((m) => ({ default: m.OrderTracking || m.default })));
const PaymentResult = lazy(() => import('../pages/PaymentResult').then((m) => ({ default: m.PaymentResult || m.default })));
const PaymentDemo = lazy(() => import('../pages/PaymentDemo').then((m) => ({ default: m.PaymentDemo || m.default })));
const PublicMembership = lazy(() => import('../pages/PublicMembership').then((m) => ({ default: m.PublicMembership || m.default })));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy || m.default })));
const TermsOfService = lazy(() => import('../pages/TermsOfService').then((m) => ({ default: m.TermsOfService || m.default })));
const RiderApplication = lazy(() => import('../pages/RiderApplication').then((m) => ({ default: m.RiderApplication || m.default })));

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
const AdminStaff = lazy(() => import('../pages/admin/AdminStaff').then((m) => ({ default: m.AdminStaff })));

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
import { ErrorBoundary } from '../components/ErrorBoundary';
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
                  position="top-center" 
                  containerStyle={{ zIndex: 999999, top: 16 }}
                  toastOptions={{ 
                    duration: 3500,
                    className: 'hot-toast-custom',
                    style: { 
                      zIndex: 999999,
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      lineHeight: '1.3',
                      borderRadius: '12px',
                      maxWidth: '90vw',
                      width: 'auto',
                      whiteSpace: 'nowrap',
                    },
                    success: {
                      iconTheme: {
                        primary: '#e02424',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#e02424',
                        secondary: '#ffffff',
                      },
                    },
                  }} 
                />
                <ErrorBoundary>
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
                        <Route index element={<ProtectedRoute permission="dashboard"><AdminDashboard /></ProtectedRoute>} />
                        <Route path="dishes" element={<ProtectedRoute permission="dishes"><AdminDishes /></ProtectedRoute>} />
                        <Route path="brands" element={<ProtectedRoute permission="brands"><AdminBrands /></ProtectedRoute>} />
                        <Route path="regions" element={<ProtectedRoute permission="regions"><AdminRegions /></ProtectedRoute>} />
                        <Route path="branches" element={<ProtectedRoute permission="branches"><AdminBranches /></ProtectedRoute>} />
                        <Route path="orders" element={<ProtectedRoute permission="orders"><AdminOrders /></ProtectedRoute>} />
                        <Route path="fleet-overview" element={<ProtectedRoute permission="fleet"><AdminRidersFleet /></ProtectedRoute>} />
                        <Route path="add-rider" element={<ProtectedRoute permission="add_rider"><AdminAddRider /></ProtectedRoute>} />
                        <Route path="customers" element={<ProtectedRoute permission="customers"><AdminCustomers /></ProtectedRoute>} />
                        <Route path="reviews" element={<ProtectedRoute permission="reviews"><AdminReviews /></ProtectedRoute>} />
                        <Route path="coupons" element={<ProtectedRoute permission="coupons"><AdminCoupons /></ProtectedRoute>} />
                        <Route path="free-delivery" element={<ProtectedRoute permission="free_delivery"><AdminFreeDelivery /></ProtectedRoute>} />
                        <Route path="hero" element={<ProtectedRoute permission="hero"><AdminHero /></ProtectedRoute>} />
                        <Route path="about" element={<ProtectedRoute permission="about"><AdminAbout /></ProtectedRoute>} />
                        <Route path="policies" element={<ProtectedRoute permission="policies"><AdminPolicies /></ProtectedRoute>} />
                        <Route path="rider-applications" element={<ProtectedRoute permission="rider_applications"><AdminRiders /></ProtectedRoute>} />
                        <Route path="settings" element={<ProtectedRoute permission="settings"><AdminSettings /></ProtectedRoute>} />
                        <Route path="staff" element={<ProtectedRoute permission="staff_management"><AdminStaff /></ProtectedRoute>} />
                      </Route>
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
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