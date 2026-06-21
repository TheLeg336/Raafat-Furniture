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
        if (currentUser.email && db) {
          try {
            let fName = null;
            let lName = null;
            let currentAdminStatus = false;
            let currentDeveloperStatus = false;

            // Fetch User Profile
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              fName = userData.firstName || null;
              lName = userData.lastName || null;
            }

            // Check if user is in 'admins' collection
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.email.toLowerCase()));
            currentAdminStatus = adminDoc.exists();
            if (currentAdminStatus) {
              currentDeveloperStatus = adminDoc.data()?.role === 'developer';
            }
            
            // Only update state if the fetch was successful
            setFirstName(fName);
            setLastName(lName);
            setIsAdmin(currentAdminStatus);
            setIsDeveloper(currentDeveloperStatus);

            if (!currentAdminStatus) {
              // Save non-admin emails to a single list for marketing/personalization
              // Do this asynchronously so it doesn't block the UI or state updates
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
                  try {
                    await setDoc(doc(db, 'users', 'all_users_list'), {
                      users: [{
                        email: currentUser.email,
                        uid: currentUser.uid,
                        firstName: fName,
                        lastName: lName,
                        joinedAt: new Date().toISOString()
                      }]
                    });
                  } catch (innerError) {
                    console.error("Failed to create all_users_list:", innerError);
                  }
                } else {
                  console.error("Failed to update all_users_list:", error);
                }
              }
            }
          } catch (error) {
            console.error("Error checking user status:", error);
            // On error, do not update the state variables so we don't wipe out existing profile data
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
