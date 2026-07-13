import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getActivePrice } from '../services/foodsService';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // Cart items
  const [cart, setCart] = useState([]);

  // UI state — lifted out of Menu.jsx so any page/component can trigger them
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Tracks the active toast timeout so rapid add-to-cart clicks (e.g. one from
  // Home, one from Menu, seconds apart) don't have an earlier timer cut short
  // a newer toast's visible duration.
  const notificationTimeoutRef = useRef(null);

  const showNotification = useCallback((message) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(message);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  // Add to cart. Accepts an optional size/variation and quantity so DishDetail's
  // 4-arg call works (audit bug #14): variation is honored for pricing + the
  // cart-line key, and the chosen quantity is respected instead of always +1.
  //   addToCart(food, branchId?, selectedSize?, quantity?)
  // selectedSize may be a variation object ({name,price}) or a plain name string.
  const addToCart = useCallback((food, branchId = null, selectedSize = null, quantity = 1) => {
    const sizeName = (selectedSize && (selectedSize.name || selectedSize)) || food.selectedSize || null;
    const variationObj = selectedSize && typeof selectedSize === 'object' ? selectedSize : null;
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;

    setCart((prevCart) => {
      const activeBranchId = branchId || Number(localStorage.getItem('selectedBranchId')) || null;
      const basePrice = getActivePrice(food, activeBranchId, sizeName); // honors the variation price
      let purchasePrice = basePrice;
      if (food.discountPct > 0) {
        purchasePrice = basePrice * (1 - food.discountPct / 100);
      }

      const cartId = food.cartId || (sizeName ? `${food.id}-${sizeName}` : food.id);

      const existing = prevCart.find((item) => (item.cartId || item.id) === cartId);
      if (existing) {
        return prevCart.map((item) =>
          (item.cartId || item.id) === cartId
            ? { ...item, quantity: item.quantity + qty, price: purchasePrice }
            : item
        );
      }
      return [...prevCart, {
        ...food,
        cartId,
        selectedSize: sizeName,
        selectedVariation: variationObj, // kept so DishDetail can match this line
        quantity: qty,
        price: purchasePrice,
        originalPrice: basePrice, // variant-aware pre-discount price (was food.price — wrong for variants)
        basePrice: food.price, // raw base food price — lets checkout re-price at the chosen branch
      }];
    });

    showNotification(`${food.name} added to order!`);
  }, [showNotification]);

  // Set an item's quantity to an ABSOLUTE value (not a delta — audit bug #14).
  //   updateCartQuantity(cartIdOrFoodId, newQuantity, selectedSize?)
  // DishDetail passes the food id + variation; the drawer passes the cartId.
  const updateCartQuantity = useCallback((cartIdOrFoodId, newQuantity, selectedSize = null) => {
    const sizeName = selectedSize && (selectedSize.name || selectedSize);
    const targetId = sizeName ? `${cartIdOrFoodId}-${sizeName}` : cartIdOrFoodId;
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          const itemKey = item.cartId || item.id;
          if (itemKey === targetId) {
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  // Empty the cart. (The stuck success alert was removed — audit #16; the
  // checkout flow shows its own confirmation and navigates to tracking.)
  const clearCart = useCallback(() => {
    setCart([]);
    setIsCartOpen(false);
  }, []);

  // Derived totals — computed once here so every consumer (Menu, Navbar badge,
  // future checkout page, etc.) reads the same numbers instead of recalculating.
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    // state
    cart,
    isCartOpen,
    notification,
    cartTotal,
    cartItemCount,
    // actions
    addToCart,
    updateCartQuantity,
    clearCart,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook — consumers import this instead of useContext + CartContext directly,
// matching the existing useTheme.js pattern in this project.
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
