import React, {useEffect} from 'react';
import {
  AppState,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {isHealthDataAvailable,requestAuthorization,queryQuantitySamples,} from '@kingstinct/react-native-healthkit';
import {calculateStreak} from '../utils/streak';

function HomeScreen() {
  const [steps, setSteps] = React.useState(0);
  
  const goal = 10000;
  
  const [recentActivity, setRecentActivity] = React.useState<
  {date: string; steps: number; goal: number}[]
>([]);

  const progress = Math.round((steps / goal) * 100);

  const getLocalDate = () => {
    const date = new Date();
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  };

  
  
  const currentStreak = calculateStreak(recentActivity);

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
        const today = getLocalDate();

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

  <View style={styles.stepCard}>
    <Text style={styles.label}>Today's Steps</Text>

    <Text style={styles.steps}>
      {steps.toLocaleString()} / {goal.toLocaleString()}
    </Text>

    <Text style={styles.progressText}>
      {progress}% Complete
    </Text>

    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          {width: `${Math.min(progress, 100)}%`},
        ]}
      />
    </View>
  </View>

  <View style={styles.streakCard}>
  <Text style={styles.streakEmoji}>🔥</Text>

  <View>
    <Text style={styles.streakNumber}>{currentStreak} Days</Text>
    <Text style={styles.streakLabel}>Current Streak</Text>
  </View>
</View>

</View>
<Text style = {styles.sectionTitle}>Recent Activities</Text>

{recentActivity.map(activity => {
  const completed = activity.steps >= activity.goal;

  return (
    <View key={activity.date} style={styles.activityRow}>
      <View>
        <Text style={styles.activityDay}>
          {new Date(`${activity.date}T12:00:00`).toLocaleDateString('en-US', {
            weekday: 'long',
          })}
        </Text>

        <Text style={styles.activitySteps}>
          {activity.steps.toLocaleString()} steps
        </Text>
      </View>

      <Text style={styles.activityStatus}>
        {completed ? '✓' : '○'}
      </Text>
    </View>
  );
})}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stepCard: {
    backgroundColor: '#ff1111',
    padding: 20,
    borderRadius: 18,
    marginTop: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  progressText: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 14,
  },
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
    marginTop: 0,
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
/*create streak card*/
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 18,
    borderRadius: 18,
    marginBottom: 8,
  },
  
  streakEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  
  streakNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  
  streakLabel: {
    fontSize: 14,
    marginTop: 2,
  },

  sectionTitle:{
    fontSize: 20,
    fontWeight:'bold',
    marginTop: 32,
    marginBottom: 12,
  },

  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    marginBottom: 8,
  },
  
  activityDay: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  activitySteps: {
    fontSize: 14,
    marginTop: 3,
    color: '#6B7280',
  },
  
  activityStatus: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  

});

export default HomeScreen;