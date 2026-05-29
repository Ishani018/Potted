import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { UI_IMAGES } from '../engine/assets';

export default function WateringCan({ position, isWatering, onPress }) {
  const src = isWatering ? UI_IMAGES.wateringcan2 : UI_IMAGES.wateringcan1;
  return (
    <TouchableOpacity
      style={[styles.container, { left: position.x - 28, top: position.y - 28 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={src} style={styles.img} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 56,
    height: 56,
    zIndex: 10,
  },
  img: {
    width: 56,
    height: 56,
  },
});
