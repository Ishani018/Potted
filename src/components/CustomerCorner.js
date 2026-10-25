import React, { useEffect, useRef, useState } from 'react';
import { View, Image, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_IMAGES, SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { CUSTOMERS, TRADE_FLOWERS, CUSTOMERS_PER_DAY } from '../constants/gameData';
import { openOrders, customerLine, flowerName } from '../engine/customers';
import { PixelPanel, PixelButton, PixelText, COLORS } from './Pixel';
import CustomerSprite, { SPRITE_ASPECT } from './CustomerSprite';
import Portrait from './Portrait';

// The next waiting customer stands at the florist with a "!" bubble. Tap them
// to read their order. Flower orders can be handed over right here; bouquet
// orders are made at the bouquet table (the table offers to deliver them).
// Position is in the 1376×768 base space (feet on the floor); tune to the shop art.
const PLOPPER_W = 1376;
const PLOPPER_H = 768;
const CUSTOMER_SPOT = { x: 130, feetY: 640, h: 290 };

export default function CustomerCorner({ sw, sh }) {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false);
  // After you serve someone they stay a moment, hop for joy and say thanks.
  const [farewell, setFarewell] = useState(null);   // { customer, line }
  const prevOrder = useRef(null);
  const farewellTimer = useRef(null);
  // A new customer hops in from the left edge to the spot (feet on the floor), then the
  // "!" appears and they can be tapped.
  const walk = useRef(new Animated.Value(1)).current;     // 0 = off screen, 1 = at the spot
  const hopY = useRef(new Animated.Value(0)).current;
  const [arrived, setArrived] = useState(true);
  const lastArrival = useRef(null);

  const order = openOrders(state.player)[0];
  const list = state.player.customers?.list ?? [];

  useEffect(() => {
    const prev = prevOrder.current;
    if (prev && prev.id !== order?.id && list.find((o) => o.id === prev.id)?.done) {
      setOpen(false);
      setFarewell({ customer: prev.customer, line: CUSTOMERS[prev.customer]?.thanks ?? '' });
      if (farewellTimer.current) clearTimeout(farewellTimer.current);
      farewellTimer.current = setTimeout(() => setFarewell(null), 2200);
    }
    prevOrder.current = order ?? null;
  }, [order?.id]);

  useEffect(() => () => farewellTimer.current && clearTimeout(farewellTimer.current), []);

  useEffect(() => {
    if (!order?.id || lastArrival.current === order.id) return undefined;
    lastArrival.current = order.id;
    setArrived(false);
    walk.setValue(0); hopY.setValue(0);
    const HOPS = 5, HOP_MS = 300;
    const hops = [];
    for (let i = 0; i < HOPS; i++) {
      hops.push(Animated.timing(hopY, { toValue: -1, duration: HOP_MS / 2, easing: Easing.out(Easing.quad), useNativeDriver: false }));
      hops.push(Animated.timing(hopY, { toValue: 0, duration: HOP_MS / 2, easing: Easing.in(Easing.quad), useNativeDriver: false }));
    }
    const anim = Animated.parallel([
      Animated.timing(walk, { toValue: 1, duration: HOPS * HOP_MS, easing: Easing.linear, useNativeDriver: false }),
      Animated.sequence(hops),
    ]);
    anim.start(({ finished }) => { if (finished) setArrived(true); });
    return () => anim.stop();
  }, [order?.id]);

  if (!sw || !sh) return null;
  if (!order && !farewell) return null;

  const scale = sw / PLOPPER_W;
  const h = CUSTOMER_SPOT.h * (sh / PLOPPER_H);
  const w = h * SPRITE_ASPECT;
  const left = CUSTOMER_SPOT.x * scale - w / 2;
  const top = CUSTOMER_SPOT.feetY * (sh / PLOPPER_H) - h;

  // Just served: the happy customer + their thank-you, until the next one steps up.
  if (farewell) {
    const bubbleW = Math.min(200, sw - 16);
    return (
      <View style={{ position: 'absolute', left, top, width: w, height: h, zIndex: 20, pointerEvents: 'none' }}>
        <CustomerSprite customerKey={farewell.customer} height={h} happy />
        <View style={[styles.thanks, { width: bubbleW, left: Math.max(8 - left, w / 2 - bubbleW / 2), top: -Math.max(44, h * 0.16) }]}>
          <PixelText size={7} color="#5a3410" style={{ lineHeight: 12 }}>{farewell.line}</PixelText>
        </View>
        <PixelText size={Math.max(9, Math.round(h * 0.07))} color={COLORS.gold} style={{ position: 'absolute', left: -4, top: h * 0.05 }}>✦</PixelText>
        <PixelText size={Math.max(8, Math.round(h * 0.06))} color={COLORS.gold} style={{ position: 'absolute', right: -2, top: h * 0.02 }}>✦</PixelText>
      </View>
    );
  }

  const c = CUSTOMERS[order.customer];
  const harvested = state.player.harvestedFlowers ?? {};
  const have = harvested[order.flowerKey] ?? 0;
  const done = (state.player.customers?.list ?? []).filter((o) => o.done).length;
  const canGive = order.type === 'flowers' && have >= order.qty;
  const art = TRADE_IMAGES[TRADE_FLOWERS[order.flowerKey]?.img];

  const give = () => {
    dispatch({ type: 'FULFILL_CUSTOMER', id: order.id });
    setOpen(false);
  };

  return (
    <>
      <Animated.View
        style={{
          position: 'absolute', left, top, width: w, height: h, zIndex: 20,
          transform: [
            { translateX: walk.interpolate({ inputRange: [0, 1], outputRange: [-(left + w), 0] }) },
            { translateY: hopY.interpolate({ inputRange: [-1, 0], outputRange: [-h * 0.06, 0] }) },
          ],
        }}
      >
        <TouchableOpacity activeOpacity={0.85} disabled={!arrived} onPress={() => setOpen(true)} style={{ width: w, height: h }}>
          <CustomerSprite customerKey={order.customer} height={h} bob={arrived} />
          {arrived && <View style={styles.bubble}><PixelText size={Math.max(10, Math.round(h * 0.08))} color="#b04a2a">!</PixelText></View>}
        </TouchableOpacity>
      </Animated.View>

      {open && (
        <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: Math.min(sw - 24, 420) }}>
            <PixelPanel>
              <View style={{ gap: 10 }}>
                <View style={styles.head}>
                  <Portrait customerKey={order.customer} size={64} />
                  <View style={{ flex: 1 }}>
                    <PixelText size={13}>{c.name}</PixelText>
                    <PixelText size={8} color="#8a6a40">Customer {Math.min(done + 1, CUSTOMERS_PER_DAY)} of {CUSTOMERS_PER_DAY}</PixelText>
                  </View>
                </View>

                <View style={styles.rule} />
                <PixelText size={9} color="#6a4524" style={{ lineHeight: 18 }}>{customerLine(order)}</PixelText>
                <View style={styles.rule} />

                <View style={styles.row}>
                  {art && <Image source={art} style={styles.icon} resizeMode="contain" />}
                  {order.type === 'flowers' ? (
                    <PixelText size={10} color={canGive ? '#3f7a2e' : '#b04a2a'}>{flowerName(order.flowerKey)}  {Math.min(have, order.qty)} / {order.qty}</PixelText>
                  ) : (
                    <PixelText size={10}>A bouquet with {flowerName(order.flowerKey)}</PixelText>
                  )}
                </View>

                <View style={styles.row}>
                  <Image source={UI_IMAGES.goldcoins} style={styles.coin} resizeMode="contain" />
                  <PixelText size={10} color="#a8700a">{order.type === 'flowers' ? `${order.coins} coins` : `price + ${order.tip} tip`}</PixelText>
                  <PixelText size={8} color="#8a6a40" style={{ marginLeft: 6 }}>+{order.xp} xp</PixelText>
                  {order.seed && SEED_IMAGES[order.seed] && (
                    <>
                      <Image source={SEED_IMAGES[order.seed]} style={styles.seed} resizeMode="contain" />
                      <PixelText size={8} color="#8a6a40">bonus seed</PixelText>
                    </>
                  )}
                </View>

                {order.type === 'flowers' ? (
                  <PixelButton label={canGive ? 'Give flowers' : 'Not enough yet'} onPress={canGive ? give : undefined} disabled={!canGive} />
                ) : (
                  <PixelText size={8} color="#6a4524" style={{ textAlign: 'center' }}>
                    Tie a bouquet with {flowerName(order.flowerKey)} at this table and it goes to {c.name.split(' ').pop()}.
                  </PixelText>
                )}
                <PixelButton label="Close" tone="wood" size={9} onPress={() => setOpen(false)} />
              </View>
            </PixelPanel>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  thanks: {
    position: 'absolute', backgroundColor: '#f3e0b6', borderRadius: 14, borderWidth: 3, borderColor: '#8a5a2a',
    paddingHorizontal: 8, paddingVertical: 6,
  },
  bubble: {
    position: 'absolute', top: -6, right: -4,
    backgroundColor: '#f3e0b6', borderWidth: 3, borderColor: '#8a5a2a', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', zIndex: 250,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { height: 1, backgroundColor: '#d9bd86' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 34, height: 34 },
  coin: { width: 20, height: 20 },
  seed: { width: 26, height: 26, marginLeft: 6 },
});
