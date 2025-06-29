import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  saveFormResponse: (data: any) => Promise<string>;
  getFormResponses: () => Promise<any[]>;
  updateFormResponse: (id: string, data: any) => Promise<void>;
  setUserRole: (userId: string, role: string) => Promise<void>;
  getUserRole: (userId: string) => Promise<string | null>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const saveFormResponse = async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'formResponses'), {
        ...data,
        timestamp: new Date(),
        userId: user?.uid || 'anonymous'
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getFormResponses = async () => {
    try {
      const q = query(collection(db, 'formResponses'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updateFormResponse = async (id: string, data: any) => {
    try {
      const docRef = doc(db, 'formResponses', id);
      await updateDoc(docRef, {
        ...data,
        lastUpdated: new Date()
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const setUserRole = async (userId: string, role: string) => {
    try {
      await setDoc(doc(db, 'users', userId), { role }, { merge: true });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getUserRole = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    saveFormResponse,
    getFormResponses,
    updateFormResponse,
    setUserRole,
    getUserRole
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}; 