import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import LoginScreen from './screen/Auth/LoginScreen';
import RegisterScreen from './screen/Auth/RegisterScreen';
import EmailOtpScreen from './screen/Auth/EmailOtpScreen';
import ForgotPasswordScreen from './screen/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from './screen/Auth/ResetPasswordScreen';
import AppNavigator from './components/AppNavigator';

const RootStack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <RootStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
          <RootStack.Screen name="EmailOtp" component={EmailOtpScreen} />
          <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <RootStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <RootStack.Screen name="MainApp" component={AppNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}