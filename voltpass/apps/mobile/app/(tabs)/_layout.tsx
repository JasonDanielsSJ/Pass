import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1e3a5f' },
        headerTintColor: '#ffffff',
        tabBarStyle: { backgroundColor: '#1e3a5f', borderTopColor: 'rgba(255,255,255,0.1)' },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#93c5fd',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color }) => <TabIcon icon="💳" color={color} />,
          headerTitle: 'My Credentials',
        }}
      />
      <Tabs.Screen
        name="check"
        options={{
          title: 'Check',
          tabBarLabel: 'Check',
          tabBarIcon: ({ color }) => <TabIcon icon="🗺" color={color} />,
          headerTitle: 'Compliance Check',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
          headerTitle: 'My Profile',
        }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#f59e0b' ? 1 : 0.6 }}>{icon}</Text>;
}
