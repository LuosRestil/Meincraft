import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from "./rng.js";
import { blocks, blockTypes } from "./blocks.js";

const blockGeometry = new THREE.BoxGeometry();

/** @typedef {{typeId: number, instanceId: number | null}} Block */

export class World extends THREE.Group {
  /**
   * @type Block[][][]}
   */
  blocks = [];
  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.5,
      offset: 0.2,
    },
  };

  constructor(size = { width: 32, height: 16 }) {
    super();
    this.size = size;
  }

  generate() {
    const rng = new RNG(this.params.seed);
    this.initializeTerrain();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateMeshes();
  }

  initializeTerrain() {
    this.blocks = [];
    for (let x = 0; x < this.size.width; x++) {
      let slice = [];
      for (let y = 0; y < this.size.height; y++) {
        let row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            typeId: blockTypes.empty,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.blocks.push(slice);
    }
  }

  /** Coal, iron, stone, etc. */
  generateResources(rng) {
    const noise = new SimplexNoise(rng);
    blocks
      .toSorted((a, b) => {
        if (!a.scarcity || !b.scarcity) return 0;
        return a.scarcity - b.scarcity;
      })
      .forEach((block) => {
        if (!block.scarcity) return;
        for (let x = 0; x < this.size.width; x++) {
          for (let y = 0; y < this.size.height; y++) {
            for (let z = 0; z < this.size.width; z++) {
              const value = noise.noise3d(
                x / (block.scale?.x ?? 1),
                y / (block.scale?.y ?? 1),
                z / (block.scale?.z ?? 1),
              );
              if (value > block.scarcity) {
                this.setTypeId(x, y, z, block.typeId);
              }
            }
          }
        }
      });
  }

  generateTerrain(rng) {
    const noise = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        // compute noise value at this (x, z) location
        const value = noise.noise(
          x / this.params.terrain.scale,
          z / this.params.terrain.scale,
        );
        // scale by magnitude/offset
        const scaledValue =
          this.params.terrain.offset + this.params.terrain.magnitude * value;
        // compute terrain height at (x, z) location
        let height = Math.floor(this.size.height * scaledValue);
        // clamp it between 0..max height
        height = Math.max(0, Math.min(height, this.size.height - 1));
        // fill in all blocks at or below terrain height
        for (let y = 0; y <= this.size.height; y++) {
          if (y > height) {
            this.setTypeId(x, y, z, blockTypes.empty);
          } else if (y === height) {
            this.setTypeId(x, y, z, blockTypes.grass);
          } else if (!this.getBlock(x, y, z)?.typeId) {
            this.setTypeId(x, y, z, blockTypes.dirt);
          }
        }
      }
    }
  }

  /**
   * Generates the 3d representation of the world from the world data
   */
  generateMeshes() {
    this.clear();

    const maxCount = this.size.width * this.size.width * this.size.height;

    // block type id : mesh
    const meshes = {};

    Object.values(blocks).forEach((block) => {
      if (block.typeId === blockTypes.empty) return;
      const mesh = new THREE.InstancedMesh(
        blockGeometry,
        block.material,
        maxCount,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = block.name;
      mesh.count = 0;
      meshes[block.typeId] = mesh;
    });

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const block = this.getBlock(x, y, z);
          if (
            !block ||
            block.typeId === blockTypes.empty ||
            this.isBlockObscured(x, y, z)
          )
            continue;
          const mesh = meshes[block.typeId];
          const instanceId = mesh.count;
          matrix.setPosition(x, y, z);
          mesh.setMatrixAt(instanceId, matrix);
          this.setInstanceId(x, y, z, instanceId);
          mesh.count++;
        }
      }
    }

    this.add(...Object.values(meshes));
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {Block | null}
   */
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.blocks[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockTypeId
   * @returns {void}
   */
  setTypeId(x, y, z, blockTypeId) {
    if (this.inBounds(x, y, z)) {
      this.blocks[x][y][z].typeId = blockTypeId;
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   * @returns {void}
   */
  setInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.blocks[x][y][z].instanceId = instanceId;
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    return (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    );
  }

  isBlockObscured(x, y, z) {
    return [
      this.getBlock(x, y + 1, z)?.typeId ?? blockTypes.empty,
      this.getBlock(x, y - 1, z)?.typeId ?? blockTypes.empty,
      this.getBlock(x - 1, y, z)?.typeId ?? blockTypes.empty,
      this.getBlock(x + 1, y, z)?.typeId ?? blockTypes.empty,
      this.getBlock(x, y, z + 1)?.typeId ?? blockTypes.empty,
      this.getBlock(x, y, z - 1)?.typeId ?? blockTypes.empty,
    ].every((type) => type !== blockTypes.empty);
  }
}
