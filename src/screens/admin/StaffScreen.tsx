import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Animated, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { formatKES } from '../../lib/payroll';

export default function StaffScreen() {
  const { theme, isDark } = useTheme();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [baseRate, setBaseRate] = useState('');
  const [otRate, setOtRate] = useState('');
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchStaff();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'staff').order('full_name');
    setStaff(data ?? []);
    setLoading(false);
  };

  const startEdit = (m: any) => {
    setEditing(m.id);
    setBaseRate(String(m.base_hourly_rate || 0));
    setOtRate(String(m.overtime_hourly_rate || 0));
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ base_hourly_rate: parseFloat(baseRate), overtime_hourly_rate: parseFloat(otRate) })
      .eq('id', id);
    if (error) Alert.alert('Error', error.message);
    setEditing(null);
    setSaving(false);
    fetchStaff();
  };

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
            <Text style={s.title}>Staff</Text>
            <Text style={s.sub}>{staff.length} members</Text>
          </View>

          {staff.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No staff found</Text>
            </View>
          )}

          {staff.map(member => {
            const initials = (member.full_name || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const isEditing = editing === member.id;
            return (
              <View key={member.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>
                  <View style={s.info}>
                    <Text style={s.name}>{member.full_name || 'Unnamed'}</Text>
                    <Text style={s.id}>ID: {member.id.slice(0, 12)}...</Text>
                  </View>
                  <TouchableOpacity
                    style={s.editBtn}
                    onPress={() => isEditing ? saveEdit(member.id) : startEdit(member)}
                    disabled={saving}>
                    {saving && isEditing
                      ? <ActivityIndicator color={theme.green} size="small" />
                      : <Text style={s.editBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
                    }
                  </TouchableOpacity>
                </View>

                {isEditing ? (
                  <View style={s.editRow}>
                    <View style={s.editField}>
                      <Text style={s.editLabel}>Base rate (KES/hr)</Text>
                      <TextInput
                        style={s.editInput}
                        value={baseRate}
                        onChangeText={setBaseRate}
                        keyboardType="numeric"
                        placeholderTextColor={theme.text3}
                      />
                    </View>
                    <View style={s.editField}>
                      <Text style={s.editLabel}>OT rate (KES/hr)</Text>
                      <TextInput
                        style={s.editInput}
                        value={otRate}
                        onChangeText={setOtRate}
                        keyboardType="numeric"
                        placeholderTextColor={theme.text3}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={s.ratesRow}>
                    <View style={s.rateBox}>
                      <Text style={[s.rateVal, { color: theme.green }]}>{formatKES(member.base_hourly_rate)}</Text>
                      <Text style={s.rateLbl}>base/hr</Text>
                    </View>
                    <View style={s.rateDivider} />
                    <View style={s.rateBox}>
                      <Text style={[s.rateVal, { color: theme.amber }]}>{formatKES(member.overtime_hourly_rate)}</Text>
                      <Text style={s.rateLbl}>OT/hr</Text>
                    </View>
                  </View>
                )}
              </View>
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
  header: { paddingTop: 16, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: t.text3, marginTop: 3 },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: t.text3, fontSize: 14 },
  card: { backgroundColor: t.bg2, borderRadius: 14, borderWidth: 0.5, borderColor: t.border, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: t.blueBg, borderWidth: 0.5, borderColor: t.blueBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: t.blueText },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: t.text },
  id: { fontSize: 11, color: t.text3, marginTop: 2 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: t.greenBg, borderWidth: 0.5, borderColor: t.greenBorder },
  editBtnText: { fontSize: 13, color: t.greenText, fontWeight: '600' },
  ratesRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg3, borderRadius: 10, padding: 12 },
  rateBox: { flex: 1, alignItems: 'center' },
  rateVal: { fontSize: 18, fontWeight: '700' },
  rateLbl: { fontSize: 11, color: t.text3, marginTop: 2 },
  rateDivider: { width: 0.5, height: 32, backgroundColor: t.border2 },
  editRow: { flexDirection: 'row', gap: 10 },
  editField: { flex: 1, gap: 5 },
  editLabel: { fontSize: 11, color: t.text2 },
  editInput: { backgroundColor: t.bg3, borderWidth: 0.5, borderColor: t.border2, borderRadius: 8, padding: 10, fontSize: 14, color: t.text },
});