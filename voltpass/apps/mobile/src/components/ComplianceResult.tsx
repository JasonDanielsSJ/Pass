import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import type { GapStep, ComplianceVerdict } from '@voltpass/types';

interface ComplianceResultProps {
  verdict: ComplianceVerdict;
  message: string;
  targetState: string;
  gapSteps?: GapStep[];
  estimatedDaysToCompliant?: number;
  onGapStepPress?: (step: GapStep) => void;
  onMarkComplete?: (stepId: string) => void;
}

export function ComplianceResultView({
  verdict,
  message,
  targetState,
  gapSteps,
  estimatedDaysToCompliant,
  onGapStepPress,
  onMarkComplete,
}: ComplianceResultProps) {
  if (verdict === 'compliant') {
    return (
      <View style={[styles.container, styles.compliant]}>
        <Text style={styles.bigIcon}>✓</Text>
        <Text style={styles.stateLabel}>{targetState}</Text>
        <Text style={styles.verdictTitle}>You're cleared to work</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    );
  }

  if (verdict === 'ineligible') {
    return (
      <View style={[styles.container, styles.ineligible]}>
        <Text style={styles.bigIcon}>✗</Text>
        <Text style={styles.stateLabel}>{targetState}</Text>
        <Text style={styles.verdictTitle}>Not eligible</Text>
        <Text style={styles.message}>{message}</Text>
        {estimatedDaysToCompliant && estimatedDaysToCompliant > 0 && (
          <Text style={styles.timeline}>
            Estimated full application: ~{estimatedDaysToCompliant} days
          </Text>
        )}
      </View>
    );
  }

  // Partial
  return (
    <View style={[styles.container, styles.partial]}>
      <Text style={styles.bigIcon}>⚠</Text>
      <Text style={styles.stateLabel}>{targetState}</Text>
      <Text style={styles.verdictTitle}>Almost there</Text>
      <Text style={styles.message}>{message}</Text>
      {estimatedDaysToCompliant != null && estimatedDaysToCompliant > 0 && (
        <Text style={styles.timeline}>
          Estimated time to compliant: ~{estimatedDaysToCompliant} days
        </Text>
      )}
      {(gapSteps?.length ?? 0) > 0 && (
        <ScrollView style={styles.gapStepsList}>
          {gapSteps!.map((step) => (
            <GapStepCard
              key={step.requirementId}
              step={step}
              onPress={() => onGapStepPress?.(step)}
              onMarkComplete={() => onMarkComplete?.(step.requirementId)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function GapStepCard({
  step,
  onPress,
  onMarkComplete,
}: {
  step: GapStep;
  onPress: () => void;
  onMarkComplete: () => void;
}) {
  return (
    <View style={styles.gapCard}>
      <View style={styles.gapCardContent}>
        <Text style={styles.gapName}>{step.name}</Text>
        {step.description && <Text style={styles.gapDesc}>{step.description}</Text>}
        <View style={styles.gapMeta}>
          {step.feeAmount != null && (
            <Text style={styles.gapMetaItem}>${step.feeAmount} fee</Text>
          )}
          {step.processingDays != null && step.processingDays > 0 && (
            <Text style={styles.gapMetaItem}>{step.processingDays} days</Text>
          )}
        </View>
        {step.formUrl && (
          <TouchableOpacity onPress={() => Linking.openURL(step.formUrl!)}>
            <Text style={styles.gapLink}>Open state board form →</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.markCompleteBtn} onPress={onMarkComplete}>
        <Text style={styles.markCompleteText}>Mark Complete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    margin: 16,
  },
  compliant: { backgroundColor: '#dcfce7', borderColor: '#16a34a', borderWidth: 2 },
  partial: { backgroundColor: '#fef9c3', borderColor: '#ca8a04', borderWidth: 2 },
  ineligible: { backgroundColor: '#fee2e2', borderColor: '#dc2626', borderWidth: 2 },
  bigIcon: { fontSize: 64, marginBottom: 8 },
  stateLabel: { fontSize: 22, fontWeight: '800', marginBottom: 4, color: '#1e293b' },
  verdictTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#1e293b' },
  message: { fontSize: 15, textAlign: 'center', color: '#374151', lineHeight: 22 },
  timeline: { marginTop: 12, fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
  gapStepsList: { marginTop: 20, width: '100%' },
  gapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gapCardContent: { marginBottom: 10 },
  gapName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  gapDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 6 },
  gapMeta: { flexDirection: 'row', gap: 12 },
  gapMetaItem: { fontSize: 12, color: '#374151', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  gapLink: { color: '#2563eb', fontSize: 13, fontWeight: '600', marginTop: 6 },
  markCompleteBtn: { backgroundColor: '#16a34a', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  markCompleteText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});
