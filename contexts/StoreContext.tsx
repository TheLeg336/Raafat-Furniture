import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

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
  const [hasMerged, setHasMerged] = useState(false);

  const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        isAnonymous: user?.isAnonymous,
        tenantId: user?.tenantId,
        providerInfo: user?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    if (errInfo.error.includes('permission-denied') || errInfo.error.includes('Missing or insufficient permissions')) {
      throw new Error(JSON.stringify(errInfo));
    }
  };

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      if (!db) return;
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection test successful.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  }, []);

  // 1. Initial Load: Local Storage (only if no user or during auth transition)
  useEffect(() => {
    if (!user && !isInitialized) {
      console.log("Loading initial data from local storage...");
      const localCart = localStorage.getItem('rf_cart');
      const localSaved = localStorage.getItem('rf_saved');
      setCart(localCart ? JSON.parse(localCart) : []);
      setSavedForLater(localSaved ? JSON.parse(localSaved) : []);
      setWishlist([]);
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // 2. Sync with Firestore & Merge Logic
  useEffect(() => {
    if (!user || !db) {
      if (!user) {
        setHasMerged(false);
        setIsInitialized(false); // Allow re-initialization on next login
      }
      return;
    }

    const userStoreRef = doc(db, 'users', user.uid, 'store', 'data');
    
    console.log("Setting up Firestore sync for user:", user.uid);
    
    const unsubscribe = onSnapshot(userStoreRef, async (docSnap) => {
      const fsData = docSnap.exists() ? docSnap.data() : null;
      
      // If we haven't merged local data yet, do it now
      if (!hasMerged) {
        const localCart = localStorage.getItem('rf_cart');
        const localSaved = localStorage.getItem('rf_saved');
        
        if (localCart || localSaved) {
          console.log("Merging local data to Firestore...");
          const lCart = localCart ? JSON.parse(localCart) : [];
          const lSaved = localSaved ? JSON.parse(localSaved) : [];
          
          let mergedCart = fsData?.cart || [];
          let mergedSaved = fsData?.savedForLater || [];
          const mergedWishlist = fsData?.wishlist || [];

          // Merge logic: append local items if they don't exist in Firestore
          lCart.forEach((item: CartItem) => {
            if (!mergedCart.find((c: CartItem) => c.id === item.id)) {
              mergedCart.push(item);
            }
          });

          lSaved.forEach((item: CartItem) => {
            if (!mergedSaved.find((c: CartItem) => c.id === item.id)) {
              mergedSaved.push(item);
            }
          });

          try {
            await setDoc(userStoreRef, {
              cart: mergedCart,
              savedForLater: mergedSaved,
              wishlist: mergedWishlist
            }, { merge: true });
            
            localStorage.removeItem('rf_cart');
            localStorage.removeItem('rf_saved');
            console.log("Merge complete.");
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, userStoreRef.path);
          }
        }
        setHasMerged(true);
      }

      // Update local state from Firestore
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Firestore data received:", data);
        setCart(data.cart || []);
        setSavedForLater(data.savedForLater || []);
        setWishlist(data.wishlist || []);
      } else {
        setCart([]);
        setSavedForLater([]);
        setWishlist([]);
      }
      setIsInitialized(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, userStoreRef.path);
    });

    return () => unsubscribe();
  }, [user, hasMerged]);

  // 3. Persist to Local Storage (only if logged out)
  useEffect(() => {
    if (!user && isInitialized) {
      localStorage.setItem('rf_cart', JSON.stringify(cart));
      localStorage.setItem('rf_saved', JSON.stringify(savedForLater));
    }
  }, [cart, savedForLater, user, isInitialized]);

  // 4. Update Firestore Helper
  const updateFirestore = async (newCart: CartItem[], newSaved: CartItem[], newWishlist: string[]) => {
    if (!user || !db || !isInitialized) {
      console.warn("Skipping Firestore update: Not initialized or no user.");
      return;
    }
    const userStoreRef = doc(db, 'users', user.uid, 'store', 'data');
    try {
      await setDoc(userStoreRef, {
        cart: newCart,
        savedForLater: newSaved,
        wishlist: newWishlist
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userStoreRef.path);
    }
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
