import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader }      from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls }   from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer }   from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MODEL_URL = '/models/openOffice.gltf';

export class Viewer {
  constructor(container) {
    this.container = container;
    this.content   = null;
    this._init();
    this._addLights();
    this._startLoop();
    window.addEventListener('resize', () => this._onResize());
  }

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  _init() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.scene = new Scene();
    this.scene.background = new Color('#d0d8e8');

    this.camera = new PerspectiveCamera(50, w / h, 0.1, 5000);

    // WebGL renderer
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // Environment map — required for metallic materials to reflect light correctly
    const pmrem = new PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;
    pmrem.dispose();

    // CSS2DRenderer — overlaid on top for object tags
    this.css2d = new CSS2DRenderer();
    this.css2d.setSize(w, h);
    this.css2d.domElement.style.position      = 'absolute';
    this.css2d.domElement.style.top           = '0';
    this.css2d.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.css2d.domElement);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePanning = true;
    this.controls.enableDamping      = true;
    this.controls.dampingFactor      = 0.05;
    this.controls.minDistance        = 0.5;
    this.controls.maxDistance        = 200;
    this.controls.maxPolarAngle      = Math.PI / 2.05;
  }

  _addLights() {
    // Cool office lighting — bright overhead feel
    const hemi = new HemisphereLight('#d8e8ff', '#a0a8b0', 1.4);
    this.scene.add(hemi);

    // Main directional light from upper-front
    const sun = new DirectionalLight('#ffffff', 1.6);
    sun.position.set(1, 2, 1);
    this.scene.add(sun);
  }

  // -------------------------------------------------------------------------
  // Model loading
  // -------------------------------------------------------------------------

  load() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        MODEL_URL,
        (gltf) => {
          this.content = gltf.scene ?? gltf.scenes[0];
          this.scene.add(this.content);
          this._fitCamera(this.content);
          resolve(this.content);
        },
        undefined,
        reject
      );
    });
  }

  // -------------------------------------------------------------------------
  // Camera fit — centers model and positions camera for a top-down overview
  // -------------------------------------------------------------------------

  _fitCamera(object) {
    object.updateMatrixWorld();

    const box    = new Box3().setFromObject(object);
    const size   = box.getSize(new Vector3()).length();
    const center = box.getCenter(new Vector3());

    // Re-center model at origin
    object.position.x -= center.x;
    object.position.y -= center.y;
    object.position.z -= center.z;

    this.controls.reset();
    this.controls.target.set(0, 0, 0);

    this.camera.near = size / 100;
    this.camera.far  = size * 10;
    this.camera.updateProjectionMatrix();

    // Position camera at ~45° above and slightly to the side
    this.camera.position.set(size * 0.6, size * 0.5, size * 0.6);
    this.camera.lookAt(new Vector3(0, 0, 0));

    this.controls.maxDistance = size * 5;
    this.controls.minDistance = size * 0.05;

    // Save home position for reset
    this._home = {
      camPos: this.camera.position.clone(),
      target: new Vector3(0, 0, 0),
    };
  }

  resetCamera() {
    if (!this._home) return;
    this._anim = {
      camFrom:    this.camera.position.clone(),
      camTo:      this._home.camPos.clone(),
      targetFrom: this.controls.target.clone(),
      targetTo:   this._home.target.clone(),
      t: 0,
    };
  }

  // -------------------------------------------------------------------------
  // Camera focus — smoothly zoom to a specific object node
  // -------------------------------------------------------------------------

  focusOn(node, camDir) {
    node.updateWorldMatrix(true, true);
    const box    = new Box3().setFromObject(node);
    const center = box.getCenter(new Vector3());
    const size   = box.getSize(new Vector3()).length();

    const offset = Math.max(size * 2, 2);
    const dir    = camDir
      ? new Vector3(...camDir).normalize()
      : new Vector3(0.6, 0.5, 0.6).normalize();
    const camTo  = center.clone().addScaledVector(dir, offset);

    this._anim = {
      camFrom:    this.camera.position.clone(),
      camTo,
      targetFrom: this.controls.target.clone(),
      targetTo:   center.clone(),
      t: 0,
    };
  }

  // -------------------------------------------------------------------------
  // Render loop
  // -------------------------------------------------------------------------

  _startLoop() {
    this.renderer.setAnimationLoop(() => {
      // Smooth camera animation
      if (this._anim) {
        this._anim.t += 0.04;
        const t = this._ease(Math.min(this._anim.t, 1));

        this.camera.position.lerpVectors(this._anim.camFrom, this._anim.camTo, t);
        this.controls.target.lerpVectors(this._anim.targetFrom, this._anim.targetTo, t);

        if (this._anim.t >= 1) this._anim = null;
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.css2d.render(this.scene, this.camera);
    });
  }

  // Smooth ease-in-out curve
  _ease(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.css2d.setSize(w, h);
  }
}
