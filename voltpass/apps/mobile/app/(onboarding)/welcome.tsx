import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.bolt}>⚡</Text>
        <Text style={styles.title}>VoltPass</Text>
        <Text style={styles.tagline}>
          Your digital electrician credential wallet.{'\n'}
          Work anywhere. Verified in seconds.
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: '🔐', text: 'Cryptographically signed licenses' },
          { icon: '🗺', text: 'Instant multi-state compliance check' },
          { icon: '📲', text: 'Works offline — no signal needed' },
        ].map(({ icon, text }) => (
          <View key={text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(onboarding)/enter-license')}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(onboarding)/enter-license')}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e3a5f', justifyContent: 'space-between', padding: 32 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  bolt: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 42, fontWeight: '900', color: '#f59e0b', letterSpacing: -1 },
  tagline: { fontSize: 17, color: '#bfdbfe', textAlign: 'center', lineHeight: 26, marginTop: 12 },
  features: { gap: 16, marginVertical: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 22 },
  featureText: { color: '#e0f2fe', fontSize: 15 },
  actions: { gap: 12, paddingBottom: 16 },
  primaryBtn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#1e3a5f', fontSize: 17, fontWeight: '800' },
  secondaryBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#93c5fd', fontSize: 15 },
});
