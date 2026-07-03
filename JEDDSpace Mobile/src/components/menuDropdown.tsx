import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type NavItem =
  | { kind: 'link'; label: string; icon: string; value: string }
  | { kind: 'section'; label: string };

const NAV_ITEMS: NavItem[] = [
  { kind: 'link',    label: 'Dashboard',      icon: '⊞',  value: '/' },
  { kind: 'link',    label: 'Documents',      icon: '📄', value: '/documents' },
  { kind: 'link',    label: 'Emails',         icon: '✉️',  value: '/email' },
  { kind: 'link',    label: 'Contracts',      icon: '📋', value: '/contracts' },
  { kind: 'link',    label: 'Announcements',  icon: '📢', value: '/announcements' },
  { kind: 'section', label: 'HR Forms' },
  { kind: 'link',    label: 'Business Form',  icon: '💼', value: '/business-form' },
  { kind: 'link',    label: 'Leave Form',     icon: '🗓️', value: '/leave-form' },
];

export default function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleNav = (value: string) => {
    setOpen(false);
    router.push(value as any);
  };

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.triggerLeft}>
          <View style={styles.hamburgerLines}>
            <View style={styles.line} />
            <View style={styles.line} />
            <View style={styles.lineShort} />
          </View>
          <Text style={styles.triggerLabel}>Menu</Text>
        </View>
        <Text style={styles.triggerChevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Modal overlay */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Stop press from closing when tapping inside the sheet */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Navigate to</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {NAV_ITEMS.map((item, idx) => {
                if (item.kind === 'section') {
                  return (
                    <View key={idx} style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>{item.label}</Text>
                      <View style={styles.sectionLine} />
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.navItem}
                    onPress={() => handleNav(item.value)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.navIcon}>{item.icon}</Text>
                    <Text style={styles.navLabel}>{item.label}</Text>
                    <Text style={styles.navArrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Trigger
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E0977',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hamburgerLines: {
    gap: 4,
  },
  line: {
    width: 18,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  lineShort: {
    width: 12,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  triggerLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  triggerChevron: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    maxHeight: 480,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // Nav items
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  navIcon: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  navArrow: {
    fontSize: 18,
    color: '#D1D5DB',
    fontWeight: '300',
  },
});
