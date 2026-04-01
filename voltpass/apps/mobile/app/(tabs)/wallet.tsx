import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LicenseCard } from '../../src/components/LicenseCard';
import { api, cacheCredentials, getCachedCredentials } from '../../src/services/api';

export default function WalletTab() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState<Date | null>(null);

  const loadCredentials = useCallback(async () => {
    try {
      const { data } = await api.credentials.list() as { data: any[] };
      setCredentials(data);
      setOffline(false);
      await cacheCredentials(data);
    } catch {
      // Fall back to cache
      const { credentials: cached, cachedAt: ts } = await getCachedCredentials();
      if (cached.length > 0) {
        setCredentials(cached);
        setOffline(true);
        setCachedAt(ts);
      } else {
        Alert.alert('Network error', 'Could not load credentials. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadCredentials(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline mode — last verified {cachedAt ? formatRelativeTime(cachedAt) : 'recently'}
          </Text>
        </View>
      )}

      <FlatList
        data={credentials}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCredentials(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No credentials yet</Text>
            <Text style={styles.emptySubtitle}>Add your electrician license to get started.</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(onboarding)/enter-license')}>
              <Text style={styles.addBtnText}>+ Add License</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/credential-detail', params: { id: item.id } })}
          >
            <LicenseCard
              licenseNumber={item.licenseNumber}
              issuingState={item.issuingState}
              licenseType={item.licenseType}
              tradeLevel={item.tradeLevel}
              holderName={'My License'}
              expiryDate={item.expiryDate}
              status={item.status}
              lastVerifiedAt={item.lastVerifiedAt}
            />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListFooterComponent={
          credentials.length > 0
            ? (
              <TouchableOpacity style={styles.addAnotherBtn} onPress={() => router.push('/(onboarding)/enter-license')}>
                <Text style={styles.addAnotherText}>+ Add Another License</Text>
              </TouchableOpacity>
            )
            : null
        }
      />
    </View>
  );
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  offlineBanner: { backgroundColor: '#fef3c7', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  offlineText: { color: '#92400e', fontSize: 13, textAlign: 'center' },
  list: { paddingVertical: 24, paddingHorizontal: 0 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  addBtn: { backgroundColor: '#1e3a5f', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  addAnotherBtn: { margin: 16, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#1e3a5f', borderStyle: 'dashed', alignItems: 'center' },
  addAnotherText: { color: '#1e3a5f', fontWeight: '700', fontSize: 15 },
});
