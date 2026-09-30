import React, {useEffect} from 'react';
import {API_BASE_URL} from '../config/api';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
} from '../services/notifications';
import {
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {isHealthDataAvailable,requestAuthorization,queryQuantitySamples,} from '@kingstinct/react-native-healthkit';
import {calculateStreak, withCurrentGoal} from '../utils/streak';
import {useGoal} from '../context/GoalContext';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

function HomeScreen() {
  const [steps, setSteps] = React.useState(0);
  const {goal, goalLoaded} = useGoal();
  const [recentActivity, setRecentActivity] = React.useState<
  {date: string; steps: number; goal: number}[]
>([]);
const [activityLoading, setActivityLoading] = React.useState(true);
const [activityError, setActivityError] = React.useState(false);
const [syncError, setSyncError] = React.useState(false);
  const progress = Math.round((steps / goal) * 100); 
  const currentStreak = calculateStreak(withCurrentGoal(recentActivity, goal));

  useEffect(() => {
    if (!goalLoaded) { return; }
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
        const response = await fetch(
          `${API_BASE_URL}/api/steps/${dateString}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              steps: stepsForDay,
              goal,
              updateGoal: index === 0,
            }),
          },
        );
        if (!response.ok) {
          throw new Error(`Step sync failed for ${dateString}: ${response.status}`);
        }
        console.log(`Synced ${dateString}: ${stepsForDay} steps`);
      }
    };

    const setupHealthKit = async () => {
      try {
        setSyncError(false);
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

        const todayResponse = await fetch(`${API_BASE_URL}/api/steps/${today}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    steps: Math.round(totalSteps),
    goal,
    updateGoal: true,
  }),
});
        if (!todayResponse.ok) {
          throw new Error(`Today's step sync failed: ${todayResponse.status}`);
        }
        console.log('Today steps:', totalSteps);
      } catch (error) {
        console.error('HealthKit error:', error);
        setSyncError(true);
      }
    };

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
  }, [goal, goalLoaded]);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await requestNotificationPermission();
        await scheduleDailyReminder();
      } catch (error) {
        console.error('Notification setup error:', error);
      }
    };
    setupNotifications();
  }, []);
  const remaining = Math.max(goal - steps, 0);
  const goalReached = steps >= goal;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>YOUR DAILY CHECK-IN</Text>
        <Text style={styles.title}>Keep moving.</Text>
        <Text style={styles.subtitle}>Small steps. Consistent progress.</Text>

        <View style={styles.stepCard}>
          <Text style={styles.cardLabel}>TODAY’S STEPS</Text>
          <Text style={styles.steps}>{steps.toLocaleString()}</Text>
          <Text style={styles.goalText}>of {goal.toLocaleString()} daily goal</Text>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Daily progress</Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Daily step goal progress"
            accessibilityValue={{min: 0, max: 100, now: Math.min(progress, 100)}}
            style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${Math.min(progress, 100)}%`}]} />
          </View>
          <Text style={styles.encouragement}>
            {goalReached
              ? 'Goal reached. Every extra step counts.'
              : `${remaining.toLocaleString()} steps to reach your goal.`}
          </Text>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakIcon}><Text style={styles.streakEmoji}>🔥</Text></View>
          <View style={styles.streakContent}>
            <Text style={styles.streakLabel}>CURRENT STREAK</Text>
            <Text style={styles.streakNumber}>
              {activityLoading ? 'Loading…' : activityError ? 'Unavailable' : `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
            </Text>
            <Text style={styles.streakHint}>Keep the streak up, one day at a time.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent activity</Text>
        <Text style={styles.sectionSubtitle}>Progress toward your current daily goal</Text>
        {syncError && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>Unable to sync steps. Reopen the app to try again.</Text>
          </View>
        )}
        {activityLoading ? (
          <Text style={styles.activityMessage}>Loading recent activity…</Text>
        ) : activityError ? (
          <Text style={styles.activityMessage}>Unable to load recent activity.</Text>
        ) : recentActivity.length === 0 ? (
          <Text style={styles.activityMessage}>Your activity will appear here after your first sync.</Text>
        ) : (
          recentActivity.map(activity => {
            const completed = activity.steps >= goal;
            const date = new Date(`${activity.date}T12:00:00`);
            return (
              <View key={activity.date} style={styles.activityRow}>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityDay}>
                    {activity.date === getLocalDateString() ? 'Today' : date.toLocaleDateString('en-US', {weekday: 'long'})}
                  </Text>
                  <Text style={styles.activityDate}>
                    {date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                  </Text>
                  <Text style={styles.activitySteps}>{activity.steps.toLocaleString()} steps</Text>
                </View>
                <View style={[styles.statusBadge, completed ? styles.completedBadge : styles.pendingBadge]}>
                  <Text style={[styles.statusText, completed ? styles.completedText : styles.pendingText]}>
                    {completed ? '✓ Goal met' : 'Below goal'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F7FA'},
  scrollContent: {padding: 22, paddingTop: 80, paddingBottom: 32},
  eyebrow: {fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: '#64748B'},
  title: {fontSize: 32, fontWeight: '800', color: '#172B3A', marginTop: 8},
  subtitle: {fontSize: 15, color: '#64748B', marginTop: 6, marginBottom: 24},
  stepCard: {backgroundColor: '#143F3C', borderRadius: 24, padding: 24},
  cardLabel: {fontSize: 12, fontWeight: '700', letterSpacing: 1.4, color: '#B6D8D0'},
  steps: {fontSize: 54, fontWeight: '800', color: '#FFFFFF', marginTop: 12, fontVariant: ['tabular-nums']},
  goalText: {fontSize: 15, color: '#C6DDD7', marginTop: 2},
  progressHeader: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 26, marginBottom: 10},
  progressLabel: {fontSize: 13, color: '#C6DDD7'},
  progressPercent: {fontSize: 13, fontWeight: '700', color: '#FFFFFF'},
  progressBar: {height: 10, backgroundColor: '#38605C', borderRadius: 5, overflow: 'hidden'},
  progressFill: {height: '100%', backgroundColor: '#A8E6C3', borderRadius: 5},
  encouragement: {fontSize: 13, lineHeight: 20, color: '#DAEEE5', marginTop: 14},
  streakCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#F3E3CB', borderRadius: 20, padding: 18, marginTop: 16},
  streakIcon: {width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE7C6', marginRight: 14},
  streakEmoji: {fontSize: 26},
  streakContent: {flex: 1},
  streakLabel: {fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: '#8B5B28'},
  streakNumber: {fontSize: 24, fontWeight: '800', color: '#543719', marginTop: 4},
  streakHint: {fontSize: 12, lineHeight: 18, color: '#8B6A48', marginTop: 4},
  sectionTitle: {fontSize: 21, fontWeight: '700', color: '#172B3A', marginTop: 30},
  sectionSubtitle: {fontSize: 12, color: '#64748B', marginTop: 5, marginBottom: 16},
  activityRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBEF', borderRadius: 18, padding: 16, marginBottom: 10, gap: 12},
  activityDetails: {flex: 1},
  activityDay: {fontSize: 15, fontWeight: '700', color: '#172B3A'},
  activityDate: {fontSize: 12, color: '#64748B', marginTop: 3},
  activitySteps: {fontSize: 14, fontWeight: '600', color: '#334B59', marginTop: 8},
  statusBadge: {borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flexShrink: 1},
  completedBadge: {backgroundColor: '#E8F5ED'},
  pendingBadge: {backgroundColor: '#F1F4F7'},
  statusText: {fontSize: 11, fontWeight: '700'},
  completedText: {color: '#286747'},
  pendingText: {color: '#64748B'},
  notice: {backgroundColor: '#FFF4E5', borderRadius: 12, padding: 14, marginBottom: 12},
  noticeText: {fontSize: 13, lineHeight: 20, color: '#805629'},
  activityMessage: {fontSize: 14, lineHeight: 22, color: '#64748B', paddingVertical: 16},
});

export default HomeScreen;
