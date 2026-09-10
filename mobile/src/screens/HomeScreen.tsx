import React, {useEffect} from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import HealthKit from '@kingstinct/react-native-healthkit';

function HomeScreen() {
  const steps = 6845;
  const goal = 10000;
  const progress = Math.round((steps / goal) * 100);
  const currentStreak = 4;
  const recentActivity = [
    {day: 'Monday', steps: 10421},
    {day: 'Sunday', steps: 11203},
    {day: 'Saturday', steps: 8932},
  ];

  /* useEffect(() => {
    const requestHealthPermissions = async () => {
      try {
        await HealthKit.requestAuthorization({
            toRead: ['HKQuantityTypeIdentifierStepCount'],
        });
  
        console.log('HealthKit permission requested');
      } catch (error) {
        console.error('HealthKit permission error:', error);
      }
    };
  
    requestHealthPermissions();
  }, []);
*/
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>Step Accountability</Text>
        <Text style={styles.label}>Today's Steps</Text>
        <Text style={styles.steps}>{steps.toLocaleString()} / {goal.toLocaleString()}
</Text>
<Text>{progress}% Complete</Text>
<View style={styles.progressBar}>
  <View
    style={[
      styles.progressFill,
      {width: `${Math.min(progress, 100)}%`},
    ]}
  />
  </View>
  
  <Text style={styles.streak}>
  🔥 {currentStreak} Day Streak
</Text>

      </View>
<Text style = {styles.sectionTitle}>Recent Activities</Text>

{recentActivity.map(activity => (
  <Text key={activity.day}>
    {activity.day}: {activity.steps.toLocaleString()} steps{' '}
    {activity.steps >= goal ? '✓' : '✗'}
  </Text>
))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  label: {
    fontSize: 18,
    marginTop: 40,
  },

  steps: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },

  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginTop: 16,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 6,
  },

  streak: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },

  sectionTitle:{
    fontSize: 20,
    fontWeight:'bold',
    marginTop: 32,
    marginBottom: 12,
  }
});

export default HomeScreen;