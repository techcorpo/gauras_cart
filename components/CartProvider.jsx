'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartCtx = createContext(null);

// Cart holds farmer's selected products. Each line keeps the full product
// (incl. distributor_id) so we can split into per-distributor orders at checkout.
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);   // [{ product, quantity }]
  const [open, setOpen] = useState(false);

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.product.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + qty };
        return next;
      }
      return [...prev, { product, quantity: qty }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((productId, qty) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((x) => x.product.id !== productId)
               : prev.map((x) => (x.product.id === productId ? { ...x, quantity: qty } : x))
    );
  }, []);

  const remove = useCallback((productId) =>
    setItems((prev) => prev.filter((x) => x.product.id !== productId)), []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((s, x) => s + x.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, x) => s + Number(x.product.price ?? x.product.base_price) * x.quantity, 0), [items]);

  return (
    <CartCtx.Provider value={{ items, open, setOpen, add, setQty, remove, clear, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}
export const useCart = () => useContext(CartCtx);
