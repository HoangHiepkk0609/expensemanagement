import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/themeContext';
import styles from '../styles';
import { ImageCard } from './ImageCard';

export const ImageInputForm = ({
  setInputMode,
  loading,
  onSelectImage,
  selectedImages,
  setSelectedImages,
  onAnalyze,
}: any) => {
  const { colors } = useTheme();
  const hasImages = selectedImages && selectedImages.length > 0;


  return (
    <>
      <View
        style={[styles.formSectionImage, { backgroundColor: colors.surface }]}
      >
        <View
          style={[
            styles.inputModeSelector,
            { borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={() => setInputMode('manual')}>
            <Text
              style={[styles.modeTextInactive, { color: colors.textSecondary }]}
            >
              Nhập thủ công
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInputMode('image')}>
            <Text
              style={[
                styles.modeTextActive,
                { color: colors.primary, borderBottomColor: colors.primary },
              ]}
            >
              Nhập bằng ảnh
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.imageInputTitle,
            { color: colors.text, marginTop: 16 },
          ]}
        >
          Thêm giao dịch hàng loạt từ ảnh
        </Text>
        {selectedImages && selectedImages.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: colors.text,
                marginBottom: 8,
                fontWeight: 'bold',
              }}
            >
              Ảnh đã chọn ({selectedImages.length}/3)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {selectedImages.map((img: any, index: number) => (
                <View
                  key={index}
                  style={{
                    position: 'relative',
                    width: '30%',
                    aspectRatio: 0.7,
                  }}
                >
                  <Image
                    source={{ uri: img.uri }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: 'red',
                      borderRadius: 12,
                      padding: 4,
                    }}
                    onPress={() => {
                      const newImages = selectedImages.filter(
                        (_: any, i: number) => i !== index,
                      );
                      setSelectedImages(newImages);
                    }}
                  >
                    <Icon name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {selectedImages.length < 3 && (
                <TouchableOpacity
                  style={{
                    width: '30%',
                    aspectRatio: 0.7,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    borderStyle: 'dashed',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.background,
                  }}
                  onPress={onSelectImage}
                  disabled={loading}
                >
                  <Icon name="plus" size={32} color={colors.primary} />
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 12,
                      marginTop: 4,
                      fontWeight: '500',
                    }}
                  >
                    Thêm ảnh
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View>
            <Text
              style={[
                styles.imageInputSubtitle,
                { color: colors.textSecondary, marginBottom: 16 },
              ]}
            >
              Chọn tối đa 3 ảnh chụp màn hình...
            </Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              <ImageCard title="Lịch sử giao dịch" statusIcon="check-circle" />
              <ImageCard title="Kết quả giao dịch" statusIcon="check-circle" />
              <ImageCard title="Ảnh QR" statusIcon="close-circle" />
            </ScrollView>
          </View>
        )}

        <Text
          style={[
            styles.imageInputHint,
            { color: colors.textSecondary},
          ]}
        >
          AI sẽ tự động đọc và phân loại giao dịch (Thu/Chi).
        </Text>
      </View>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: hasImages
                ? colors.primary
                : colors.textSecondary,
            },
          ]}
          onPress={hasImages ? onAnalyze : onSelectImage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>
              {hasImages
                ? `Bắt đầu phân tích (${selectedImages.length})`
                : 'Tải ảnh lên'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};