import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatKES, formatHours } from '../../lib/payroll';

export default function PayScreen() {
  const { theme, isDark } = useTheme();
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchData = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', profile.id)
      .gte('clock_in', startOfMonth)
      .not('hours_worked', 'is', null);
    setLogs(data ?? []);
    setLoading(false);
  };

  const regularLogs = logs.filter(l => l.type === 'regular');
  const overtimeLogs = logs.filter(l => l.type === 'overtime');
  const totalRegHrs = regularLogs.reduce((s, l) => s + (l.hours_worked || 0), 0);
  const totalOTHrs = overtimeLogs.reduce((s, l) => s + (l.hours_worked || 0), 0);
  const regPay = totalRegHrs * (profile?.base_hourly_rate || 0);
  const otPay = totalOTHrs * (profile?.overtime_hourly_rate || 0);
  const total = regPay + otPay;
  const daysWorked = new Set(regularLogs.map(l => l.clock_in.split('T')[0])).size;

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
            <Text style={s.title}>My Pay</Text>
            <Text style={s.sub}>
              {now.toLocaleString('default', { month: 'long' })} {now.getFullYear()}
            </Text>
          </View>

          <View style={s.heroCard}>
            <Text style={s.heroLabel}>EARNED SO FAR</Text>
            <Text style={s.heroVal}>{formatKES(total)}</Text>
            <Text style={s.heroSub}>{daysWorked} days worked</Text>
          </View>

          <View style={s.grid}>
            <View style={s.miniCard}>
              <Text style={[s.miniVal, { color: theme.green }]}>{formatHours(totalRegHrs)}</Text>
              <Text style={s.miniLbl}>regular hrs</Text>
            </View>
            <View style={s.miniCard}>
              <Text style={[s.miniVal, { color: theme.amber }]}>{formatHours(totalOTHrs)}</Text>
              <Text style={s.miniLbl}>overtime hrs</Text>
            </View>
          </View>

          <View style={s.breakdown}>
            <View style={s.row}>
              <Text style={s.rowLbl}>Base rate</Text>
              <Text style={s.rowVal}>{formatKES(profile?.base_hourly_rate || 0)}/hr</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLbl}>Overtime rate</Text>
              <Text style={s.rowVal}>{formatKES(profile?.overtime_hourly_rate || 0)}/hr</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLbl}>Regular pay</Text>
              <Text style={s.rowVal}>{formatKES(regPay)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLbl}>Overtime pay</Text>
              <Text style={[s.rowVal, { color: theme.amber }]}>{formatKES(otPay)}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <Text style={s.totalLbl}>Projected total</Text>
              <Text style={[s.totalVal, { color: theme.green }]}>{formatKES(total)}</Text>
            </View>
          </View>

          <View style={s.payDateCard}>
            <Text style={s.payDateLbl}>Payment date</Text>
            <Text style={s.payDateVal}>
              {lastDay.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
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
  heroCard: {
    backgroundColor: t.greenBg, borderWidth: 0.5,
    borderColor: t.greenBorder, borderRadius: 16,
    padding: 28, alignItems: 'center', marginBottom: 16,
  },
  heroLabel: { fontSize: 11, color: t.greenText, letterSpacing: 0.8, fontWeight: '600', marginBottom: 8 },
  heroVal: { fontSize: 36, fontWeight: '800', color: t.text, letterSpacing: -1, marginBottom: 6 },
  heroSub: { fontSize: 13, color: t.text3 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  miniCard: {
    flex: 1, backgroundColor: t.bg2, borderRadius: 12,
    borderWidth: 0.5, borderColor: t.border,
    padding: 16, alignItems: 'center',
  },
  miniVal: { fontSize: 20, fontWeight: '700' },
  miniLbl: { fontSize: 11, color: t.text3, marginTop: 4 },
  breakdown: {
    backgroundColor: t.bg2, borderRadius: 12,
    borderWidth: 0.5, borderColor: t.border,
    padding: 16, marginBottom: 14,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  rowLbl: { fontSize: 13, color: t.text3 },
  rowVal: { fontSize: 13, color: t.text2 },
  divider: { height: 0.5, backgroundColor: t.border, marginVertical: 4 },
  totalLbl: { fontSize: 15, fontWeight: '700', color: t.text },
  totalVal: { fontSize: 15, fontWeight: '800' },
  payDateCard: {
    backgroundColor: t.bg2, borderRadius: 12,
    borderWidth: 0.5, borderColor: t.border,
    padding: 16, alignItems: 'center',
  },
  payDateLbl: { fontSize: 12, color: t.text3 },
  payDateVal: { fontSize: 16, fontWeight: '600', color: t.text, marginTop: 6 },
});