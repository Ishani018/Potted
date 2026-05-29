import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { GameProvider } from './src/context/GameContext';
import GardenScreen from './src/screens/GardenScreen';
import ShopScreen from './src/screens/ShopScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import RoomScreen from './src/screens/RoomScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GameProvider>
      <NavigationContainer>
        <StatusBar hidden />
        <Stack.Navigator
          initialRouteName="Garden"
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animationEnabled: true,
            cardStyle: { backgroundColor: '#000' },
          }}
        >
          <Stack.Screen name="Garden" component={GardenScreen} />
          <Stack.Screen name="Shop" component={ShopScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
          <Stack.Screen name="Room" component={RoomScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GameProvider>
  );
}
