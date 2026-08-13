import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/themeContext';
import styles from '../styles';

export const SelectModal = ({
  visible,
  onClose,
  title,
  options,
  onSelect,
  selectedValue,
}: any) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {options.map((item: any, index: number) => {
              const optionValue = typeof item === 'string' ? item : item.label;
              const isSelected = selectedValue === optionValue;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.text },
                      isSelected && {
                        color: colors.primary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {optionValue}
                  </Text>
                  {isSelected && (
                    <Icon name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};