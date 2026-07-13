import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllBranches } from '../services/branchesService';

// ---------------------------------------------------------------------------
// BranchContext — the branch list + the branch the customer is ordering from.
// Browsing is UNRESTRICTED (all branches, all products visible); a branch is
// chosen only at checkout, where it drives per-branch prices and the delivery
// charge. The chosen id persists in localStorage['selectedBranchId'] (same key
// CartContext reads) so it's remembered between visits.
// ---------------------------------------------------------------------------
const BranchContext = createContext(null);
const KEY = 'selectedBranchId';

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [isBranchLoaded, setIsBranchLoaded] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    const v = Number(localStorage.getItem(KEY));
    return v > 0 ? v : null;
  });

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

  const chooseBranch = useCallback((id) => {
    const nid = Number(id);
    if (!nid) return;
    setSelectedBranchId(nid);
    try { localStorage.setItem(KEY, String(nid)); } catch { /* ignore */ }
  }, []);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || null;

  const value = {
    branches,
    selectedBranchId,
    selectedBranch,
    isBranchChosen: !!selectedBranchId,
    isBranchLoaded,
    chooseBranch,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within a BranchProvider');
  return ctx;
};
