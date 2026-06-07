import { create } from 'zustand';

const STORAGE_KEY = 'sf_cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const useCartStore = create((set, get) => ({
  items: loadCart(),

  get totalItems() {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },
  get totalPrice() {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  addItem(product, quantity = 1) {
    set((state) => {
      const existing = state.items.find((i) => i.id === product.id);
      let next;
      if (existing) {
        next = state.items.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      } else {
        next = [
          ...state.items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || product.images?.[0] || '',
            quantity,
          },
        ];
      }
      saveCart(next);
      return { items: next };
    });
  },

  updateQuantity(id, quantity) {
    if (quantity < 1) return get().removeItem(id);
    set((state) => {
      const next = state.items.map((i) =>
        i.id === id ? { ...i, quantity } : i,
      );
      saveCart(next);
      return { items: next };
    });
  },

  removeItem(id) {
    set((state) => {
      const next = state.items.filter((i) => i.id !== id);
      saveCart(next);
      return { items: next };
    });
  },

  clearCart() {
    localStorage.removeItem(STORAGE_KEY);
    set({ items: [] });
  },
}));

export default useCartStore;
