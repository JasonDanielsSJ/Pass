import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/services/api';

export default function VerifyingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    licenseNumber: string;
    issuingState: string;
    licenseType: string;
    tradeLevel: string;
    expiryDate: string;
  }>();

  const [status, setStatus] = useState<'verifying' | 'done' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        await api.credentials.create({
          licenseNumber: params.licenseNumber,
          issuingState: params.issuingState,
          licenseType: params.licenseType,
          tradeLevel: params.tradeLevel,
          expiryDate: params.expiryDate,
          verificationMethod: 'scrape',
        });
        setStatus('done');
        setTimeout(() => router.replace('/(tabs)/wallet'), 1500);
      } catch (e: any) {
        setError(e.message);
        setStatus('error');
      }
    }
    verify();
  }, []);

  return (
    <View style={styles.container}>
      {status === 'verifying' && (
        <>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.title}>Verifying your license…</Text>
          <Text style={styles.subtitle}>Checking with the state board. This takes about 30 seconds.</Text>
        </>
      )}
      {status === 'done' && (
        <>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.title}>License Verified!</Text>
          <Text style={styles.subtitle}>Taking you to your wallet…</Text>
        </>
      )}
      {status === 'error' && (
        <>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.title}>Verification issue</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <Text style={styles.hint}>Your license was saved as "pending". You can upload a document to complete verification.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e3a5f', justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#bfdbfe', marginTop: 10, textAlign: 'center', lineHeight: 22 },
  checkmark: { fontSize: 72, color: '#4ade80' },
  errorIcon: { fontSize: 64, color: '#fbbf24' },
  hint: { fontSize: 13, color: '#93c5fd', marginTop: 16, textAlign: 'center', lineHeight: 20 },
});
