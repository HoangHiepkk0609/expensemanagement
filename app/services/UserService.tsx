import firestore from '@react-native-firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  settings: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
    dailyReminder: boolean;
  };
}

class UserService {
  async createUserProfile(user: any) {
    try {
      const userRef = firestore().collection('users').doc(user.uid);

      const newUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Người dùng mới',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        settings: {
          theme: 'light',
          currency: 'VND',
          dailyReminder: true
        }
      };

      await userRef.set(newUser, { merge: true });
      
      console.log("✅ UserService: Đã tạo User Profile trên Firestore!");
    } catch (error) {
      console.error("❌ UserService Lỗi:", error);
      throw error; 
    }
  }

  async getUserProfile(uid: string) {
    try {
      const doc = await firestore().collection('users').doc(uid).get();
      return doc.exists() ? doc.data() as UserProfile : null;
    } catch (error) {
      console.error("Lỗi lấy user:", error);
      return null;
    }
  }
}

export default new UserService();