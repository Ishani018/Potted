# Potted — 3D Apartment Browser Experiment

This is an isolated browser prototype. It does **not** replace or modify Potted's Expo/React Native apartment screen, save format, economy, or assets.

## Run locally

From this directory, start a static server:

```bash
python3 -m http.server 4173
```

Open http://localhost:4173 in a modern browser. Three.js is loaded from a CDN, so the first load needs internet access.

## Prototype controls

- Drag furniture cards into the room, or choose a card and click the floor.
- Click a placed item to select it.
- Drag a selected item to reposition it.
- Rotate, duplicate, or remove the selected item.
- Orbit/zoom the camera with the mouse.
- Save/load the experiment in this browser using localStorage.

## Pixling's role

Pixling is an asset-generation pipeline, not a 3D runtime or a general-purpose 3D mesh generator. This first pass uses simple Three.js meshes to validate the room, camera, placement, and interaction model without waiting on generated assets. If the direction feels right, we can use Pixling to explore coherent pixel-art props, textures, and environmental art; for true 3D furniture models, use a dedicated modelling pipeline (for example, Blender) and import glTF/GLB assets into this browser scene.

## Safety boundary

This experiment lives only in `experiments/apartment-3d-web/` on the `experiment/apartment-3d-browser` branch. No existing Potted files are changed.
