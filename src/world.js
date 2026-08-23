import * as THREE from "three";

export class World extends THREE.Group {
  params = {
    seed: -1,
    terrain: {
      scale: 29,
      magnitude: -1.5,
      offset: -1.2,
    },
    chunkSize: { width: 32, height: 16 },
  };

  constructor(seed = 0) {
    super();
    this.seed = seed;
  }
}
