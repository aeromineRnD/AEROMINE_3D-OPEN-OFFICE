# Aeromine 3D Open Office

Interactive 3D facility map for the Aeromine open office environment. Built with Three.js and Vite, it renders a GLTF scene and overlays clickable pins on safety equipment, emergency devices, and meeting areas. Clicking a pin smoothly animates the camera to the object and opens an information panel with location, description, and contact details.

## Features

- 3D model viewer with orbit controls, environment lighting, and ACES filmic tone mapping
- Color-coded interactive pins by category (fire safety, emergency, first aid, meeting rooms)
- Smooth camera focus animation per object with configurable approach direction
- Sliding information panel with responsive mobile bottom-sheet layout
- Tooltip on pin hover showing object name
- Real-time search filter by object name or category
- Category legend with toggle buttons to show or hide pin groups
- Reset camera button to return to the initial overview

## Technology Stack

- [Three.js](https://threejs.org/) v0.169 - 3D rendering, GLTF loading, CSS2D overlays
- [Vite](https://vitejs.dev/) v5.4 - development server and production bundler

## Project Structure

```
├── index.html
├── style.css
├── src/
│   ├── main.js           # Application entry point
│   ├── viewer.js         # Three.js scene, camera, lighting, model loading
│   ├── tag-manager.js    # CSS2D pin placement, filtering, category toggling
│   ├── popup.js          # Info panel UI component
│   └── site-data.js      # Object definitions and camera directions
└── public/
    └── models/
        ├── openOffice.gltf
        ├── openOffice.bin
        └── images/
```

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Adding or Updating Objects

All interactive objects are defined in `src/site-data.js`. Each entry maps to a node name in the GLTF scene graph.

```js
{
  meshName:    'NodeNameInGLTF',   // must match the Three.js scene node name exactly
  name:        'Display Name',
  category:    'Fire Safety',      // Fire Safety | First Aid | Emergency Alert | Emergency Egress | Meeting Room
  icon:        '',
  location:    'Zone A - East Wall',
  description: 'Object description shown in the info panel.',
  contact:     'Safety Officer',
  photo:       null,               // relative path to image or null
  camDir:      [0.3, 0.4, -1],    // optional camera approach vector [x, y, z]
}
```

Note: Three.js strips dots from GLTF node names on load. A Blender object named `Cabinet.Body` becomes `CabinetBody` at runtime. Use the browser console to verify node names if a pin does not appear.

## 3D Model

The model files are located in `public/models/`. The GLTF references textures relative to itself inside the `images/` subfolder. If the model is re-exported from Blender, ensure all image URIs in the GLTF use the `images/` prefix, and that any material base color factors are set explicitly for materials that rely solely on texture maps.

## Browser Requirements

WebGL 2.0 capable browser. Tested on Chrome, Firefox, Safari, and Edge.

## Author

Aeromine RnD - [www.aeromine.info](https://www.aeromine.info)
