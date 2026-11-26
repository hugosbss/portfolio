import {
  Color,
  DoubleSide,
  FogExp2,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  TextureLoader,
  TorusGeometry,
  WebGLRenderer,
} from 'three';

const BG = 0x090c12;
const FEATURE_Z = 8;
const FEATURE_STEP = 10;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

export function createProjectScene(canvas, projects, featuredProjects, assetUrl) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (error) {
    console.warn('WebGL indisponível; exibindo a galeria estática.', error);
    return null;
  }

  const scene = new Scene();
  scene.background = new Color(BG);
  scene.fog = new FogExp2(BG, 0.019);
  const camera = new PerspectiveCamera(48, 1, 0.1, 150);
  camera.position.set(0, 0, 12);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(BG, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const geometry = new PlaneGeometry(1, 1);
  const textures = [];
  const materials = [];
  const featurePlanes = [];
  const wallPlanes = [];
  const rings = [];
  const state = { progress: 0, pointerX: 0, pointerY: 0, disposed: false };
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  for (let index = 0; index < 7; index += 1) {
    const material = new MeshBasicMaterial({
      color: index % 2 === 0 ? 0x9d4edd : 0xff6b35,
      transparent: true,
      opacity: index < 4 ? 0.16 : 0.07,
      depthWrite: false,
      side: DoubleSide,
    });
    const ring = new Mesh(new TorusGeometry(5.1, 0.018, 4, 8), material);
    ring.scale.set(1.28, 0.76, 1);
    ring.position.z = 7 - index * 7.5;
    ring.rotation.z = Math.PI / 8;
    rings.push(ring);
    materials.push(material);
    scene.add(ring);
  }

  const loader = new TextureLoader();
  const loaded = new Map();
  const requests = projects.map((project) => new Promise((resolve) => {
    loader.load(assetUrl(project.image), (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.magFilter = LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = 2;
      textures.push(texture);
      loaded.set(project.id, texture);
      resolve(true);
    }, undefined, () => resolve(false));
  }));

  function createImagePlane(project, { featured = false, index = 0 } = {}) {
    const texture = loaded.get(project.id);
    if (!texture) return null;
    const angle = index * 2.39996 + 0.45;
    const radius = featured ? 5.5 : 6.7;
    const z = featured ? FEATURE_Z - index * FEATURE_STEP : 5 - index * 5.1;
    const baseHeight = featured ? 2.9 : 2.15;
    const aspect = texture.image.width / Math.max(1, texture.image.height);
    const width = baseHeight * aspect;
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: featured ? 0.72 : 0.3,
      depthWrite: false,
      side: DoubleSide,
    });
    const plane = new Mesh(geometry, material);
    plane.scale.set(width, baseHeight, 1);
    plane.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.54, z);
    plane.rotation.set(Math.sin(angle) * 0.16, -Math.cos(angle) * 0.26, 0);
    plane.userData = {
      index,
      featured,
      baseX: plane.position.x,
      baseY: plane.position.y,
      baseRotationX: plane.rotation.x,
      baseRotationY: plane.rotation.y,
      z,
      width,
      height: baseHeight,
    };
    materials.push(material);
    (featured ? featurePlanes : wallPlanes).push(plane);
    scene.add(plane);
    return plane;
  }

  function render() {
    if (state.disposed) return;
    const progress = state.progress;
    const focusIndex = progress * Math.max(0, featuredProjects.length - 1);
    camera.position.set(state.pointerX * 0.28, state.pointerY * 0.2, 18 - progress * FEATURE_STEP * Math.max(0, featuredProjects.length - 1));
    camera.lookAt(state.pointerX * 0.08, state.pointerY * 0.06, camera.position.z - 10);

    for (const plane of featurePlanes) {
      const { index, baseX, baseY, baseRotationX, baseRotationY, width, height, z } = plane.userData;
      const distance = Math.abs(index - focusIndex);
      const focus = 1 - smoothstep(0.12, 1, distance);
      const focusX = canvas.clientWidth < 1200 ? 2.35 : 3;
      plane.position.set(lerp(baseX, focusX, focus), lerp(baseY, 0, focus), z);
      plane.rotation.set(lerp(baseRotationX, 0, focus), lerp(baseRotationY, 0, focus), 0);
      const scale = 0.78 + focus * 0.34;
      plane.scale.set(width * scale, height * scale, 1);
      plane.material.opacity = 0.12 + focus * 0.88;
    }

    for (const plane of wallPlanes) {
      const distance = Math.abs(camera.position.z - plane.userData.z);
      plane.material.opacity = 0.3 * (1 - smoothstep(5, 33, distance));
    }

    for (const [index, ring] of rings.entries()) {
      const distance = Math.abs(camera.position.z - ring.position.z);
      ring.material.opacity = (index < 4 ? 0.16 : 0.07) * (1 - smoothstep(12, 38, distance));
      ring.rotation.z = Math.PI / 8 + state.pointerX * 0.012;
    }

    renderer.render(scene, camera);
  }

  Promise.all(requests).then(() => {
    if (state.disposed) return;
    featuredProjects.forEach((project, index) => createImagePlane(project, { featured: true, index }));
    const featuredIds = new Set(featuredProjects.map((project) => project.id));
    projects.filter((project) => !featuredIds.has(project.id)).forEach((project, index) => createImagePlane(project, { index: index + featuredProjects.length }));
    render();
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 58 : 48;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    render();
  }

  function pointerMove(event) {
    if (!finePointer) return;
    const rect = canvas.getBoundingClientRect();
    state.pointerX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    state.pointerY = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
    render();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', pointerMove, { passive: true });
  resize();

  return {
    setProgress(value) {
      state.progress = clamp(value, 0, 1);
      render();
    },
    dispose() {
      state.disposed = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointerMove);
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      geometry.dispose();
      for (const ring of rings) ring.geometry.dispose();
      renderer.dispose();
    },
  };
}
