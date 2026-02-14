import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface HomeProps {
  streak: number;
  onSave: (entry: { grateful: string; goodToday: string; appreciate: string }) => void;
}

export function Home({ streak, onSave }: HomeProps) {
  const [grateful, setGrateful] = useState('');
  const [goodToday, setGoodToday] = useState('');
  const [appreciate, setAppreciate] = useState('');
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSave = () => {
    if (grateful.trim() || goodToday.trim() || appreciate.trim()) {
      onSave({ grateful, goodToday, appreciate });
      setGrateful('');
      setGoodToday('');
      setAppreciate('');
      setSaved(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Today’s Gratitude</Text>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {streak}-day streak</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>I’m grateful for…</Text>
          <TextInput
            value={grateful}
            onChangeText={setGrateful}
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Something good today…</Text>
          <TextInput
            value={goodToday}
            onChangeText={setGoodToday}
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Someone I appreciate…</Text>
          <TextInput
            value={appreciate}
            onChangeText={setAppreciate}
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Save Entry</Text>
        </Pressable>
        {saved && <Text style={styles.savedText}>Saved ✓</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
    fontWeight: '600',
  },
  streakPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
  },
  form: {
    flex: 1,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 10,
  },
  footer: {
    marginTop: 18,
    gap: 10,
  },
  button: {
    width: '100%',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  savedText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#4F46E5',
  },
});
