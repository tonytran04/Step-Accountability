import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import {GoalProvider} from './src/context/GoalContext';

const Tab = createBottomTabNavigator();

function App() {
  return (
  <GoalProvider>
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />

        <Tab.Screen
          name="History"
          component={HistoryScreen}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
/>
      </Tab.Navigator>
    </NavigationContainer>
  </GoalProvider>
    
  );
}

export default App;
