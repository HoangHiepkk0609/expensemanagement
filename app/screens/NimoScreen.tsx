import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/themeContext';
import ChatService, { ChatMessage } from '../services/ChatService'; 

const GEMINI_API_KEY = "AIzaSyCit9J3FKe-v0iXaBGG00VCvHIJQAkV1c0"; 


const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: 'model',
  text: 'Chào bạn, Nimo đã sẵn sàng hỗ trợ bạn rồi đây ✨\n\n"Nimo luôn theo sát ví tiền của bạn – có gì bất thường, mình sẽ báo liền!"'
};

const NimoScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);


  React.useLayoutEffect(() => {
    navigation.setOptions({ tabBarStyle: { display: 'none' } });
    return () => { navigation.setOptions({ tabBarStyle: { display: 'flex' } }); };
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = ChatService.subscribeToChat((firestoreMessages) => {
      if (firestoreMessages && firestoreMessages.length > 0) {
        setMessages(firestoreMessages);
      } else {
     
        setMessages([INITIAL_MESSAGE]);
      }
      
  
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, []);

  const handleReset = () => {
    Alert.alert(
      "Xóa đoạn chat", 
      "Toàn bộ lịch sử trò chuyện sẽ bị xóa vĩnh viễn?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đồng ý", 
          style: 'destructive',
          onPress: async () => {
            await ChatService.clearChat();
            setMessages([INITIAL_MESSAGE]);
            setInputText('');
          }
        }
      ]
    );
  };

  const suggestions = [
    "Nhập chi tiêu? Chat là xong",
    "Nimo ơi, tiền tôi bay đi đâu rồi?",
    "Tôi có đang tiêu tiền theo cảm xúc?",
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;


    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: messageText };
    
 
    await ChatService.addMessage(userMsg);
    
    setInputText('');
    setLoading(true);

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
       
           navigation.navigate('AddTransactionModal', { nimoData: data });
        }


        const botMsg: ChatMessage = { id: Date.now() + 1, role: 'model', text: data.reply || text };
        

        await ChatService.addMessage(botMsg);

      } catch (parseError) {

        const botMsg: ChatMessage = { id: Date.now() + 1, role: 'model', text: text };
        await ChatService.addMessage(botMsg);
      }

    } catch (error: any) {
      console.error("Lỗi API:", error);
      let errorMessage = "Nimo đang bị mất kết nối xíu, thử lại sau nha! 🤕";
      
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorMessage = "Nimo đã dùng hết quota hôm nay rồi 😢";
      }
      

      const errorMsg: ChatMessage = { id: Date.now() + 1, role: 'model', text: errorMessage };
      await ChatService.addMessage(errorMsg); 
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? colors.surface : '#FFD6E8'}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Trợ lý Nimo</Text>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <Icon name="trash-can-outline" size={24} color={colors.text} />
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
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
     
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

 
          {messages.map((msg, index) => {

             if (msg.id === 1 && messages.length > 1) return null; 

             return (
              <View key={msg.id || index} style={[
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

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Nimo đang trả lời...
              </Text>
            </View>
          )}
        </ScrollView>

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