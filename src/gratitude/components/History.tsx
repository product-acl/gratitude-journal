import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export interface Entry {
  id: string;
  date: string;
  grateful: string;
  goodToday: string;
  appreciate: string;
}

interface HistoryProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
}

type FilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

interface GroupedEntries {
  [dateKey: string]: Entry[];
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString();
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function History({ entries, onSelectEntry }: HistoryProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeStartDate, setRangeStartDate] = useState<Date | null>(null);
  const [rangeEndDate, setRangeEndDate] = useState<Date | null>(null);
  const [activeRangeField, setActiveRangeField] = useState<'start' | 'end'>('start');

  const filteredEntries = useMemo(() => {
    if (filterType === 'all') return entries;

    const today = startOfToday();

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      if (filterType === 'today') {
        return entryDate.getTime() === today.getTime();
      }

      if (filterType === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return entryDate >= weekAgo;
      }

      if (filterType === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return entryDate >= monthAgo;
      }

      if (filterType === 'custom') {
        if (!rangeStartDate || !rangeEndDate) return true;
        const start = new Date(rangeStartDate);
        const end = new Date(rangeEndDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return entryDate >= start && entryDate <= end;
      }

      return true;
    });
  }, [entries, filterType, rangeEndDate, rangeStartDate]);

  const groupedEntries: GroupedEntries = useMemo(() => {
    return filteredEntries.reduce((groups: GroupedEntries, entry) => {
      const key = new Date(entry.date).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
      return groups;
    }, {});
  }, [filteredEntries]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Entries</Text>
        <Pressable onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Feather name="filter" size={18} color="#4F46E5" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {Object.entries(groupedEntries).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>Start a new entry to see it here.</Text>
          </View>
        ) : (
          Object.entries(groupedEntries).map(([dateKey, group]) => (
            <View key={dateKey} style={styles.group}>
              <Text style={styles.dateLabel}>{formatDateLabel(group[0].date)}</Text>

              {group.map((entry) => (
                <Pressable
                  key={entry.id}
                  style={styles.entryCard}
                  onPress={() => onSelectEntry(entry)}
                >
                  <Text style={styles.entryTime}>{formatTime(entry.date)}</Text>
                  <View style={styles.entrySection}>
                    <Text style={styles.entryLabel}>I’m grateful for</Text>
                    <Text style={styles.entryValue}>{entry.grateful || '—'}</Text>
                  </View>
                  <View style={styles.entrySection}>
                    <Text style={styles.entryLabel}>Something good today</Text>
                    <Text style={styles.entryValue}>{entry.goodToday || '—'}</Text>
                  </View>
                  <View style={styles.entrySection}>
                    <Text style={styles.entryLabel}>Someone I appreciate</Text>
                    <Text style={styles.entryValue}>{entry.appreciate || '—'}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showFilterModal} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowFilterModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => null}>
            <Text style={styles.modalTitle}>Filter</Text>
            <Pressable onPress={() => { setFilterType('all'); setShowFilterModal(false); }}>
              <Text style={styles.modalItem}>All</Text>
            </Pressable>
            <Pressable onPress={() => { setFilterType('today'); setShowFilterModal(false); }}>
              <Text style={styles.modalItem}>Today</Text>
            </Pressable>
            <Pressable onPress={() => { setFilterType('week'); setShowFilterModal(false); }}>
              <Text style={styles.modalItem}>This Week</Text>
            </Pressable>
            <Pressable onPress={() => { setFilterType('month'); setShowFilterModal(false); }}>
              <Text style={styles.modalItem}>This Month</Text>
            </Pressable>
            <Pressable onPress={() => { setFilterType('custom'); setShowFilterModal(false); setShowRangeModal(true); }}>
              <Text style={styles.modalItem}>Date Range</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showRangeModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowRangeModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <Text style={styles.modalTitle}>Date Range</Text>
            <View style={styles.rangeField}>
              <Text style={styles.rangeLabel}>Start date</Text>
              <Pressable
                style={[styles.rangeInput, activeRangeField === 'start' && styles.rangeInputActive]}
                onPress={() => setActiveRangeField('start')}
              >
                <Text style={styles.rangeInputText}>
                  {rangeStartDate ? rangeStartDate.toLocaleDateString() : 'Select date'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.rangeField}>
              <Text style={styles.rangeLabel}>End date</Text>
              <Pressable
                style={[styles.rangeInput, activeRangeField === 'end' && styles.rangeInputActive]}
                onPress={() => setActiveRangeField('end')}
              >
                <Text style={styles.rangeInputText}>
                  {rangeEndDate ? rangeEndDate.toLocaleDateString() : 'Select date'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.rangeActions}>
              <Pressable onPress={() => setShowRangeModal(false)} style={styles.rangeButtonOutline}>
                <Text style={styles.rangeButtonOutlineText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!rangeStartDate || !rangeEndDate) {
                    Alert.alert('Select dates', 'Pick both a start and end date.');
                    return;
                  }
                  setFilterType('custom');
                  setShowRangeModal(false);
                }}
                style={styles.rangeButton}
              >
                <Text style={styles.rangeButtonText}>Apply</Text>
              </Pressable>
            </View>

            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={(activeRangeField === 'start' ? rangeStartDate : rangeEndDate) ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, date) => {
                  if (event.type !== 'set' || !date) return;
                  if (activeRangeField === 'start') {
                    setRangeStartDate(date);
                  } else {
                    setRangeEndDate(date);
                  }
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  group: { marginBottom: 16 },
  dateLabel: { fontWeight: '700', marginBottom: 6 },
  entryCard: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  entryTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  entrySection: {
    gap: 2,
  },
  entryLabel: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  entryValue: {
    fontSize: 15,
    color: '#111827',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  modalItem: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 6,
  },
  rangeField: {
    gap: 6,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  rangeInputActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  rangeInputText: {
    fontSize: 15,
    color: '#111827',
  },
  rangeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  rangeButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  rangeButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  rangeButtonOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  rangeButtonOutlineText: {
    color: '#374151',
    fontWeight: '700',
  },
  pickerWrap: {
    marginTop: 6,
  },
});
