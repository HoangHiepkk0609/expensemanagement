import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';
import { Goal, useGoals } from '../../hook/useGoals';
import { useTheme } from '../../theme/themeContext';
import styles from './styles';

const GoalCard = ({ goal, onPress, onLongPress }: any) => {
  const percent =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;
  const isCompleted = percent >= 100;
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(goal.deadline).getTime() - new Date().getTime()) /
        (1000 * 3600 * 24),
    ),
  );

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={[styles.iconBox, { backgroundColor: goal.color + '20' }]}
          >
            <Icon
              name={goal.icon || 'flag-checkered'}
              size={24}
              color={goal.color}
            />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>{goal.title}</Text>
            <Text style={styles.subtitle}>
              {isCompleted ? '🎉 Đã hoàn thành' : `Còn ${daysLeft} ngày`}
            </Text>
          </View>
        </View>
        <Text style={styles.percentText}>{percent.toFixed(0)}%</Text>
      </View>
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percent}%`,
              backgroundColor: isCompleted ? '#4CAF50' : goal.color,
            },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.currentAmount}>
          {goal.currentAmount.toLocaleString('vi-VN')}đ
        </Text>
        <Text style={styles.targetAmount}>
          / {goal.targetAmount.toLocaleString('vi-VN')}đ
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const GoalsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const { userId, familyId, filterMode } = useAuth();
  const { goals, loading, setGoals } = useGoals();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contributeModal, setContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const [createModal, setCreateModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const MAX_AMOUNT = 1_000_000_000;

  const handleCreateGoal = async () => {
    if (!newGoalTitle || !newGoalTarget)
      return Alert.alert('Lỗi', 'Nhập đủ thông tin nha bạn!');

    if (parseInt(newGoalTarget) > MAX_AMOUNT) {
      return Alert.alert(
        'Lỗi',
        'Số tiền mục tiêu không được vượt quá 1 tỷ đồng',
      );
    }

    setIsSubmitting(true);

    try {
      const newGoalData = {
        title: newGoalTitle,
        targetAmount: parseInt(newGoalTarget),
        currentAmount: 0,
        deadline: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ).toISOString(),
        icon: 'piggy-bank',
        color: '#FF69B4',
        userId: userId,
        familyId: filterMode === 'family' ? familyId : null,
        isFamily: filterMode === 'family',
        createdAt: new Date().toISOString(),
      };

      const newDocRef = await firestore().collection('goals').add(newGoalData);

      setGoals((prevGoals: Goal[]) => [
        {
          id: newDocRef.id,
          ...newGoalData,
        } as Goal,
        ...prevGoals,
      ]);

      setCreateModal(false);
      setNewGoalTitle('');
      setNewGoalTarget('');

      setTimeout(() => {
        Alert.alert('Hay quá!', 'Đã lên xong mục tiêu mới! 🚀');
      }, 300);
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể tạo mục tiêu. Chi tiết: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribute = async () => {
    const amount = parseInt(contributeAmount);
    if (!amount || amount <= 0)
      return Alert.alert('Lỗi', 'Nhập số tiền hợp lệ');

    if (amount > MAX_AMOUNT) {
      return Alert.alert('Lỗi', 'Số tiền không được vượt quá 1 tỷ đồng');
    }

    setIsSubmitting(true);

    try {
      const batch = firestore().batch();

      const goalRef = firestore().collection('goals').doc(selectedGoal.id);
      batch.update(goalRef, {
        currentAmount: firestore.FieldValue.increment(amount),
      });

      const transRef = firestore().collection('transactions').doc();
      batch.set(transRef, {
        userId: userId,
        type: 'expense',
        amount: amount,
        category: 'Mục tiêu tài chính',
        note: `Góp quỹ: ${selectedGoal.title}`,
        date: new Date().toISOString(),
        familyId: filterMode === 'family' ? familyId : null,
        isFamily: filterMode === 'family',
        createdAt: new Date().toISOString(),
      });

      await batch.commit();

      setGoals((prevGoals: Goal[]) =>
        prevGoals.map((g: Goal) =>
          g.id === selectedGoal.id
            ? { ...g, currentAmount: (g.currentAmount || 0) + amount }
            : g,
        ),
      );

      setContributeModal(false);
      setContributeAmount('');

      setTimeout(() => {
        Alert.alert(
          'Hay quá!',
          `Đã nạp ${amount.toLocaleString('vi-VN')}đ vào quỹ.`,
        );
      }, 300);
    } catch {
      Alert.alert('Lỗi', 'Góp tiền thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = (goal: any) => {
    Alert.alert(
      'Cảnh báo đập ống heo! 🔨',
      goal.currentAmount > 0
        ? `Quỹ "${goal.title}" đang có ${goal.currentAmount.toLocaleString(
            'vi-VN',
          )}đ. Xóa mục tiêu này thì toàn bộ số tiền sẽ được HOÀN TRẢ lại vào ví của bạn nhé?`
        : 'Quỹ đang trống, bạn muốn xóa mục tiêu này chứ?',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: goal.currentAmount > 0 ? 'Xóa & Hoàn tiền' : 'Xóa luôn',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const batch = firestore().batch();

              const goalRef = firestore().collection('goals').doc(goal.id);
              batch.delete(goalRef);

              if (goal.currentAmount > 0) {
                const transRef = firestore().collection('transactions').doc();
                batch.set(transRef, {
                  userId: userId,
                  type: 'income',
                  amount: goal.currentAmount,
                  category: 'Hoàn tiền',
                  note: `Hoàn tiền hủy quỹ: ${goal.title}`,
                  date: new Date().toISOString(),
                  familyId: filterMode === 'family' ? familyId : null,
                  isFamily: filterMode === 'family',
                  createdAt: new Date().toISOString(),
                });
              }

              await batch.commit();

              setGoals((prevGoals: Goal[]) =>
                prevGoals.filter((g: Goal) => g.id !== goal.id),
              );

              setTimeout(() => {
                Alert.alert(
                  'Đã dọn dẹp xong! 🧹',
                  goal.currentAmount > 0
                    ? `Đã đập heo và hoàn lại ${goal.currentAmount.toLocaleString(
                        'vi-VN',
                      )}đ vào tổng tài sản!`
                    : 'Đã xóa mục tiêu thành công!',
                );
              }, 300);
            } catch (error: any) {
              Alert.alert('Lỗi', `Đập heo thất bại: ${error.message}`);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={`Mục tiêu ${filterMode === 'family' ? 'Gia đình' : 'Cá nhân'}`}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onPress={() => {
                const current = item.currentAmount || 0;
                const target = item.targetAmount || 0;

                if (current >= target && target > 0) {
                  Alert.alert(
                    'Hoàn thành rực rỡ! 🎉',
                    'Quỹ này đã thu đủ tiền rồi bạn ơi. Cất app đi ăn mừng thôi!',
                  );
                  return;
                }

                setSelectedGoal(item);
                setContributeModal(true);
              }}
              onLongPress={() => handleDeleteGoal(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>
              Chưa có mục tiêu nào. Bấm dấu + để tạo ngay!
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setCreateModal(true)}
      >
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={contributeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.modalTitle}>
              Góp tiền: {selectedGoal?.title}
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="Nhập số tiền muốn góp..."
              keyboardType="numeric"
              value={contributeAmount}
              onChangeText={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                if (Number(numericValue) > MAX_AMOUNT) return;
                setContributeAmount(numericValue);
              }}
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleContribute}
            >
              <Text style={styles.btnText}>Xác nhận nạp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 15 }}
              onPress={() => setContributeModal(false)}
            >
              <Text style={{ textAlign: 'center', color: '#888' }}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.modalTitle}>Tạo mục tiêu mới</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="Tên mục tiêu (VD: Đám cưới)..."
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="Số tiền đích (VD: 50000000)..."
              keyboardType="numeric"
              value={newGoalTarget}
              onChangeText={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                if (Number(numericValue) > MAX_AMOUNT) return;
                setNewGoalTarget(numericValue);
              }}
            />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleCreateGoal}
            >
              <Text style={styles.btnText}>Lưu Mục Tiêu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 15 }}
              onPress={() => setCreateModal(false)}
            >
              <Text style={{ textAlign: 'center', color: '#888' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Đang xử lý...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default GoalsScreen;
