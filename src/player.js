import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class Player {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  movementControls = new PointerLockControls(this.camera, document.body);
  maxSpeed = 10;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();

  constructor(scene, inputManager) {
    this.camera.position.set(32, 16, 32);
    scene.add(this.camera);
    this.inputManager = inputManager;
  }

  update(dt) {
    this.input.x = 0;
    this.input.z = 0;
    if (this.inputManager.isButtonPressed("KeyW")) this.input.z++;
    if (this.inputManager.isButtonPressed("KeyS")) this.input.z--;
    if (this.inputManager.isButtonPressed("KeyA")) this.input.x++;
    if (this.inputManager.isButtonPressed("KeyD")) this.input.x--;
    let scaledSpeed = this.maxSpeed;
    if (
      this.inputManager.isButtonPressed("ShiftLeft") ||
      this.inputManager.isButtonPressed("ShiftRight")
    ) {
      scaledSpeed *= 2;
    }
    this.input.normalize().multiplyScalar(scaledSpeed);
    this.velocity.set(this.input.x * dt, this.velocity.y, this.input.z * dt);
    this.movementControls.moveRight(-this.velocity.x);
    this.movementControls.moveForward(this.velocity.z);
    this.movementControls.update(dt);
  }

  /**
   * @returns {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }
}
