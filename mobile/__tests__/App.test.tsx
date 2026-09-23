/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';
import App from '../App';

jest.mock('../src/screens/HomeScreen', () => () => null);
jest.mock('../src/screens/HistoryScreen', () => () => null);
jest.mock('../src/screens/SettingsScreen', () => () => null);
jest.mock('../src/context/GoalContext', () => ({GoalProvider: ({children}: {children: React.ReactNode}) => children}));
jest.mock('@react-navigation/native', () => ({NavigationContainer: ({children}: {children: React.ReactNode}) => children}));
jest.mock('@react-navigation/bottom-tabs', () => {
  const {View, Text: MockText} = require('react-native');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
      Screen: ({name}: {name: string}) => <MockText>{name}</MockText>,
    }),
  };
});

test('registers the Home, History, and Settings tabs', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(renderer!.root.findAllByType(Text).map(node => node.props.children)).toEqual([
    'Home', 'History', 'Settings',
  ]);
});
