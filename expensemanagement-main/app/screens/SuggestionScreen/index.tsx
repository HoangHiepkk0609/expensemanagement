import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SUGGESTIONS } from '../../constants/onboardingData';
import styles from './styles';

export default function SuggestionScreen({ route, navigation }: any) {
  const occupationId = route.params.occupationId as keyof typeof SUGGESTIONS;
  const suggestionData = SUGGESTIONS[occupationId];

  const handleStartGoal = () => {
    navigation.navigate(suggestionData.targetScreen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.suggestionBox}>
        <Text style={styles.title}>{suggestionData.title}</Text>
        <Text style={styles.description}>{suggestionData.description}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStartGoal}>
        <Text style={styles.buttonText}>{suggestionData.buttonText}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('GoalTypeSelection')}
      >
        <Text style={styles.secondaryText}>Tôi muốn tự chọn loại khác</Text>
      </TouchableOpacity>
    </View>
  );
}


