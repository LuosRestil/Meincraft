import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  cameraHelper = new THREE.CameraHelper(this.camera);
  movementControls = new PointerLockControls(this.camera, document.body);
  speed = 5;
  jumpSpeed = 10;
  isGrounded = false;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();
  origin = [16, 16, 16];
  radius = 0.5;
  height = 1.75;
  raycaster = new THREE.Raycaster();

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
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true, color: 0x808080 }),
    );
    scene.add(this.boundsHelper);

    this.playerPosHelper = new THREE.Mesh(
      new THREE.SphereGeometry(0.05),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    );
    scene.add(this.playerPosHelper);

    this.raycaster.near = 0;
    this.raycaster.far = 3;
  }

  update(dt, world) {
    if (this.inputManager.wasButtonJustPressed("KeyR")) this.reset();

    this.positionDiv.innerText = `x: ${this.position.x.toFixed(2)}, y: ${this.position.y.toFixed(2)}, z: ${this.position.z.toFixed(2)}`;

    this.updateHelpers();

    this.updateRaycaster(world);
  }

  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObjects(world, true);
    if (intersections.length) {

    } else {
      
    }
  }

  /**
   * @returns {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  /** Returns the velocity of the player in world coordinates
   * @returns {THREE.Vector3}
   */
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    return this.#worldVelocity;
  }

  reset() {
    //@ts-ignore
    this.position.set(...this.origin);
    this.velocity.set(0, 0, 0);
  }

  move(dt) {
    if (this.isGrounded && this.inputManager.isButtonPressed("Space")) {
      this.velocity.y += this.jumpSpeed;
    }
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
      scaledSpeed += this.speed * 0.5;
    }
    this.input.normalize().multiplyScalar(scaledSpeed);
    this.velocity.set(this.input.x * dt, this.velocity.y, this.input.z * dt);
    this.movementControls.moveRight(-this.velocity.x);
    this.movementControls.moveForward(this.velocity.z);
    this.movementControls.object.position.y += this.velocity.y * dt;

    this.movementControls.update(dt);

    this.inputManager.clear();
  }

  /**
   * Applies a change in velocity that is specified in the world space
   * @param {THREE.Vector3} dv 
   */
  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  updateHelpers() {
    this.cameraHelper.update();

    this.boundsHelper.position.copy(this.position);
    this.boundsHelper.position.y -= this.height / 2;

    this.playerPosHelper.position.copy(this.position);
  }
}
