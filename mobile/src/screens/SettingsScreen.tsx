import React, {useState} from 'react';
import {
  SafeAreaView,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
} from 'react-native';
import {useGoal} from '../context/GoalContext';

function SettingsScreen() {
    const {goal, updateGoal} = useGoal();
    const [goalInput, setGoalInput] = useState(goal.toString());
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Customize your Step Accountability experience
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Step Goal</Text>

          <Text style={styles.cardDescription}>
            Choose the number of steps you want to reach each day.
          </Text>

<TextInput
  style={styles.input}
  value={goalInput}
  onChangeText={setGoalInput}
  keyboardType="number-pad"
  placeholder="10000"
/>

<Pressable
  style={styles.saveButton}
  onPress={() => {
    const newGoal = Number(goalInput);

    if (newGoal > 0) {
        updateGoal(newGoal);
      Keyboard.dismiss();
      Alert.alert(
        'Goal Saved',
        `Your daily goal is now ${newGoal.toLocaleString()} steps.`,
      );
    }
  }}>
  <Text style={styles.saveButtonText}>Save Goal</Text>
</Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 16,
    marginTop: 6,
    color: '#6B7280',
  },

  card: {
    backgroundColor: '#F9FAFB',
    padding: 18,
    borderRadius: 16,
    marginTop: 24,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },

  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginTop: 18,
  },
  
  saveButton: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;