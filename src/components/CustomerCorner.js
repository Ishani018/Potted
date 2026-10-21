import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { TRADE_IMAGES, SEED_IMAGES, UI_IMAGES } from '../engine/assets';
import { CUSTOMERS, TRADE_FLOWERS, CUSTOMERS_PER_DAY } from '../constants/gameData';
import { openOrders, customerLine, flowerName } from '../engine/customers';
import { PixelPanel, PixelButton, PixelText, COLORS } from './Pixel';
import CustomerSprite, { SPRITE_ASPECT } from './CustomerSprite';

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
  if (!sw || !sh) return null;

  const orders = openOrders(state.player);
  const order = orders[0];
  if (!order) return null;

  const scale = sw / PLOPPER_W;
  const h = CUSTOMER_SPOT.h * (sh / PLOPPER_H);
  const w = h * SPRITE_ASPECT;
  const left = CUSTOMER_SPOT.x * scale - w / 2;
  const top = CUSTOMER_SPOT.feetY * (sh / PLOPPER_H) - h;

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
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(true)} style={{ position: 'absolute', left, top, width: w, height: h, zIndex: 20 }}>
        <CustomerSprite customerKey={order.customer} height={h} />
        <View style={styles.bubble}><PixelText size={Math.max(8, Math.round(h * 0.07))} color={COLORS.gold}>!</PixelText></View>
      </TouchableOpacity>

      {open && (
        <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: Math.min(sw - 24, 360) }}>
            <PixelPanel>
              <View style={{ gap: 10 }}>
                <View style={styles.head}>
                  <View style={styles.portrait}>
                    <View style={{ position: 'absolute', top: 2, left: (64 - 120 * SPRITE_ASPECT) / 2 }}>
                      <CustomerSprite customerKey={order.customer} height={120} bob={false} />
                    </View>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <PixelText size={11} color={COLORS.gold}>{c.name.toUpperCase()}</PixelText>
                    <PixelText size={7}>CUSTOMER {Math.min(done + 1, CUSTOMERS_PER_DAY)} OF {CUSTOMERS_PER_DAY} TODAY</PixelText>
                  </View>
                </View>

                {/* what they say */}
                <View style={styles.speech}>
                  <PixelText size={8} color="#5a3410" style={{ lineHeight: 14 }}>{customerLine(order)}</PixelText>
                </View>

                {/* the order */}
                <View style={styles.row}>
                  {art && <Image source={art} style={styles.icon} resizeMode="contain" />}
                  {order.type === 'flowers' ? (
                    <PixelText size={9} color={canGive ? '#cfe8a0' : '#ff9a7a'}>
                      {flowerName(order.flowerKey).toUpperCase()}  {Math.min(have, order.qty)}/{order.qty}
                    </PixelText>
                  ) : (
                    <PixelText size={8}>BOUQUET WITH {flowerName(order.flowerKey).toUpperCase()}</PixelText>
                  )}
                </View>

                {/* the reward */}
                <View style={styles.row}>
                  <Image source={UI_IMAGES.goldcoins} style={styles.coin} resizeMode="contain" />
                  <PixelText size={9} color={COLORS.gold}>
                    {order.type === 'flowers' ? order.coins : `PRICE + ${order.tip} TIP`}
                  </PixelText>
                  <PixelText size={7} style={{ marginLeft: 6 }}>+{order.xp} XP</PixelText>
                  {order.seed && SEED_IMAGES[order.seed] && (
                    <>
                      <Image source={SEED_IMAGES[order.seed]} style={styles.seed} resizeMode="contain" />
                      <PixelText size={7}>BONUS SEED</PixelText>
                    </>
                  )}
                </View>

                {order.type === 'flowers' ? (
                  <PixelButton label={canGive ? 'GIVE FLOWERS' : 'NOT ENOUGH YET'} onPress={canGive ? give : undefined} disabled={!canGive} />
                ) : (
                  <PixelText size={7} color="#cfe8a0" style={{ textAlign: 'center' }}>
                    TIE A BOUQUET WITH {flowerName(order.flowerKey).toUpperCase()} AT THIS TABLE AND IT GOES TO {c.name.split(' ').pop().toUpperCase()}
                  </PixelText>
                )}
                <PixelButton label="CLOSE" tone="wood" size={9} onPress={() => setOpen(false)} />
              </View>
            </PixelPanel>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute', top: -6, right: -4,
    backgroundColor: COLORS.woodDark, borderWidth: 3, borderColor: COLORS.woodEdge, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', zIndex: 250,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  portrait: {
    width: 64, height: 64, overflow: 'hidden', borderRadius: 4,
    backgroundColor: '#e8d4a8', borderWidth: 3, borderColor: COLORS.woodEdge,
  },
  speech: { backgroundColor: '#fbf0cf', borderRadius: 4, borderWidth: 2, borderColor: COLORS.creamEdge, padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 34, height: 34 },
  coin: { width: 20, height: 20 },
  seed: { width: 26, height: 26, marginLeft: 6 },
});
