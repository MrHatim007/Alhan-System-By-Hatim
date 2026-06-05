import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { UserRecord, isUsingFirebase, subscribeToUsers } from '../services/dbService';

interface AuthContextType {
  user: UserRecord | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isFirebase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirebase, setIsFirebase] = useState(false);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);

  // Keep a local cached subscription of users for mock auth validation
  useEffect(() => {
    const unsub = subscribeToUsers((data) => {
      setUsersList(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const firebaseActive = isUsingFirebase();
    setIsFirebase(firebaseActive);

    if (firebaseActive) {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          // Find matching user doc in usersList
          const matched = usersList.find(u => u.email === fbUser.email);
          if (matched) {
            setUser(matched);
          } else {
            // Fallback user if not found in db
            setUser({
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Unknown',
              email: fbUser.email || '',
              role: 'rep', // default role
              createdAt: new Date().toISOString(),
              status: 'active'
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Offline LocalStorage Mock Auth
      const savedUser = localStorage.getItem('alhan_active_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, [usersList]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    
    if (isFirebase) {
      try {
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (err: any) {
        console.error('Firebase Auth Error', err);
        setError(err.message || 'Authentication failed');
        setLoading(false);
        return false;
      }
    } else {
      // Mock validation
      // Password presets matching: admin -> admin, warehouse -> warehouse, rep -> rep
      const cleanEmail = email.trim().toLowerCase();
      const matchedUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);
      
      let passwordMatch = false;
      if (matchedUser) {
        if (matchedUser.role === 'admin' && password === 'admin') passwordMatch = true;
        if (matchedUser.role === 'warehouse' && password === 'warehouse') passwordMatch = true;
        if (matchedUser.role === 'rep' && password === 'rep') passwordMatch = true;
      }

      if (matchedUser && passwordMatch) {
        if (matchedUser.status === 'suspended') {
          setError('User account has been suspended');
          setLoading(false);
          return false;
        }
        setUser(matchedUser);
        localStorage.setItem('alhan_active_user', JSON.stringify(matchedUser));
        setLoading(false);
        return true;
      } else {
        setError('Invalid credentials. Presets: admin@alhan.com (pass: admin), warehouse@alhan.com (pass: warehouse), rep1@alhan.com (pass: rep)');
        setLoading(false);
        return false;
      }
    }
  };

  const logout = () => {
    if (isFirebase) {
      const auth = getAuth();
      signOut(auth);
    } else {
      localStorage.removeItem('alhan_active_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isFirebase }}>
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
