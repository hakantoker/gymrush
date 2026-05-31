import * as THREE from 'three';
import { Renderer }     from './core/Renderer.js';
import { GameLoop }     from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { UI }           from './ui/UI.js';
import { GymRoom }      from './scene/GymRoom.js';
import { ItemManager }  from './systems/ItemManager.js';

const VIEW_SIZE = 10;

async function main() {
  const renderer = new Renderer();
  const input    = new InputManager();  // eslint-disable-line no-unused-vars
  const ui       = new UI();
  await ui.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF0EBE0);

  // Orthographic camera — isometric angle
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.OrthographicCamera(
    -VIEW_SIZE * aspect, VIEW_SIZE * aspect,
    VIEW_SIZE, -VIEW_SIZE,
    0.1, 200
  );
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);
  renderer.setCamera(camera, VIEW_SIZE);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  sun.shadow.camera.near   = 0.5;
  sun.shadow.camera.far    = 80;
  sun.shadow.camera.left   = sun.shadow.camera.bottom = -20;
  sun.shadow.camera.right  = sun.shadow.camera.top    =  20;
  scene.add(sun);

  // Gym room — floor, walls, slot markers
  const room = new GymRoom(scene);

  // Item system — create an item for every slot that has a typeKey
  const itemManager = new ItemManager(scene);
  for (const slot of room.slots) {
    if (!slot.typeKey) continue;
    const item  = itemManager.createItem(slot.typeKey, slot);
    slot.item   = item;
  }

  const loop = new GameLoop(
    (delta) => {
      itemManager.update(delta);
    },
    () => renderer.render(scene)
  );
  loop.start();
}

main();
