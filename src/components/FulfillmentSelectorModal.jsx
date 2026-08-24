import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ShoppingBag, MapPin, Clock, Check, X, Building, ChevronRight } from 'lucide-react';
import { useFulfillment } from '../context/FulfillmentContext';
import { getAllBranches } from '../services/branchesService';

export const FulfillmentSelectorModal = () => {
  const {
    fulfillmentMode,
    selectedBranch,
    isFulfillmentModalOpen,
    closeFulfillmentModal,
    selectPickupBranch,
    selectHomeDelivery,
  } = useFulfillment();

  const [activeTab, setActiveTab] = useState(fulfillmentMode || 'delivery');
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    setActiveTab(fulfillmentMode);
  }, [fulfillmentMode, isFulfillmentModalOpen]);

  useEffect(() => {
    if (!isFulfillmentModalOpen) return;
    let active = true;

    const fetchBranchesData = async () => {
      try {
        setLoadingBranches(true);
        const data = await getAllBranches();
        if (active && Array.isArray(data)) {
          setBranches(data);
        }
      } catch (err) {
        console.error('Error fetching branches for fulfillment modal:', err);
      } finally {
        if (active) setLoadingBranches(false);
      }
    };

    fetchBranchesData();
    return () => {
      active = false;
    };
  }, [isFulfillmentModalOpen]);

  if (!isFulfillmentModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary-500">
                Order Fulfillment Mode
              </span>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">
                How would you like your food?
              </h2>
            </div>
            <button
              onClick={closeFulfillmentModal}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="p-4 bg-neutral-100/70 dark:bg-neutral-950 p-1.5 flex gap-2 mx-5 mt-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('delivery')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'delivery'
                  ? 'bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Truck className="w-4 h-4 text-primary-500" />
              <span>Home Delivery</span>
            </button>
            <button
              onClick={() => setActiveTab('pickup')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'pickup'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Self Pickup (FREE)</span>
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'delivery' ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/60 rounded-2xl flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-extrabold text-neutral-900 dark:text-white">
                      Delivered to Your Doorstep
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                      Browse our full menu now. You can enter your specific delivery address & region at checkout.
                    </p>
                  </div>
                </div>

                <button
                  onClick={selectHomeDelivery}
                  className="w-full py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-primary-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue with Home Delivery</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  Select your preferred Barcode Cafe branch outlet to pick up your order:
                </p>

                {loadingBranches ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-neutral-500 font-medium">Loading branch outlets...</span>
                  </div>
                ) : branches.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400 border border-dashed rounded-2xl">
                    No branch outlets currently available for pickup.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {branches.map((b) => {
                      const bId = b.id || b._id;
                      const isSelected = selectedBranch && String(selectedBranch.id || selectedBranch._id) === String(bId);

                      return (
                        <div
                          key={bId || Math.random()}
                          onClick={() => selectPickupBranch(b)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-400'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                                isSelected
                                  ? 'bg-emerald-500 text-white shadow-md'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              <Building className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                                {b.name}
                              </h4>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                <span>{b.address || b.area || 'Outlet Address'}</span>
                              </p>
                              {b.operatingHours && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {b.operatingHours}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                Select
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
