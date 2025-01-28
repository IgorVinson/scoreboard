import React, {useState} from 'react';
import {Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {supabase} from '@/utils/supabase';

// @ts-ignore
const InputField = ({ label, placeholder, value, onChangeText, secureTextEntry = false }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      placeholder={placeholder}
      placeholderTextColor="#6b7280"
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
    />
  </View>
);

export default function Auth() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) Alert.alert('Error', error.message);
    if (!session) Alert.alert('Success', 'Please check your inbox for email verification!');
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Welcome to <Text style={{ color: '#075eec' }}>MyApp</Text>
        </Text>
        <Text style={styles.subtitle}>Get access to your portfolio and more</Text>
      </View>

      <View style={styles.form}>
        <InputField
          label="Email address"
          placeholder="email@address.com"
          value={form.email}
          onChangeText={(email: string) => setForm({ ...form, email })}
        />
        <InputField
          label="Password"
          placeholder="********"
          secureTextEntry
          value={form.password}
          onChangeText={(password: string) => setForm({ ...form, password })}
        />

        <TouchableOpacity
          onPress={signInWithEmail}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Alert.alert('Coming soon', 'Password reset functionality will be added soon.')}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={signUpWithEmail} disabled={loading}>
        <Text style={styles.footer}>
          Don't have an account? <Text style={{ textDecorationLine: 'underline' }}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8ecf4',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 36,
  },
  title: {
    fontSize: 31,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
  },
  form: {
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#C9D3DB',
  },
  button: {
    backgroundColor: '#075eec',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075eec',
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
  },
});
