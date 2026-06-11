import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminLeaveScreen() {
  const { theme, isDark } = useTheme();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRequests();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('absence_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error:', error.message);
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      (data ?? []).map(async (req) => {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', req.employee_id)
          .single();
        return { ...req, profiles: prof };
      })
    );

    setRequests(enriched);
    setLoading(false);
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id + status);
    const { error } = await supabase.from('absence_requests')
      .update({ status, reviewed_by: profile?.id })
      .eq('id', id);
    if (error) Alert.alert('Error', error.message);
    setProcessing(null);
    fetchRequests();
  };

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');
  const s = styles(theme);

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={theme.green} size="large" /></View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={s.header}>
            <Text style={s.title}>Leave Requests</Text>
            <Text style={s.sub}>{pending.length} pending approval</Text>
          </View>

          {pending.length === 0 && (
            <View style={s.allClear}>
              <Text style={s.allClearIcon}>✓</Text>
              <Text style={s.allClearText}>All requests resolved</Text>
            </View>
          )}

          {pending.map(req => (
            <View key={req.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={s.info}>
                  <Text style={s.name}>{req.profiles?.full_name || 'Unknown'}</Text>
                  <Text style={s.meta}>
                    {new Date(req.date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' })} · {req.type} leave
                  </Text>
                  {req.reason && <Text style={s.reason}>"{req.reason}"</Text>}
                </View>
                <View style={s.pendingBadge}>
                  <Text style={s.pendingText}>pending</Text>
                </View>
              </View>
              <View style={s.actions}>
                <TouchableOpacity
                  style={s.approveBtn}
                  onPress={() => handleAction(req.id, 'approved')}
                  disabled={!!processing}>
                  {processing === req.id + 'approved'
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.approveTxt}>Approve</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.rejectBtn}
                  onPress={() => handleAction(req.id, 'rejected')}
                  disabled={!!processing}>
                  {processing === req.id + 'rejected'
                    ? <ActivityIndicator color={theme.red} size="small" />
                    : <Text style={s.rejectTxt}>Reject</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {resolved.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Resolved</Text>
              {resolved.map(req => (
                <View key={req.id} style={s.resolvedCard}>
                  <View style={s.info}>
                    <Text style={s.name}>{req.profiles?.full_name}</Text>
                    <Text style={s.meta}>{req.date} · {req.type}</Text>
                  </View>
                  <View style={[s.badge,
                    req.status === 'approved' ? s.badgeGreen : s.badgeRed]}>
                    <Text style={[s.badgeText,
                      { color: req.status === 'approved' ? theme.greenText : theme.redText }]}>
                      {req.status}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
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
  allClear: { alignItems: 'center', padding: 40, gap: 10 },
  allClearIcon: { fontSize: 28, color: t.green },
  allClearText: { fontSize: 14, color: t.text3 },
  card: { backgroundColor: t.bg2, borderRadius: 14, borderWidth: 0.5, borderColor: t.border, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: t.text },
  meta: { fontSize: 12, color: t.text3, marginTop: 2 },
  reason: { fontSize: 12, color: t.text3, marginTop: 4, fontStyle: 'italic' },
  pendingBadge: { backgroundColor: t.bg3, borderWidth: 0.5, borderColor: t.border2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  pendingText: { fontSize: 11, color: t.text3, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: t.green, borderRadius: 10, padding: 11, alignItems: 'center' },
  approveTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: t.redBg, borderWidth: 0.5, borderColor: t.redBorder, borderRadius: 10, padding: 11, alignItems: 'center' },
  rejectTxt: { color: t.redText, fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: t.text3, marginBottom: 10, marginTop: 20, letterSpacing: 0.5, textTransform: 'uppercase' },
  resolvedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.bg2, borderRadius: 12, borderWidth: 0.5, borderColor: t.border, padding: 14, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5 },
  badgeGreen: { backgroundColor: t.greenBg, borderColor: t.greenBorder },
  badgeRed: { backgroundColor: t.redBg, borderColor: t.redBorder },
  badgeText: { fontSize: 11, fontWeight: '700' },
});