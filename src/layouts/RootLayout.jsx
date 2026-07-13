import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { ChooseBranchModal } from '../components/ChooseBranchModal';

export const RootLayout = () => {
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

      {/* Global cart toast + drawer — lives outside the page Outlet so
          "Order Now" works identically whether triggered from Home, Menu,
          or anywhere else. */}
      <CartDrawer />

      {/* Branch-first gate — forces a branch choice on first visit, re-openable from Navbar */}
      <ChooseBranchModal />
    </div>
  );
};
export default RootLayout;
