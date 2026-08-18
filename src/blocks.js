import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();
const textures = {
  dirt: loadTexture("textures/dirt.png"),
  grassTop: loadTexture("textures/grass_top.png"),
  grassSide: loadTexture("textures/grass_side.png"),
  stone: loadTexture("textures/stone.png"),
  coalOre: loadTexture("textures/coal_ore.png"),
  ironOre: loadTexture("textures/iron_ore.png"),
};

export const blockTypes = {
  empty: 0,
  grass: 1,
  dirt: 2,
  stone: 3,
  coalOre: 4,
  ironOre: 5,
};

export const blocks = [
  { name: "empty", typeId: 0 },
  {
    name: "grass",
    color: 0x559020,
    typeId: 1,
    material: [
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.grassTop }), // top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // back
    ],
  },
  {
    name: "dirt",
    color: 0x807020,
    typeId: 2,
    material: new THREE.MeshLambertMaterial({ map: textures.dirt }),
  },
  {
    name: "stone",
    color: 0x808080,
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    typeId: 3,
    material: new THREE.MeshLambertMaterial({ map: textures.stone }),
  },
  {
    name: "coalOre",
    color: 0x202020,
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8,
    typeId: 4,
    material: new THREE.MeshLambertMaterial({ map: textures.coalOre }),
  },
  {
    name: "ironOre",
    color: 0x806060,
    scale: { x: 60, y: 60, z: 60 },
    scarcity: 0.9,
    typeId: 5,
    material: new THREE.MeshLambertMaterial({ map: textures.ironOre }),
  },
];

function loadTexture(path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}
