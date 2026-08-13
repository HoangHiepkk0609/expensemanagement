import { GoogleGenerativeAI } from '@google/generative-ai';
import { useState } from 'react';
import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

export const useImageAnalyzer = (navigation: any) => {
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const handlePickImage = async () => {
    try {
      let result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 3,
        quality: 0.8,
        includeBase64: true,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error('Lỗi từ ImagePicker: ', result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setSelectedImages(prevImages => {
          const safePrev = prevImages || [];
          const safeNew = result.assets || [];

          const combinedImages = [...safePrev, ...safeNew];

          const uniqueImages = combinedImages.filter(
            (img, index, self) =>
              index ===
              self.findIndex(
                t => t.fileName === img.fileName && t.fileSize === img.fileSize,
              ),
          );

          return uniqueImages.slice(0, 3);
        });
      }
    } catch (error) {
      console.error('Lỗi khi chọn ảnh:', error);
    }
  };

  const handleAnalyzeImages = async () => {
    setLoadingAI(true);

    try {
      const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const imageParts = selectedImages.map(img => ({
        inlineData: {
          data: img.base64,
          mimeType: img.type || 'image/jpeg',
        },
      }));

      const prompt = `
      Bạn là một chuyên gia kế toán. Hãy đọc hóa đơn này và trả về ĐÚNG MỘT OBJECT JSON, KHÔNG CÓ markdown \`\`\`json.
      Cấu trúc bắt buộc:
      {
        "type": "expense",
        "amount": <số nguyên, ví dụ: 150000>,
        "date": "<YYYY-MM-DD>",
        "category": "<chọn 1: an_uong, mua_sam, di_lai, hoa_don, luong, khac>",
        "note": "<Mô tả ngắn gọn>"
      }
      Nếu không đọc được, trả về {"error": "INVALID"}
        `;

      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();

      const aiData = JSON.parse(responseText);

      if (aiData.error) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin giao dịch trong ảnh.');
        return;
      }

      const imagesToPass = selectedImages.map(img => {
        const { ...safeImageData } = img;
        return safeImageData;
      });

      navigation.navigate('ImageExtract', {
        images: imagesToPass,
        aiData: aiData,
      });

      setSelectedImages([]);
    } catch (error) {
      console.error('Lỗi AI: ', error);
      Alert.alert('Lỗi', 'Quá trình phân tích thất bại.');
    } finally {
      setLoadingAI(false);
    }
  };

  return {
    selectedImages,
    setSelectedImages,
    loadingAI,
    handleAnalyzeImages,
    handlePickImage,
  };
};