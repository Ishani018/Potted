import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PlantPopup({ slot, position, onWater, onHarvest, onRemove, onClose }) {
  if (!slot) return null;

  const canHarvest = slot.type === 'potted' && slot.stage === 3 && !slot.isDead;
  const canWater = !!slot.flowerKey && !slot.isDead;

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <View
        style={[
          styles.popup,
          {
            left: Math.min(position.x - 60, 260),
            top: Math.max(position.y - 130, 10),
          },
        ]}
      >
        {canWater && (
          <TouchableOpacity style={styles.btn} onPress={onWater}>
            <Text style={styles.btnText}>Water</Text>
          </TouchableOpacity>
        )}
        {canHarvest && (
          <TouchableOpacity style={[styles.btn, styles.btnHarvest]} onPress={onHarvest}>
            <Text style={styles.btnText}>Harvest</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.btnRemove]} onPress={onRemove}>
          <Text style={styles.btnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  popup: {
    position: 'absolute',
    backgroundColor: 'rgba(28,14,2,0.93)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#c8873a',
    padding: 8,
    gap: 6,
    minWidth: 120,
  },
  btn: {
    backgroundColor: '#3d2009',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7a4a18',
  },
  btnHarvest: {
    backgroundColor: '#2a5c1e',
    borderColor: '#5aaa3a',
  },
  btnRemove: {
    backgroundColor: '#5c1e1e',
    borderColor: '#aa3a3a',
  },
  btnText: {
    color: '#ffe8a0',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
