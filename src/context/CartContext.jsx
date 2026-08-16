import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { getActivePrice, applyFoodDiscount } from '../services/foodsService';

const CartContext = createContext(null);

export const getCartItemLineTotal = (item) => {
  const price = Number(item.price) || 0;
  const qty = Number(item.quantity) || 0;

  if (item.offerType === 'bogo_1g1') {
    const paidQuantity = Math.ceil(qty / 2);
    return price * paidQuantity;
  }

  if (item.offerType === 'bogo_1g2') {
    const paidQuantity = Math.ceil(qty / 3);
    return price * paidQuantity;
  }

  return price * qty;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('app_cart_items');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Cart load error:", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const notificationTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('app_cart_items', JSON.stringify(cart));
    } catch (error) {
      console.error("Cart save error:", error);
    }
  }, [cart]);

  const showNotification = useCallback((message) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(message);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  const addToCart = useCallback((food, branchId = null, selectedSize = null, quantity = 1, selectedAddons = []) => {
    if (!food) return;

    const activeBranchId =
      branchId !== undefined && branchId !== null
        ? branchId
        : food.branchId !== undefined && food.branchId !== null
        ? food.branchId
        : typeof window !== 'undefined' && localStorage.getItem('selectedBranchId')
        ? Number(localStorage.getItem('selectedBranchId'))
        : null;

    const sizeName =
      (selectedSize && (selectedSize.name || selectedSize)) ||
      food.selectedSize ||
      (food.selectedVariation && food.selectedVariation.name) ||
      null;

    const variationObj =
      (selectedSize && typeof selectedSize === 'object' ? selectedSize : null) ||
      food.selectedVariation ||
      null;

    const finalAddons = Array.isArray(selectedAddons) && selectedAddons.length > 0
      ? selectedAddons
      : Array.isArray(food.selectedAddons)
      ? food.selectedAddons
      : [];

    const addonsTotal = finalAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    let targetQty = Number(quantity) > 0 ? Number(quantity) : (Number(food.quantity) > 0 ? Number(food.quantity) : 1);
    if (quantity === 1 && (!food.quantity || food.quantity === 1)) {
      if (food.offerType === 'bogo_1g1') targetQty = 2;
      else if (food.offerType === 'bogo_1g2') targetQty = 3;
    }

    setCart((prevCart) => {
      const foodId = food.id || food._id;

      // 🎯 অরিজিনাল বেস প্রাইস (ব্রাঞ্চ এডজাস্টমেন্ট ও সাইজ ভেরিয়েশন সহ)
      const rawBasePrice = getActivePrice(food, activeBranchId, sizeName);

      // 🎯 অরিজিনাল বেস প্রাইসের ওপর ঠিক একবারই ডিসকাউন্ট অ্যাপ্লাই হবে (যেমন: ৳340 -> ৳306)
      const purchasePrice = applyFoodDiscount(rawBasePrice, food);

      // এড-অনস সহ কার্যকর মোট একক প্রাইস
      const rawBaseWithAddons = rawBasePrice + addonsTotal;
      const purchaseWithAddons = purchasePrice + addonsTotal;

      const branchPrefix = activeBranchId ? `branch-${activeBranchId}` : 'menu-base';
      const addonsKey = finalAddons.map((a) => `${a.name}:${a.price}`).sort().join('|');
      const cartId =
        food.cartId ||
        `${branchPrefix}-${foodId}${sizeName ? `-${sizeName}` : ''}${addonsKey ? `-[${addonsKey}]` : ''}`;

      const existing = prevCart.find((item) => (item.cartId || item.id || item._id) === cartId);
      if (existing) {
        return prevCart.map((item) =>
          (item.cartId || item.id || item._id) === cartId
            ? {
                ...item,
                quantity: item.quantity + targetQty,
                originalPrice: rawBaseWithAddons,
                price: purchaseWithAddons,
                selectedAddons: finalAddons,
                offerType: food.offerType || item.offerType || 'none',
                promoCode: food.promoCode || item.promoCode || null,
                discountPct: Number(food.discountPct ?? item.discountPct) || 0,
                discountAmount: Number(food.discountAmount ?? item.discountAmount) || 0,
                discountType: food.discountType || item.discountType || 'percent',
              }
            : item
        );
      }

      return [
        ...prevCart,
        {
          ...food,
          id: foodId,
          cartId,
          branchId: activeBranchId,
          selectedSize: sizeName,
          selectedVariation: variationObj,
          selectedAddons: finalAddons,
          quantity: targetQty,
          originalPrice: rawBaseWithAddons, // 🎯 অরিজিনাল প্রাইস (যেমন: ৳340.00 + ৳50)
          price: purchaseWithAddons, // 🎯 ডিসকাউন্টেড পেইড প্রাইস (যেমন: ৳306.00 + ৳50)
          offerType: food.offerType || 'none',
          promoCode: food.promoCode || null,
          discountPct: Number(food.discountPct) || 0,
          discountAmount: Number(food.discountAmount) || 0,
          discountType: food.discountType || 'percent',
        },
      ];
    });

    showNotification(`${food.name} added to order!`);
  }, [showNotification]);

  const updateCartQuantity = useCallback((cartIdOrFoodId, newQuantity, selectedSize = null) => {
    const sizeName = selectedSize && (selectedSize.name || selectedSize);
    const targetId = sizeName ? `${cartIdOrFoodId}-${sizeName}` : cartIdOrFoodId;
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          const itemKey = item.cartId || item.id || item._id;
          if (
            itemKey === targetId ||
            itemKey === cartIdOrFoodId ||
            item.id === cartIdOrFoodId ||
            item.cartId === cartIdOrFoodId ||
            String(item.id) === String(cartIdOrFoodId)
          ) {
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const removeFromCart = useCallback((cartIdOrFoodId, selectedSize = null) => {
    updateCartQuantity(cartIdOrFoodId, 0, selectedSize);
  }, [updateCartQuantity]);

  const clearCart = useCallback(() => {
    setCart([]);
    setIsCartOpen(false);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + getCartItemLineTotal(item), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cart,
    isCartOpen,
    notification,
    cartTotal,
    cartItemCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartItemLineTotal,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};