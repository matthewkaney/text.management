import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

loader.load(
  "/model/scene.gltf",
  function (gltf) {
    window.model = gltf.scene;
    window.model.scale.set(0.015, 0.015, 0.015);
    window.model.position.set(0, 0, 1.3);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

import * as THREE from "three";

window.THREE = THREE;

export const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

window.scene = new THREE.Scene();

window.camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

window.makeLight = (name, color = "white", x = 0, y = 0, z = 0) => {
  if (scene.children.includes(window[name])) {
    scene.remove(window[name]);
  }

  window[name] = new THREE.PointLight(new THREE.Color(color));
  window[name].position.set(x, y, z);
  window[name].castShadow = true;
  scene.add(window[name]);
};

window.lights = (top = "pink", bottom = "lightblue") => {
  if (scene.children.includes(window.hemi)) {
    scene.remove(window.hemi);
  }

  if (!top) {
    return;
  }

  window.hemi = new THREE.HemisphereLight(
    new THREE.Color(top),
    new THREE.Color(bottom)
  );
  scene.add(window.hemi);
};

window.makeSphere = (name, color = "white", scale = 1, x = 0, y = 0, z = 0) => {
  if (scene.children.includes(window[name])) {
    scene.remove(window[name]);
  }

  window[name] = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(color) })
  );
  window[name].position.set(x, y, z);
  window[name].scale.set(scale, scale, scale);
  window[name].castShadow = true;
  window[name].receiveShadow = true;
  scene.add(window[name]);
};

window.makeDonut = (
  name,
  color = "white",
  scale = 1,
  tube = 0.5,
  x = 0,
  y = 0,
  z = 0
) => {
  if (scene.children.includes(window[name])) {
    scene.remove(window[name]);
  }

  window[name] = new THREE.Mesh(
    new THREE.TorusGeometry(scale, scale * tube, 20, 60),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(color) })
  );
  window[name].position.set(x, y, z);
  window[name].scale.set(scale, scale, scale);
  window[name].castShadow = true;
  window[name].receiveShadow = true;
  scene.add(window[name]);
};

window.makeMan = (name, scale = 1, x = 0, y = 0, z = 0) => {
  if (scene.children.includes(window[name])) {
    scene.remove(window[name]);
  }

  if (window.model) {
    window[name] = new THREE.Object3D();
    window[name].add(window.model.clone());
    window[name].position.set(x, y, z);
    window[name].scale.set(scale, scale, scale);
    window[name].castShadow = true;
    window[name].receiveShadow = true;
    scene.add(window[name]);
  }
};

window.remove = (name) => {
  if (scene.children.includes(window[name])) {
    scene.remove(window[name]);
  }
};

window.rand = Math.random;

window.rand2 = () => Math.random() * 2 - 1;

window.sin = Math.sin;

window.cos = Math.cos;

window.ground = (color = "white") => {
  if (scene.children.includes(window.gnd)) {
    scene.remove(window.gnd);
  }

  if (!color) {
    return;
  }

  window.gnd = new THREE.Mesh(
    new THREE.CircleGeometry(30, 60),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(color) })
  );
  window.gnd.rotation.x = -Math.PI / 2;
  window.gnd.receiveShadow = true;
  scene.add(window.gnd);
};
