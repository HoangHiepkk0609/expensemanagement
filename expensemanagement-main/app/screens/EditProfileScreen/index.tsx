import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../theme/themeContext';
import styles from './styles';

const AVATAR_OPTIONS = [
  { id: '1', emoji: '😊', color: '#FF69B4' },
  { id: '2', emoji: '😎', color: '#4CAF50' },
  { id: '3', emoji: '🤑', color: '#FFC107' },
  { id: '4', emoji: '🚀', color: '#2196F3' },
  { id: '5', emoji: '💰', color: '#FF6B6B' },
  { id: '6', emoji: '🎯', color: '#9C27B0' },
  { id: '7', emoji: '⚡', color: '#FF9800' },
  { id: '8', emoji: '🌟', color: '#00BCD4' },
  { id: '9', emoji: '🎨', color: '#E91E63' },
  { id: '10', emoji: '🎭', color: '#3F51B5' },
  { id: '11', emoji: '🔥', color: '#F44336' },
  { id: '12', emoji: '💎', color: '#00E5FF' },
  { id: '13', emoji: '🎪', color: '#FF4081' },
  { id: '14', emoji: '🌈', color: '#7C4DFF' },
  { id: '15', emoji: '🦄', color: '#EA80FC' },
  { id: '16', emoji: '🐱', color: '#FFB74D' },
  { id: '17', emoji: '🐶', color: '#A1887F' },
  { id: '18', emoji: '🐼', color: '#90A4AE' },
];

const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const user = auth().currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.photoURL) {
      try {
        const parsed = JSON.parse(user.photoURL);
        if (parsed.emoji && parsed.color) {
          setSelectedAvatar(parsed);
        } else {
          setSelectedAvatar(AVATAR_OPTIONS[0]);
        }
      } catch {
        setSelectedAvatar(AVATAR_OPTIONS[0]);
      }
    } else {
      setSelectedAvatar(AVATAR_OPTIONS[0]);
    }
  }, [user?.photoURL]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên hiển thị');
      return;
    }

    setLoading(true);
    try {
      await user?.updateProfile({
        displayName: displayName.trim(),
        photoURL: JSON.stringify(selectedAvatar),
      });

      await firestore().collection('users').doc(user?.uid).update({
        displayName: displayName.trim(),
      });

      const userDoc = await firestore()
        .collection('users')
        .doc(user?.uid)
        .get();
      const familyId = userDoc.data()?.familyId;

      if (familyId) {
        await firestore()
          .collection('families')
          .doc(familyId)
          .collection('members')
          .doc(user?.uid)
          .update({
            displayName: displayName.trim(),
            avatarUrl: JSON.stringify(selectedAvatar),
          });
      }

      Alert.alert('Thành công', 'Cập nhật thông tin thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', `Không thể cập nhật: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = (avatar: any) => {
    setSelectedAvatar(avatar);
    setShowAvatarPicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Thông tin cá nhân" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={() => setShowAvatarPicker(true)}
            style={styles.avatarContainer}
          >
            {selectedAvatar ? (
              <View
                style={[
                  styles.avatarLarge,
                  { backgroundColor: selectedAvatar.color },
                ]}
              >
                <Text style={styles.emojiText}>{selectedAvatar.emoji}</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.avatarLarge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Icon name="account" size={60} color="#fff" />
              </View>
            )}

            <View
              style={[
                styles.changeAvatarButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <Icon name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            Nhấn để đổi avatar
          </Text>
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Tên hiển thị
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon
                name="account-circle"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nhập tên của bạn"
                placeholderTextColor={colors.textSecondary}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View
              style={[
                styles.inputContainer,
                styles.inputDisabled,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="email" size={20} color={colors.textSecondary} />
              <Text style={[styles.inputText, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Email không thể thay đổi
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              ID người dùng
            </Text>
            <View
              style={[
                styles.inputContainer,
                styles.inputDisabled,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="identifier" size={20} color={colors.textSecondary} />
              <Text
                style={[styles.inputText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {user?.uid?.slice(0, 20)}...
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.changePasswordButton, { borderColor: colors.border }]}
          onPress={() => {
            Alert.alert(
              'Đổi mật khẩu',
              'Email đặt lại mật khẩu sẽ được gửi đến ' + user?.email,
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Gửi email',
                  onPress: async () => {
                    try {
                      await auth().sendPasswordResetEmail(user?.email || '');
                      Alert.alert(
                        'Thành công',
                        'Vui lòng kiểm tra email để đặt lại mật khẩu',
                      );
                    } catch (error: any) {
                      Alert.alert('Lỗi', error.message);
                    }
                  },
                },
              ],
            );
          }}
        >
          <Icon name="lock-reset" size={20} color={colors.text} />
          <Text style={[styles.changePasswordText, { color: colors.text }]}>
            Đổi mật khẩu
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAvatarPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Chọn Avatar
            </Text>

            <ScrollView contentContainerStyle={styles.avatarGrid}>
              {AVATAR_OPTIONS.map(avatar => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    { backgroundColor: avatar.color },
                    selectedAvatar?.id === avatar.id &&
                      styles.avatarOptionSelected,
                  ]}
                  onPress={() => handleSelectAvatar(avatar)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                  {selectedAvatar?.id === avatar.id && (
                    <View style={styles.selectedBadge}>
                      <Icon name="check-circle" size={24} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.border }]}
              onPress={() => setShowAvatarPicker(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Đóng
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditProfileScreen;
