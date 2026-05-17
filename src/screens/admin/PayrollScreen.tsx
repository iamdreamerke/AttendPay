import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { formatKES, formatHours } from '../../lib/payroll';

export default function PayrollScreen() {
  const { theme, isDark } = useTheme();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1).toISOString();

  useEffect(() => {
    fetchPayroll();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchPayroll = async () => {
    const [{ data: profiles }, { data: logs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'staff'),
      supabase.from('attendance_logs').select('*').gte('clock_in', startOfMonth).not('hours_worked', 'is', null),
    ]);
    const summary = (profiles ?? []).map(p => {
      const pLogs = (logs ?? []).filter((l: any) => l.employee_id === p.id);
      const regHrs = pLogs.filter((l: any) => l.type === 'regular').reduce((s: number, l: any) => s + (l.hours_worked || 0), 0);
      const otHrs = pLogs.filter((l: any) => l.type === 'overtime').reduce((s: number, l: any) => s + (l.hours_worked || 0), 0);
      const totalPay = (regHrs * (p.base_hourly_rate || 0)) + (otHrs * (p.overtime_hourly_rate || 0));
      return { ...p, regHrs, otHrs, totalPay };
    });
    setStaff(summary);
    setLoading(false);
  };

  const handleGenerate = () => {
    Alert.alert(
      'Generate Payroll',
      `Generate payroll for ${now.toLocaleString('default', { month: 'long' })} ${year}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate', onPress: async () => {
            setGenerating(true);
            for (const m of staff) {
              await supabase.from('pay_periods').upsert({
                employee_id: m.id, month, year,
                total_regular_hours: parseFloat(m.regHrs.toFixed(2)),
                total_overtime_hours: parseFloat(m.otHrs.toFixed(2)),
                total_pay: parseFloat(m.totalPay.toFixed(2)),
                status: 'pending',
              }, { onConflict: 'employee_id,month,year' });
            }
            setGenerating(false);
            setGenerated(true);
          },
        },
      ]
    );
  };

  const grandTotal = staff.reduce((s, m) => s + m.totalPay, 0);
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
            <Text style={s.title}>Payroll</Text>
            <Text style={s.sub}>{now.toLocaleString('default', { month: 'long' })} {year}</Text>
          </View>

          <View style={s.heroCard}>
            <Text style={s.heroLabel}>TOTAL PAYROLL THIS MONTH</Text>
            <Text style={s.heroVal}>{formatKES(grandTotal)}</Text>
            <Text style={s.heroSub}>{staff.length} staff members</Text>
          </View>

          <Text style={s.sectionTitle}>Breakdown</Text>

          {staff.map(member => {
            const initials = (member.full_name || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <View key={member.id} style={s.card}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.name}>{member.full_name || 'Unnamed'}</Text>
                  <Text style={s.meta}>
                    {formatHours(member.regHrs)} reg
                    {member.otHrs > 0 ? ` · ${formatHours(member.otHrs)} OT` : ''}
                  </Text>
                </View>
                <Text style={s.pay}>{formatKES(member.totalPay)}</Text>
              </View>
            );
          })}

          {generated && (
            <View style={s.successBanner}>
              <Text style={s.successText}>Payroll generated successfully</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.genBtn, generating && s.genBtnDisabled]}
            onPress={handleGenerate}
            disabled={generating}
            activeOpacity={0.85}>
            {generating
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.genBtnText}>Generate payroll</Text>
            }
          </TouchableOpacity>
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
  heroCard: { backgroundColor: t.greenBg, borderWidth: 0.5, borderColor: t.greenBorder, borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 24 },
  heroLabel: { fontSize: 11, color: t.greenText, letterSpacing: 0.8, fontWeight: '600', marginBottom: 8 },
  heroVal: { fontSize: 36, fontWeight: '800', color: t.text, letterSpacing: -1, marginBottom: 6 },
  heroSub: { fontSize: 13, color: t.text3 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: t.text3, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg2, borderRadius: 12, borderWidth: 0.5, borderColor: t.border, padding: 14, marginBottom: 8, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.blueBg, borderWidth: 0.5, borderColor: t.blueBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: t.blueText },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: t.text },
  meta: { fontSize: 12, color: t.text3, marginTop: 2 },
  pay: { fontSize: 15, fontWeight: '800', color: t.green },
  successBanner: { backgroundColor: t.greenBg, borderWidth: 0.5, borderColor: t.greenBorder, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 14 },
  successText: { color: t.greenText, fontSize: 14, fontWeight: '500' },
  genBtn: { backgroundColor: t.green, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  genBtnDisabled: { opacity: 0.6 },
  genBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});