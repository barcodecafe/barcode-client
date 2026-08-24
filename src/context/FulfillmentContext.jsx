import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const FulfillmentContext = createContext();

export const FulfillmentProvider = ({ children }) => {
  const [fulfillmentMode, setFulfillmentModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('barcode_fulfillment_mode');
      return saved === 'pickup' ? 'pickup' : 'delivery';
    } catch {
      return 'delivery';
    }
  });

  const [selectedBranch, setSelectedBranchState] = useState(() => {
    try {
      const saved = localStorage.getItem('barcode_selected_branch');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const checkIsAdminOrRider = () => {
    try {
      if (typeof window === 'undefined') return false;
      const path = window.location.pathname || '';
      return path.startsWith('/admin') || path.startsWith('/rider');
    } catch {
      return false;
    }
  };

  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(() => {
    try {
      // Clean up legacy localStorage item if present
      localStorage.removeItem('barcode_fulfillment_chosen');
      if (checkIsAdminOrRider()) return false;
      const hasChosen = sessionStorage.getItem('barcode_fulfillment_chosen');
      return !hasChosen; // 🎯 Auto-open pop-up modal on every browser session / re-open!
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('barcode_fulfillment_mode', fulfillmentMode);
    } catch (err) {
      console.error('Failed to save fulfillment mode:', err);
    }
  }, [fulfillmentMode]);

  useEffect(() => {
    try {
      if (selectedBranch) {
        localStorage.setItem('barcode_selected_branch', JSON.stringify(selectedBranch));
      } else {
        localStorage.removeItem('barcode_selected_branch');
      }
    } catch (err) {
      console.error('Failed to save selected branch:', err);
    }
  }, [selectedBranch]);

  const markFulfillmentChosen = () => {
    try {
      sessionStorage.setItem('barcode_fulfillment_chosen', 'true');
    } catch (err) {
      console.error('Failed to mark fulfillment chosen:', err);
    }
  };

  const setFulfillmentMode = (mode) => {
    if (mode !== 'delivery' && mode !== 'pickup') return;
    setFulfillmentModeState(mode);
    markFulfillmentChosen();
    if (mode === 'pickup' && !selectedBranch && !checkIsAdminOrRider()) {
      setIsFulfillmentModalOpen(true);
    }
  };

  const setSelectedBranch = (branch) => {
    setSelectedBranchState(branch);
  };

  const selectPickupBranch = (branch) => {
    if (!branch) return;
    setSelectedBranchState(branch);
    setFulfillmentModeState('pickup');
    markFulfillmentChosen();
    setIsFulfillmentModalOpen(false);
    toast.success(`Selected ${branch.name || 'Branch Outlet'} for Self-Pickup!`, {
      icon: '🛍️',
      position: 'top-center',
    });
  };

  const selectHomeDelivery = () => {
    setFulfillmentModeState('delivery');
    markFulfillmentChosen();
    setIsFulfillmentModalOpen(false);
    toast.success('Switched to Home Delivery mode!', {
      icon: '🚚',
      position: 'top-center',
    });
  };

  const openFulfillmentModal = () => {
    if (checkIsAdminOrRider()) return;
    setIsFulfillmentModalOpen(true);
  };

  const closeFulfillmentModal = () => {
    markFulfillmentChosen();
    setIsFulfillmentModalOpen(false);
  };

  const ensureFulfillmentSelected = () => {
    if (checkIsAdminOrRider()) return true;
    try {
      const hasChosen = sessionStorage.getItem('barcode_fulfillment_chosen');
      const savedMode = localStorage.getItem('barcode_fulfillment_mode');
      const savedBranch = localStorage.getItem('barcode_selected_branch');

      if (!hasChosen || (savedMode === 'pickup' && !savedBranch)) {
        setIsFulfillmentModalOpen(true);
        toast('Please confirm Home Delivery or Pickup Branch first!', {
          icon: '📍',
          position: 'top-center',
        });
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  return (
    <FulfillmentContext.Provider
      value={{
        fulfillmentMode,
        selectedBranch,
        isFulfillmentModalOpen,
        setFulfillmentMode,
        setSelectedBranch,
        selectPickupBranch,
        selectHomeDelivery,
        openFulfillmentModal,
        closeFulfillmentModal,
        ensureFulfillmentSelected,
        isPickup: fulfillmentMode === 'pickup',
      }}
    >
      {children}
    </FulfillmentContext.Provider>
  );
};

export const useFulfillment = () => {
  const context = useContext(FulfillmentContext);
  if (!context) {
    throw new Error('useFulfillment must be used within a FulfillmentProvider');
  }
  return context;
};
