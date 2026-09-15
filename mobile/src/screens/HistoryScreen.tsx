import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';

function HistoryScreen() {
  const [activities, setActivities] = useState<
    {date: string; steps: number; goal: number}[]
  >([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(
          'http://192.168.4.66:3000/api/steps',
        );

        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('History error:', error);
      }
    };

    loadHistory();
  }, []);

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
  
    const activity = activities.find(
      item => item.date === dateString,
    );
  
    return {
      date: dateString,
      steps: activity?.steps ?? 0,
      goal: activity?.goal ?? 10000,
    };
  });

const goalsCompleted = last7Days.filter(
  activity => activity.steps >= activity.goal,
).length;

const averageSteps =
  last7Days.length > 0
    ? Math.round(
        last7Days.reduce(
          (sum, activity) => sum + activity.steps,
          0,
        ) / last7Days.length,
      )
    : 0;
    const chartData = [...last7Days];

    const maxSteps = Math.max(
      ...chartData.map(activity => activity.steps),
      10000,
    );
    return (
        <SafeAreaView style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          Your daily step activity
        </Text>
        <View style={styles.summaryCard}>
  <View>
    <Text style={styles.summaryNumber}>
      {goalsCompleted} / {last7Days.length}
    </Text>
    <Text style={styles.summaryLabel}>Goals Completed</Text>
  </View>

  <View>
    <Text style={styles.summaryNumber}>
      {averageSteps.toLocaleString()}
    </Text>
    <Text style={styles.summaryLabel}>Avg. Steps</Text>
  </View>
</View>
</View>

<Text style={styles.chartTitle}>Last 7 Days</Text>

<View style={styles.chart}>
  {chartData.map(activity => {
    const barHeight = (activity.steps / maxSteps) * 120;

    const day = new Date(
      `${activity.date}T12:00:00`,
    ).toLocaleDateString('en-US', {
      weekday: 'short',
    });

    return (
      <View key={activity.date} style={styles.barContainer}>
        <Text style={styles.barSteps}>
          {activity.steps >= 1000
            ? `${(activity.steps / 1000).toFixed(1)}k`
            : activity.steps}
        </Text>

        <View
          style={[
            styles.bar,
            {height: Math.max(barHeight, 3)},
          ]}
        />

<Text style={styles.barDay}>
  {day}
</Text>
      </View>
    );
  })}
</View>

{activities.map(activity => {
  const completed = activity.steps >= activity.goal;

  return (
    <View key={activity.date} style={styles.activityRow}>
      <View>
        <Text style={styles.activityDate}>
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
          {activity.steps.toLocaleString()} /{' '}
          {activity.goal.toLocaleString()} steps
        </Text>
      </View>

      <Text style={styles.activityStatus}>
        {completed ? '✓' : '○'}
      </Text>
    </View>
  );
})}

</ScrollView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 22,
        marginBottom: 12,
      },
      
      chart: {
        height: 175,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
      },
      
      barContainer: {
        width: 42,
        alignItems: 'center',
      },
      
      bar: {
        width: 24,
        backgroundColor: '#111827',
        borderRadius: 6,
      },
      
      barSteps: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 5,
      },
      
      barDay: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
      },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F3F4F6',
        padding: 18,
        borderRadius: 16,
        marginTop: 20,
        marginBottom: 10,
      },
      
      summaryNumber: {
        fontSize: 22,
        fontWeight: 'bold',
      },
      
      summaryLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
      },
  activityRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 16,
  paddingHorizontal: 16,
  backgroundColor: '#F9FAFB',
  borderRadius: 14,
  marginTop: 10,
},

activityDate: {
  fontSize: 16,
  fontWeight: '600',
},

activitySteps: {
  fontSize: 14,
  marginTop: 4,
  color: '#6B7280',
},

activityStatus: {
  fontSize: 22,
  fontWeight: 'bold',
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

  subtitle: {
    fontSize: 16,
    marginTop: 6,
    color: '#6B7280',
  },
});

export default HistoryScreen;