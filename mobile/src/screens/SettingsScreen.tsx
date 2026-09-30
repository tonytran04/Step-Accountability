import React, {useEffect, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Alert, Keyboard, Linking, StyleSheet, Text, View,
  Pressable, TextInput, Switch, ScrollView,
} from 'react-native';
import {useGoal} from '../context/GoalContext';
import {getDailyReminderEnabled, setDailyReminderEnabled} from '../services/notifications';

function SettingsScreen() {
  const {goal, updateGoal} = useGoal();
  const [goalInput, setGoalInput] = useState(goal.toString());
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(true);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderError, setReminderError] = useState(false);
  useEffect(() => setGoalInput(goal.toString()), [goal]);

  useFocusEffect(React.useCallback(() => {
    let active = true;
    setReminderLoading(true);
    getDailyReminderEnabled().then(enabled => {
      if (active) {
        setReminderEnabled(enabled);
        setReminderError(false);
      }
    }).catch(() => {
      if (active) {setReminderError(true);}
    }).finally(() => {
      if (active) {setReminderLoading(false);}
    });
    return () => {active = false;};
  }, []));

  const changeReminder = async (enabled: boolean) => {
    setSavingReminder(true);
    try {
      await setDailyReminderEnabled(enabled);
      setReminderEnabled(enabled);
    } catch (error) {
      Alert.alert('Unable to update reminder', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingReminder(false);
    }
  };

  const saveGoal = () => {
    const newGoal = Number(goalInput);
    if (Number.isSafeInteger(newGoal) && newGoal > 0) {
      updateGoal(newGoal);
      Keyboard.dismiss();
      Alert.alert('Goal Saved', `Your daily goal is now ${newGoal.toLocaleString()} steps.`);
    } else {
      Alert.alert('Invalid Goal', 'Enter a positive whole number of steps.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Set your goal. Keep your momentum.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily step goal</Text>
          <Text style={styles.description}>Saved goal: {goal.toLocaleString()} steps per day</Text>
          <TextInput
            accessibilityLabel="Daily step goal"
            style={styles.input} value={goalInput} onChangeText={setGoalInput}
            keyboardType="number-pad" placeholder="10000" placeholderTextColor="#64748B"
          />
          <Text style={styles.note}>Changing your goal also updates how past days are marked complete.</Text>
          <Pressable accessibilityRole="button" style={styles.saveButton} onPress={saveGoal}>
            <Text style={styles.saveButtonText}>Save goal</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <View style={styles.reminderRow}>
            <View style={styles.reminderDetails}>
              <Text style={styles.cardTitle}>Daily reminder</Text>
              <Text style={styles.description}>Every day at 8:00 PM</Text>
            </View>
            <Switch
              accessibilityLabel="Daily 8 PM step reminder"
              value={reminderEnabled}
              disabled={reminderLoading || savingReminder || reminderError}
              onValueChange={changeReminder}
              trackColor={{false: '#CBD5E1', true: '#286747'}}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.note}>
            {reminderLoading ? 'Loading reminder preference…' : savingReminder ? 'Updating reminder…' : reminderError ? 'Unable to load preference. Revisit this screen to retry.' : reminderEnabled ? 'Reminder enabled. iPhone notification permission must also be allowed.' : 'Reminder off. You can turn it on whenever you like.'}
          </Text>
          <Text style={styles.note}>A daily nudge, even on days you have already met your goal.</Text>
          <Pressable
            accessibilityRole="button" style={styles.settingsButton}
            onPress={() => {
              Linking.openSettings().catch(() => Alert.alert('Open iPhone Settings', 'Find Step Accountability and allow notifications.'));
            }}>
            <Text style={styles.settingsButtonText}>Open iPhone settings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F7FA'},
  scrollContent: {padding: 22, paddingTop: 44, paddingBottom: 40},
  eyebrow: {fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: '#64748B'},
  title: {fontSize: 32, fontWeight: '800', color: '#172B3A', marginTop: 8},
  subtitle: {fontSize: 15, lineHeight: 22, marginTop: 6, color: '#64748B', marginBottom: 6},
  card: {backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBEF', padding: 20, borderRadius: 20, marginTop: 18},
  cardTitle: {fontSize: 18, fontWeight: '700', color: '#172B3A'},
  description: {fontSize: 14, lineHeight: 21, color: '#64748B', marginTop: 6},
  input: {backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 22, fontWeight: '600', color: '#172B3A', marginTop: 18},
  note: {fontSize: 12, lineHeight: 19, color: '#64748B', marginTop: 12},
  saveButton: {backgroundColor: '#143F3C', padding: 15, borderRadius: 12, marginTop: 18, alignItems: 'center'},
  saveButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  reminderRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  reminderDetails: {flex: 1},
  settingsButton: {paddingVertical: 14, marginTop: 8},
  settingsButtonText: {fontSize: 14, fontWeight: '600', color: '#286747'},
});

export default SettingsScreen;
