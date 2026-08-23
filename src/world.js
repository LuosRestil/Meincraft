import * as THREE from "three";
import { WorldChunk } from "./worldChunk.js";
import { Player } from "./player.js";

export class World extends THREE.Group {
  loadAsync = true;

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.2,
      offset: 0.2,
    },
    chunkSize: { width: 32, height: 32 },
    renderDistance: 3,
  };

  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  generate() {
    this.disposeChunks();

    for (
      let x = -this.params.renderDistance;
      x <= this.params.renderDistance;
      x++
    ) {
      for (
        let z = -this.params.renderDistance;
        z <= this.params.renderDistance;
        z++
      ) {
        this.addChunk(x, z);
      }
    }
  }

  addChunk(x, z) {
    const chunk = new WorldChunk(this.params);
    chunk.position.set(
      x * this.params.chunkSize.width,
      0,
      z * this.params.chunkSize.width,
    );
    chunk.userData = { x, z };
    if (this.loadAsync) {
      requestIdleCallback(chunk.generate.bind(chunk), {timeout: 1000});
    } else {
      chunk.generate();
    }
    this.add(chunk);
  }

  /**
   * @param {Player} player
   */
  update(player) {
    // 1. Find visible chunks based on player pos
    let coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z,
    );
    let minX = coords.chunk.x - this.params.renderDistance;
    let maxX = coords.chunk.x + this.params.renderDistance;
    let minZ = coords.chunk.z - this.params.renderDistance;
    let maxZ = coords.chunk.z + this.params.renderDistance;
    // 2. Compare with current chunks
    let visibleChunks = [];
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        visibleChunks.push({ x, z });
      }
    }
    // 3. Remove chunks out of range
    let outOfRange = this.children.filter((chunk) => {
      let chunkInVisible =
        visibleChunks.findIndex(
          (vc) => vc.x === chunk.userData.x && vc.z === chunk.userData.z,
        ) !== -1;
      return !chunkInVisible;
    });
    for (let chunk of outOfRange) {
      let worldChunk = this.getChunk(chunk.userData.x, chunk.userData.z);
      if (worldChunk) {
        worldChunk.disposeInstances();
        this.remove(worldChunk);
      } else {
        console.log("oh god oh fuck");
      }
    }
    // 4. Add chunks newly in range
    let newlyInRange = visibleChunks.filter((chunk) => {
      let chunkInWorld =
        this.children.findIndex(
          (c) => chunk.x === c.userData.x && chunk.z === c.userData.z,
        ) !== -1;
      return !chunkInWorld;
    });
    for (let chunk of newlyInRange) {
      this.addChunk(chunk.x, chunk.z);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {import("./worldChunk.js").Block | null}
   */
  getBlock(x, y, z) {
    let coords = this.worldToChunkCoords(x, y, z);
    let chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (!chunk || !chunk.loaded) return null;
    return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{
   *  chunk: {x: number, z: number},
   *  block: {x: number, y: number, z: number}
   * }} 'chunk' is coordinates of the chunk, block is the coordinates of the block relative to that chunk
   */
  worldToChunkCoords(x, y, z) {
    let chunk = {
      x: Math.floor(x / this.params.chunkSize.width),
      z: Math.floor(z / this.params.chunkSize.width),
    };

    let block = {
      x: x - chunk.x * this.params.chunkSize.width,
      y,
      z: z - chunk.z * this.params.chunkSize.width,
    };

    return { chunk, block };
  }

  /**
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | undefined}
   */
  getChunk(chunkX, chunkZ) {
    // @ts-ignore
    return this.children.find(
      (chunk) => chunk.userData.x === chunkX && chunk.userData.z === chunkZ,
    );
  }

  disposeChunks() {
    this.traverse((chunk) => {
      // @ts-ignore
      if (chunk.disposeInstances) {
        // @ts-ignore
        chunk.disposeInstances();
      }
    });
    this.clear();
  }
}
