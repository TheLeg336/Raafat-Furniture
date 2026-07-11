import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { isBootstrapDeveloperEmail, normalizeStaffRole } from '../lib/staff';

interface AuthContextType {
  user: User | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  isDeveloper: boolean;
  /** Workshop staff: sees the spec-only /staff view, no prices or customer data. */
  isWorker: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Module-level so re-renders can't reset the profile-write cooldown.
let lastProfileWriteAt = 0;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
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

            // Default from Google auth when the user hasn't set a name themselves.
            // A manually saved name (users/{uid}.firstName) always wins — it's read first.
            if (!fName && currentUser.displayName) {
              const parts = currentUser.displayName.trim().split(/\s+/);
              fName = parts[0] || null;
              lName = lName || parts.slice(1).join(' ') || null;
            }

            // Check role in the 'admins' collection. role 'worker' = workshop
            // staff (spec-only access); anything else in the collection = admin.
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.email.toLowerCase()));
            const role = adminDoc.exists() ? (adminDoc.data()?.role || 'admin') : null;
            const roleNorm = normalizeStaffRole(role);
            const bootstrapDev = isBootstrapDeveloperEmail(currentUser.email, currentUser.emailVerified);
            currentAdminStatus = bootstrapDev || (roleNorm !== null && roleNorm !== 'worker');
            currentDeveloperStatus = bootstrapDev || roleNorm === 'developer';
            // Only update state if the fetch was successful
            setFirstName(fName);
            setLastName(lName);
            setIsAdmin(currentAdminStatus);
            setIsDeveloper(currentDeveloperStatus);
            setIsWorker(roleNorm === 'worker');

            // One-time self-heal: fix legacy role casing in the signed-in user's admin doc.
            if (adminDoc.exists() && roleNorm && typeof role === 'string' && role !== roleNorm && currentDeveloperStatus) {
              try {
                await setDoc(doc(db, 'admins', currentUser.email.toLowerCase()), { role: roleNorm }, { merge: true });
              } catch { /* non-developers cannot write — ignore */ }
            }

            if (!currentAdminStatus) {
              // Ensure every customer has a profile document. One doc per user
              // (scalable — admins list the `users` collection) instead of an
              // ever-growing array on a single doc.
              try {
                await setDoc(
                  doc(db, 'users', currentUser.uid),
                  { email: currentUser.email, lastSeenAt: new Date().toISOString() },
                  { merge: true },
                );
              } catch (error) {
                console.error('Failed to upsert user profile:', error);
              }
            }
          } catch (error) {
            console.error("Error checking user status:", error);
            // Fail closed on role-fetch errors — never keep stale privilege flags.
            setIsAdmin(false);
            setIsDeveloper(false);
            setIsWorker(false);
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
        setIsWorker(false);
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
    const first = fName.trim().slice(0, 50);
    const last = lName.trim().slice(0, 50);
    if (!first) throw new Error('Name cannot be empty.');
    // Light client-side rate limit so a stuck button/bot can't spam writes.
    const now = Date.now();
    if (now - lastProfileWriteAt < 5_000) throw new Error('Please wait a moment before saving again.');
    lastProfileWriteAt = now;
    await setDoc(doc(db, 'users', user.uid), {
      firstName: first,
      lastName: last,
      email: user.email,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setFirstName(first);
    setLastName(last);
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
      isWorker,
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
