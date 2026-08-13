import firestore from '@react-native-firebase/firestore';

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  text: string;
  createdAt?: number;
}

class ChatService {
  private getDocRef(userId: string) {
    return firestore().collection('chat_sessions').doc(userId);
  }

  subscribeToChat(userId: string, onUpdate: (messages: ChatMessage[]) => void) {
    return this.getDocRef(userId).onSnapshot(doc => {
      if (doc.exists()) {
        const data = doc.data();
        let messages = data?.messages || [];

        messages.sort(
          (a: ChatMessage, b: ChatMessage) =>
            (a.createdAt || 0) - (b.createdAt || 0),
        );

        onUpdate(messages);
      } else {
        onUpdate([]);
      }
    });
  }

  async addMessage(userId: string, msg: ChatMessage) {
    const messageToSave = {
      ...msg,
      createdAt: Date.now(),
    };

    try {
      await this.getDocRef(userId).set(
        {
          messages: firestore.FieldValue.arrayUnion(messageToSave),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
          userId: userId,
        },
        { merge: true },
      );
    } catch (error) {
      console.error('Lỗi lưu tin nhắn:', error);
    }
  }

  async clearChat(userId: string) {
    try {
      await this.getDocRef(userId).delete();
    } catch (error) {
      console.error('Lỗi xóa chat:', error);
    }
  }
}

export default new ChatService();