import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Lấy chiều rộng màn hình để tính toán kích thước cố định
const { width } = Dimensions.get('window');

const MoniScreen = () => {
  // Mảng dữ liệu cho các nút gợi ý chat
  const chatPrompts = [
    { text: 'Nhập chi tiêu? Chat là xong', icon: 'thumb-up-outline' },
    { text: 'Moni ơi, tiền tôi bay đi đâu rồi?', icon: 'emoticon-wink-outline' },
    { text: 'Tôi có đang tiêu tiền theo cảm xúc?', icon: 'star-outline' },
  ];

  // Mảng dữ liệu cho phần "Dành cho bạn"
  const forYouCards = [
    { title: 'Moni làm được những gì?', icon: 'information-outline', color: '#e0c3fc' },
    { title: 'Test tài chính cá nhân 60s?', icon: 'trophy-outline', color: '#fddb92' },
    { title: 'Lập mục tiêu chi tiêu?', icon: 'target', color: '#f6d365' },
  ];

  const handlePromptPress = (prompt: any) => {
    // Logic xử lý khi người dùng nhấn vào nút gợi ý
    console.log(`User selected prompt: ${prompt}`);
    // Bạn có thể thêm Navigation để chuyển sang màn hình nhập liệu chi tiêu ở đây
  };

  return (
    <View style={styles.container}>
      {/* Header (Mặc dù Tab Navigator đã ẩn header, đây là header nội dung) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Moni</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="bell-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="home-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Khung Chào Mừng */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            {/* Moni Avatar/Icon */}
            <View style={styles.moniAvatar}>
              <Icon name="robot-outline" size={30} color="#fff" />
            </View>
            <Text style={styles.welcomeText}>
              Chào bạn, Moni đã sẵn sàng hỗ trợ bạn rồi đây ✨
            </Text>
          </View>

          {/* Quote */}
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>
              <Text style={{fontWeight: '900', fontSize: 20, color: '#333'}}>“</Text> Moni luôn theo sát ví tiền của bạn – có gì bất thường, mình sẽ báo liền!
            </Text>
          </View>
        </View>

        {/* Các nút gợi ý chat */}
        <View style={styles.promptsContainer}>
          {chatPrompts.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.promptButton}
              onPress={() => handlePromptPress(item.text)}
            >
              <Text style={styles.promptText}>{item.text}</Text>
              <Icon name="chevron-right" size={20} color="#888" />
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Phần Dành cho bạn */}
        <View style={styles.forYouSection}>
          <Text style={styles.forYouTitle}>Dành cho bạn</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forYouScroll}>
            {forYouCards.map((card, index) => (
              <TouchableOpacity key={index} style={[styles.forYouCard, { backgroundColor: card.color }]}>
                <Icon name={card.icon} size={24} color="#333" style={{ marginBottom: 4 }} />
                <Text style={styles.forYouCardTitle}>{card.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Input Chat cố định */}
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Nhập nội dung..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9', // Nền màu hồng nhạt/trắng
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Đủ khoảng trống cho input chat cố định
  },
  // --- Welcome Card ---
  welcomeCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    // Giả lập gradient hồng/tím
    borderWidth: 1,
    borderColor: '#f0e0f5', 
    shadowColor: '#f7c3dc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  moniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff69b4', // Màu Moni
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quoteContainer: {
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f7c3dc',
    marginBottom: 5,
  },
  quoteText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  // --- Prompts ---
  promptsContainer: {
    marginTop: 20,
  },
  promptButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  promptText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  // --- For You Section ---
  forYouSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  forYouTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  forYouScroll: {
    // Đảm bảo scroll ngang
  },
  forYouCard: {
    width: width * 0.4, // Khoảng 40% chiều rộng màn hình
    padding: 15,
    borderRadius: 12,
    marginRight: 12,
    height: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  forYouCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  // --- Chat Input Fixed ---
  chatInputContainer: {
    position: 'absolute',
    bottom: 0, 
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    // Đảm bảo input nằm trên Tab Bar, trừ đi chiều cao Tab Bar (70) + paddingBottom (10) = 80
    // Trong React Native, nó sẽ tự động đặt phía trên TabBar nếu nó là một phần của màn hình.
    // Dùng marginBottom để tạo khoảng trống nếu cần.
  },
  chatInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff69b4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MoniScreen;
