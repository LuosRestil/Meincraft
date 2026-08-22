import * as THREE from "three";
import { Player } from "./player.js";
import { World } from "./world.js";
import { blockTypes } from "./blocks.js";
import "./world.js";

/** @import { Block } from "./world.js" */
/** @typedef {{x: number, y: number, z: number}} Vec3 */
/** @typedef {{block: Vec3, contactPoint: Vec3, normal: THREE.Vector3, overlap: number}} Collision */

let logGrounded = false;

const collisionMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.2,
});
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);
const contactPointMaterial = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0xffff00,
});
const contactPointGeometry = new THREE.SphereGeometry(0.05, 6, 6);

export class Physics {
  simRate = 250;
  timestep = 1 / this.simRate;
  elapsed = 0;
  gravity = 32;

  constructor(scene) {
    this.helpers = new THREE.Group();
    // this.helpers.visible = false;
    scene.add(this.helpers);
  }

  /**
   * @param {number} dt
   * @param {Player} player
   * @param {World} world
   */
  update(dt, player, world) {
    this.elapsed += dt;
    while (this.elapsed >= this.timestep) {
      this.elapsed -= this.timestep;

      player.velocity.y -= this.gravity * this.timestep;
      if (player.inputManager.wasButtonJustPressed("Space")) {
        logGrounded = true;
      }
      player.move(this.timestep);

      this.handleCollisions(player, world);
    }
  }

  /**
   * @param {Player} player
   * @param {World} world
   */
  handleCollisions(player, world) {
    this.helpers.clear();
    player.isGrounded = false;

    const candidates = this.broadPhase(player, world);
    const collisions = this.narrowPhase(player, candidates);
    if (collisions.length === 0) return;
    this.resolveCollisions(collisions, player);
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

    return candidates;
  }

  /**
   * @param {Player} player
   * @param {{x: number, y: number, z: number}[]} candidates
   * @returns {Collision[]}
   */
  narrowPhase(player, candidates) {
    const collisions = [];
    const p = player.position;
    for (const block of candidates) {
      const closestPoint = {
        x: Math.max(block.x - 0.5, Math.min(p.x, block.x + 0.5)),
        y: Math.max(
          block.y - 0.5,
          Math.min(p.y - player.height / 2, block.y + 0.5),
        ),
        z: Math.max(block.z - 0.5, Math.min(p.z, block.z + 0.5)),
      };
      const dx = closestPoint.x - player.position.x;
      const dy = closestPoint.y - (player.position.y - player.height / 2);
      const dz = closestPoint.z - player.position.z;
      const colliding = this.isPointInPlayerBoundingCylinder(
        closestPoint,
        player,
      );
      if (colliding) {
        const overlapY = player.height / 2 - Math.abs(dy);
        const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz);
        let normal, overlap;
        if (overlapY < overlapXZ) {
          normal = new THREE.Vector3(0, -Math.sign(dy), 0);
          overlap = overlapY;
          player.isGrounded = true;
          if (logGrounded) {
            console.log(`overlapY: ${overlapY}`);
            console.log(`overlapXZ: ${overlapXZ}`);
            // debugger;
            logGrounded = false;
          }
        } else {
          normal = new THREE.Vector3(-dx, 0, -dz).normalize();
          overlap = overlapXZ;
        }
        collisions.push({
          block,
          normal,
          overlap,
          contactPoint: closestPoint,
        });
        this.addContactPointHelper(closestPoint);
      }
    }
    return collisions;
  }

  /**
   * @param {Collision[]} collisions
   * @param {Player} player
   */
  resolveCollisions(collisions, player) {
    collisions.sort((a, b) => b.overlap - a.overlap);
    for (const collision of collisions) {
      // recheck if contact point is inside player bounding box, as prior resolutions may have nullified the collision
      if (!this.isPointInPlayerBoundingCylinder(collision.contactPoint, player))
        continue;

      // adjust player position to remove overlap
      let deltaPos = collision.normal.clone();
      deltaPos.multiplyScalar(collision.overlap);
      player.position.add(deltaPos);
      // player.position.add(
      //   collision.normal.clone().multiplyScalar(collision.overlap),
      // );
      // negate player velocity along collision normal
      // get magnitude of player velocity along collision normal
      let mag = player.worldVelocity.dot(collision.normal);
      let adjustment = collision.normal.clone().multiplyScalar(mag);
      if (collision.normal.y === 1 && player.velocity.y > 0) continue;
      player.applyWorldDeltaVelocity(adjustment.negate());
    }
  }

  /**
   * @param {{x: number, y: number, z: number}} block
   */
  addCollisionHelper(block) {
    const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    collisionMesh.position.copy(block);
    this.helpers.add(collisionMesh);
  }

  addContactPointHelper(contactPoint) {
    const contactMesh = new THREE.Mesh(
      contactPointGeometry,
      contactPointMaterial,
    );
    contactMesh.position.copy(contactPoint);
    this.helpers.add(contactMesh);
  }

  isPointInPlayerBoundingCylinder(point, player) {
    const dx = point.x - player.position.x;
    const dy = point.y - (player.position.y - player.height / 2);
    const dz = point.z - player.position.z;
    const distToPlayerSq = dx * dx + dz * dz;
    const playerRadiusSq = player.radius * player.radius;
    const colliding =
      Math.abs(dy) < player.height / 2 && distToPlayerSq < playerRadiusSq;
    return colliding;
  }
}
