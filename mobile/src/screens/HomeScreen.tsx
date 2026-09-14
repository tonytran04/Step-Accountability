import React, {useEffect} from 'react';
import {
  AppState,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {isHealthDataAvailable,requestAuthorization,queryQuantitySamples,} from '@kingstinct/react-native-healthkit';
function HomeScreen() {
  const [steps, setSteps] = React.useState(0);
  
  const goal = 10000;
  
  const [recentActivity, setRecentActivity] = React.useState<
  {date: string; steps: number; goal: number}[]
>([]);

  const progress = Math.round((steps / goal) * 100);
  const calculateStreak = () => {
    let streak = 0;
  
    const today = new Date().toISOString().split('T')[0];
  
    for (const activity of recentActivity) {
      // Today is still in progress, so don't let it break the streak
      if (activity.date === today && activity.steps < activity.goal) {
        continue;
      }
  
      if (activity.steps >= activity.goal) {
        streak++;
      } else {
        break;
      }
    }
  
    return streak;
  };
  
  const currentStreak = calculateStreak();

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        const response = await fetch('http://192.168.4.66:3000/api/steps');
        const data = await response.json();
    
        setRecentActivity(data);
      } catch (error) {
        console.error('Recent activity error:', error);
      }
    };
    const setupHealthKit = async () => {
      try {
        const available = await isHealthDataAvailable();
        console.log('HealthKit available:', available);
  
        if (!available) {
          return;
        }
  
        await requestAuthorization({
          toRead: ['HKQuantityTypeIdentifierStepCount'],
        });
  
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
  
        const samples = await queryQuantitySamples(
          'HKQuantityTypeIdentifierStepCount',
          {
            filter: {
              date: {
                startDate: startOfDay,
                endDate: new Date(),
              },
            },
            unit: 'count',
            limit: 1000,
          },
        );
  
        const totalSteps = samples.reduce(
          (sum, sample) => sum + sample.quantity,
          0,
        );
  
        setSteps(Math.round(totalSteps));
        const today = new Date().toISOString().split('T')[0];

await fetch(`http://192.168.4.66:3000/api/steps/${today}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    steps: Math.round(totalSteps),
    goal,
  }),
});
        console.log('Today steps:', totalSteps);
      } catch (error) {
        console.error('HealthKit error:', error);
      }
    };
  
    setupHealthKit();
    loadRecentActivity();
  
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        setupHealthKit();
        loadRecentActivity();
      }
    });
  
    return () => {
      subscription.remove();
    };
  }, []);
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
  <Text key={activity.date}>
    {new Date(`${activity.date}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
    })}: {activity.steps.toLocaleString()} steps
    {activity.steps >= activity.goal ? ' ✓' : ' ✗'}
  </Text>
))}
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