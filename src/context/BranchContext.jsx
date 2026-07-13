import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllBranches } from '../services/branchesService';
import { useCart } from './CartContext';

// ---------------------------------------------------------------------------
// BranchContext — branch-first ordering. A branch MUST be chosen before
// browsing/ordering: a specific dish may not exist at every branch, its price
// varies per branch, and delivery is charged from that branch. The chosen id
// persists in localStorage['selectedBranchId'] (same key CartContext reads for
// pricing). Switching branch with items in the cart clears the cart, since
// those items may not be available (or priced the same) at the new branch.
// ---------------------------------------------------------------------------
const BranchContext = createContext(null);
const KEY = 'selectedBranchId';

export const BranchProvider = ({ children }) => {
  const { cart, clearCart } = useCart();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    const v = Number(localStorage.getItem(KEY));
    return v > 0 ? v : null;
  });
  const [isBranchLoaded, setIsBranchLoaded] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Load the branch list once; drop a stale stored id that no longer exists.
  useEffect(() => {
    getAllBranches()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setBranches(arr);
        setSelectedBranchId((cur) => (cur && arr.some((b) => b.id === cur) ? cur : null));
      })
      .catch(() => setBranches([]))
      .finally(() => setIsBranchLoaded(true));
  }, []);

  // First visit (no branch chosen) → force the chooser open once branches load.
  useEffect(() => {
    if (isBranchLoaded && !selectedBranchId && branches.length > 0) setShowBranchModal(true);
  }, [isBranchLoaded, selectedBranchId, branches.length]);

  const chooseBranch = useCallback(
    (id) => {
      const nid = Number(id);
      if (!nid) return;
      if (selectedBranchId && selectedBranchId !== nid && cart.length > 0) clearCart();
      setSelectedBranchId(nid);
      try { localStorage.setItem(KEY, String(nid)); } catch { /* ignore */ }
      setShowBranchModal(false);
    },
    [selectedBranchId, cart.length, clearCart]
  );

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || null;

  const value = {
    branches,
    selectedBranchId,
    selectedBranch,
    isBranchChosen: !!selectedBranchId,
    isBranchLoaded,
    showBranchModal,
    openBranchModal: () => setShowBranchModal(true),
    closeBranchModal: () => setShowBranchModal(false),
    chooseBranch,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within a BranchProvider');
  return ctx;
};
