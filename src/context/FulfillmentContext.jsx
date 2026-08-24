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

  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);

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

  const setFulfillmentMode = (mode) => {
    if (mode !== 'delivery' && mode !== 'pickup') return;
    setFulfillmentModeState(mode);
    if (mode === 'pickup' && !selectedBranch) {
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
    setIsFulfillmentModalOpen(false);
    toast.success(`Selected ${branch.name || 'Branch Outlet'} for Self-Pickup!`, {
      icon: '🛍️',
      position: 'top-center',
    });
  };

  const selectHomeDelivery = () => {
    setFulfillmentModeState('delivery');
    setIsFulfillmentModalOpen(false);
    toast.success('Switched to Home Delivery mode!', {
      icon: '🚚',
      position: 'top-center',
    });
  };

  const openFulfillmentModal = () => setIsFulfillmentModalOpen(true);
  const closeFulfillmentModal = () => setIsFulfillmentModalOpen(false);

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
