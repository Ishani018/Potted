// The finished, wrapped bouquet pictures (assets/bouquets/): a kraft set and a floral-parchment
// set, each with a few flower mixes. The one shown is the picture whose flowers match what you
// put in best (a poppy counts as a rose, a jasmine as the white lily, and so on).

// 'k' = kraft paper, 'f' = floral (layered) paper
const PICS = {
  k: [
    { flowers: ['daisy', 'daisy', 'daisy'], img: require('../../assets/bouquets/p1_k.png') },
    { flowers: ['rose', 'rose', 'rose'], img: require('../../assets/bouquets/p2_k.png') },
    { flowers: ['jasmine', 'peony', 'snapdragon'], img: require('../../assets/bouquets/p3_k.png') },
    { flowers: ['daisy', 'rose', 'snapdragon'], img: require('../../assets/bouquets/p4_k.png') },
    { flowers: ['rose', 'rose', 'marigold'], img: require('../../assets/bouquets/p5_k.png') },
    { flowers: ['rose', 'rose', 'marigold'], img: require('../../assets/bouquets/p6_k.png') },
    { flowers: ['hydrenga', 'hydrenga', 'hydrenga'], img: require('../../assets/bouquets/p8_k.png') },
  ],
  f: [
    { flowers: ['peony', 'peony', 'peony'], img: require('../../assets/bouquets/p1_f.png') },
    { flowers: ['rose', 'rose', 'rose'], img: require('../../assets/bouquets/p2_f.png') },
    { flowers: ['rose', 'marigold', 'hydrenga'], img: require('../../assets/bouquets/p3_f.png') },
    { flowers: ['marigold', 'peony', 'petunia'], img: require('../../assets/bouquets/p4_f.png') },
    { flowers: ['marigold', 'marigold', 'rose'], img: require('../../assets/bouquets/p5_f.png') },
    { flowers: ['rose', 'rose', 'marigold'], img: require('../../assets/bouquets/p6_f.png') },
    { flowers: ['hydrenga', 'hydrenga', 'hydrenga'], img: require('../../assets/bouquets/p8_f.png') },
  ],
};

// flowers with no picture of their own borrow the look of a similar one
const LOOKS_LIKE = { poppy: 'rose', Bougainvillea: 'petunia', stringofpearls: 'jasmine', Philodendron: 'jasmine' };

function score(want, have) {
  const pool = [...have];
  let s = 0;
  for (const k of want) {
    const i = pool.indexOf(k);
    if (i >= 0) { s += 1; pool.splice(i, 1); }
  }
  return s;
}

export function bouquetPic(picks, paper) {
  const set = PICS[paper === 'layered' ? 'f' : 'k'];
  const want = picks.map((k) => LOOKS_LIKE[k] ?? k);
  let best = -1; let tied = [];
  for (const p of set) {
    const s = score(want, p.flowers);
    if (s > best) { best = s; tied = [p]; } else if (s === best) tied.push(p);
  }
  // same picks always give the same picture
  const h = [...picks].sort().join('').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return tied[h % tied.length].img;
}
