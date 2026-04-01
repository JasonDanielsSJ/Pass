import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Share, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { LicenseCard } from '../src/components/LicenseCard';
import { api } from '../src/services/api';
import { generateQRPayload } from '@voltpass/vc';

const QR_REFRESH_INTERVAL = 60 * 1000; // 60 seconds

export default function CredentialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [credential, setCredential] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [qrPayload, setQrPayload] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    api.credentials.get(id)
      .then((r: any) => setCredential(r.data))
      .catch(() => Alert.alert('Error', 'Could not load credential'))
      .finally(() => setLoading(false));
  }, [id]);

  // QR refresh every 60s
  useEffect(() => {
    if (!credential?.vcJwt) return;

    function refreshQR() {
      const payload = generateQRPayload(credential.vcJwt, credential.id, 3600);
      setQrPayload(payload);
      setQrExpiresAt(new Date(Date.now() + 3600 * 1000));
    }

    refreshQR();
    const interval = setInterval(refreshQR, QR_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [credential]);

  // Countdown timer
  useEffect(() => {
    if (!qrExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, qrExpiresAt.getTime() - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [qrExpiresAt]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e3a5f" /></View>;
  if (!credential) return null;

  if (showShare) {
    return (
      <View style={styles.shareContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setShowShare(false)}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.shareTitle}>Share Credential</Text>
        <Text style={styles.holdNear}>Hold near reader</Text>

        {qrPayload ? (
          <View style={styles.qrWrapper}>
            <QRCode value={qrPayload} size={240} backgroundColor="#ffffff" color="#1e293b" />
          </View>
        ) : (
          <View style={styles.noVcWarning}>
            <Text style={styles.noVcText}>QR not available — credential still being verified</Text>
          </View>
        )}

        {timeLeft && (
          <View style={styles.expiryBanner}>
            <Text style={styles.expiryBannerText}>This code expires in {timeLeft}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Wallet</Text>
      </TouchableOpacity>

      <LicenseCard
        licenseNumber={credential.licenseNumber}
        issuingState={credential.issuingState}
        licenseType={credential.licenseType}
        tradeLevel={credential.tradeLevel}
        holderName={'My License'}
        expiryDate={credential.expiryDate}
        status={credential.status}
        lastVerifiedAt={credential.lastVerifiedAt}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => setShowShare(true)}>
          <Text style={styles.primaryActionIcon}>📲</Text>
          <Text style={styles.primaryActionText}>Share / Show QR</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { paddingBottom: 12 },
  backBtnText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
  actions: { marginTop: 24, gap: 12 },
  primaryAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e3a5f', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, gap: 12 },
  primaryActionIcon: { fontSize: 22 },
  primaryActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  shareContainer: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', padding: 24, paddingTop: 60 },
  shareTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  holdNear: { color: '#93c5fd', fontSize: 15, marginBottom: 32 },
  qrWrapper: { backgroundColor: '#ffffff', padding: 24, borderRadius: 20 },
  expiryBanner: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  expiryBannerText: { color: '#fcd34d', fontSize: 14, fontWeight: '600' },
  noVcWarning: { padding: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16 },
  noVcText: { color: '#93c5fd', textAlign: 'center', fontSize: 14 },
});
