import * as THREE from 'three';
import { Renderer } from './core/Renderer.js';
import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { UI } from './ui/UI.js';
import { GymRoom } from './scene/GymRoom.js';

const VIEW_SIZE = 10; // orthographic half-height in world units

async function main() {
  const renderer = new Renderer();
  const input    = new InputManager();  // eslint-disable-line no-unused-vars
  const ui       = new UI();
  await ui.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF0EBE0);

  // Orthographic camera — isometric angle (equal distance on all axes)
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.OrthographicCamera(
    -VIEW_SIZE * aspect, VIEW_SIZE * aspect,
    VIEW_SIZE, -VIEW_SIZE,
    0.1, 200
  );
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);
  renderer.setCamera(camera, VIEW_SIZE);

  // Lighting — soft ambient + single directional (GDD spec)
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 80;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -20;
  sun.shadow.camera.right = sun.shadow.camera.top   =  20;
  scene.add(sun);

  // Gym room — floor, walls, machine slot markers
  const room = new GymRoom(scene);  // eslint-disable-line no-unused-vars

  const loop = new GameLoop(
    (_delta) => { /* game systems go here */ },
    () => renderer.render(scene)
  );
  loop.start();
}

main();
