import { PermissionsAndroid, Platform } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Animated, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatKES, formatHours } from '../../lib/payroll';
import NetInfo from '@react-native-community/netinfo';
export default function HomeScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const [activeLog, setActiveLog] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOnCampus, setIsOnCampus] = useState(false);
  const [ssid, setSsid] = useState<string | null>(null);
  const [checkingWifi, setCheckingWifi] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const ALLOWED_SSID = 'POA HOTSPOT';
  const ALLOWED_BSSID = '';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
    checkWifi();
    fetchActiveLog();
    const wifiInterval = setInterval(checkWifi, 30000);
    return () => clearInterval(wifiInterval);
  }, []);

  useEffect(() => {
    if (activeLog) {
      const interval = setInterval(() => {
        const ms = Date.now() - new Date(activeLog.clock_in).getTime();
        setElapsed(ms / (1000 * 60 * 60));
      }, 1000);
      startPulse();
      return () => clearInterval(interval);
    }
  }, [activeLog]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission Required',
        message: 'AttendPay needs location access to verify your campus WiFi network.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

 const checkWifi = async () => {
  setCheckingWifi(true);
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Location permission is needed to verify campus WiFi.');
      setIsOnCampus(false);
      setCheckingWifi(false);
      return;
    }

    const state = await NetInfo.fetch();
    const detectedSSID = (state.details as any)?.ssid ?? null;
    const detectedBSSID = (state.details as any)?.bssid ?? null;


    setSsid(detectedSSID);
    setIsOnCampus(state.type === 'wifi' && detectedSSID === ALLOWED_SSID);

  } catch (e: any) {
    Alert.alert('WiFi Error', e.message || 'Unknown error');
    setIsOnCampus(false);
  }
  setCheckingWifi(false);
};

  const fetchActiveLog = async () => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', profile.id)
      .gte('clock_in', today)
      .is('clock_out', null)
      .maybeSingle();
    setActiveLog(data);
    setLoading(false);
  };

  const handleClockIn = async () => {
    if (!isOnCampus || !profile) return;
    setActionLoading(true);
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({ employee_id: profile.id, clock_in: new Date().toISOString(), type: 'regular' })
      .select().single();
    if (error) Alert.alert('Error', error.message);
    else setActiveLog(data);
    setActionLoading(false);
  };

  const handleClockOut = () => {
    Alert.alert('Leave early?', 'Are you sure you want to clock out before 4:00 PM?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock out', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          const now = new Date();
          const hrs = (now.getTime() - new Date(activeLog.clock_in).getTime()) / (1000 * 60 * 60);
          await supabase.from('attendance_logs')
            .update({ clock_out: now.toISOString(), hours_worked: parseFloat(hrs.toFixed(2)) })
            .eq('id', activeLog.id);
          setActiveLog(null);
          setElapsed(0);
          setActionLoading(false);
        },
      },
    ]);
  };

  const handleStartOvertime = async () => {
    if (!isOnCampus || !profile) return;
    setActionLoading(true);
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({ employee_id: profile.id, clock_in: new Date().toISOString(), type: 'overtime' })
      .select().single();
    if (error) Alert.alert('Error', error.message);
    else setActiveLog(data);
    setActionLoading(false);
  };

  const handleEndOvertime = () => {
    Alert.alert('End overtime?', 'Your overtime session will be closed now.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          const now = new Date();
          const hrs = (now.getTime() - new Date(activeLog.clock_in).getTime()) / (1000 * 60 * 60);
          await supabase.from('attendance_logs')
            .update({ clock_out: now.toISOString(), hours_worked: parseFloat(hrs.toFixed(2)) })
            .eq('id', activeLog.id);
          setActiveLog(null);
          setElapsed(0);
          setActionLoading(false);
        },
      },
    ]);
  };

  const isOvertime = activeLog?.type === 'overtime';
  const isPast4PM = new Date().getHours() >= 16;
  const estimatedPay = elapsed * (isOvertime
    ? (profile?.overtime_hourly_rate || 0)
    : (profile?.base_hourly_rate || 0));

  const ringColor = activeLog ? isOvertime ? theme.amber : theme.green : theme.border2;
  const ringBg = activeLog ? isOvertime ? theme.amberBg : theme.greenBg : theme.bg3;
  const timeStr = activeLog
    ? `${String(Math.floor(elapsed)).padStart(2, '0')}:${String(Math.floor((elapsed % 1) * 60)).padStart(2, '0')}`
    : '--:--';

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

        {/* Header */}
        <Animated.View style={[s.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={s.greeting}>
              {profile?.full_name?.split(' ')[0] || 'Welcome'}
            </Text>
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

        {/* WiFi Status */}
        <Animated.View style={[s.wifiRow, { opacity: fadeAnim }]}>
          <View style={[s.wifiPill, isOnCampus ? s.wifiOn : s.wifiOff]}>
            <View style={[s.wifiDot, { backgroundColor: isOnCampus ? theme.green : theme.red }]} />
            <Text style={[s.wifiText, { color: isOnCampus ? theme.greenText : theme.redText }]}>
              {checkingWifi ? 'Checking network...' :
                isOnCampus ? `${ssid} — verified` : 'Not on campus network'}
            </Text>
          </View>
        </Animated.View>

        {/* Clock Ring */}
        <Animated.View style={[s.ringWrap, { opacity: fadeAnim }]}>
          <Animated.View style={[
            s.ring,
            { borderColor: ringColor, backgroundColor: ringBg },
            activeLog && { transform: [{ scale: pulseAnim }] },
          ]}>
            <Text style={[s.ringTime, { color: activeLog
              ? isOvertime ? theme.amberText : theme.greenText
              : theme.text3,
            }]}>{timeStr}</Text>
            <Text style={[s.ringLabel, { color: activeLog
              ? isOvertime ? theme.amber : theme.green
              : theme.text3,
            }]}>
              {activeLog ? isOvertime ? 'overtime' : 'hrs today' : 'not clocked in'}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Stats */}
        {activeLog && (
          <Animated.View style={[s.statsRow, { opacity: fadeAnim }]}>
            <View style={s.statBox}>
              <Text style={s.statVal}>
                {new Date(activeLog.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={s.statLbl}>clocked in</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statVal}>16:00</Text>
              <Text style={s.statLbl}>auto out</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: isOvertime ? theme.amber : theme.green }]}>
                {formatKES(estimatedPay)}
              </Text>
              <Text style={s.statLbl}>est. pay</Text>
            </View>
          </Animated.View>
        )}

        {/* Pay Breakdown */}
        {activeLog && (
          <Animated.View style={[s.payCard, { opacity: fadeAnim }]}>
            <View style={s.payRow}>
              <Text style={s.payLbl}>Hours so far</Text>
              <Text style={s.payVal}>{formatHours(elapsed)}</Text>
            </View>
            <View style={s.payRow}>
              <Text style={s.payLbl}>{isOvertime ? 'OT rate' : 'Base rate'}</Text>
              <Text style={s.payVal}>
                {formatKES(isOvertime ? profile?.overtime_hourly_rate || 0 : profile?.base_hourly_rate || 0)}/hr
              </Text>
            </View>
            <View style={s.payDivider} />
            <View style={s.payRow}>
              <Text style={s.payTotalLbl}>Est. today</Text>
              <Text style={[s.payTotalVal, { color: isOvertime ? theme.amber : theme.green }]}>
                {formatKES(estimatedPay)}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Actions */}
        <Animated.View style={[s.actions, { opacity: fadeAnim }]}>
          {!activeLog && !isPast4PM && (
            <TouchableOpacity
              style={[s.btn, isOnCampus ? s.btnGreen : s.btnDisabled]}
              onPress={handleClockIn}
              disabled={!isOnCampus || actionLoading}
              activeOpacity={0.85}>
              {actionLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>
                    {isOnCampus ? 'Clock in' : 'Connect to campus WiFi to clock in'}
                  </Text>
              }
            </TouchableOpacity>
          )}
          {activeLog && !isOvertime && (
            <TouchableOpacity style={[s.btn, s.btnOutline]} onPress={handleClockOut} disabled={actionLoading} activeOpacity={0.85}>
              <Text style={[s.btnText, { color: theme.text2 }]}>Leave early</Text>
            </TouchableOpacity>
          )}
          {!activeLog && isPast4PM && (
            <TouchableOpacity
              style={[s.btn, isOnCampus ? s.btnAmber : s.btnDisabled]}
              onPress={handleStartOvertime}
              disabled={!isOnCampus || actionLoading}
              activeOpacity={0.85}>
              {actionLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>
                    {isOnCampus ? 'Start overtime' : 'Connect to campus WiFi for overtime'}
                  </Text>
              }
            </TouchableOpacity>
          )}
          {activeLog && isOvertime && (
            <TouchableOpacity style={[s.btn, s.btnAmber]} onPress={handleEndOvertime} disabled={actionLoading} activeOpacity={0.85}>
              {actionLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>End overtime</Text>
              }
            </TouchableOpacity>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, marginBottom: 20 },
  greeting: { fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.5 },
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
  wifiRow: { alignItems: 'center', marginBottom: 16 },
  wifiPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 100, borderWidth: 0.5,
  },
  wifiOn: { backgroundColor: t.greenBg, borderColor: t.greenBorder },
  wifiOff: { backgroundColor: t.redBg, borderColor: t.redBorder },
  wifiDot: { width: 7, height: 7, borderRadius: 4 },
  wifiText: { fontSize: 13, fontWeight: '500' },
  ringWrap: { alignItems: 'center', marginBottom: 28 },
  ring: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  ringTime: { fontSize: 34, fontWeight: '600', letterSpacing: 1 },
  ringLabel: { fontSize: 12, marginTop: 6, fontWeight: '500', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1, backgroundColor: t.bg2, borderRadius: 12,
    borderWidth: 0.5, borderColor: t.border,
    padding: 14, alignItems: 'center',
  },
  statVal: { fontSize: 15, fontWeight: '600', color: t.text },
  statLbl: { fontSize: 11, color: t.text3, marginTop: 3 },
  payCard: {
    backgroundColor: t.bg2, borderRadius: 12,
    borderWidth: 0.5, borderColor: t.border,
    padding: 16, marginBottom: 20,
  },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  payLbl: { fontSize: 13, color: t.text3 },
  payVal: { fontSize: 13, color: t.text2 },
  payDivider: { height: 0.5, backgroundColor: t.border, marginVertical: 4 },
  payTotalLbl: { fontSize: 14, fontWeight: '600', color: t.text },
  payTotalVal: { fontSize: 14, fontWeight: '700' },
  actions: { gap: 10 },
  btn: {
    borderRadius: 12, padding: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGreen: { backgroundColor: t.green },
  btnAmber: { backgroundColor: t.amber },
  btnOutline: { borderWidth: 0.5, borderColor: t.border2, backgroundColor: 'transparent' },
  btnDisabled: { backgroundColor: t.bg3, borderWidth: 0.5, borderColor: t.border },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});