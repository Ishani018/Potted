import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
} from 'react-native';

const MENU_ITEMS = [
  { key: 'shop',         label: 'Shop' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'room',         label: 'Room' },
];

export default function NurseryMenu({ visible, onClose, onNavigate }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.menu}>
          <Text style={styles.title}>Nursery</Text>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.item}
              onPress={() => {
                onClose();
                onNavigate(item.key);
              }}
            >
              <Text style={styles.itemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.item, styles.closeItem]} onPress={onClose}>
            <Text style={styles.itemText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#1e0f02',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#c8873a',
    paddingVertical: 18,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#ffe8a0',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 6,
  },
  item: {
    backgroundColor: '#3d2009',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7a4a18',
  },
  closeItem: {
    marginTop: 6,
    backgroundColor: '#2a1608',
    borderColor: '#4a2810',
  },
  itemText: {
    color: '#ffe8a0',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
