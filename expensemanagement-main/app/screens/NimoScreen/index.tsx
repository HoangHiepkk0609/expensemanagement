import { GoogleGenerativeAI } from '@google/generative-ai';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import ChatService, { ChatMessage } from '../../services/ChatService';
import { useTheme } from '../../theme/themeContext';
import { validateNimoResponse } from '../../utils/nimoValidator';
import styles from './styles';
interface Transaction {
  userId: string;
  type: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  familyId: string | null;
  isFamily: boolean;
  source?: string;
}

const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: 'model',
  text: 'Chào bạn, Nimo đã sẵn sàng hỗ trợ bạn rồi đây ✨',
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const SYSTEM_PROMPT = `
Bạn là Nimo, trợ lý ảo quản lý tài chính.
HÔM NAY LÀ NGÀY: ${getTodayString()}.

DANH MỤC CHI TIÊU (expense) — ưu tiên chọn 1 trong:
- Ăn uống
- Mua sắm
- Di chuyển
- Người thân
- Khác (nếu không khớp danh mục nào)

DANH MỤC THU NHẬP (income) — ưu tiên chọn 1 trong:
- Lương
- Kinh doanh
- Thưởng
- Khác (nếu không khớp danh mục nào)

QUY TẮC CHỌN DANH MỤC:
- "ăn", "uống", "cà phê", "trà sữa", "phở", "cơm", "lẩu", "nhậu" → Ăn uống
- "xăng", "grab", "xe", "bus", "taxi", "gửi xe" → Di chuyển
- "mua", "quần áo", "giày", "điện thoại", "đồ dùng" → Mua sắm
- "ba mẹ", "bố mẹ", "con", "anh", "chị", "em", "bạn bè", "cho" → Người thân
- "lương", "lương tháng", "lương tuần" → Lương
- "thưởng", "thưởng tết", "thưởng dự án" → Thưởng
- "kinh doanh", "bán hàng", "thu từ" → Kinh doanh
- Không rõ → Khác

QUAN TRỌNG: Nếu người dùng nhắc danh mục không có trong danh sách trên
(ví dụ "Sức khỏe", "Học tập"...), vẫn trả về đúng tên đó —
vì có thể người dùng đã tự tạo danh mục tùy chỉnh trong app.

Luôn trả về JSON định dạng:
{
  "isTransaction": true,
  "reply": "...",
  "amount": <số tiền>,
  "category": "<tên danh mục>",
  "type": "<expense hoặc income>",
  "date": "<YYYY-MM-DD>",
  "note": "<mô tả chi tiết>",
  "wallet": "<Tiền mặt | Thẻ ngân hàng | Ví MoMo | Ví điện tử khác>"
}
`;

const ANALYTICS_PROMPT = `
Bạn là Nimo, trợ lý ảo quản lý tài chính.
HÔM NAY LÀ NGÀY: ${getTodayString()}.

Bạn sẽ nhận được dữ liệu chi tiêu thực tế của người dùng trong tin nhắn.
Hãy phân tích và trả lời câu hỏi dựa trên dữ liệu đó.
Trả lời thân thiện, ngắn gọn, dùng emoji cho sinh động.
QUAN TRỌNG: Đây là câu hỏi phân tích, KHÔNG phải nhập giao dịch. isTransaction LUÔN LUÔN là false.

Luôn trả về JSON định dạng:
{
  "isTransaction": false,
  "reply": "câu trả lời phân tích chi tiêu"
}
`;

const nimoModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: { responseMimeType: 'application/json' },
});

const nimoAnalyticsModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: ANALYTICS_PROMPT,
  generationConfig: { responseMimeType: 'application/json' },
});

const NimoScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();
  const userId = auth().currentUser?.uid;

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);

  React.useLayoutEffect(() => {
    navigation.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      navigation.setOptions({ tabBarStyle: { display: 'flex' } });
    };
  }, [navigation]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = ChatService.subscribeToChat(
      userId,
      firestoreMessages => {
        if (firestoreMessages && firestoreMessages.length > 0) {
          setMessages(firestoreMessages);
        } else {
          setMessages([INITIAL_MESSAGE]);
        }
      },
    );
    return () => unsubscribe();
  }, [userId]);

  const handleReset = () => {
    Alert.alert(
      'Xóa đoạn chat',
      'Toàn bộ lịch sử trò chuyện sẽ bị xóa vĩnh viễn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: async () => {
            if (userId) {
              await ChatService.clearChat(userId);
              setMessages([INITIAL_MESSAGE]);
              setInputText('');
            }
          },
        },
      ],
    );
  };

  const callGeminiWithRetry = async (
    model: any,
    prompt: string,
    retries = 3,
  ) => {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await model.generateContent(prompt);
        return result;
      } catch (error: any) {
        const is503 = error?.message?.includes('503') || error?.status === 503;
        if (is503 && i < retries - 1) {
          console.log(`Gemini 503, thử lại lần ${i + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Gemini không phản hồi sau nhiều lần thử');
  };

  const fetchUserTransactions = async () => {
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).toISOString();

    const userDoc = await firestore().collection('users').doc(userId).get();
    const familyId = userDoc.data()?.familyId;

    const personalQuery = firestore()
      .collection('transactions')
      .where('userId', '==', userId)
      .where('isFamily', '==', false)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    const familyQuery = familyId
      ? firestore()
          .collection('transactions')
          .where('familyId', '==', familyId)
          .where('isFamily', '==', true)
          .where('date', '>=', startDate)
          .where('date', '<=', endDate)
          .get()
      : Promise.resolve(null);

    const [personalSnapshot, familySnapshot] = await Promise.all([
      personalQuery,
      familyQuery,
    ]);

    const personalTransactions: Transaction[] = personalSnapshot.docs.map(
      doc => ({
        ...(doc.data() as Transaction),
        source: 'personal',
      }),
    );

    const familyTransactions: Transaction[] = familySnapshot
      ? familySnapshot.docs.map(doc => ({
          ...(doc.data() as Transaction),
          source: 'family',
        }))
      : [];

    return { personalTransactions, familyTransactions, familyId };
  };

  const isAnalyticsQuestion = (text: string): boolean => {
    const keywords = [
      'tiêu bao nhiêu',
      'chi bao nhiêu',
      'tháng này',
      'danh mục nào',
      'so sánh',
      'nhiều nhất',
      'ít nhất',
      'còn lại',
      'tiền tôi',
      'thống kê',
      'phân tích',
      'gia đình',
      'thành viên nào',
      'chi chung',
    ];
    return keywords.some(k => text.toLowerCase().includes(k));
  };

  const suggestions = [
    'Nhập chi tiêu? Chat là xong',
    'Tháng này tôi tiêu bao nhiêu?',
    'Danh mục nào tốn nhiều nhất?',
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !userId) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: messageText,
    };
    await ChatService.addMessage(userId, userMsg);
    setInputText('');
    setLoading(true);

    try {
      let result;

      if (isAnalyticsQuestion(messageText)) {
        const { personalTransactions, familyTransactions, familyId } =
          await fetchUserTransactions();

        const personalExpense = personalTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const personalIncome = personalTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const personalByCategory = personalTransactions.reduce(
          (acc: any, t) => {
            if (t.type === 'expense') {
              acc[t.category] = (acc[t.category] || 0) + t.amount;
            }
            return acc;
          },
          {},
        );

        const familyExpense = familyTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const familyByCategory = familyTransactions.reduce((acc: any, t) => {
          if (t.type === 'expense') {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
          }
          return acc;
        }, {});

        const byMember = familyTransactions.reduce((acc: any, t) => {
          if (t.type === 'expense') {
            acc[t.userId] = (acc[t.userId] || 0) + t.amount;
          }
          return acc;
        }, {});

        const memberIds = Object.keys(byMember);
        const memberNames: { [key: string]: string } = {};

        await Promise.all(
          memberIds.map(async uid => {
            const userDoc = await firestore()
              .collection('users')
              .doc(uid)
              .get();
            memberNames[uid] =
              userDoc.data()?.displayName || uid;
          }),
        );

        const byMemberNamed = Object.entries(byMember).reduce(
          (acc: any, [uid, amount]) => {
            const name = memberNames[uid] || uid;
            acc[name] = amount;
            return acc;
          },
          {},
        );

        const now = new Date();
        const dataSummary = `
          DỮ LIỆU THÁNG ${now.getMonth() + 1}/${now.getFullYear()}:

          CÁ NHÂN:
          - Tổng chi: ${personalExpense.toLocaleString('vi-VN')}đ
          - Tổng thu: ${personalIncome.toLocaleString('vi-VN')}đ
          - Chi theo danh mục: ${JSON.stringify(personalByCategory)}
          - Số giao dịch: ${personalTransactions.length}

          ${
            familyId
              ? `GIA ĐÌNH:
          - Tổng chi chung: ${familyExpense.toLocaleString('vi-VN')}đ
          - Chi theo danh mục: ${JSON.stringify(familyByCategory)}
          - Chi theo thành viên: ${JSON.stringify(byMemberNamed)}
          - Số giao dịch chung: ${familyTransactions.length}`
              : 'CHƯA CÓ NHÓM GIA ĐÌNH'
          }
        `;

        result = await callGeminiWithRetry(
          nimoAnalyticsModel,
          `${dataSummary}\n\nCâu hỏi: ${messageText}`,
        );
      } else {
        result = await callGeminiWithRetry(nimoModel, messageText);
      }

      const rawText = result.response.text();
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      let replyText = cleaned;

      try {
        const raw = JSON.parse(cleaned);
        const data = validateNimoResponse(raw);

        if (data.isTransaction) {
          navigation.navigate('AddTransactionModal', { nimo: data });
        }
        replyText = data.reply;
      } catch {
        replyText =
          cleaned.length < 300
            ? cleaned
            : 'Nimo chưa xử lý được, bạn thử hỏi lại nhé!';
      }

      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'model',
        text: replyText,
      };
      await ChatService.addMessage(userId, botMsg);
    } catch (error: any) {
      console.error('Lỗi khi gọi Nimo:', error);
      const isQuota =
        error?.message?.includes('429') || error?.message?.includes('quota');
      const is503 = error?.message?.includes('503');
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'model',
        text: isQuota
          ? 'Nimo đã dùng hết quota hôm nay rồi 😢'
          : is503
          ? 'Server Gemini đang bận, thử lại sau nhé! 😓'
          : 'Nimo đang bị mất kết nối xíu, thử lại sau nha! 🤕',
      };
      await ChatService.addMessage(userId, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Trợ lý ảo Nimo"
        onBack={() => navigation.goBack()}
        rightIcon="delete"
        onRightPress={handleReset}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.chatArea}
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length <= 1 && (
            <>
              <View
                style={[
                  styles.greetingCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.greetingHeader}>
                  <View
                    style={[
                      styles.botAvatarSmall,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Icon name="robot-happy" size={20} color="#fff" />
                  </View>
                  <Text style={[styles.greetingTitle, { color: colors.text }]}>
                    Chào bạn, Nimo đã sẵn sàng!
                  </Text>
                </View>
                <Text
                  style={[styles.greetingText, { color: colors.textSecondary }]}
                >
                  "Nimo luôn theo sát ví tiền của bạn – có gì bất thường, mình
                  sẽ báo liền!"
                </Text>
              </View>

              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => sendMessage(item)}
                  >
                    <Text
                      style={[styles.suggestionText, { color: colors.text }]}
                    >
                      {item}
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {messages.map((msg, index) => {
            if (msg.id === 1 && messages.length > 1) return null;

            return (
              <View
                key={msg.id || index}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                {msg.role === 'model' && (
                  <View
                    style={[
                      styles.botAvatar,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Icon name="robot-happy" size={24} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    styles.messageContent,
                    msg.role === 'user'
                      ? {
                          backgroundColor: colors.primary,
                          borderBottomRightRadius: 4,
                        }
                      : {
                          backgroundColor: colors.surface,
                          borderBottomLeftRadius: 4,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                  ]}
                >
                  <Text
                    style={[
                      msg.role === 'user'
                        ? styles.userText
                        : { color: colors.text, fontSize: 15, lineHeight: 22 },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Nimo đang trả lời...
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? colors.background : '#f0f0f0',
                color: colors.text,
              },
            ]}
            placeholder="Nhập nội dung..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={() => sendMessage(inputText)}
            disabled={loading || !inputText.trim()}
          >
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default NimoScreen;
