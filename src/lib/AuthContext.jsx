import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth, db } from '../db/firebase.js';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const snap = await getDoc(userRef);
          let userProfile;
          if (snap.exists()) {
            userProfile = snap.data();
          } else {
            // New user – create their profile document
            userProfile = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              last_active_at: serverTimestamp(),
              partner_id: null,
              settings: {
                notificationPreferences: { desktop: true, mobile: true, email: false },
                reminderDefaultTime: 30,
                defaultCategories: ['personal', 'work', 'health'],
                defaultFocusBehavior: 'manual',
                backgroundAnimationPreference: 'subtle',
                calendarSystem: 'jalali'
              }
            };
            await setDoc(userRef, userProfile, { merge: true });
          }
          setUser({ ...userProfile, uid: firebaseUser.uid, email: firebaseUser.email });
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Still let them in with basic info; Firestore might be offline
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const updateLastActive = () => {
      setDoc(doc(db, 'users', user.uid), {
        last_active_at: serverTimestamp()
      }, { merge: true }).catch((error) => console.error('Error updating last active time:', error));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateLastActive();
    };

    updateLastActive();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = window.setInterval(updateLastActive, 60000);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [user?.uid]);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      register,
      resetPassword,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
