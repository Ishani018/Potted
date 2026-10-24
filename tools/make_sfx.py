"""Synthesises the game's small UI / shop sounds (no downloads, no licences). usage: python3 tools/make_sfx.py
Writes assets/sfx/<name>.mp3 (needs numpy + ffmpeg)."""
import numpy as np, subprocess, wave, os
SR = 44100
rng = np.random.RandomState(7)
t = lambda d: np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na, nr = int(SR * a), int(SR * r)
    e[:na] = np.linspace(0, 1, max(1, na)); e[-nr:] *= np.linspace(1, 0, nr); return e
def tone(f, d, vol=1, decay=6, harm=(1, .5, .25)):
    x = t(d); y = sum(h * np.sin(2 * np.pi * f * (i + 1) * x) for i, h in enumerate(harm))
    return vol * y * np.exp(-decay * x) * env(len(x), .003, .02)
def mix(*parts):
    n = max(off + len(p) for off, p in parts); y = np.zeros(n)
    for off, p in parts: y[off:off + len(p)] += p
    return y
def at(s, p): return (int(SR * s), p)
def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, mode='same')
def save(name, y, gain=0.8):
    y = y / max(1e-6, np.abs(y).max()) * gain
    wav = f'/tmp/{name}.wav'
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes())
    os.makedirs('assets/sfx', exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '4', f'assets/sfx/{name}.mp3'], check=True)

# coin: two bright metallic pings
save('coin', mix(at(0, tone(1568, .5, 1, 7, (1, .6, .3))), at(.09, tone(2093, .6, .9, 6, (1, .5, .3)))))
# register: drawer thunk + bell ring ("cha-ching")
thunk = lowpass(rng.randn(int(SR * .12)), 40) * np.exp(-30 * t(.12)) * 2
save('register', mix(at(0, thunk), at(.07, tone(1976, .9, .8, 4, (1, .7, .5, .3))), at(.17, tone(2637, 1.0, .8, 4, (1, .6, .4)))))
# tap: soft wooden click
save('tap', tone(520, .08, 1, 40, (1, .3)) + lowpass(rng.randn(int(SR * .08)), 6) * np.exp(-60 * t(.08)) * .4, .6)
# add: friendly two-note blip
save('add', mix(at(0, tone(660, .12, 1, 14, (1, .3))), at(.08, tone(880, .18, 1, 12, (1, .3)))), .7)
# pop: seed into soil
x = t(.14); f = 300 + 700 * np.exp(-x * 40)
save('pop', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-28 * x) * env(len(x), .002, .02), .8)
# water: a short burbling pour
n = int(SR * .9); x = np.arange(n) / SR
noise = lowpass(rng.randn(n), 9) - lowpass(rng.randn(n), 60)
bub = sum(np.sin(2 * np.pi * (500 + 900 * rng.rand()) * x) * np.exp(-40 * ((x - rng.rand() * .8) % .15)) * .15 for _ in range(14))
save('water', (noise * 1.2 + bub) * env(n, .08, .25) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * x)), .7)
# error: low soft buzz
x = t(.22); save('nope', (np.sin(2 * np.pi * 150 * x) + .5 * np.sin(2 * np.pi * 300 * x)) * env(len(x), .005, .08) * (np.sin(2 * np.pi * 22 * x) > -.2), .5)
# whoosh: page / panel sweep
n = int(SR * .35); x = np.arange(n) / SR
w = lowpass(rng.randn(n), 20) - lowpass(rng.randn(n), 120)
save('whoosh', w * np.sin(np.pi * x / .35) ** 1.5, .6)
print('ok')
