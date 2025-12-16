import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/themeContext'; // ✅ Import useTheme

const GEMINI_API_KEY = "AIzaSyCpfAXfGmAvEosiOu5693ZH73NQDVZOGww"; 

const INITIAL_MESSAGE = {
  id: 1,
  role: 'model',
  text: 'Chào bạn, Nimo đã sẵn sàng hỗ trợ bạn rồi đây ✨\n\n"Nimo luôn theo sát ví tiền của bạn – có gì bất thường, mình sẽ báo liền!"'
};

const NimoScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme(); // ✅ Lấy colors
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
    });
    return () => {
      navigation.setOptions({
        tabBarStyle: { display: 'flex' },
      });
    };
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setMessages([INITIAL_MESSAGE]);
        setInputText('');
      };
    }, [])
  );

  const handleReset = () => {
    Alert.alert(
      "Xóa đoạn chat", 
      "Bạn muốn bắt đầu cuộc trò chuyện mới?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đồng ý", 
          onPress: () => {
            setMessages([INITIAL_MESSAGE]);
            setInputText('');
          }
        }
      ]
    );
  };

  const handleTransaction = (data: any) => {
    navigation.navigate('AddTransaction', {
      nimoData: {
        amount: data.amount,
        category: data.category,
        note: data.note,
        date: new Date().toISOString(),
        type: 'expense'
      }
    });
  };

  const suggestions = [
    "Nhập chi tiêu? Chat là xong",
    "Nimo ơi, tiền tôi bay đi đâu rồi?",
    "Tôi có đang tiêu tiền theo cảm xúc?",
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        Bạn tên là Nimo, một trợ lý tài chính cá nhân vui vẻ, hài hước và thông minh.
        Nhiệm vụ của bạn là giúp người dùng quản lý chi tiêu.
        
        Người dùng hỏi: "${messageText}"
        
        Hãy trả lời ngắn gọn (dưới 100 từ), thân thiện, dùng emoji. 
        Nếu người dùng muốn nhập chi tiêu (ví dụ: "vừa ăn phở 50k"), hãy trích xuất thông tin và xác nhận lại.

        Danh sách danh mục của tôi: "Ăn uống", "Mua sắm", "Di chuyển", "Người thân", "Lương", "Thưởng", "Kinh doanh".
        Hãy cố gắng map hành động vào các danh mục này. Nếu không khớp, hãy tự bịa ra một cái tên ngắn gọn.

        Ví dụ user nhắn: "Đổ xăng 50k" ->
        { 
          "isTransaction": true, 
          "amount": 50000, 
          "category": "Di chuyển", 
          "note": "Đổ xăng", 
          "reply": "Okela, đã mở màn hình nhập tiền xăng nha! ⛽" 
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const data = JSON.parse(text);

        if (data.isTransaction) {
           console.log("Phát hiện giao dịch, đang chuyển màn hình...", data);
           
           navigation.navigate('AddTransactionModal', { 
             nimoData: data 
           });
        }

        const botMsg = { id: Date.now() + 1, role: 'model', text: data.reply || text };
        setMessages(prev => [...prev, botMsg]);

      } catch (parseError) {
        console.log("Lỗi đọc JSON:", parseError);
        const botMsg = { id: Date.now() + 1, role: 'model', text: text };
        setMessages(prev => [...prev, botMsg]);
      }

    } catch (error: any) {
      console.error("Lỗi API:", error);
      
      let errorMessage = "Nimo đang bị mất kết nối xíu, thử lại sau nha! 🤕";
      
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorMessage = "Nimo đã dùng hết quota hôm nay rồi 😢\n\nBạn có thể:\n• Đợi 1 phút rồi thử lại\n• Hoặc tạo API key mới tại:\naistudio.google.com/app/apikey";
      }
      
      const errorMsg = { 
        id: Date.now() + 1, 
        role: 'model', 
        text: errorMessage 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Trợ lý Nimo</Text>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <Icon name="refresh" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          style={styles.chatArea} 
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting Card - Chỉ hiện khi mới vào */}
          {messages.length <= 1 && (
            <>
              <View style={[styles.greetingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.greetingHeader}>
                  <View style={[styles.botAvatarSmall, { backgroundColor: colors.primary }]}>
                    <Icon name="robot-happy" size={20} color="#fff" />
                  </View>
                  <Text style={[styles.greetingTitle, { color: colors.text }]}>Chào bạn, Nimo đã sẵn sàng!</Text>
                </View>
                <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
                  "Nimo luôn theo sát ví tiền của bạn – có gì bất thường, mình sẽ báo liền!"
                </Text>
              </View>

              {/* Suggestions */}
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.suggestionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => sendMessage(item)}
                  >
                    <Text style={[styles.suggestionText, { color: colors.text }]}>{item}</Text>
                    <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Messages */}
          {messages.map((msg) => {
             if (msg.id === 1 && messages.length > 1) return null; 

             return (
              <View key={msg.id} style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.botBubble
              ]}>
                {msg.role === 'model' && (
                  <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                    <Icon name="robot-happy" size={24} color="#fff" />
                  </View>
                )}
                <View style={[
                  styles.messageContent,
                  msg.role === 'user' 
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border }
                ]}>
                  <Text style={[
                    msg.role === 'user' 
                      ? styles.userText 
                      : { color: colors.text, fontSize: 15, lineHeight: 22 }
                  ]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
             );
          })}

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Nimo đang trả lời...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: colors.surface, 
            borderTopColor: colors.border 
          }
        ]}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDarkMode ? colors.background : '#f0f0f0',
                color: colors.text
              }
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
          >
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold'
  },
  headerIcons: { 
    flexDirection: 'row'
  },
  headerButton: {
    padding: 8,
  },
  
  chatArea: { 
    flex: 1, 
    padding: 15 
  },

  greetingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5, 
    elevation: 2
  },
  greetingHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  botAvatarSmall: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  greetingTitle: { 
    fontSize: 16, 
    fontWeight: 'bold'
  },
  greetingText: { 
    fontSize: 14, 
    lineHeight: 20, 
    fontStyle: 'italic' 
  },

  suggestionsContainer: { 
    marginBottom: 25 
  },
  suggestionItem: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  suggestionText: { 
    fontSize: 15, 
    fontWeight: '500' 
  },

  messageBubble: { 
    marginBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'flex-end' 
  },
  userBubble: { 
    justifyContent: 'flex-end' 
  },
  botBubble: { 
    justifyContent: 'flex-start' 
  },
  botAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 10 
  },
  messageContent: { 
    maxWidth: '80%', 
    padding: 12, 
    borderRadius: 16 
  },
  userText: { 
    color: '#fff', 
    fontSize: 15 
  },

  loadingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 10,
    marginBottom: 20 
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14
  },

  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  input: {
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 44, 
    height: 44, 
    borderRadius: 22,
    justifyContent: 'center', 
    alignItems: 'center',
  },
});

export default NimoScreen;