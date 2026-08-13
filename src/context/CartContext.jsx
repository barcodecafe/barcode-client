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

  const addToCart = useCallback((food, branchId = null, selectedSize = null, quantity = 1) => {
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

      const branchPrefix = activeBranchId ? `branch-${activeBranchId}` : 'menu-base';
      const cartId = food.cartId || (sizeName ? `${branchPrefix}-${foodId}-${sizeName}` : `${branchPrefix}-${foodId}`);

      const existing = prevCart.find((item) => (item.cartId || item.id || item._id) === cartId);
      if (existing) {
        return prevCart.map((item) =>
          (item.cartId || item.id || item._id) === cartId
            ? {
                ...item,
                quantity: item.quantity + targetQty,
                originalPrice: rawBasePrice,
                price: purchasePrice,
                offerType: food.offerType || item.offerType || 'none',
                promoCode: food.promoCode || item.promoCode || null,
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
          quantity: targetQty,
          originalPrice: rawBasePrice, // 🎯 অরিজিনাল প্রাইস (যেমন: ৳340.00)
          price: purchasePrice, // 🎯 ডিসকাউন্টেড পেইড প্রাইস (যেমন: ৳306.00)
          offerType: food.offerType || 'none',
          promoCode: food.promoCode || null,
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