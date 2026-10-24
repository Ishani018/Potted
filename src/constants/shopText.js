import { FLOWER_GROWTH, POTTED_FLOWERS, HANGING_PLANTS, formatDuration, CAN_INFO } from './gameData';

// Words for the nursery's item card: a short description plus a few "more details" lines.
const SEED_DESC = {
  daisy: 'Cheerful white petals around a sunny yellow heart. The easiest flower to start with.',
  snapdragon: 'Tall spires of ruffled blooms that open from the bottom up.',
  poppy: 'Bright red petals with a dark, velvety centre. Gone by evening in the wild, kept for you here.',
  marigold: 'Golden pom-pom blooms, a garden favourite that never looks tired.',
  peony: 'Big, soft, blushing petals folded like a ball gown.',
  hydrenga: 'Round clusters of tiny blue blossoms that look like a cloud.',
  rose: 'A classic red rose with velvety petals and a sweet scent.',
  stringofpearls: 'Trailing strands of little green pearls. Looks best in a hanging pot.',
  Philodendron: 'Glossy heart-shaped leaves that trail and climb. Happy in a hanging pot.',
  jasmine: 'Starry white flowers with a lovely scent that fills the room.',
  petunia: 'Ruffled purple trumpets that spill over the edge of the pot.',
  Bougainvillea: 'Papery magenta bracts that cascade like a waterfall of colour.',
};

const PPOT_DESC = {
  1: 'Warm terracotta with a scalloped rim and ivy creeping over it.', 2: 'Cream porcelain with a scalloped rim and little green leaves.',
  3: 'A round sage-green pot with pumpkin-style ribs.', 4: 'The plain clay pot every gardener starts with.',
  5: 'Cream glaze painted with tiny blue bluebells.', 6: 'A mint-green square planter carved with leaves.',
  7: 'Scalloped cream pot dotted with white daisies and vines.', 8: 'A cosy pot with two handles and a row of pink tulips.',
  9: 'Soft cream pot tied up with a golden rope bow.', 10: 'Cream scalloped pot with pale blue stripes.',
  11: 'Shaped like a tulip, with blush-pink petals for a rim.', 12: 'Cream pot wrapped in a trailing green vine.',
  13: 'Fluted terracotta with a smart round rim.', 14: 'A lilac pot standing on little curled feet.',
  15: 'A sturdy wooden crate for a rustic look.', 16: 'A woven wicker basket with two handles.',
  17: 'A round belly pot painted with white daisies.', 18: 'Blue fluted pot finished with a pretty bow.',
  19: 'Cream pot with leafy vines and its own saucer.', 20: 'An oak barrel bound with iron hoops.',
  21: 'Speckled stone pot, soft with moss.', 22: 'Cream pot with sprigs of lavender on the ribs.',
  23: 'A little urn with handles and blue flower vines.', 24: 'A cream pedestal urn, elegant on any shelf.',
  25: 'A peach pot with a ruffled, frilly rim.', 26: 'A cream crate planter with ivy spilling over the sides.',
  27: 'Sage-green pot with soft vertical flutes.', 28: 'Scalloped cream pot with a blue ribbon swag.',
  29: 'Deep green pot with cheerful white daisies.', 30: 'Terracotta rim, cream body and a garland of lemons.',
  31: 'Dusty mauve pot embossed with leaves.', 32: 'Cream urn with two handles and fine fluting.',
  33: 'A wide, rustic clay bowl with a weathered glaze.', 34: 'Scalloped cream pot with bluebell sprigs.',
  35: 'Cream pot with a curtain of trailing pearl strings.',
};

const HPOT_DESC = {
  macrame: 'Knotted cream rope slung around a little pot. Free for every gardener.',
  macramethin: 'A slim macramé sling with long tassels.',
  terracotta: 'A clay pot hung from a chain, with a rustic look.',
  basket: 'A woven wicker basket on four sturdy chains.',
  chain: 'A scalloped green bowl hanging from golden chains.',
  bowl: 'A ceramic bowl that swings gently from its hooks.',
  barrel: 'A little oak barrel to hang from the rod.',
};

export function itemText(id, price) {
  const [kind, key] = id.split(':');
  if (kind === 's') {
    const info = POTTED_FLOWERS[key] || HANGING_PLANTS[key] || {};
    const hours = FLOWER_GROWTH[key]?.hours;
    const lines = [];
    if (hours) lines.push(['Grows in', formatDuration(hours * 3600 * 1000)]);
    if (info.harvestCoins) lines.push(['Harvest worth', `${info.harvestCoins} coins`]);
    lines.push(['Plant it in', HANGING_PLANTS[key] ? 'A hanging pot' : 'A shelf pot']);
    return { desc: SEED_DESC[key] || 'A packet of seeds.', lines };
  }
  if (kind === 'p') return { desc: PPOT_DESC[key] || 'A pretty pot.', lines: [['Type', 'Shelf pot'], ['Fits', 'Any shelf plant']] };
  if (kind === 'h') return { desc: HPOT_DESC[key] || 'A pot to hang.', lines: [['Type', 'Hanging pot'], ['Hangs', 'From the rod or a hook']] };
  const can = CAN_INFO[key] || {};
  return { desc: 'A shiny red watering can with white blossoms. It pours twice as fast as the blue one.', lines: [['Waters in', `${(can.holdMs ?? 1000) / 1000} second${(can.holdMs ?? 1000) === 1000 ? '' : 's'}`], ['Compared to blue', 'Twice as fast']] };
}
