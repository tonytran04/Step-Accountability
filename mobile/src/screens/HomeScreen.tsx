import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';

function HomeScreen() {
  const steps = 6842;
  const goal = 10000;
  const progress = Math.round((steps / goal) * 100);

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
      </View>
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
});

export default HomeScreen;