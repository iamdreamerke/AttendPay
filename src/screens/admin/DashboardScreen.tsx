import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Animated, StatusBar, RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatKES } from '../../lib/payroll';

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({ present: 0, overtime: 0, absent: 0, pending: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [{ data: activeLogs }, { data: allStaff }, { data: pendingLeave }] = await Promise.all([
      supabase.from('attendance_logs').select('*, profiles(full_name, base_hourly_rate, overtime_hourly_rate)').gte('clock_in', today),
      supabase.from('profiles').select('id').eq('role', 'staff'),
      supabase.from('absence_requests').select('id').eq('status', 'pending'),
    ]);
    const present = activeLogs?.length ?? 0;
    const overtime = activeLogs?.filter(l => l.type === 'overtime').length ?? 0;
    const absent = Math.max(0, (allStaff?.length ?? 0) - present);
    setStats({ present, overtime, absent, pending: pendingLeave?.length ?? 0 });
    setLogs(activeLogs ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const s = styles(theme);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={theme.green} size="large" />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.green} />}>

        {/* Header */}
        <Animated.View style={[s.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={s.title}>Today</Text>
            <Text style={s.date}>
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
              <Text style={s.themeBtnText}>{isDark ? '☀' : '☾'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
              <Text style={s.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View style={[s.statsGrid, { opacity: fadeAnim }]}>
          {[
            { val: stats.present, lbl: 'present', color: theme.green, bg: theme.greenBg, border: theme.greenBorder },
            { val: stats.overtime, lbl: 'overtime', color: theme.amber, bg: theme.amberBg, border: theme.amberBorder },
            { val: stats.absent, lbl: 'absent', color: theme.red, bg: theme.redBg, border: theme.redBorder },
            { val: stats.pending, lbl: 'leave pending', color: theme.blue, bg: theme.blueBg, border: theme.blueBorder },
          ].map(stat => (
            <View key={stat.lbl} style={[s.statCard, { backgroundColor: stat.bg, borderColor: stat.border }]}>
              <Text style={[s.statVal, { color: stat.color }]}>{stat.val}</Text>
              <Text style={s.statLbl}>{stat.lbl}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Live Attendance */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={s.sectionTitle}>Live attendance</Text>

          {logs.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No clock-ins recorded today</Text>
            </View>
          )}

          {logs.map((log, i) => {
            const name = log.profiles?.full_name || 'Unknown';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const isOT = log.type === 'overtime';
            const hrs = log.clock_out
              ? (new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime()) / (1000 * 60 * 60)
              : (Date.now() - new Date(log.clock_in).getTime()) / (1000 * 60 * 60);
            const rate = isOT ? log.profiles?.overtime_hourly_rate : log.profiles?.base_hourly_rate;
            const pay = hrs * (rate || 0);

            return (
              <Animated.View
                key={log.id}
                style={[s.logCard, { opacity: fadeAnim }]}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View style={s.logInfo}>
                  <Text style={s.logName}>{name}</Text>
                  <Text style={s.logTime}>
                    in {new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {log.clock_out
                      ? ` · out ${new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : ' · active'}
                  </Text>
                </View>
                <View style={s.logRight}>
                  <View style={[s.badge,
                    isOT ? s.badgeAmber : log.clock_out ? s.badgeGreen : s.badgeBlue]}>
                    <Text style={[s.badgeText, {
                      color: isOT ? theme.amberText : log.clock_out ? theme.greenText : theme.blueText,
                    }]}>
                      {isOT ? 'OT' : log.clock_out ? 'done' : 'live'}
                    </Text>
                  </View>
                  <Text style={[s.logPay, { color: isOT ? theme.amber : theme.green }]}>
                    {formatKES(pay)}
                  </Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.5 },
  date: { fontSize: 13, color: t.text3, marginTop: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statCard: {
    width: '47%', borderWidth: 0.5, borderRadius: 14,
    padding: 18, alignItems: 'center',
  },
  statVal: { fontSize: 32, fontWeight: '700' },
  statLbl: { fontSize: 12, color: t.text3, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: t.text2, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: t.text3, fontSize: 14 },
  logCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: t.bg2, borderRadius: 12,
    borderWidth: 0.5, borderColor: t.border,
    padding: 14, marginBottom: 8, gap: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: t.blueBg, borderWidth: 0.5,
    borderColor: t.blueBorder, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: t.blueText },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, fontWeight: '600', color: t.text },
  logTime: { fontSize: 12, color: t.text3, marginTop: 2 },
  logRight: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5 },
  badgeGreen: { backgroundColor: t.greenBg, borderColor: t.greenBorder },
  badgeAmber: { backgroundColor: t.amberBg, borderColor: t.amberBorder },
  badgeBlue: { backgroundColor: t.blueBg, borderColor: t.blueBorder },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  logPay: { fontSize: 12, fontWeight: '600' },
});