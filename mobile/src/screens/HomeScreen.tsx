import React, {useEffect} from 'react';
import {API_BASE_URL} from '../config/api';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
} from '../services/notifications';
import {
  AppState,
  Pressable,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {isHealthDataAvailable,requestAuthorization,queryQuantitySamples,} from '@kingstinct/react-native-healthkit';
import {calculateStreak} from '../utils/streak';
import {useGoal} from '../context/GoalContext';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

function HomeScreen() {
  const [steps, setSteps] = React.useState(0);
  
  const {goal} = useGoal();
  
  const [recentActivity, setRecentActivity] = React.useState<
  {date: string; steps: number; goal: number}[]
>([]);
const [activityLoading, setActivityLoading] = React.useState(true);
const [activityError, setActivityError] = React.useState(false);
  const progress = Math.round((steps / goal) * 100); 
  
  const currentStreak = calculateStreak(recentActivity);

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        setActivityLoading(true);
        setActivityError(false);
    
        const response = await fetch(`${API_BASE_URL}/api/steps`);
    
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
    
        const data = await response.json();
    
        setRecentActivity(data);
      } catch (error) {
        console.error('Recent activity error:', error);
        setActivityError(true);
      } finally {
        setActivityLoading(false);
      }
    };
    const getStepsForDate = async (date: Date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
    
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
    
      const samples = await queryQuantitySamples(
        'HKQuantityTypeIdentifierStepCount',
        {
          filter: {
            date: {
              startDate: startOfDay,
              endDate: endOfDay,
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
    
      return Math.round(totalSteps);
    };

    const syncLast7Days = async () => {
      for (let index = 0; index < 7; index++) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - index);
    
        const stepsForDay = await getStepsForDate(date);
        const dateString = getLocalDateString(date);
    
        await fetch(
          `${API_BASE_URL}/api/steps/${dateString}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              steps: stepsForDay,
              goal,
            }),
          },
        );
    
        console.log(`Synced ${dateString}: ${stepsForDay} steps`);
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
        
        await syncLast7Days();
  
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
        const today = getLocalDateString();

        await fetch(`${API_BASE_URL}/api/steps/${today}`, {
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
    const setupNotifications = async () => {
      await requestNotificationPermission();
      await scheduleDailyReminder();
    };
    
    setupNotifications();

const initializeApp = async () => {
  await setupHealthKit();
  await loadRecentActivity();
};

initializeApp();
  
const subscription = AppState.addEventListener('change', async nextAppState => {
  if (nextAppState === 'active') {
    await setupHealthKit();
    await loadRecentActivity();
  }
});
  
    return () => {
      subscription.remove();
    };
  }, []);
  
return (
  <SafeAreaView style={styles.container}>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View>
        <Text style={styles.title}>Step Accountability</Text>

  <View style={styles.stepCard}>
    <Text style={styles.label}>Today's Steps</Text>

    <Text style={styles.steps}>
      {steps.toLocaleString()} / {goal.toLocaleString()}
    </Text>

    <View style={styles.progressHeader}>
  <Text style={styles.progressLabel}>Daily Progress</Text>
  <Text style={styles.progressPercent}>
    {progress}% Complete
  </Text>
</View>

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
  <Text style={styles.streakNumber}>
  {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
</Text>
    <Text style={styles.streakLabel}>Current Streak</Text>
  </View>
</View>

</View>

<Text style={styles.sectionTitle}>Recent Activities</Text>


{activityLoading ? (
  <Text style={styles.activityMessage}>Loading recent activity...</Text>
) : activityError ? (
  <Text style={styles.activityMessage}>
    Unable to load recent activity.
  </Text>
) : recentActivity.length === 0 ? (
  <Text style={styles.activityMessage}>No activity yet.</Text>
) : (
  recentActivity.map(activity => {
    const completed = activity.steps >= activity.goal;

    return (
      <View key={activity.date} style={styles.activityRow}>
        <View>
          <Text style={styles.activityDay}>
            {new Date(`${activity.date}T12:00:00`).toLocaleDateString(
              'en-US',
              {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              },
            )}
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
  })
)}

</ScrollView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
 
  stepCard: {
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#ffffff',
  },
  
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
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
    marginTop: 5,
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
  activityMessage: {
    fontSize: 14,
    color: '#6B7280',
    paddingVertical: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;