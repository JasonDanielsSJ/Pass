import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ComplianceResultView } from '../../src/components/ComplianceResult';
import { api } from '../../src/services/api';
import type { GapStep } from '@voltpass/types';

const PILOT_STATES = [
  { code: 'TX', name: 'Texas' },
  { code: 'CA', name: 'California' },
  { code: 'FL', name: 'Florida' },
  { code: 'NV', name: 'Nevada' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'CO', name: 'Colorado' },
  { code: 'GA', name: 'Georgia' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'VA', name: 'Virginia' },
  { code: 'PA', name: 'Pennsylvania' },
];

const TRADE_LEVELS = ['journeyman', 'master', 'contractor'] as const;

export default function CheckTab() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('journeyman');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  async function runCheck() {
    if (!selectedState) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await api.compliance.check(selectedState, selectedLevel) as { data: any };
      setResult(resp.data);
    } catch (e: any) {
      setResult({ verdict: 'ineligible', message: e.message, clearedToWork: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkComplete(stepId: string) {
    // In production, post to API to mark step done then re-run check
    if (!selectedState) return;
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/compliance/gap-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, targetState: selectedState, tradeLevel: selectedLevel }),
      });
      await runCheck();
    } catch { /* ignore */ }
  }

  if (result) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setResult(null)}>
          <Text style={styles.backBtnText}>← Check another state</Text>
        </TouchableOpacity>
        <ComplianceResultView
          verdict={result.verdict}
          message={result.message}
          targetState={selectedState ?? ''}
          gapSteps={result.gapSteps}
          estimatedDaysToCompliant={result.estimatedDaysToCompliant}
          onMarkComplete={handleMarkComplete}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Select target state</Text>
      <View style={styles.stateGrid}>
        {PILOT_STATES.map(({ code, name }) => (
          <TouchableOpacity
            key={code}
            style={[styles.stateCard, selectedState === code && styles.stateCardActive]}
            onPress={() => setSelectedState(code)}
          >
            <Text style={[styles.stateCode, selectedState === code && styles.stateCodeActive]}>{code}</Text>
            <Text style={[styles.stateName, selectedState === code && styles.stateNameActive]} numberOfLines={1}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Trade level</Text>
      <View style={styles.levelRow}>
        {TRADE_LEVELS.map(level => (
          <TouchableOpacity
            key={level}
            style={[styles.levelChip, selectedLevel === level && styles.levelChipActive]}
            onPress={() => setSelectedLevel(level)}
          >
            <Text style={[styles.levelText, selectedLevel === level && styles.levelTextActive]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.checkBtn, (!selectedState || loading) && styles.checkBtnDisabled]}
        onPress={runCheck}
        disabled={!selectedState || loading}
      >
        {loading
          ? <ActivityIndicator color="#1e3a5f" />
          : <Text style={styles.checkBtnText}>Check Compliance</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12, marginTop: 20 },
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stateCard: { width: '18%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0' },
  stateCardActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  stateCode: { fontSize: 14, fontWeight: '800', color: '#374151' },
  stateCodeActive: { color: '#f59e0b' },
  stateName: { fontSize: 8, color: '#64748b', marginTop: 2 },
  stateNameActive: { color: '#93c5fd' },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0' },
  levelChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  levelText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  levelTextActive: { color: '#ffffff' },
  checkBtn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  checkBtnDisabled: { opacity: 0.5 },
  checkBtnText: { color: '#1e3a5f', fontSize: 17, fontWeight: '800' },
  backBtn: { padding: 16 },
  backBtnText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
});
