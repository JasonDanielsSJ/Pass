import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { clearToken } from '../../src/services/api';

export default function ProfileTab() {
  const router = useRouter();

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearToken();
          router.replace('/(onboarding)/welcome');
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.planCard}>
        <Text style={styles.planLabel}>Current Plan</Text>
        <Text style={styles.planName}>Free</Text>
        <Text style={styles.planLimits}>1 credential · 3 state checks</Text>
        <TouchableOpacity style={styles.upgradeBtn}>
          <Text style={styles.upgradeBtnText}>Upgrade to Pro — $9.99/mo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {[
          { label: 'Notification Settings', icon: '🔔' },
          { label: 'Manage Credentials', icon: '💳' },
          { label: 'Privacy & Security', icon: '🔐' },
          { label: 'Help & Support', icon: '💬' },
        ].map(({ label, icon }) => (
          <TouchableOpacity key={label} style={styles.menuRow}>
            <Text style={styles.menuIcon}>{icon}</Text>
            <Text style={styles.menuLabel}>{label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>VoltPass v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  planCard: { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 24 },
  planLabel: { color: '#93c5fd', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  planName: { color: '#fff', fontSize: 28, fontWeight: '900', marginVertical: 4 },
  planLimits: { color: '#bfdbfe', fontSize: 13, marginBottom: 16 },
  upgradeBtn: { backgroundColor: '#f59e0b', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  upgradeBtnText: { color: '#1e3a5f', fontWeight: '800', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: '#1e293b' },
  menuArrow: { fontSize: 20, color: '#94a3b8' },
  signOutBtn: { padding: 16, alignItems: 'center' },
  signOutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 8 },
});
