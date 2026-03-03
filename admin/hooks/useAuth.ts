import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { AuthUser } from '@/types';

export const useAuth = () => {
  const { user, setUser, setLoading, setError } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const authUser: AuthUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || '',
              role: userData.role || 'admin',
              avatar: userData.avatar || '',
            };
            setUser(authUser);
          } else {
            setError('User data not found');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Authentication error');
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setError]);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Logout failed');
    }
  };

  return {
    user,
    isInitialized,
    logout,
  };
};
