import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    const err = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields'); return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created. You can now sign in.');
      setMode('login');
      setFullName('');
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const s = styles(theme);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Theme toggle */}
        <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
          <Text style={s.themeBtnText}>{isDark ? '☀' : '☾'}</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkText}>A</Text>
          </View>
          <Text style={s.logoName}>AttendPay</Text>
          <Text style={s.logoTagline}>Staff Attendance & Payroll</Text>
        </View>

        {/* Tab switcher */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, mode === 'login' && s.tabActive]}
            onPress={() => switchMode('login')}>
            <Text style={[s.tabText, mode === 'login' && s.tabTextActive]}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, mode === 'signup' && s.tabActive]}
            onPress={() => switchMode('signup')}>
            <Text style={[s.tabText, mode === 'signup' && s.tabTextActive]}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Form card */}
        <View style={s.card}>

          {mode === 'signup' && (
            <View style={s.field}>
              <Text style={s.label}>Full name</Text>
              <TextInput
                style={s.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Doe"
                placeholderTextColor={theme.text3}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={s.field}>
            <Text style={s.label}>Email address</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@institution.ac.ke"
              placeholderTextColor={theme.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.text3}
              secureTextEntry
            />
          </View>

          {mode === 'signup' && (
            <View style={s.field}>
              <Text style={s.label}>Confirm password</Text>
              <TextInput
                style={s.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.text3}
                secureTextEntry
              />
            </View>
          )}

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={s.successBox}>
              <Text style={s.successText}>{success}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={mode === 'login' ? handleLogin : handleSignUp}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.btnText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={s.hint}>
          {mode === 'login'
            ? 'New here? Switch to Sign up above'
            : 'Already have an account? Switch to Sign in above'}
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (t: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: t.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  themeBtn: {
    position: 'absolute', top: 16, right: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: t.bg3, borderWidth: 0.5,
    borderColor: t.border2, alignItems: 'center', justifyContent: 'center',
  },
  themeBtnText: { fontSize: 16 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoMark: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: t.green, alignItems: 'center',
    justifyContent: 'center', marginBottom: 12,
  },
  logoMarkText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  logoName: { fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.5 },
  logoTagline: { fontSize: 13, color: t.text3, marginTop: 4 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: t.bg3,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1, paddingVertical: 10,
    borderRadius: 10, alignItems: 'center',
  },
  tabActive: { backgroundColor: t.bg },
  tabText: { fontSize: 14, fontWeight: '500', color: t.text3 },
  tabTextActive: { color: t.text, fontWeight: '700' },
  card: {
    backgroundColor: t.bg2, borderRadius: 16,
    borderWidth: 0.5, borderColor: t.border,
    padding: 20, gap: 14,
  },
  field: { gap: 6 },
  label: { fontSize: 12, color: t.text2, letterSpacing: 0.4, fontWeight: '500' },
  input: {
    backgroundColor: t.bg3, borderWidth: 0.5,
    borderColor: t.border2, borderRadius: 10,
    padding: 13, fontSize: 15, color: t.text,
  },
  errorBox: {
    backgroundColor: t.redBg, borderWidth: 0.5,
    borderColor: t.redBorder, borderRadius: 8, padding: 10,
  },
  errorText: { fontSize: 13, color: t.redText },
  successBox: {
    backgroundColor: t.greenBg, borderWidth: 0.5,
    borderColor: t.greenBorder, borderRadius: 8, padding: 10,
  },
  successText: { fontSize: 13, color: t.greenText },
  btn: {
    backgroundColor: t.green, borderRadius: 10,
    padding: 15, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, color: t.text3, textAlign: 'center', marginTop: 20 },
});