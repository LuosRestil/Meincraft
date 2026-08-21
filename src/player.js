import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class Player {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  cameraHelper = new THREE.CameraHelper(this.camera);
  movementControls = new PointerLockControls(this.camera, document.body);
  speed = 10;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  origin = [32, 16, 32];
  radius = 0.5;
  height = 1.75;

  constructor(scene, inputManager) {
    //@ts-ignore
    this.position.set(...this.origin);
    scene.add(this.camera);
    this.inputManager = inputManager;
    this.positionDiv = document.getElementById("player-position");
    if (!this.positionDiv) {
      throw new Error("fuckass");
    }
    this.cameraHelper.visible = false;
    scene.add(this.cameraHelper);

    // wireframe mesh visualizing player's bounding cylinder
    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height),
      new THREE.MeshBasicMaterial({ wireframe: true }),
    );
    scene.add(this.boundsHelper);
  }

  update(dt) {
    if (this.inputManager.wasButtonJustPressed("KeyR")) this.reset();

    this.input.x = 0;
    this.input.z = 0;
    if (this.inputManager.isButtonPressed("KeyW")) this.input.z++;
    if (this.inputManager.isButtonPressed("KeyS")) this.input.z--;
    if (this.inputManager.isButtonPressed("KeyA")) this.input.x++;
    if (this.inputManager.isButtonPressed("KeyD")) this.input.x--;
    let scaledSpeed = this.speed;
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

    this.movementControls.object.position.y += this.velocity.y * dt;

    if (this.movementControls.object.position.y < 10) {
      this.velocity.y = 0;
      this.movementControls.object.position.y = 10;

      // canJump = true;
    }

    this.movementControls.update(dt);
    this.positionDiv.innerText = `x: ${this.position.x.toFixed(2)}, y: ${this.position.y.toFixed(2)}, z: ${this.position.z.toFixed(2)}`;

    this.cameraHelper.update();

    this.updateBoundsHelper();
  }

  /**
   * @returns {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  reset() {
    //@ts-ignore
    this.position.set(...this.origin);
    this.velocity.set(0, 0, 0);
  }

  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.position);
    this.boundsHelper.position.y -= this.height / 2;
  }
}
