import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Animated, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const TYPES = ['sick', 'personal', 'other'];

export default function LeaveScreen() {
  const { theme, isDark } = useTheme();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState('');
  const [type, setType] = useState('sick');
  const [reason, setReason] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRequests();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchRequests = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('absence_requests')
      .select('*')
      .eq('employee_id', profile.id)
      .order('created_at', { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!date || !reason) { Alert.alert('Missing fields', 'Please fill in the date and reason'); return; }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) { Alert.alert('Invalid date', 'Use format YYYY-MM-DD e.g. 2026-05-20'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('absence_requests')
      .insert({ employee_id: profile!.id, date, type, reason, status: 'pending' });
    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Submitted', 'Your request has been sent for approval');
      setDate(''); setReason(''); setType('sick');
      fetchRequests();
    }
    setSubmitting(false);
  };

  const statusColor = (s: string) => ({
    approved: theme.greenText, rejected: theme.redText, pending: theme.text3,
  }[s] || theme.text3);

  const statusBg = (s: string) => ({
    approved: theme.greenBg, rejected: theme.redBg, pending: theme.bg3,
  }[s] || theme.bg3);

  const statusBorder = (s: string) => ({
    approved: theme.greenBorder, rejected: theme.redBorder, pending: theme.border2,
  }[s] || theme.border2);

  const st = styles(theme);

  if (loading) return (
    <View style={st.center}>
      <ActivityIndicator color={theme.green} size="large" />
    </View>
  );

  return (
    <View style={st.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <ScrollView style={st.scroll} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={st.header}>
            <Text style={st.title}>Leave</Text>
            <Text style={st.sub}>Request an absence</Text>
          </View>

          <View style={st.card}>
            <View style={st.field}>
              <Text style={st.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={st.input}
                value={date}
                onChangeText={setDate}
                placeholder="2026-05-20"
                placeholderTextColor={theme.text3}
              />
            </View>

            <View style={st.field}>
              <Text style={st.label}>Type</Text>
              <View style={st.typeRow}>
                {TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[st.typePill, type === t && st.typePillActive]}
                    onPress={() => setType(t)}>
                    <Text style={[st.typePillText, type === t && st.typePillTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={st.field}>
              <Text style={st.label}>Reason</Text>
              <TextInput
                style={[st.input, st.textarea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Brief description..."
                placeholderTextColor={theme.text3}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[st.btn, submitting && st.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}>
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={st.btnText}>Submit request</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={st.sectionTitle}>My requests</Text>

          {requests.length === 0 && (
            <View style={st.emptyBox}>
              <Text style={st.emptyText}>No requests yet</Text>
            </View>
          )}

          {requests.map(req => (
            <View key={req.id} style={st.reqCard}>
              <View style={st.reqLeft}>
                <Text style={st.reqDate}>{req.date}</Text>
                <Text style={st.reqType}>{req.type} leave</Text>
                {req.reason && <Text style={st.reqReason}>"{req.reason}"</Text>}
              </View>
              <View style={[st.badge, { backgroundColor: statusBg(req.status), borderColor: statusBorder(req.status) }]}>
                <Text style={[st.badgeText, { color: statusColor(req.status) }]}>{req.status}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = (t: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: t.bg },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
  header: { paddingTop: 16, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: t.text3, marginTop: 3 },
  card: {
    backgroundColor: t.bg2, borderRadius: 14,
    borderWidth: 0.5, borderColor: t.border,
    padding: 18, gap: 14, marginBottom: 28,
  },
  field: { gap: 6 },
  label: { fontSize: 12, color: t.text2, letterSpacing: 0.4, fontWeight: '500' },
  input: {
    backgroundColor: t.bg3, borderWidth: 0.5,
    borderColor: t.border2, borderRadius: 10,
    padding: 12, fontSize: 14, color: t.text,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typePill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 100, borderWidth: 0.5, borderColor: t.border2,
  },
  typePillActive: { backgroundColor: t.green, borderColor: t.green },
  typePillText: { fontSize: 13, color: t.text3, fontWeight: '500' },
  typePillTextActive: { color: '#fff', fontWeight: '700' },
  btn: {
    backgroundColor: t.green, borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: t.text3, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: t.text3, fontSize: 14 },
  reqCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', backgroundColor: t.bg2,
    borderRadius: 12, borderWidth: 0.5,
    borderColor: t.border, padding: 14, marginBottom: 8,
  },
  reqLeft: { flex: 1 },
  reqDate: { fontSize: 14, fontWeight: '600', color: t.text },
  reqType: { fontSize: 12, color: t.text3, marginTop: 2 },
  reqReason: { fontSize: 12, color: t.text3, marginTop: 3, fontStyle: 'italic' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});