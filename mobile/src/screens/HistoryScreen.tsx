import React, {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {API_BASE_URL} from '../config/api';
import {useGoal} from '../context/GoalContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator, StyleSheet, ScrollView, Text, View} from 'react-native';

function HistoryScreen() {
  const {goal} = useGoal();
  const [activities, setActivities] = useState<
    {date: string; steps: number; goal: number}[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        try {
          setError(null);
          const response = await fetch(`${API_BASE_URL}/api/steps`);
          if (!response.ok) {
            throw new Error('Failed to load history');
          }
          const data = await response.json();
          setActivities(data);
        } catch (fetchError) {
          console.error('History error:', fetchError);
          setError('Unable to refresh activity. Revisit this screen to try again.');
        } finally {
          setIsLoading(false);
        }
      };
      loadHistory();
    }, []),
  );

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const last7Days = Array.from({length: 7}, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const dateString = getLocalDateString(date);
    const activity = activities.find(item => item.date === dateString);
    return {date: dateString, steps: activity?.steps ?? 0, goal};
  });
  const goalsCompleted = last7Days.filter(activity => activity.steps >= activity.goal).length;
  const averageSteps = Math.round(
    last7Days.reduce((sum, activity) => sum + activity.steps, 0) / last7Days.length,
  );
  const chartData = [...last7Days].reverse();
  const maxSteps = Math.max(...chartData.map(activity => activity.steps), goal, 1);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#286747" />
          <Text style={styles.loadingText}>Loading your activity…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>See the consistency behind your steps.</Text>

        {error && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.cardLabel}>LAST 7 DAYS · INCLUDING TODAY</Text>
          <View style={styles.summaryMetrics}>
            <View style={styles.metric}>
              <Text style={styles.summaryNumber}>
                {activities.length === 0 && error ? '—' : `${goalsCompleted} / 7`}
              </Text>
              <Text style={styles.summaryLabel}>Goals met</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.summaryNumber}>
                {activities.length === 0 && error ? '—' : averageSteps.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Daily average</Text>
            </View>
          </View>
          <Text style={styles.summaryFootnote}>Current goal: {goal.toLocaleString()} steps per day</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>A week in motion</Text>
          <Text style={styles.chartSubtitle}>Daily steps · oldest to newest</Text>
          {activities.length === 0 && error ? (
            <Text style={styles.emptyText}>The chart will appear when activity loads.</Text>
          ) : (
            <View style={styles.chart}>
              {chartData.map(activity => {
                const completed = activity.steps >= goal;
                const day = new Date(`${activity.date}T12:00:00`).toLocaleDateString('en-US', {weekday: 'short'});
                return (
                  <View
                    key={activity.date}
                    accessible
                    accessibilityLabel={`${day}, ${activity.steps.toLocaleString()} steps, ${completed ? 'goal met' : 'below goal'}`}
                    style={styles.barContainer}>
                    <Text style={styles.barSteps}>
                      {activity.steps >= 1000 ? `${(activity.steps / 1000).toFixed(1)}k` : activity.steps}
                    </Text>
                    <View style={styles.barTrack}>
                      <View style={[
                        styles.bar,
                        {height: Math.max((activity.steps / maxSteps) * 120, 3)},
                        completed ? styles.completedBar : styles.pendingBar,
                      ]} />
                    </View>
                    <Text style={styles.barDay}>{day}</Text>
                  </View>
                );
              })}
            </View>
          )}
          <View style={styles.legend}>
            <View style={[styles.legendDot, styles.completedBar]} />
            <Text style={styles.legendText}>Goal met</Text>
            <View style={[styles.legendDot, styles.pendingBar]} />
            <Text style={styles.legendText}>Below goal</Text>
          </View>
          <Text style={styles.chartNote}>Average uses all 7 days. Days without a record count as 0.</Text>
        </View>

        <Text style={styles.sectionTitle}>Daily activity</Text>
        <Text style={styles.sectionSubtitle}>Each day compared with your current goal</Text>
        {activities.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {error ? 'Activity is unavailable right now.' : 'No activity yet. Open Home to sync your steps.'}
            </Text>
          </View>
        ) : activities.map(activity => {
          const completed = activity.steps >= goal;
          const date = new Date(`${activity.date}T12:00:00`);
          return (
            <View key={activity.date} style={styles.activityRow}>
              <View style={styles.activityDetails}>
                <Text style={styles.activityDay}>
                  {date.toLocaleDateString('en-US', {weekday: 'long'})}
                </Text>
                <Text style={styles.activityDate}>
                  {date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                </Text>
                <Text style={styles.activitySteps}>
                  {activity.steps.toLocaleString()} / {goal.toLocaleString()} steps
                </Text>
              </View>
              <View style={[styles.statusBadge, completed ? styles.completedBadge : styles.pendingBadge]}>
                <Text style={[styles.statusText, completed ? styles.completedText : styles.pendingText]}>
                  {completed ? '✓ Goal met' : 'Below goal'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F7FA'},
  scrollContent: {padding: 22, paddingTop: 24, paddingBottom: 32},
  eyebrow: {fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: '#64748B'},
  title: {fontSize: 32, fontWeight: '800', color: '#172B3A', marginTop: 8},
  subtitle: {fontSize: 15, lineHeight: 22, color: '#64748B', marginTop: 6, marginBottom: 24},
  summaryCard: {backgroundColor: '#143F3C', borderRadius: 24, padding: 22},
  cardLabel: {fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#B6D8D0'},
  summaryMetrics: {flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 20},
  metric: {flexGrow: 1, flexBasis: 110},
  summaryNumber: {fontSize: 29, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums']},
  summaryLabel: {fontSize: 13, color: '#C6DDD7', marginTop: 5},
  summaryFootnote: {fontSize: 12, lineHeight: 18, color: '#C6DDD7', marginTop: 20},
  chartCard: {backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBEF', borderRadius: 20, padding: 16, marginTop: 18},
  chartTitle: {fontSize: 18, fontWeight: '700', color: '#172B3A'},
  chartSubtitle: {fontSize: 12, color: '#64748B', marginTop: 5},
  chart: {flexDirection: 'row', marginTop: 24},
  barContainer: {flex: 1, minWidth: 0, alignItems: 'center'},
  barSteps: {fontSize: 10, color: '#64748B', marginBottom: 7},
  barTrack: {height: 120, width: '100%', alignItems: 'center', justifyContent: 'flex-end'},
  bar: {width: '58%', maxWidth: 26, borderRadius: 6},
  completedBar: {backgroundColor: '#286747'},
  pendingBar: {backgroundColor: '#B5C6CE'},
  barDay: {fontSize: 10, fontWeight: '600', color: '#475569', marginTop: 9},
  legend: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 20},
  legendDot: {width: 8, height: 8, borderRadius: 4},
  legendText: {fontSize: 11, color: '#64748B', marginRight: 8},
  chartNote: {fontSize: 11, lineHeight: 17, color: '#64748B', marginTop: 12},
  sectionTitle: {fontSize: 21, fontWeight: '700', color: '#172B3A', marginTop: 28},
  sectionSubtitle: {fontSize: 12, lineHeight: 18, color: '#64748B', marginTop: 5, marginBottom: 16},
  activityRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBEF', borderRadius: 18, padding: 16, marginBottom: 10, gap: 12},
  activityDetails: {flex: 1},
  activityDay: {fontSize: 15, fontWeight: '700', color: '#172B3A'},
  activityDate: {fontSize: 12, color: '#64748B', marginTop: 3},
  activitySteps: {fontSize: 13, fontWeight: '600', color: '#334B59', marginTop: 8},
  statusBadge: {borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flexShrink: 1},
  completedBadge: {backgroundColor: '#E8F5ED'},
  pendingBadge: {backgroundColor: '#F1F4F7'},
  statusText: {fontSize: 11, fontWeight: '700'},
  completedText: {color: '#286747'},
  pendingText: {color: '#64748B'},
  notice: {backgroundColor: '#FFF4E5', borderRadius: 12, padding: 14, marginBottom: 16},
  noticeText: {fontSize: 13, lineHeight: 20, color: '#805629'},
  emptyCard: {backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18},
  emptyText: {fontSize: 14, lineHeight: 22, color: '#64748B', paddingVertical: 12},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {fontSize: 14, color: '#64748B', marginTop: 14},
});

export default HistoryScreen;
