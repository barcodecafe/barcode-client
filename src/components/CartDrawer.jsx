import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, X, ArrowRight, Minus, Plus, Trash2, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

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

  const navigate = useNavigate();

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

  // 🎯 BOGO Offer Text Helper Function
  const getOfferText = (offerType) => {
    if (offerType === 'bogo_1g1') return 'BUY 1 GET 1 FREE';
    if (offerType === 'bogo_1g2') return 'BUY 1 GET 2 FREE';
    if (offerType === 'combo') return 'SPECIAL COMBO DEAL';
    return null;
  };

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
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary-500" />
                  <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">Your Order Selection</h3>
                </div>
                <button
                  onClick={closeCart}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-pointer"
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
                      
                      // 🎯 BOGO এবং ডিসকাউন্ট ক্যালকুলেশন
                      const originalTotal = (item.originalPrice || item.price) * item.quantity;
                      const finalPayable = typeof getCartItemLineTotal === 'function' 
                        ? getCartItemLineTotal(item) 
                        : (item.price * item.quantity);
                      const freeSavings = originalTotal - finalPayable;

                      // 🎯 BOGO এর জোড়া (+২ বা +৩) অনুযায়ী কোয়ান্টিটি স্টেপ
                      const step = item.offerType === 'bogo_1g1' ? 2 : item.offerType === 'bogo_1g2' ? 3 : 1;

                      return (
                        <div
                          key={item.cartId || item.id}
                          className="flex gap-3 items-center justify-between bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60"
                        >
                          <img 
                            src={itemImage} 
                            alt={item.name} 
                            className="w-14 h-14 rounded-lg object-cover bg-neutral-100 shrink-0" 
                          />

                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{item.name}</h4>
                            
                            {/* BOGO Offer Badge */}
                            {offerLabel && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded mt-0.5 border border-purple-200 dark:border-purple-800/60">
                                <Gift className="w-2.5 h-2.5" />
                                {offerLabel}
                              </span>
                            )}

                            {optionName && (
                              <span className="inline-block text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold px-1.5 py-0.5 rounded mt-0.5 ml-1">
                                Option: {optionName}
                              </span>
                            )}

                            {/* 🎯 মূল দাম, ফ্রি/ডিসকাউন্ট সেভিংস এবং ফাইনাল প্রদেয় দামের ডিসপ্লে */}
                            <div className="flex flex-col gap-0.5 mt-1">
                              {/* ১. BOGO অফারের ক্ষেত্রে */}
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
                              ) : item.originalPrice && item.originalPrice > item.price ? (
                                /* ২. সাধারণ % বা ৳ ফ্ল্যাট ডিসকাউন্টের ক্ষেত্রে (যেমন: বোরহানি) */
                                <>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-neutral-400 line-through">
                                      ৳{(item.originalPrice * item.quantity).toFixed(2)}
                                    </span>
                                    <span className="font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-1 rounded">
                                      SAVE ৳{((item.originalPrice - item.price) * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-primary-500 font-black">
                                    Payable: ৳{finalPayable.toFixed(2)}
                                  </div>
                                </>
                              ) : (
                                /* ৩. কোনো ডিসকাউন্ট না থাকলে */
                                <span className="text-xs text-primary-500 font-bold">
                                  ৳{finalPayable.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls & Delete Icon */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg p-0.5">
                              <button
                                onClick={() => updateCartQuantity(item.cartId || item.id, item.quantity - step)}
                                className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 cursor-pointer"
                                title={step > 1 ? `Decrease by ${step}` : 'Decrease'}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center text-neutral-800 dark:text-neutral-100">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.cartId || item.id, item.quantity + step)}
                                className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 cursor-pointer"
                                title={step > 1 ? `Increase by ${step}` : 'Increase'}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Delete Item Button */}
                            <button
                              onClick={() => handleRemoveItem(item.cartId || item.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* + Add More Items Button */}
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

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-3 shrink-0">
                  <div className="flex justify-between font-bold text-base text-neutral-800 dark:text-white">
                    <span>Subtotal</span>
                    <span className="text-primary-500">৳{cartTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 text-center -mt-1">Delivery, coupon &amp; points applied at checkout</p>
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