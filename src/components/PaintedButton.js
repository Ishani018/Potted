import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SET_UI } from '../engine/assets';

const SERIF = Platform.select({ web: "'Almendra', Georgia, serif", default: 'Almendra' });
export const bw = (key, h) => h * SET_UI[key].w / SET_UI[key].h;

// A painted button: the left and right ends of the cream (or red) button picture with the middle stretched sideways,
// so the vine corners keep their shape however long the label is.
export default function PaintedButton({ label, onPress, disabled, tone = 'btnCream', h = 34, style, fontSize = 15 }) {
  const full = bw(tone, h), cap = Math.round(full * 0.34);
  const img = SET_UI[tone].src;
  return (
    <TouchableOpacity activeOpacity={0.8} disabled={disabled} onPress={onPress} style={[{ height: h, minWidth: full, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'stretch', opacity: disabled ? 0.5 : 1 }, style]}>
      <View style={{ width: cap, height: h, overflow: 'hidden' }}><Image source={img} resizeMode="stretch" style={{ width: full, height: h }} /></View>
      <View style={{ flex: 1, height: h, overflow: 'hidden', paddingHorizontal: 6 }}>
        <Image source={img} resizeMode="stretch" style={{ position: 'absolute', top: 0, left: -(full * 25), width: full * 50, height: h }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={[s.text, { fontSize }]}>{label}</Text></View>
      </View>
      <View style={{ width: cap, height: h, overflow: 'hidden' }}><Image source={img} resizeMode="stretch" style={{ width: full, height: h, marginLeft: -(full - cap) }} /></View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  text: { fontFamily: SERIF, color: '#4a2a10', fontWeight: 'bold', textAlign: 'center' },
});
