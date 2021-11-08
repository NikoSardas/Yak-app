import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import AppLoading from 'expo-app-loading';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

import Start from './components/Start'
import Chat from './components/Chat'

const Stack = createStackNavigator()

export default function App() {
  let [fontsLoaded] = useFonts({
    Regular: Poppins_400Regular,
    Bold: Poppins_600SemiBold
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen name="Start" component={Start}/>
        <Stack.Screen name="Chat" component={Chat}/>
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  )
}