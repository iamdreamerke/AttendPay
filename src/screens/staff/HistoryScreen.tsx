import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Animated, StatusBar, TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatHours, formatKES } from '../../lib/payroll';

export default function HistoryScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLogs();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchLogs = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', profile.id)
      .order('clock_in', { ascending: false })
      .limit(50);
    setLogs(data ?? []);
    setLoading(false);
  };

  const s = styles(theme);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={theme.green} size="large" />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={s.header}>
            <View>
              <Text style={s.title}>History</Text>
              <Text style={s.sub}>Last 50 records</Text>
            </View>
            <View style={s.headerRight}>
              <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
                <Text style={s.themeBtnText}>{isDark ? '☀' : '☾'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
                <Text style={s.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {logs.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No attendance records yet</Text>
            </View>
          )}

          {logs.map((log) => {
            const isOT = log.type === 'overtime';
            const clockIn = new Date(log.clock_in);
            const clockOut = log.clock_out ? new Date(log.clock_out) : null;
            const pay = log.hours_worked
              ? log.hours_worked * (isOT ? profile?.overtime_hourly_rate || 0 : profile?.base_hourly_rate || 0)
              : null;

            return (
              <Animated.View key={log.id} style={[s.card, { opacity: fadeAnim }]}>
                <View style={s.cardLeft}>
                  <Text style={s.cardDate}>
                    {clockIn.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={s.cardTime}>
                    {clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {clockOut
                      ? ` → ${clockOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : ' → ongoing'}
                  </Text>
                </View>
                <View style={s.cardRight}>
                  {log.hours_worked && (
                    <Text style={s.cardHours}>{formatHours(log.hours_worked)}</Text>
                  )}
                  {pay !== null && (
                    <Text style={[s.cardPay, { color: isOT ? theme.amber : theme.green }]}>
                      {formatKES(pay)}
                    </Text>
                  )}
                  <View style={[s.badge, isOT ? s.badgeAmber : s.badgeGreen]}>
                    <Text style={[s.badgeText, { color: isOT ? theme.amberText : theme.greenText }]}>
                      {isOT ? 'OT' : 'REG'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingTop: 16, marginBottom: 24,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: t.text3, marginTop: 3 },
  themeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: t.bg3, borderWidth: 0.5,
    borderColor: t.border2, alignItems: 'center', justifyContent: 'center',
  },
  themeBtnText: { fontSize: 16 },
  signOutBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, borderWidth: 0.5,
    borderColor: t.redBorder, backgroundColor: t.redBg,
  },
  signOutText: { fontSize: 12, color: t.redText, fontWeight: '500' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: t.text3, fontSize: 14 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: t.bg2,
    borderRadius: 12, borderWidth: 0.5,
    borderColor: t.border, padding: 16, marginBottom: 8,
  },
  cardLeft: { flex: 1 },
  cardDate: { fontSize: 14, fontWeight: '600', color: t.text },
  cardTime: { fontSize: 12, color: t.text3, marginTop: 3 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardHours: { fontSize: 13, color: t.text2 },
  cardPay: { fontSize: 14, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5 },
  badgeGreen: { backgroundColor: t.greenBg, borderColor: t.greenBorder },
  badgeAmber: { backgroundColor: t.amberBg, borderColor: t.amberBorder },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});