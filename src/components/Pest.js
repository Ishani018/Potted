import React, { useEffect, useRef } from 'react';
import { Animated, Easing, TouchableOpacity, View, StyleSheet } from 'react-native';

// A little bug drawn with Views (no image asset needed). It wiggles so it reads
// as alive; tapping it calls onPress (shoo it away).
const COLORS = {
  aphid:  { body: '#7fbf3a', shell: '#5c9a22', head: '#2f4a12' },
  beetle: { body: '#8a4a1c', shell: '#6a3410', head: '#2a1606' },
};

export default function Pest({ type = 'aphid', size, left, top, onPress }) {
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const c = COLORS[type] ?? COLORS.aphid;
  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] });
  const head = size * 0.42;
  const spot = Math.max(2, size * 0.14);

  return (
    <TouchableOpacity
      style={{ position: 'absolute', left, top, width: size, height: size, zIndex: 12 }}
      onPress={onPress}
      activeOpacity={0.6}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
        {/* antennae */}
        <View style={[styles.antenna, { left: size * 0.32, top: 0, height: size * 0.3, transform: [{ rotate: '-25deg' }] }]} />
        <View style={[styles.antenna, { left: size * 0.62, top: 0, height: size * 0.3, transform: [{ rotate: '25deg' }] }]} />
        {/* head */}
        <View style={{ position: 'absolute', left: (size - head) / 2, top: size * 0.12, width: head, height: head, borderRadius: head / 2, backgroundColor: c.head }} />
        {/* body */}
        <View style={{
          position: 'absolute', left: size * 0.14, top: size * 0.3,
          width: size * 0.72, height: size * 0.66, borderRadius: size * 0.36,
          backgroundColor: c.body, borderWidth: 1.5, borderColor: c.head, overflow: 'hidden',
        }}>
          {/* wing split + spots */}
          <View style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1.5, marginLeft: -0.75, backgroundColor: c.shell }} />
          <View style={{ position: 'absolute', left: '22%', top: '30%', width: spot, height: spot, borderRadius: spot, backgroundColor: c.shell }} />
          <View style={{ position: 'absolute', right: '22%', top: '55%', width: spot, height: spot, borderRadius: spot, backgroundColor: c.shell }} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  antenna: { position: 'absolute', width: 1.5, backgroundColor: '#2a1606' },
});
