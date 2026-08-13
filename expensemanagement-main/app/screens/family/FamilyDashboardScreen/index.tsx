import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../../components/AppHeader';
import { useAuth } from '../../../context/AuthContext';
import {
  deleteFamily,
  getFamilyInfo,
  getFamilyMembers,
  leaveFamily,
  refreshInviteCode,
  removeMemberFromFamily,
  transferFamilyOwnership,
} from '../../../services/familyService';
import { useTheme } from '../../../theme/themeContext';
import { Family, FamilyMember } from '../../../types/family';
import styles from './style';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};
export default function FamilyDashboardScreen({ navigation }: Props) {
  const { familyId, refreshFamilyId } = useAuth();
  const user = auth().currentUser;
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memberStats, setMemberStats] = useState<any>({});
  const [totalBudget, setTotalBudget] = useState(0);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );
  const [menuVisible, setMenuVisible] = useState(false);
  const { colors } = useTheme();

  const handleTransferOwnership = () => {
    const eligibleMembers = members.filter(m => m.userId !== user?.uid);

    console.log('User đang đăng nhập:', user?.uid);
    console.log(
      'Danh sách eligible:',
      eligibleMembers.map(m => ({ userId: m.userId, name: m.displayName })),
    );

    if (eligibleMembers.length === 0) {
      Alert.alert(
        'Thông báo',
        'Nhóm hiện không có thành viên nào khác để chuyển quyền.',
      );
      return;
    }

    Alert.alert(
      'Chuyển quyền Chủ hộ',
      `Bạn muốn chuyển quyền cho ai? (Tính năng này cần UI Modal để chọn thành viên)`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tiếp tục',
          onPress: () => {
            const newOwner = eligibleMembers[0];
            executeTransfer(newOwner.userId, newOwner.displayName);
          },
        },
      ],
    );
  };

  const executeTransfer = async (newOwnerId: string, newOwnerName: string) => {
    if (!familyId || !user?.uid) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng hoặc nhóm.');
      return;
    }

    Alert.alert(
      'Xác nhận chuyển quyền',
      `Bạn có chắc chắn muốn chuyển quyền Chủ hộ cho ${newOwnerName}? Bạn sẽ trở thành thành viên bình thường.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: async () => {
            try {
              await transferFamilyOwnership(familyId, user.uid, newOwnerId);
              await handleRefresh();
              Alert.alert('Thành công', 'Đã chuyển quyền Chủ hộ.');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message);
            }
          },
        },
      ],
    );
  };

  const handleDisbandFamily = () => {
    if (!familyId) {
      Alert.alert('Lỗi', 'Không tìm thấy mã nhóm để giải tán.');
      return;
    }

    const currentFamilyId = familyId;

    Alert.alert(
      'CẢNH BÁO: Giải tán nhóm',
      'Hành động này sẽ xóa vĩnh viễn nhóm và toàn bộ dữ liệu chi tiêu chung. Các thành viên sẽ bị đăng xuất khỏi nhóm. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Giải tán',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFamily(currentFamilyId);
              await refreshFamilyId();
              Alert.alert('Thành công', 'Nhóm gia đình đã được giải tán.', [
                {
                  text: 'OK',
                  onPress: () => navigation.replace('Profile'),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message);
            }
          },
        },
      ],
    );
  };

  const fetchFamilyData = useCallback(async () => {
    if (!familyId) return;
    try {
      const [familyInfo, familyMembers] = await Promise.all([
        getFamilyInfo(familyId),
        getFamilyMembers(familyId),
      ]);
      setFamily(familyInfo);
      setMembers(familyMembers);

      const stats: any = {};
      let total = 0;
      familyMembers.forEach(member => {
        stats[member.userId] = {
          chi: member.totalSpent ?? 0,
          dong: member.totalContributed ?? 0,
        };
        total += (member.totalContributed ?? 0) - (member.totalSpent ?? 0);
      });
      setMemberStats(stats);
      setTotalBudget(total);
      
    } catch (error: any) {
      console.error('Load family data error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin nhóm gia đình');
    }
  }, [familyId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFamilyData();
    setRefreshing(false);
  };

  const handleShareInviteCode = async () => {
    if (!family?.inviteCode) return;

    try {
      await Share.share({
        message: `🏠 Tham gia nhóm gia đình "${family.name}"!\n\nMã mời: ${family.inviteCode}\n\nTải app và nhập mã này để tham gia nhóm quản lý chi tiêu chung gia đình.`,
        title: 'Mời tham gia nhóm gia đình',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleRefreshInviteCode = async () => {
    if (!familyId || !family) return;

    Alert.alert(
      'Làm mới mã mời',
      'Mã mời cũ sẽ không còn sử dụng được. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Làm mới',
          style: 'destructive',
          onPress: async () => {
            try {
              const newCode = await refreshInviteCode(familyId);
              setFamily(prev =>
                prev ? { ...prev, inviteCode: newCode } : null,
              );
              Alert.alert('Thành công', `Mã mời mới: ${newCode}`);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message);
            }
          },
        },
      ],
    );
  };

  const handleLeaveFamily = async () => {
    if (!familyId) return;

    Alert.alert(
      'Rời nhóm gia đình',
      'Bạn có chắc chắn muốn rời khỏi nhóm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveFamily(familyId);
              await refreshFamilyId();
              Alert.alert('Thành công', 'Đã rời khỏi nhóm gia đình', [
                {
                  text: 'OK',
                  onPress: () => navigation.replace('Profile'),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message);
            }
          },
        },
      ],
    );
  };

  const handleRemoveMember = (userId: string, displayName: string) => {
    if (!family) return;
    Alert.alert(
      'Xóa thành viên',
      `Bạn có chắc muốn xóa ${displayName} khỏi nhóm?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberFromFamily(family.id, userId);
              handleRefresh();
            } catch (error) {
              console.error('Lỗi xóa thành viên:', error);

              Alert.alert('Lỗi', 'Không thể xóa thành viên. Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  };

  const parseAvatar = (avatarUrl: string | null) => {
    try {
      const parsed = JSON.parse(avatarUrl || '');
      if (parsed.emoji && parsed.color) return parsed;
    } catch {}
    return null;
  };

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await fetchFamilyData();
      setLoading(false);
    };
    initLoad();
  }, [fetchFamilyData]);

  useEffect(() => {
    if (!familyId) return;

    const unsubscribe = firestore()
      .collection('families')
      .doc(familyId)
      .collection('members')
      .orderBy('joinedAt', 'asc')
      .onSnapshot(snapshot => {
        const updatedMembers = snapshot.docs.map(doc => ({
          ...doc.data(),
        })) as unknown as FamilyMember[];
        setMembers(updatedMembers);
      });

    return () => unsubscribe();
  }, [familyId]);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Đang tải thông tin nhóm...
        </Text>
      </View>
    );
  }

  if (!family) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Không tìm thấy nhóm gia đình
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.navigate('FamilySetup')}
        >
          <Text style={styles.retryText}>Tạo hoặc tham gia nhóm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = family.ownerId === user?.uid;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <AppHeader
        title="Nhóm gia đình"
        onBack={() => navigation.navigate('Profile')}
      />
      <View style={[styles.familyCard, { backgroundColor: colors.surface }]}>
        <View style={styles.familyHeader}>
          <Icon name="home" size={60} color={colors.primary} />
          <Text style={styles.familyEmoji} />
          <View style={styles.familyInfo}>
            <Text style={[styles.familyName, { color: colors.text }]}>
              {family.name}
            </Text>
            <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
              {members.length} thành viên
            </Text>
          </View>
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerText}>Chủ hộ</Text>
            </View>
          )}
        </View>

        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Tổng ngân sách
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: totalBudget < 0 ? '#FF3B30' : '#4CAF50' },
            ]}
          >
            {totalBudget.toLocaleString('vi-VN')} đ
          </Text>
        </View>

        {isOwner && (
          <View style={styles.inviteSection}>
            <Text style={[styles.inviteLabel, { color: colors.textSecondary }]}>
              Mã mời nhóm
            </Text>
            <View style={styles.inviteCodeContainer}>
              <Text
                style={[
                  styles.inviteCode,
                  {
                    backgroundColor: colors.background,
                    color: colors.primary,
                  },
                ]}
              >
                {family.inviteCode}
              </Text>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareInviteCode}
              >
                <Text style={styles.shareText}>Chia sẻ</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.refreshCodeButton}
              onPress={handleRefreshInviteCode}
            >
              <Text
                style={[
                  styles.refreshCodeText,
                  { color: colors.textSecondary },
                ]}
              >
                Làm mới mã
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.membersCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Thành viên ({members.length})
        </Text>

        {members.map(member => {
          const userStat = memberStats[member.userId] || { chi: 0, dong: 0 };
          return (
            <View
              key={member.userId}
              style={[styles.memberItem, { borderBottomColor: colors.border }]}
            >
              {(() => {
                const avatar = parseAvatar(member.avatarUrl);
                return (
                  <View
                    style={[
                      styles.memberAvatar,
                      {
                        backgroundColor: avatar ? avatar.color : colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.memberAvatarText}>
                      {avatar
                        ? avatar.emoji
                        : member.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                );
              })()}

              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {member.displayName}
                  {member.userId === user?.uid && ' (Bạn)'}
                </Text>
                <Text
                  style={[styles.memberRole, { color: colors.textSecondary }]}
                >
                  {member.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}
                </Text>
              </View>

              <View style={styles.memberStats}>
                <Text style={styles.memberSpent}>
                  Chi: {userStat.chi.toLocaleString('vi-VN') || '0'}đ
                </Text>
                <Text style={styles.memberContrib}>
                  Đóng: {userStat.dong.toLocaleString('vi-VN') || '0'}đ
                </Text>
              </View>

              {/* Menu 3 chấm - chỉ hiện với chủ hộ, không hiện trên chính mình */}
              {isOwner && member.userId !== user?.uid && (
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => {
                    setSelectedMember(member);
                    setMenuVisible(true);
                  }}
                >
                  <Icon
                    name="dots-vertical"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Giải tán nhóm - chỉ chủ hộ */}
        {isOwner && (
          <TouchableOpacity
            style={[styles.disbandButton, { marginTop: 12 }]}
            onPress={handleDisbandFamily}
          >
            <Icon name="alert-box" size={20} color={colors.primary} />
            <Text style={styles.disbandText}>Giải tán nhóm</Text>
          </TouchableOpacity>
        )}

        {/* Rời nhóm - thành viên thường */}
        {!isOwner && (
          <TouchableOpacity
            style={[styles.leaveButton, { borderColor: '#ef4444' }]}
            onPress={handleLeaveFamily}
          >
            <Text style={styles.leaveText}>Rời nhóm gia đình</Text>
          </TouchableOpacity>
        )}

        {/* Modal menu 3 chấm */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View
              style={[styles.menuCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.menuMemberName, { color: colors.text }]}>
                {selectedMember?.displayName}
              </Text>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setMenuVisible(false);
                  handleTransferOwnership();
                }}
              >
                <Icon name="crown" size={20} color="#F59E0B" />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  Chuyển quyền Chủ hộ
                </Text>
              </TouchableOpacity>

              {/* Xóa thành viên */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  if (selectedMember) {
                    handleRemoveMember(
                      selectedMember.userId,
                      selectedMember.displayName,
                    );
                  }
                }}
              >
                <Icon name="delete" size={20} color="#EF4444" />
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
                  Xóa khỏi nhóm
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScrollView>
  );
}
