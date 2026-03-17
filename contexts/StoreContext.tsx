import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CartItem {
  id: string; // unique id for the cart item (productId + color + material)
  productId: string | number;
  name: string;
  price?: number;
  imageUrl: string;
  quantity: number;
  color?: string;
  material?: string;
}

interface StoreContextType {
  cart: CartItem[];
  savedForLater: CartItem[];
  wishlist: string[]; // array of product IDs
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  moveToSavedForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeFromSavedForLater: (id: string) => void;
  toggleWishlist: (productId: string | number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage initially or on logout
  useEffect(() => {
    if (!user) {
      const localCart = localStorage.getItem('rf_cart');
      const localSaved = localStorage.getItem('rf_saved');
      setCart(localCart ? JSON.parse(localCart) : []);
      setSavedForLater(localSaved ? JSON.parse(localSaved) : []);
      setWishlist([]); // Wishlist is only for logged-in users
      setIsInitialized(true);
    }
  }, [user]);

  // Sync with Firestore when user logs in
  useEffect(() => {
    if (!user || !db) return;

    const userStoreRef = doc(db, 'users', user.uid, 'store', 'data');
    
    // Merge local storage to firestore on first login if local has items
    const mergeLocalData = async () => {
      if (!isInitialized) return;
      const localCart = localStorage.getItem('rf_cart');
      const localSaved = localStorage.getItem('rf_saved');
      
      if (localCart || localSaved) {
        const docSnap = await getDoc(userStoreRef);
        let mergedCart = localCart ? JSON.parse(localCart) : [];
        let mergedSaved = localSaved ? JSON.parse(localSaved) : [];
        let mergedWishlist: string[] = [];

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Simple merge: keep firestore items, append local items if they don't exist
          const fsCart = data.cart || [];
          const fsSaved = data.savedForLater || [];
          mergedWishlist = data.wishlist || [];

          mergedCart = [...fsCart];
          if (localCart) {
            JSON.parse(localCart).forEach((item: CartItem) => {
              if (!mergedCart.find((c: CartItem) => c.id === item.id)) {
                mergedCart.push(item);
              }
            });
          }

          mergedSaved = [...fsSaved];
          if (localSaved) {
            JSON.parse(localSaved).forEach((item: CartItem) => {
              if (!mergedSaved.find((c: CartItem) => c.id === item.id)) {
                mergedSaved.push(item);
              }
            });
          }
        }

        await setDoc(userStoreRef, {
          cart: mergedCart,
          savedForLater: mergedSaved,
          wishlist: mergedWishlist
        }, { merge: true });

        // Clear local storage after merge
        localStorage.removeItem('rf_cart');
        localStorage.removeItem('rf_saved');
      }
    };

    mergeLocalData();

    // Listen to changes
    const unsubscribe = onSnapshot(userStoreRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCart(data.cart || []);
        setSavedForLater(data.savedForLater || []);
        setWishlist(data.wishlist || []);
      } else {
        setCart([]);
        setSavedForLater([]);
        setWishlist([]);
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [user, isInitialized]);

  // Save to local storage if not logged in
  useEffect(() => {
    if (!user && isInitialized) {
      localStorage.setItem('rf_cart', JSON.stringify(cart));
      localStorage.setItem('rf_saved', JSON.stringify(savedForLater));
    }
  }, [cart, savedForLater, user, isInitialized]);

  // Save to Firestore if logged in
  const updateFirestore = async (newCart: CartItem[], newSaved: CartItem[], newWishlist: string[]) => {
    if (!user || !db) return;
    const userStoreRef = doc(db, 'users', user.uid, 'store', 'data');
    await setDoc(userStoreRef, {
      cart: newCart,
      savedForLater: newSaved,
      wishlist: newWishlist
    }, { merge: true });
  };

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const id = `${item.productId}-${item.color || 'default'}-${item.material || 'default'}`;
    const existingItem = cart.find(c => c.id === id);
    let newCart;
    if (existingItem) {
      newCart = cart.map(c => c.id === id ? { ...c, quantity: c.quantity + item.quantity } : c);
    } else {
      newCart = [...cart, { ...item, id }];
    }
    setCart(newCart);
    if (user) updateFirestore(newCart, savedForLater, wishlist);
  };

  const removeFromCart = (id: string) => {
    const newCart = cart.filter(c => c.id !== id);
    setCart(newCart);
    if (user) updateFirestore(newCart, savedForLater, wishlist);
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const newCart = cart.map(c => c.id === id ? { ...c, quantity } : c);
    setCart(newCart);
    if (user) updateFirestore(newCart, savedForLater, wishlist);
  };

  const moveToSavedForLater = (id: string) => {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    const newCart = cart.filter(c => c.id !== id);
    const newSaved = [...savedForLater, item];
    setCart(newCart);
    setSavedForLater(newSaved);
    if (user) updateFirestore(newCart, newSaved, wishlist);
  };

  const moveToCart = (id: string) => {
    const item = savedForLater.find(c => c.id === id);
    if (!item) return;
    const newSaved = savedForLater.filter(c => c.id !== id);
    const existingCartItem = cart.find(c => c.id === id);
    let newCart;
    if (existingCartItem) {
      newCart = cart.map(c => c.id === id ? { ...c, quantity: c.quantity + item.quantity } : c);
    } else {
      newCart = [...cart, item];
    }
    setSavedForLater(newSaved);
    setCart(newCart);
    if (user) updateFirestore(newCart, newSaved, wishlist);
  };

  const removeFromSavedForLater = (id: string) => {
    const newSaved = savedForLater.filter(c => c.id !== id);
    setSavedForLater(newSaved);
    if (user) updateFirestore(cart, newSaved, wishlist);
  };

  const toggleWishlist = (productId: string | number) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const idStr = String(productId);
    let newWishlist;
    if (wishlist.includes(idStr)) {
      newWishlist = wishlist.filter(id => id !== idStr);
    } else {
      newWishlist = [...wishlist, idStr];
    }
    setWishlist(newWishlist);
    updateFirestore(cart, savedForLater, newWishlist);
  };

  return (
    <StoreContext.Provider value={{
      cart,
      savedForLater,
      wishlist,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      moveToSavedForLater,
      moveToCart,
      removeFromSavedForLater,
      toggleWishlist,
      isCartOpen,
      setIsCartOpen,
      showAuthModal,
      setShowAuthModal
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
