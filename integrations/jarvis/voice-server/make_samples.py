"""Generate A/B samples for every British-male Kokoro voice at several
speeds into samples/, plus an audition.html to click through them.
Run: .venv\\Scripts\\python.exe make_samples.py
"""
import glob
import os
import sys

for _d in glob.glob(os.path.join(sys.prefix, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(_d)
    os.environ["PATH"] = _d + os.pathsep + os.environ["PATH"]

os.environ.setdefault("ONNX_PROVIDER", "CUDAExecutionProvider")

import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "samples")
os.makedirs(OUT, exist_ok=True)

TEXT = (
    "Good evening, sir. All systems are operating within normal parameters. "
    "The morning briefing is ready — three priorities on deck, and video "
    "velocity is up about twelve percent since yesterday."
)
SPEEDS = [0.95, 1.0, 1.08]

kokoro = Kokoro(
    os.path.join(HERE, "kokoro-v1.0.onnx"),
    os.path.join(HERE, "voices-v1.0.bin"),
)

voices = sorted(v for v in kokoro.get_voices() if v.startswith("bm_"))
print("british male voices:", voices)

rows = []
for voice in voices:
    for speed in SPEEDS:
        name = f"{voice}_x{speed:.2f}.wav"
        samples, sr = kokoro.create(TEXT, voice=voice, speed=speed, lang="en-gb")
        sf.write(os.path.join(OUT, name), samples, sr)
        rows.append((voice, speed, name))
        print("wrote", name)

items = "\n".join(
    f'<div class="row"><b>{v}</b> <span>x{s:.2f}</span>'
    f'<audio controls preload="none" src="samples/{n}"></audio></div>'
    for v, s, n in rows
)
html = f"""<!doctype html><meta charset="utf-8"><title>Kokoro voice audition</title>
<style>body{{background:#0a0e14;color:#9fd8e8;font-family:Consolas,monospace;padding:2rem}}
.row{{display:flex;align-items:center;gap:1rem;margin:.4rem 0}}
.row b{{width:8rem}}.row span{{width:4rem;opacity:.6}}audio{{width:30rem}}</style>
<h2>Kokoro bm_* audition — current: bm_george x1.00</h2>
<p>Set winner via KOKORO_VOICE / KOKORO_SPEED env, restart voice-server.</p>
{items}
"""
with open(os.path.join(HERE, "audition.html"), "w", encoding="utf-8") as f:
    f.write(html)
print(f"\n{len(rows)} samples -> {OUT}\naudition page -> {os.path.join(HERE, 'audition.html')}")
