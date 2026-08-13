import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  familyId: string | null;
  userId: string | null;
  refreshFamilyId: () => Promise<void>;
  filterMode: 'personal' | 'family';
  setFilterMode: (mode: 'personal' | 'family') => void;
}

const defaultState: AuthContextType = {
  isLoggedIn: false,
  isAuthLoading: true,
  familyId: null,
  userId: null,
  refreshFamilyId: async () => {},
  filterMode: 'personal',
  setFilterMode: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultState);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'personal' | 'family'>(
    'personal',
  );

  const fetchFamilyId = async (uid: string) => {
    try {
      const doc = await firestore().collection('users').doc(uid).get();
      const nextFamilyId = doc.exists() ? doc.data()?.familyId ?? null : null;
      setFamilyId(nextFamilyId);
    } catch (error) {
      console.error('Loi lay familyId:', error);
      setFamilyId(null);
    }
  };

  const refreshFamilyId = async () => {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      setFamilyId(null);
      return;
    }

    await fetchFamilyId(currentUser.uid);
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async user => {
      setIsAuthLoading(true);

      if (user) {
        setIsLoggedIn(true);
        setUserId(user.uid);

        const isNewUser =
          user.metadata.creationTime &&
          user.metadata.lastSignInTime &&
          user.metadata.creationTime === user.metadata.lastSignInTime;

        if (isNewUser) {
          setFamilyId(null);
        } else {
          await fetchFamilyId(user.uid);
        }
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        setFamilyId(null);
        setFilterMode('personal');
      }

      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAuthLoading,
        familyId,
        userId,
        refreshFamilyId,
        filterMode,
        setFilterMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
