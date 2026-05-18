import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/staff/HomeScreen';
import HistoryScreen from '../screens/staff/HistoryScreen';
import PayScreen from '../screens/staff/PayScreen';
import LeaveScreen from '../screens/staff/LeaveScreen';
import DashboardScreen from '../screens/admin/DashboardScreen';
import StaffScreen from '../screens/admin/StaffScreen';
import AdminLeaveScreen from '../screens/admin/LeaveScreen';
import PayrollScreen from '../screens/admin/PayrollScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{name}</Text>;
}

function StaffTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bg2,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.green,
        tabBarInactiveTintColor: theme.text3,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⌂" color={color} /> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="◷" color={color} /> }}
      />
      <Tab.Screen
        name="Pay"
        component={PayScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="◈" color={color} /> }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⊞" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bg2,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.green,
        tabBarInactiveTintColor: theme.text3,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}>
      <Tab.Screen
        name="Today"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⊟" color={color} /> }}
      />
      <Tab.Screen
        name="Staff"
        component={StaffScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⊕" color={color} /> }}
      />
      <Tab.Screen
        name="Leave"
        component={AdminLeaveScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⊞" color={color} /> }}
      />
      <Tab.Screen
        name="Payroll"
        component={PayrollScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="◈" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { theme, isDark } = useTheme();
  const { session, profile, loading } = useAuth();

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={theme.green} size="large" />
    </View>
  );

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.bg, card: theme.bg2, border: theme.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.bg, card: theme.bg2, border: theme.border } };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session || !profile ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : profile.role === 'admin' ? (
          <Stack.Screen name="Admin" component={AdminTabs} />
        ) : (
          <Stack.Screen name="Staff" component={StaffTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}