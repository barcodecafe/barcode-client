import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, X, ArrowRight, Minus, Plus, Trash2, Gift, Sparkles, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { checkFreeDeliveryEligibility } from '../services/deliveryService';

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    notification,
    cartTotal,
    updateCartQuantity,
    closeCart,
    removeFromCart,
    getCartItemLineTotal,
  } = useCart();
  const { settings } = useSettings();

  const navigate = useNavigate();

  const isFreeDeliveryEligible = checkFreeDeliveryEligibility(settings, {
    subtotal: cartTotal,
    cartItems: cart,
  });

  const isMinAmountCampaign = settings?.freeDeliveryEnabled && settings?.freeDeliveryScope === 'min_amount' && settings?.freeDeliveryMinOrder > 0;
  const neededForFreeDelivery = isMinAmountCampaign ? Math.max(0, Number(settings.freeDeliveryMinOrder) - cartTotal) : 0;
  const progressPct = isMinAmountCampaign && settings.freeDeliveryMinOrder > 0 ? Math.min(100, Math.max(0, (cartTotal / Number(settings.freeDeliveryMinOrder)) * 100)) : 0;

  const goToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleAddMoreItems = () => {
    closeCart();
    navigate('/menu');
  };

  const handleRemoveItem = (itemId) => {
    if (typeof removeFromCart === 'function') {
      removeFromCart(itemId);
    } else {
      updateCartQuantity(itemId, 0);
    }
  };

  const getOfferText = (offerType) => {
    if (offerType === 'bogo_1g1') return 'BUY 1 GET 1 FREE';
    if (offerType === 'bogo_1g2') return 'BUY 1 GET 2 FREE';
    if (offerType === 'combo') return 'SPECIAL COMBO DEAL';
    return null;
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 🎯 পুরো কার্টের মূল মোট দাম, এড-অনস ও মূল ডিশের আলাদা হিসেব
  const overallOriginalTotal = cart.reduce((sum, item) => {
    const origUnitPrice = item.originalPrice || item.price;
    return sum + (origUnitPrice * item.quantity);
  }, 0);

  const totalAddonsPrice = cart.reduce((sum, item) => {
    const itemAddons = Array.isArray(item.selectedAddons)
      ? item.selectedAddons.reduce((s, a) => s + (Number(a.price) || 0), 0)
      : 0;
    return sum + itemAddons * item.quantity;
  }, 0);

  const totalBaseDishesPrice = Math.max(0, cartTotal - totalAddonsPrice);
  const totalSavings = Math.max(0, overallOriginalTotal - cartTotal);

  return (
    <>
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">Your Order ({cartItemCount})</h3>
                </div>
                <button
                  onClick={closeCart}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-grow overflow-y-auto py-4 pr-1">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500">
                    <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                    <p className="text-sm font-medium">Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const itemImage = item.selectedVariation?.image || item.image;
                      const optionName = item.selectedVariation?.name || item.selectedSize;
                      const offerLabel = getOfferText(item.offerType);
                      
                      const itemAddonsUnit = Array.isArray(item.selectedAddons)
                        ? item.selectedAddons.reduce((s, a) => s + Number(a.price || 0), 0)
                        : 0;
                      const itemBaseUnit = Math.max(0, item.price - itemAddonsUnit);

                      const originalTotal = (item.originalPrice || item.price) * item.quantity;
                      const finalPayable = typeof getCartItemLineTotal === 'function' 
                        ? getCartItemLineTotal(item) 
                        : (item.price * item.quantity);
                      const freeSavings = originalTotal - finalPayable;

                      const step = item.offerType === 'bogo_1g1' ? 2 : item.offerType === 'bogo_1g2' ? 3 : 1;

                      return (
                        <div
                          key={item.cartId || item.id}
                          className="flex gap-3 items-start justify-between bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 shadow-xs"
                        >
                          <img 
                            src={itemImage} 
                            alt={item.name} 
                            className="w-14 h-14 rounded-lg object-cover bg-neutral-100 shrink-0 mt-0.5" 
                          />

                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">{item.name}</h4>
                            
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {offerLabel && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                                  <Gift className="w-2.5 h-2.5" />
                                  {offerLabel}
                                </span>
                              )}

                              {optionName && (
                                <span className="inline-block text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold px-1.5 py-0.5 rounded">
                                  {optionName} (৳{itemBaseUnit.toFixed(0)})
                                </span>
                              )}
                            </div>

                            {Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.selectedAddons.map((addon, aIdx) => (
                                  <span
                                    key={aIdx}
                                    className="text-[9px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 font-semibold px-1.5 py-0.5 rounded"
                                  >
                                    +{addon.name} (+৳{Number(addon.price).toFixed(0)})
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-col gap-0.5 mt-1.5">
                              {offerLabel && freeSavings > 0 ? (
                                <>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-neutral-400 line-through">
                                      ৳{originalTotal.toFixed(2)}
                                    </span>
                                    <span className="font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-1 rounded">
                                      FREE -৳{freeSavings.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-primary-500 font-black">
                                    Payable: ৳{finalPayable.toFixed(2)}
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-baseline gap-1 text-xs">
                                  <span className="text-[10px] text-neutral-400 font-medium">{item.quantity} × ৳{item.price.toFixed(2)} =</span>
                                  <span className="font-black text-primary-500">
                                    ৳{finalPayable.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg p-0.5">
                              <button
                                onClick={() => updateCartQuantity(item.cartId || item.id, item.quantity - step)}
                                className="w-5 h-5 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 cursor-pointer"
                                title={step > 1 ? `Decrease by ${step}` : 'Decrease'}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center text-neutral-800 dark:text-neutral-100">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.cartId || item.id, item.quantity + step)}
                                className="w-5 h-5 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 cursor-pointer"
                                title={step > 1 ? `Increase by ${step}` : 'Increase'}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(item.cartId || item.id)}
                              className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={handleAddMoreItems}
                      className="w-full py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary-500 hover:text-primary-500 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 bg-neutral-50/50 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-primary-500" />
                      Add More Items
                    </button>
                  </div>
                )}
              </div>

              {/* 🎯 Footer: Subtotal Section with Professional Breakdown */}
              {cart.length > 0 && (
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3.5 space-y-2.5 shrink-0">
                  
                  {/* মোট সেভিংস থাকলে Green Badge */}
                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        Total Savings & Free Offers:
                      </span>
                      <span className="text-xs font-black">-৳{totalSavings.toFixed(2)}</span>
                    </div>
                  )}

                  {/* 🎯 Detailed Breakdown */}
                  <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400 pt-1">
                    <div className="flex justify-between items-center">
                      <span>Dishes Base Total:</span>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        ৳{totalBaseDishesPrice.toFixed(2)}
                      </span>
                    </div>

                    {totalAddonsPrice > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Extras & Add-ons:</span>
                        <span className="font-mono font-bold">
                          +৳{totalAddonsPrice.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* 🚚 Free Delivery Campaign Notice / Progress */}
                    {isFreeDeliveryEligible ? (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                        <Truck className="w-4 h-4 shrink-0 animate-bounce" />
                        <span>🎉 FREE Delivery applied to this order!</span>
                      </div>
                    ) : isMinAmountCampaign && neededForFreeDelivery > 0 ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" /> Add ৳{neededForFreeDelivery.toFixed(0)} more for FREE Delivery!
                          </span>
                          <span>{progressPct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-baseline justify-between font-bold text-base text-neutral-800 dark:text-white pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span>Subtotal</span>
                    <div className="text-right">
                      {totalSavings > 0 && (
                        <span className="block text-xs font-normal text-neutral-400 line-through">
                          ৳{overallOriginalTotal.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xl font-black text-primary-500">৳{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 text-center -mt-0.5">
                    Delivery, coupon &amp; points applied at checkout
                  </p>

                  <button
                    onClick={goToCheckout}
                    className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-center shadow-lg shadow-primary-500/10 hover:shadow-primary-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;