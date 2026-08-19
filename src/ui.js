import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { blocks } from "./blocks.js";

export function createUI(world, player) {
  const gui = new GUI();

  let playerFolder = gui.addFolder("Player");
  playerFolder.add(player, "speed", 1, 20)?.name("Speed");
  playerFolder.add(player.cameraHelper, "visible")?.name("Show Camera");

  const terrainFolder = gui.addFolder("Terrain");
  terrainFolder.add(world.size, "width", 8, 128, 1)?.name("Width");
  terrainFolder.add(world.size, "height", 8, 128, 1)?.name("Height");
  terrainFolder.add(world.params, "seed", 0, 10_000)?.name("Seed");
  terrainFolder.add(world.params.terrain, "scale", 10, 100)?.name("Scale");
  terrainFolder.add(world.params.terrain, "magnitude", 0, 1)?.name("Magnitude");
  terrainFolder.add(world.params.terrain, "offset", 0, 1)?.name("Offset");

  terrainFolder.close();

  const resourcesFolder = gui.addFolder("Resources");
  for (let block of Object.values(blocks)) {
    if (!block.scale || !block.scarcity) continue;
    const blockFolder = resourcesFolder.addFolder(block.name);
    blockFolder.add(block, "scarcity", 0, 1)?.name("Scarcity");
    const scaleFolder = blockFolder.addFolder("Scale");
    scaleFolder.add(block.scale, "x", 10, 100)?.name("X");
    scaleFolder.add(block.scale, "x", 10, 100)?.name("Y");
    scaleFolder.add(block.scale, "x", 10, 100)?.name("Z");
    blockFolder.close();
  }
  resourcesFolder.close();

  gui.onChange(() => world.generate());
}
