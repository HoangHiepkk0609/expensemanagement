import firestore from '@react-native-firebase/firestore';

const USER_ID = 'my-test-user-id-123'; 

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  text: string;
  createdAt?: number; 
}

class ChatService {
  private get docRef() {
    return firestore().collection('chat_sessions').doc(USER_ID);
  }

  subscribeToChat(onUpdate: (messages: ChatMessage[]) => void) {
    return this.docRef.onSnapshot(doc => {
      if (doc.exists()) {
        const data = doc.data();
        let messages = data?.messages || [];
        
        messages.sort((a: ChatMessage, b: ChatMessage) => (a.createdAt || 0) - (b.createdAt || 0));
        
        onUpdate(messages);
      } else {
        onUpdate([]); 
      }
    });
  }

  async addMessage(msg: ChatMessage) {
    const messageToSave = {
      ...msg,
      createdAt: Date.now(), 
    };

    try {

      await this.docRef.set(
        {
          messages: firestore.FieldValue.arrayUnion(messageToSave),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
          userId: USER_ID,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Lỗi lưu tin nhắn:", error);
    }
  }

  async clearChat() {
    try {
      await this.docRef.delete();
    } catch (error) {
      console.error("Lỗi xóa chat:", error);
    }
  }
}

export default new ChatService();