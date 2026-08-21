import * as THREE from "three";
import { Player } from "./player.js";
import { World } from "./world.js";
import { blockTypes } from "./blocks.js";
import "./world.js";

/** @import { Block } from "./world.js" */
const collisionMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.2,
});
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);
const playerExtentsBox = new THREE.Box3();
const playerExtentsHelper = new THREE.Box3Helper(playerExtentsBox, 0x00ff00);

export class Physics {
  constructor(scene) {
    this.helpers = new THREE.Group();
    scene.add(this.helpers);

    scene.add(playerExtentsHelper);
  }

  /**
   * @param {number} dt
   * @param {Player} player
   * @param {World} world
   */
  update(dt, player, world) {
    this.helpers.clear();
    this.detectCollisions(player, world);
  }

  /**
   * @param {Player} player
   * @param {World} world
   */
  detectCollisions(player, world) {
    const candidates = this.broadPhase(player, world);
    const collisions = this.narrowPhase(player, candidates);
    // if (collisions.length === 0) return;
    // this.resolveCollisions(collisions);
  }

  /**
   * @param {Player} player
   * @param {World} world
   * @returns {{x: number, y: number, z: number}[]}
   */
  broadPhase(player, world) {
    const candidates = [];
    let playerExtents = {
      x: {
        min: Math.floor(player.position.x - player.radius),
        max: Math.ceil(player.position.x + player.radius),
      },
      y: {
        min: Math.floor(player.position.y - player.height),
        max: Math.ceil(player.position.y),
      },
      z: {
        min: Math.floor(player.position.z - player.radius),
        max: Math.ceil(player.position.z + player.radius),
      },
    };

    this.addPlayerExtentsHelper(playerExtents);

    // loop through all blocks within player extents
    // if they aren't empty, they are a collision candidate
    for (let x = playerExtents.x.min; x <= playerExtents.x.max; x++) {
      for (let y = playerExtents.y.min; y <= playerExtents.y.max; y++) {
        for (let z = playerExtents.z.min; z <= playerExtents.z.max; z++) {
          const block = world.getBlock(x, y, z);
          if (block && block.typeId !== blockTypes.empty) {
            const pos = { x, y, z };
            candidates.push(pos);
            this.addCollisionHelper(pos);
          }
        }
      }
    }

    console.log(`Candidates: ${candidates.length}`);
    return candidates;
  }

  /**
   * @param {Player} player
   * @param {{x: number, y: number, z: number}[]} candidates
   */
  narrowPhase(player, candidates) {}

  resolveCollisions(collisions) {}

  /**
   * @param {{x: number, y: number, z: number}} block
   */
  addCollisionHelper(block) {
    const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    collisionMesh.position.copy(block);
    this.helpers.add(collisionMesh);
  }

  addPlayerExtentsHelper(playerExtents) {
    playerExtentsBox.min.set(playerExtents.x.min, playerExtents.y.min, playerExtents.z.min);
    playerExtentsBox.max.set(playerExtents.x.max, playerExtents.y.max, playerExtents.z.max);
  }
}
