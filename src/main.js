import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { WorldChunk } from "./worldChunk.js";
import { createUI } from "./ui.js";
import { InputManager } from "./inputManager.js";
import { Player } from "./player.js";
import { Physics } from "./physics.js";
import { World } from "./world.js";

const stats = new Stats();
document.body.append(stats.dom);

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(-20, 60, -20);
camera.lookAt(32, 0, 32);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const scene = new THREE.Scene();
const world = new World();
scene.add(world);
// const worldChunk = new WorldChunk({ width: 64, height: 32 });
// worldChunk.generate();
// scene.add(worldChunk);

const cameraControls = new PointerLockControls(camera, renderer.domElement);
let inputManager = new InputManager();

const player = new Player(scene, inputManager);

const physics = new Physics(scene);

setupLights();
createUI(world, player, physics);

let lastMs = 0;
let moveSpeed = 10;
let activeCamera = camera;

loop(0);

function loop(ms) {
  requestAnimationFrame(loop);

  let dt = Math.min((ms - lastMs) / 1000, 0.1);
  lastMs = ms;

  if (inputManager.wasButtonJustPressed("KeyL")) {
    cameraControls.lock();
  } else if (inputManager.wasButtonJustPressed("KeyK")) {
    if (cameraControls.isLocked) {
      activeCamera = player.camera;
      player.movementControls.lock();
      player.boundsHelper.visible = false;
      player.playerPosHelper.visible = false;
    } else {
      activeCamera = camera;
      cameraControls.lock();
      player.boundsHelper.visible = true;
      player.playerPosHelper.visible = true;
    }
  }

  renderer.render(scene, activeCamera);
  stats.update();

  if (activeCamera === camera) {
    let dx = 0;
    let dy = 0;
    let dz = 0;
    if (inputManager.isButtonPressed("KeyW")) dz += 1;
    if (inputManager.isButtonPressed("KeyS")) dz -= 1;
    if (inputManager.isButtonPressed("KeyA")) dx -= 1;
    if (inputManager.isButtonPressed("KeyD")) dx += 1;
    if (inputManager.isButtonPressed("KeyQ")) dy += 1;
    if (inputManager.isButtonPressed("KeyE")) dy -= 1;
    let scaledSpeed =
      moveSpeed *
      (inputManager.isButtonPressed("ShiftLeft") ||
      inputManager.isButtonPressed("ShiftRight")
        ? 2
        : 1);
    camera.translateX(dx * scaledSpeed * dt);
    camera.translateZ(-dz * scaledSpeed * dt);
    cameraControls.object.position.y += dy * scaledSpeed * dt;
    cameraControls.update(dt);
    inputManager.clear();
  } else {
    player.update(dt);
    physics.update(dt, player, worldChunk);
  }
}

function setupLights() {
  const sun = new THREE.DirectionalLight();
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = -0.001;
  sun.shadow.mapSize = new THREE.Vector2(512, 512);
  scene.add(sun);

  const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
  // scene.add(shadowHelper);

  const ambientLight = new THREE.AmbientLight();
  ambientLight.intensity = 0.5;
  scene.add(ambientLight);
}
