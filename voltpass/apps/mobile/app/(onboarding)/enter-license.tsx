import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';

const US_STATES = ['TX','CA','FL','NV','AZ','CO','GA','NC','VA','PA','AL','AK','AR','CT','DE','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NH','NJ','NM','NY','ND','OH','OK','OR','RI','SC','SD','TN','UT','VT','WA','WV','WI','WY'];

export default function EnterLicenseScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'account' | 'license'>('account');
  const [loading, setLoading] = useState(false);

  // Account fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [homeState, setHomeState] = useState('TX');
  const [tradeType, setTradeType] = useState('journeyman');

  // License fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuingState, setIssuingState] = useState('TX');
  const [licenseType, setLicenseType] = useState('Journeyman Electrician');
  const [tradeLevel, setTradeLevel] = useState('journeyman');
  const [expiryDate, setExpiryDate] = useState('');

  async function handleAccountSubmit() {
    if (!name || !email || !homeState) return Alert.alert('Missing fields', 'Please fill in all fields.');
    setLoading(true);
    try {
      await api.auth.sendMagicLink(email, name, tradeType, homeState);
      setStep('license');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLicenseSubmit() {
    if (!licenseNumber || !expiryDate) return Alert.alert('Missing fields', 'Please fill in all fields.');
    router.push({ pathname: '/(onboarding)/verifying', params: { licenseNumber, issuingState, licenseType, tradeLevel, expiryDate } });
  }

  if (step === 'account') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>We'll send you a magic link to sign in.</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jane Smith" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="jane@example.com" keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Home State</Text>
        <View style={styles.stateGrid}>
          {['TX', 'CA', 'FL', 'NV', 'AZ', 'CO', 'GA', 'NC', 'VA', 'PA'].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.stateChip, homeState === s && styles.stateChipActive]}
              onPress={() => setHomeState(s)}
            >
              <Text style={[styles.stateChipText, homeState === s && styles.stateChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Trade Level</Text>
        <View style={styles.levelRow}>
          {['journeyman', 'master', 'contractor'].map(level => (
            <TouchableOpacity
              key={level}
              style={[styles.levelChip, tradeType === level && styles.levelChipActive]}
              onPress={() => setTradeType(level)}
            >
              <Text style={[styles.levelChipText, tradeType === level && styles.levelChipTextActive]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleAccountSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#1e3a5f" /> : <Text style={styles.primaryBtnText}>Continue</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add your license</Text>
      <Text style={styles.subtitle}>We'll verify it with the state board automatically.</Text>

      <Text style={styles.label}>License Number</Text>
      <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="e.g. TX-J-123456" autoCapitalize="characters" />

      <Text style={styles.label}>Issuing State</Text>
      <View style={styles.stateGrid}>
        {['TX', 'CA', 'FL', 'NV', 'AZ', 'CO', 'GA', 'NC', 'VA', 'PA'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.stateChip, issuingState === s && styles.stateChipActive]}
            onPress={() => setIssuingState(s)}
          >
            <Text style={[styles.stateChipText, issuingState === s && styles.stateChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>License Type</Text>
      <TextInput style={styles.input} value={licenseType} onChangeText={setLicenseType} placeholder="Journeyman Electrician" />

      <Text style={styles.label}>Trade Level</Text>
      <View style={styles.levelRow}>
        {['journeyman', 'master', 'contractor'].map(level => (
          <TouchableOpacity
            key={level}
            style={[styles.levelChip, tradeLevel === level && styles.levelChipActive]}
            onPress={() => setTradeLevel(level)}
          >
            <Text style={[styles.levelChipText, tradeLevel === level && styles.levelChipTextActive]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={expiryDate} onChangeText={setExpiryDate} placeholder="2026-12-31" />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleLicenseSubmit}>
        <Text style={styles.primaryBtnText}>Verify My License</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, backgroundColor: '#f8fafc', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#1e3a5f', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1e293b' },
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  stateChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  stateChipText: { color: '#475569', fontWeight: '600' },
  stateChipTextActive: { color: '#ffffff' },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelChip: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  levelChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  levelChipText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  levelChipTextActive: { color: '#fff' },
  primaryBtn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  primaryBtnText: { color: '#1e3a5f', fontSize: 17, fontWeight: '800' },
});
