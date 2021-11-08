import React from 'react'

// Import status-bar
import { StatusBar } from 'expo-status-bar'

// Import navigation
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

// Import loading indicator
import AppLoading from 'expo-app-loading'

// Import fonts
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins'

// Import main app pages
import Start from './components/Start'
import Chat from './components/Chat'

// Navigation container
const Stack = createStackNavigator()

export default function App() {
  let [fontsLoaded] = useFonts({
    Regular: Poppins_400Regular,
    Bold: Poppins_600SemiBold,
  })

  //Show loader until fonts are loaded
  if (!fontsLoaded) {
    return <AppLoading />
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen name="Start" component={Start} />
        <Stack.Screen name="Chat" component={Chat} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  )
}
