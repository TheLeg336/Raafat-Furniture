import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isDeveloper: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setLoading(true);
        let adminStatus = false;
        let developerStatus = false;
        if (currentUser.email && db) {
          try {
            // Check if user is in 'admins' collection
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.email.toLowerCase()));
            adminStatus = adminDoc.exists();
            if (adminStatus) {
              developerStatus = adminDoc.data()?.role === 'developer';
            }
            
            if (!adminStatus) {
              // Save non-admin emails to a single list
              try {
                await updateDoc(doc(db, 'users', 'all_users'), {
                  emails: arrayUnion(currentUser.email)
                });
              } catch (error: any) {
                if (error.code === 'not-found') {
                  await setDoc(doc(db, 'users', 'all_users'), {
                    emails: [currentUser.email]
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error checking admin status:", error);
          }
        }
        setIsAdmin(adminStatus);
        setIsDeveloper(developerStatus);
        setUser(currentUser);
        setLoading(false);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsDeveloper(false);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase is not configured. Please check your .env file.");
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase is not configured. Please check your .env file.");
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase is not configured. Please check your .env file.");
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isDeveloper, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
