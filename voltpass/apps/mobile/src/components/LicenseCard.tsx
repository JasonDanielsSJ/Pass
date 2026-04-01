import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LicenseCardProps {
  licenseNumber: string;
  issuingState: string;
  licenseType: string;
  tradeLevel: string;
  holderName: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended' | 'pending';
  lastVerifiedAt?: string | null;
}

const STATUS_COLORS = {
  active: '#16a34a',
  expired: '#dc2626',
  suspended: '#d97706',
  pending: '#6b7280',
};

const STATUS_LABELS = {
  active: 'ACTIVE',
  expired: 'EXPIRED',
  suspended: 'SUSPENDED',
  pending: 'PENDING',
};

export function LicenseCard({
  licenseNumber,
  issuingState,
  licenseType,
  tradeLevel,
  holderName,
  expiryDate,
  status,
  lastVerifiedAt,
}: LicenseCardProps) {
  const daysUntilExpiry = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const expiryText =
    daysUntilExpiry > 0
      ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
      : 'Expired';

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.header}>
        <View style={styles.stateSealPlaceholder}>
          <Text style={styles.stateSealText}>{issuingState}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.stateLabel}>{issuingState} ELECTRICAL LICENSE</Text>
          <Text style={styles.licenseType}>{licenseType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Card body */}
      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>LICENSE HOLDER</Text>
          <Text style={styles.fieldValue}>{holderName}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>LICENSE #</Text>
            <Text style={styles.fieldValue}>{licenseNumber}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>TRADE LEVEL</Text>
            <Text style={styles.fieldValue}>{tradeLevel.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.expiryText, daysUntilExpiry <= 30 ? styles.expiryWarning : null]}>
          {expiryText}
        </Text>
        {lastVerifiedAt && (
          <Text style={styles.verifiedText}>
            Verified {formatRelativeTime(lastVerifiedAt)}
          </Text>
        )}
      </View>
    </View>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e3a5f',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stateSealPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stateSealText: {
    color: '#1e3a5f',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerText: {
    flex: 1,
  },
  stateLabel: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  licenseType: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 12,
  },
  body: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    color: '#93c5fd',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  fieldValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryText: {
    color: '#d1fae5',
    fontSize: 12,
    fontWeight: '500',
  },
  expiryWarning: {
    color: '#fcd34d',
  },
  verifiedText: {
    color: '#93c5fd',
    fontSize: 11,
  },
});
