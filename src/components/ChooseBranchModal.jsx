import { motion, AnimatePresence } from 'framer-motion';
import { Store, MapPin, Check, X, Clock } from 'lucide-react';
import { useBranch } from '../context/BranchContext';

// ---------------------------------------------------------------------------
// ChooseBranchModal — branch-first gate. Shown on first visit (forced: no
// close until a branch is picked) and re-openable from the Navbar to switch.
// Mounted once in RootLayout.
// ---------------------------------------------------------------------------
export const ChooseBranchModal = () => {
  const { branches, selectedBranchId, isBranchChosen, showBranchModal, chooseBranch, closeBranchModal } = useBranch();

  const forced = !isBranchChosen; // first visit — must pick before continuing

  return (
    <AnimatePresence>
      {showBranchModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!forced) closeBranchModal(); }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-black text-lg text-neutral-900 dark:text-white leading-tight">Choose your branch</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">দাম, availability ও delivery charge এই branch অনুযায়ী হবে</p>
                </div>
              </div>
              {!forced && (
                <button onClick={closeBranchModal} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mt-4 space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {branches.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-6">No branches available right now.</p>
              )}
              {branches.map((b) => {
                const active = b.id === selectedBranchId;
                return (
                  <button
                    key={b.id}
                    onClick={() => chooseBranch(b.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-primary-500 bg-primary-500/5'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-primary-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <img src={b.image} alt={b.name} className="w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-neutral-800 dark:text-white truncate">{b.name}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {b.location}</p>
                      {b.hours && <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1"><Clock className="w-2.5 h-2.5 shrink-0" /> {b.hours}</p>}
                    </div>
                    {active && <Check className="w-5 h-5 text-primary-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChooseBranchModal;
