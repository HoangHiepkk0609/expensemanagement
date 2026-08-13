import firestore from '@react-native-firebase/firestore';

export const createTransactionAPI = async (transactionData: any) => {
  try {
    const docRef = await firestore()
      .collection('transactions')
      .add(transactionData);
      
    return { id: docRef.id, ...transactionData };
  } catch (error) {
    console.log(' LỖI FIREBASE:', error);
    throw error;
  }
};

export const createCategoryAPI = async (categoryData: any) => {
  const docRef = await firestore().collection('categories').add(categoryData);
  return { id: docRef.id, ...categoryData };
};

export const deleteCategoryAPI = async (categoryId: string) => {
  await firestore().collection('user_categories').doc(categoryId).delete();
};
