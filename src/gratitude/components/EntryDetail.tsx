import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Entry } from './History';

interface EntryDetailProps {
  entry: Entry;
  onClose: () => void;
  onDelete: (entryId: string) => void;
  onEdit: (entry: Entry) => void;
}

function formatDateLong(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function EntryDetail({ entry, onClose, onDelete, onEdit }: EntryDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const insets = useSafeAreaInsets();

  const [grateful, setGrateful] = useState(entry.grateful);
  const [goodToday, setGoodToday] = useState(entry.goodToday);
  const [appreciate, setAppreciate] = useState(entry.appreciate);

  // If parent swaps to a different entry while open, sync state.
  useEffect(() => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setGrateful(entry.grateful);
    setGoodToday(entry.goodToday);
    setAppreciate(entry.appreciate);
  }, [entry.id]);

  const handleSave = () => {
    onEdit({
      ...entry,
      grateful,
      goodToday,
      appreciate,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setGrateful(entry.grateful);
    setGoodToday(entry.goodToday);
    setAppreciate(entry.appreciate);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(entry.id);
    setShowDeleteConfirm(false);
  };

  const hasAny = Boolean(grateful.trim() || goodToday.trim() || appreciate.trim());

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{formatDateLong(entry.date)}</Text>
            <Text style={styles.subtitle}>{formatTime(entry.date)}</Text>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>

        {/* Body */}
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {isEditing ? (
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
                />
              </View>
            </View>
          ) : (
            <View style={styles.cards}>
              {!hasAny ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Empty entry</Text>
                  <Text style={styles.cardText}>No text was saved for this day.</Text>
                </View>
              ) : (
                <>
                  {grateful.trim() ? (
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>I’m grateful for…</Text>
                      <Text style={styles.cardText}>{grateful}</Text>
                    </View>
                  ) : null}

                  {goodToday.trim() ? (
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Something good today…</Text>
                      <Text style={styles.cardText}>{goodToday}</Text>
                    </View>
                  ) : null}

                  {appreciate.trim() ? (
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Someone I appreciate…</Text>
                      <Text style={styles.cardText}>{appreciate}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {isEditing ? (
            <View style={styles.row}>
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.row}>
              <Pressable
                onPress={() => setIsEditing(true)}
                style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
              >
                <Text style={styles.outlineButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDeleteConfirm(true)}
                style={({ pressed }) => [styles.dangerOutlineButton, pressed && styles.pressed]}
              >
                <Text style={styles.dangerOutlineButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Delete confirmation */}
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.confirmBackdrop}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Delete Entry?</Text>
              <Text style={styles.confirmText}>
                This action cannot be undone. Are you sure you want to delete this entry?
              </Text>
              <View style={styles.row}>
                <Pressable
                  onPress={() => setShowDeleteConfirm(false)}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  inner: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  closeButtonText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    paddingBottom: 28,
  },

  form: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 12,
  },

  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 14,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#111827',
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '800',
  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  secondaryButtonText: {
    fontWeight: '800',
    color: '#374151',
  },

  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  outlineButtonText: {
    fontWeight: '800',
    color: '#4F46E5',
  },

  dangerOutlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  dangerOutlineButtonText: {
    fontWeight: '800',
    color: '#EF4444',
  },

  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    color: '#111827',
  },
  confirmText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 16,
  },
});
