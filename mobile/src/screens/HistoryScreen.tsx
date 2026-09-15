import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          Your daily step activity
        </Text>
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
});

export default HistoryScreen;