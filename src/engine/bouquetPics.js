// The finished, wrapped bouquet pictures (assets/bouquets/): a kraft set and a floral-parchment
// set, each with a few flower mixes. The one shown is the picture whose flowers match what you
// put in best (a poppy counts as a rose, a jasmine as the white lily, and so on).

// 'k' = kraft paper, 'f' = floral (layered) paper
const PICS = {
  k: [
    { id: 'p1_k', flowers: ['daisy', 'daisy', 'daisy'], img: require('../../assets/bouquets/p1_k.png') },
    { id: 'p2_k', flowers: ['rose', 'rose', 'rose'], img: require('../../assets/bouquets/p2_k.png') },
    { id: 'p3_k', flowers: ['jasmine', 'peony', 'snapdragon'], img: require('../../assets/bouquets/p3_k.png') },
    { id: 'p4_k', flowers: ['daisy', 'rose', 'snapdragon'], img: require('../../assets/bouquets/p4_k.png') },
    { id: 'p5_k', flowers: ['rose', 'rose', 'marigold'], img: require('../../assets/bouquets/p5_k.png') },
    { id: 'p6_k', flowers: ['rose', 'rose', 'marigold'], img: require('../../assets/bouquets/p6_k.png') },
    { id: 'p8_k', flowers: ['hydrenga', 'hydrenga', 'hydrenga'], img: require('../../assets/bouquets/p8_k.png') },
    { id: 'p9_k', flowers: ['jasmine', 'jasmine', 'jasmine'], img: require('../../assets/bouquets/p9_k.png') },
  ],
  f: [
    { id: 'p1_f', flowers: ['peony', 'peony', 'peony'], img: require('../../assets/bouquets/p1_f.png') },
    { id: 'p2_f', flowers: ['rose', 'rose', 'rose'], img: require('../../assets/bouquets/p2_f.png') },
    { id: 'p3_f', flowers: ['rose', 'marigold', 'hydrenga'], img: require('../../assets/bouquets/p3_f.png') },
    { id: 'p4_f', flowers: ['marigold', 'peony', 'petunia'], img: require('../../assets/bouquets/p4_f.png') },
    { id: 'p5_f', flowers: ['marigold', 'marigold', 'rose'], img: require('../../assets/bouquets/p5_f.png') },
    { id: 'p6_f', flowers: ['rose', 'rose', 'marigold'], img: require('../../assets/bouquets/p6_f.png') },
    { id: 'p8_f', flowers: ['hydrenga', 'hydrenga', 'hydrenga'], img: require('../../assets/bouquets/p8_f.png') },
    { id: 'p9_f', flowers: ['poppy', 'poppy', 'poppy'], img: require('../../assets/bouquets/p9_f.png') },
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
  const total = (p) => score(picks, p.flowers) * 2 + score(want, p.flowers);   // an exact flower beats a look-alike
  let best = -1; let tied = [];
  for (const p of set) {
    const s = total(p);
    if (s > best) { best = s; tied = [p]; } else if (s === best) tied.push(p);
  }
  // same picks always give the same picture
  const h = [...picks].sort().join('').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return tied[h % tied.length].img;
}

// Which flowers have a bouquet picture on this paper (customers only ask for those).
export function picturedFlowers(paper) {
  const set = PICS[paper === 'layered' ? 'f' : 'k'];
  return [...new Set(set.flatMap((p) => p.flowers))];
}

// every picture on a paper: [{ id, flowers, img }]
export function picturesFor(paper) {
  return PICS[paper === 'layered' ? 'f' : 'k'];
}

export function pictureById(id) {
  return [...PICS.k, ...PICS.f].find((p) => p.id === id) ?? null;
}
