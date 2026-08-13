import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../context/AuthContext';

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  userId: string;
  familyId: string | null;
  isFamily: boolean;
  createdAt: string;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const { familyId, filterMode } = useAuth();
  const user = auth().currentUser;

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = firestore().collection('goals') as any;

    if (filterMode === 'family' && familyId) {
      query = query.where('familyId', '==', familyId);
    } else {
      query = query.where('userId', '==', user.uid);
    }

    const unsubscribe = query
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot: any) => {
        if (!snapshot || !snapshot.docs) {
          setLoading(false);
          return;
        }

        let list = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (filterMode === 'personal') {
          list = list.filter((item: any) => item.isFamily !== true);
        }

        setGoals(list);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user, familyId, filterMode]);

  return { goals, loading, setGoals, setLoading };
};
