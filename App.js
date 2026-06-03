import './imports';
import 'react-native-gesture-handler';
import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GameProvider } from './src/context/GameContext';
import { LayoutContext } from './src/context/LayoutContext';
import MainScreen from './src/screens/MainScreen';
import MapScreen from './src/screens/MapScreen';
import HomeScreen from './src/screens/HomeScreen';
import GardenScreen from './src/screens/GardenScreen';
import NurseryScreen from './src/screens/NurseryScreen';
import PetShopScreen from './src/screens/PetShopScreen';
import TradeScreen from './src/screens/TradeScreen';
import RoomScreen from './src/screens/RoomScreen';

const Stack = createStackNavigator();

export default function App() {
  const [layout, setLayout] = useState({ width: 854, height: 480 });

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setLayout({ width, height });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, overflow: 'hidden' }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <GameProvider>
          <LayoutContext.Provider value={layout}>
            <View style={{ flex: 1 }} onLayout={onLayout}>
              <NavigationContainer>
                <StatusBar hidden />
                <Stack.Navigator
                  initialRouteName="Main"
                  screenOptions={{
                    headerShown: false,
                    gestureEnabled: false,
                    animationEnabled: true,
                    cardStyle: { backgroundColor: '#000' },
                  }}
                >
                  <Stack.Screen name="Main" component={MainScreen} />
                  <Stack.Screen name="Map" component={MapScreen} />
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="Garden" component={GardenScreen} />
                  <Stack.Screen name="Nursery" component={NurseryScreen} />
                  <Stack.Screen name="PetShop" component={PetShopScreen} />
                  <Stack.Screen name="Trade" component={TradeScreen} />
                  <Stack.Screen name="Room" component={RoomScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </View>
          </LayoutContext.Provider>
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
