import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Family, FamilyMember } from '../types/family';

export const deleteFamily = async (familyId: string): Promise<void> => {
  const db = firestore();
  const familyRef = db.collection('families').doc(familyId);
  const membersRef = familyRef.collection('members');

  try {
    const membersSnapshot = await membersRef.get();

    const batch = db.batch();

    membersSnapshot.docs.forEach(doc => {
      const userId = doc.id;
      const userRef = db.collection('users').doc(userId);

      batch.update(userRef, {
        familyId: firestore.FieldValue.delete(),
      });

      batch.delete(doc.ref);
    });

    batch.update(familyRef, {
      status: 'deleted',
      deletedAt: firestore.FieldValue.serverTimestamp(),
      inviteCode: firestore.FieldValue.delete(),
    });

    await batch.commit();
  } catch (error: any) {
    console.error('Lỗi Batch Write khi giải tán nhóm:', error);
    throw new Error('Không thể giải tán nhóm lúc này. Vui lòng thử lại sau.');
  }
};

export const transferFamilyOwnership = async (
  familyId: string,
  currentOwnerId: string,
  newOwnerId: string,
): Promise<void> => {
  const db = firestore();

  const familyRef = db.collection('families').doc(familyId);

  const currentOwnerRef = familyRef.collection('members').doc(currentOwnerId);
  const newOwnerRef = familyRef.collection('members').doc(newOwnerId);

  try {
    await db.runTransaction(async transaction => {
      const familyDoc = await transaction.get(familyRef);
      if (!familyDoc.exists) {
        throw new Error('Không tìm thấy thông tin nhóm gia đình!');
      }

      transaction.update(familyRef, {
        ownerId: newOwnerId,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(currentOwnerRef, { role: 'member' });

      transaction.update(newOwnerRef, { role: 'owner' });

      const currentOwnerUserRef = db.collection('users').doc(currentOwnerId);
      const newOwnerUserRef = db.collection('users').doc(newOwnerId);
      transaction.update(currentOwnerUserRef, { role: 'member' });
      transaction.update(newOwnerUserRef, { role: 'owner' });

      console.log('Transaction hoàn thành'); 
      console.log('currentOwnerId:', currentOwnerId);
      console.log('newOwnerId:', newOwnerId);
    });
  } catch (error: any) {
    console.error('Lỗi Transaction:', error);
    console.error('Lỗi Transaction khi chuyển quyền:', error);
    throw new Error(
      'Chuyển quyền thất bại. Vui lòng kiểm tra lại kết nối mạng.',
    );
  }
};

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
};

export const createFamily = async (
  familyName: string,
): Promise<{ familyId: string; inviteCode: string }> => {
  const currentUser = auth().currentUser;

  if (!currentUser) throw new Error('Chưa đăng nhập');

  const userDoc = await firestore()
    .collection('users')
    .doc(currentUser.uid)
    .get();

  if (userDoc.data()?.familyId) {
    throw new Error('Bạn đã thuộc một nhóm gia đình rồi!');
  }

  const inviteCode = generateInviteCode();
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  const familyRef = firestore().collection('families').doc();
  const familyId = familyRef.id;

  const batch = firestore().batch();

  batch.set(familyRef, {
    familyId,
    name: familyName.trim(),
    ownerId: currentUser.uid,
    inviteCode,
    inviteCodeExpiredAt: firestore.Timestamp.fromDate(expiredAt),
    totalBalance: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  const memberRef = familyRef.collection('members').doc(currentUser.uid);
  batch.set(memberRef, {
    userId: currentUser.uid,
    displayName: currentUser.displayName ?? 'Chủ hộ',
    avatarUrl: currentUser.photoURL ?? null,
    role: 'owner',
    joinedAt: firestore.FieldValue.serverTimestamp(),
    totalContributed: 0,
    totalSpent: 0,
  });

  const userRef = firestore().collection('users').doc(currentUser.uid);
  batch.update(userRef, { familyId, role: 'owner' });

  await batch.commit();
  return { familyId, inviteCode };
};

export const joinFamilyByCode = async (
  code: string,
): Promise<{ familyId: string; familyName: string }> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Chưa đăng nhập');

  const userDoc = await firestore()
    .collection('users')
    .doc(currentUser.uid)
    .get();

  if (userDoc.data()?.familyId) {
    throw new Error('Bạn đã thuộc một nhóm gia đình rồi!');
  }

  const snapshot = await firestore()
    .collection('families')
    .where('inviteCode', '==', code.toUpperCase().trim())
    .limit(1)
    .get();

  if (snapshot.empty) throw new Error('Mã mời không hợp lệ!');

  const familyDoc = snapshot.docs[0];
  const familyData = familyDoc.data() as Family;

  const now = firestore.Timestamp.now();
  if (familyData.inviteCodeExpiredAt.seconds < now.seconds) {
    throw new Error('Mã mời đã hết hạn! Hãy xin mã mới từ chủ hộ.');
  }

  const familyId = familyDoc.id;
  const batch = firestore().batch();

  const memberRef = familyDoc.ref.collection('members').doc(currentUser.uid);
  batch.set(memberRef, {
    userId: currentUser.uid,
    displayName: currentUser.displayName ?? 'Thành viên',
    avatarUrl: currentUser.photoURL ?? null,
    role: 'member',
    joinedAt: firestore.FieldValue.serverTimestamp(),
    totalContributed: 0,
    totalSpent: 0,
  });

  const userRef = firestore().collection('users').doc(currentUser.uid);
  batch.update(userRef, { familyId, role: 'member' });

  await batch.commit();
  return { familyId, familyName: familyData.name };
};

export const getFamilyInfo = async (familyId: string): Promise<Family> => {
  const doc = await firestore().collection('families').doc(familyId).get();
  if (!doc.exists) throw new Error('Không tìm thấy nhóm gia đình!');

  const data = doc.data();
  if (!data) throw new Error('Dữ liệu nhóm gia đình bị trống!');

  return { id: doc.id, ...doc.data() } as unknown as Family;
};

export const getFamilyMembers = async (
  familyId: string,
): Promise<FamilyMember[]> => {
  const snapshot = await firestore()
    .collection('families')
    .doc(familyId)
    .collection('members')
    .orderBy('joinedAt', 'asc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as unknown as FamilyMember[];
};

export const refreshInviteCode = async (familyId: string): Promise<string> => {
  const newCode = generateInviteCode();
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  await firestore()
    .collection('families')
    .doc(familyId)
    .update({
      inviteCode: newCode,
      inviteCodeExpiredAt: firestore.Timestamp.fromDate(expiredAt),
    });

  return newCode;
};

export const leaveFamily = async (familyId: string): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('Chưa đăng nhập');

  const userDoc = await firestore()
    .collection('users')
    .doc(currentUser.uid)
    .get();

  console.log('User data:', userDoc.data()); 
  console.log('Role hiện tại:', userDoc.data()?.role); 
  console.log('FamilyId:', userDoc.data()?.familyId);

  if (userDoc.data()?.role === 'owner') {
    throw new Error(
      'Chủ hộ không thể rời nhóm. Hãy chuyển quyền hoặc giải tán nhóm.',
    );
  }

  const batch = firestore().batch();

  const memberRef = firestore()
    .collection('families')
    .doc(familyId)
    .collection('members')
    .doc(currentUser.uid);
  batch.delete(memberRef);

  const userRef = firestore().collection('users').doc(currentUser.uid);
  batch.update(userRef, { familyId: null, role: null });

  await batch.commit();
};

export const removeMemberFromFamily = async (
  familyId: string,
  userId: string,
): Promise<void> => {
  const db = firestore();

  const batch = db.batch();

  const memberRef = db
    .collection('families')
    .doc(familyId)
    .collection('members')
    .doc(userId);
  batch.delete(memberRef);

  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, {
    familyId: null,
    role: null,
  });

  try {
    await batch.commit();
  } catch (error: any) {
    console.error('Lỗi khi xóa thành viên:', error);
    throw new Error('Không thể xóa thành viên. Vui lòng thử lại sau.');
  }
};
