import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../theme/themeContext';
import styles from '../styles';

const FamilyToggle = () => {
  const { colors, isDarkMode } = useTheme();
  const { familyId, filterMode, setFilterMode } = useAuth();

  if (!familyId) return null;

  return (
    <View style={styles.toggleWrapper}>
      <View
        style={[
          styles.toggleContainer,
          { backgroundColor: isDarkMode ? colors.surface : '#F5F5F5' },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            filterMode === 'personal' && [
              styles.toggleBtnActive,
              { backgroundColor: colors.background },
            ],
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
          onPress={() => setFilterMode('personal')}
        >
          <Icon
            name="account"
            size={18}
            color={
              filterMode === 'personal' ? colors.text : colors.textSecondary
            }
            style={{ marginRight: 6 }}
          />

          <Text
            style={[
              styles.toggleText,
              filterMode === 'personal' && styles.toggleTextActive,
            ]}
          >
            Cá nhân
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            filterMode === 'family' && [
              styles.toggleBtnActive,
              { backgroundColor: colors.background },
            ],
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
          onPress={() => setFilterMode('family')}
        >
          <Icon
            name="home"
            size={18}
            color={filterMode === 'family' ? colors.text : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.toggleText,
              filterMode === 'family' && styles.toggleTextActive,
            ]}
          >
            Gia đình
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FamilyToggle;
