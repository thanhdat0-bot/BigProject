import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screen/Home/HomeScreen';
import ProfileScreen from '../screen/Profile/ProfileScreen';
import EditProfileScreen from '../screen/Profile/EditProfileScreen';
import ChangePasswordScreen from '../screen/Profile/ChangePasswordScreen';
import CategoryScreen from '../screen/Function/CategoryScreen';
import CategoryDetailScreen from '../screen/Function/CategoryDetail';
import TransactionScreen from '../screen/Function/TransactionScreen';
import TransactionDetail from '../screen/Function/TransactionDetail';
import BudgetLimitScreen from '../screen/Function/BudgetLimitScreen';
import NoteScreen from '../screen/Function/NoteScreen';
import ReminderScreen from '../screen/Function/ReminderScreen';
import NoteDetail from '../screen/Function/NoteDetail';
import ChatScreen from '../screen/Conversation/ChatScreen';
import ChatListScreen from '../screen/Conversation/ChatListScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeHeaderButton({ navigation }) {
  return (
    <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.navigate('Home')}>
      <Icon name="home" size={26} color="#FFD600" />
    </TouchableOpacity>
  );
}

function FunctionTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: '#181818', shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#FFD600',
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#FFD600' },
        tabBarStyle: { backgroundColor: '#181818', borderTopColor: '#FFD600' },
        tabBarActiveTintColor: '#FFD600',
        tabBarInactiveTintColor: '#888',
        headerLeft: () => <HomeHeaderButton navigation={navigation} />,
      })}
    >
      <Tab.Screen
        name="Transaction"
        component={TransactionScreen}
        options={{
          tabBarLabel: 'Giao dịch',
          headerTitle: 'Quản lý giao dịch',
          tabBarIcon: ({ color, size }) => <Icon name="swap-horizontal" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Category"
        component={CategoryScreen}
        options={{
          tabBarLabel: 'Danh mục',
          headerTitle: 'Quản lý danh mục',
          tabBarIcon: ({ color, size }) => <Icon name="folder" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="BudgetLimit"
        component={BudgetLimitScreen}
        options={{
          tabBarLabel: 'Hạn mức',
          headerTitle: 'Hạn mức',
          tabBarIcon: ({ color, size }) => <Icon name="finance" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Note"
        component={NoteScreen}
        options={{
          tabBarLabel: 'Ghi chú',
          headerTitle: 'Ghi chú',
          tabBarIcon: ({ color, size }) => <Icon name="note-text" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Reminder"
        component={ReminderScreen}
        options={{
          tabBarLabel: 'Nhắc nhở',
          headerTitle: 'Nhắc nhở',
          tabBarIcon: ({ color, size }) => <Icon name="alarm" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          headerTitle: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <Icon name="account-circle" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Trang chủ',
          headerStyle: { backgroundColor: '#181818', shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#FFD600',
          headerTitleAlign: 'center',
          headerBackVisible: false,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#FFD600' }
        }}
      />
      <Stack.Screen name="FunctionTabs" component={FunctionTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="CategoryDetail"
        component={CategoryDetailScreen}
        options={({ navigation }) => ({
          title: 'Chi tiết danh mục',
          headerStyle: { backgroundColor: '#181818', shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#FFD600',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#FFD600' },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={26} color="#FFD600" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetail}
        options={({ navigation }) => ({
          title: 'Chi tiết giao dịch',
          headerStyle: { backgroundColor: '#181818', shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#FFD600',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#FFD600' },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={26} color="#FFD600" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetail}
        options={({ navigation }) => ({
          title: 'Chi tiết ghi chú',
          headerStyle: { backgroundColor: '#181818', shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#FFD600',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#FFD600' },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={26} color="#FFD600" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={({ navigation }) => ({
          title: 'Chỉnh sửa hồ sơ',
          headerStyle: { backgroundColor: '#181818', shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#FFD600',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#FFD600' },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={26} color="#FFD600" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={({ navigation }) => ({
          title: 'Đổi mật khẩu',
          headerStyle: { backgroundColor: '#181818', shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#FFD600',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#FFD600' },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={26} color="#FFD600" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="ChatListScreen" component={ChatListScreen} options={{ title: 'Đoạn chat' }} />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={({ navigation }) => ({
          title: 'Chat',
          headerStyle: { backgroundColor: '#181818', shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#FFD600',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20, color: '#FFD600' },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={26} color="#FFD600" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}