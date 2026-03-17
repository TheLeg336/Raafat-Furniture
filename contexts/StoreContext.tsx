import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);
  const [hasMerged, setHasMerged] = useState(false);
  const isRemoteUpdate = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 1. Initial Load: Local Storage (Always do this once on mount, but wait for auth to be ready)
  useEffect(() => {
    if (authLoading) return; // Wait for auth to determine if we have a user

    if (!isLocalLoaded) {
      console.log("Loading initial data from local storage...");
      try {
        const localCart = localStorage.getItem('rf_cart');
        const localSaved = localStorage.getItem('rf_saved');
        if (localCart) setCart(JSON.parse(localCart));
        if (localSaved) setSavedForLater(JSON.parse(localSaved));
      } catch (error) {
        console.error("Failed to load from local storage:", error);
      }
      setIsLocalLoaded(true);
      // If no user, we are "initialized" for local mode
      if (!user) setIsInitialized(true);
    }
  }, [isLocalLoaded, user, authLoading]);

  // 2. Sync with Firestore & Merge Logic
  useEffect(() => {
    if (authLoading) return;

    if (!user || !db) {
      if (!user && isLocalLoaded) {
        setIsInitialized(true);
        setHasMerged(false);
      }
      return;
    }

    setIsInitialized(false); // Reset initialization when user changes to show loading if needed

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
          
          // Clear local storage BEFORE the async call to prevent loops
          // if another snapshot arrives during the await.
          localStorage.removeItem('rf_cart');
          localStorage.removeItem('rf_saved');
          
          let mergedCart = fsData?.cart || [];
          let mergedSaved = fsData?.savedForLater || [];
          const mergedWishlist = fsData?.wishlist || [];

          // Merge logic: combine quantities for identical items
          lCart.forEach((item: CartItem) => {
            const existing = mergedCart.find((c: CartItem) => c.id === item.id);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
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
            
            console.log("Merge complete.");
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, userStoreRef.path);
            // If it fails, we might want to restore local storage, 
            // but usually a failure here means a bigger issue.
          }
        }
        setHasMerged(true);
      }

      // Update local state from Firestore
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Firestore data received:", data);
        isRemoteUpdate.current = true;
        setCart(data.cart || []);
        setSavedForLater(data.savedForLater || []);
        setWishlist(data.wishlist || []);
      } else {
        isRemoteUpdate.current = true;
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

  // 3. Persist to Local Storage (only if logged out and local data is loaded)
  useEffect(() => {
    if (!user && isLocalLoaded) {
      console.log("Persisting cart to local storage...", { cartCount: cart.length });
      try {
        localStorage.setItem('rf_cart', JSON.stringify(cart));
        localStorage.setItem('rf_saved', JSON.stringify(savedForLater));
      } catch (error) {
        console.error("Failed to save to local storage:", error);
      }
    }
  }, [cart, savedForLater, user, isLocalLoaded]);

  // 4. Centralized Firestore Sync Effect
  useEffect(() => {
    if (!user || !db || !isInitialized) return;

    // If this change came from Firestore, don't push it back
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    // Debounce Firestore updates
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    syncTimeoutRef.current = setTimeout(() => {
      updateFirestore(cart, savedForLater, wishlist);
    }, 1000); // 1 second debounce

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cart, savedForLater, wishlist, user, isInitialized]);

  // 5. Update Firestore Helper
  const updateFirestore = async (newCart: CartItem[], newSaved: CartItem[], newWishlist: string[]) => {
    if (!user || !db || !isInitialized) {
      console.warn("Skipping Firestore update: Not initialized or no user.");
      return;
    }

    // Firestore does not accept 'undefined'. We must strip undefined values or convert to null.
    const sanitizeItem = (item: CartItem) => {
      const sanitized = { ...item };
      if (sanitized.color === undefined) delete sanitized.color;
      if (sanitized.material === undefined) delete sanitized.material;
      if (sanitized.price === undefined) delete sanitized.price;
      return sanitized;
    };

    const sanitizedCart = newCart.map(sanitizeItem);
    const sanitizedSaved = newSaved.map(sanitizeItem);

    const userStoreRef = doc(db, 'users', user.uid, 'store', 'data');
    console.log("Updating Firestore with sanitized data...", { cartCount: sanitizedCart.length });
    
    try {
      await setDoc(userStoreRef, {
        cart: sanitizedCart,
        savedForLater: sanitizedSaved,
        wishlist: newWishlist
      }, { merge: true });
      console.log("Firestore update successful.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userStoreRef.path);
    }
  };

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    console.log("Adding to cart:", item.name);
    const id = `${item.productId}-${item.color || 'default'}-${item.material || 'default'}`;
    const existingItem = cart.find(c => c.id === id);
    if (existingItem) {
      setCart(cart.map(c => c.id === id ? { ...c, quantity: c.quantity + item.quantity } : c));
    } else {
      setCart([...cart, { ...item, id }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(c => c.id === id ? { ...c, quantity } : c));
  };

  const moveToSavedForLater = (id: string) => {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    setCart(cart.filter(c => c.id !== id));
    setSavedForLater([...savedForLater, item]);
  };

  const moveToCart = (id: string) => {
    const item = savedForLater.find(c => c.id === id);
    if (!item) return;
    setSavedForLater(savedForLater.filter(c => c.id !== id));
    const existingCartItem = cart.find(c => c.id === id);
    if (existingCartItem) {
      setCart(cart.map(c => c.id === id ? { ...c, quantity: c.quantity + item.quantity } : c));
    } else {
      setCart([...cart, item]);
    }
  };

  const removeFromSavedForLater = (id: string) => {
    setSavedForLater(savedForLater.filter(c => c.id !== id));
  };

  const toggleWishlist = (productId: string | number) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const idStr = String(productId);
    if (wishlist.includes(idStr)) {
      setWishlist(wishlist.filter(id => id !== idStr));
    } else {
      setWishlist([...wishlist, idStr]);
    }
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
