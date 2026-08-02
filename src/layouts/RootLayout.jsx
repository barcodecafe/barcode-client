import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { useAuth } from '../context/AuthContext'; // 👈 AuthContext ইমপোর্ট

export const RootLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 🚚 Rider বা Admin কাস্টমারদের পেজে চলে আসলে স্বয়ংক্রিয়ভাবে তাদের পোর্টালে পাঠিয়ে দেবে
    if (user?.role === 'rider' && !location.pathname.startsWith('/rider')) {
      navigate('/rider', { replace: true });
    } else if (user?.role === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate, location]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
      {/* Sticky Navbar */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-grow w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Global cart toast + drawer */}
      <CartDrawer />
    </div>
  );
};

export default RootLayout;