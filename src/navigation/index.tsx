import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, color }}>{name}</Text>
    </View>
  );
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
        component={PlaceholderScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⌂" focused={false} color={color} /> }}
      />
      <Tab.Screen
        name="History"
        component={PlaceholderScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="◷" focused={false} color={color} /> }}
      />
      <Tab.Screen
        name="Pay"
        component={PlaceholderScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="◈" focused={false} color={color} /> }}
      />
      <Tab.Screen
        name="Leave"
        component={PlaceholderScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⊞" focused={false} color={color} /> }}
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
        component={PlaceholderScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⊟" focused={false} color={color} /> }}
      />
      <Tab.Screen
        name="Staff"
        component={PlaceholderScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⊕" focused={false} color={color} /> }}
      />
      <Tab.Screen
        name="Leave"
        component={PlaceholderScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="⊞" focused={false} color={color} /> }}
      />
      <Tab.Screen
        name="Payroll"
        component={PlaceholderScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="◈" focused={false} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function PlaceholderScreen() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: theme.text3, fontSize: 14 }}>Coming soon</Text>
    </View>
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