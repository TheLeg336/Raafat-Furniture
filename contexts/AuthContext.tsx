import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  isDeveloper: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
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
        let fName = null;
        let lName = null;

        if (currentUser.email && db) {
          try {
            // Fetch User Profile
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              fName = userData.firstName || null;
              lName = userData.lastName || null;
            } else {
              // If we already have a name in state and the doc doesn't exist, keep it (though this shouldn't happen)
              // But more importantly, if the fetch fails, we don't want to clear it.
            }

            // Check if user is in 'admins' collection
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.email.toLowerCase()));
            adminStatus = adminDoc.exists();
            if (adminStatus) {
              developerStatus = adminDoc.data()?.role === 'developer';
            }
            
            if (!adminStatus) {
              // Save non-admin emails to a single list for marketing/personalization
              try {
                await updateDoc(doc(db, 'users', 'all_users_list'), {
                  users: arrayUnion({
                    email: currentUser.email,
                    uid: currentUser.uid,
                    firstName: fName,
                    lastName: lName,
                    joinedAt: new Date().toISOString()
                  })
                });
              } catch (error: any) {
                if (error.code === 'not-found') {
                  await setDoc(doc(db, 'users', 'all_users_list'), {
                    users: [{
                      email: currentUser.email,
                      uid: currentUser.uid,
                      firstName: fName,
                      lastName: lName,
                      joinedAt: new Date().toISOString()
                    }]
                  });
                }
              }
            }
            
            setFirstName(fName);
            setLastName(lName);
            setIsAdmin(adminStatus);
            setIsDeveloper(developerStatus);
          } catch (error) {
            console.error("Error checking user status:", error);
            // If there's an error (e.g., network), don't overwrite existing state with nulls
            // Just let the existing state persist if it's a token refresh
          }
        }
        
        setUser(currentUser);
        setLoading(false);
      } else {
        setUser(null);
        setFirstName(null);
        setLastName(null);
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

  const updateProfile = async (fName: string, lName: string) => {
    if (!user || !db) return;
    await setDoc(doc(db, 'users', user.uid), {
      firstName: fName,
      lastName: lName,
      email: user.email,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setFirstName(fName);
    setLastName(lName);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firstName, 
      lastName, 
      isAdmin, 
      isDeveloper, 
      loading, 
      loginWithGoogle, 
      loginWithEmail, 
      signupWithEmail, 
      updateProfile,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
