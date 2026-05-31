import * as THREE from 'three';
import { gsap } from 'gsap';
import { Renderer } from './core/Renderer.js';
import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { UI } from './ui/UI.js';

async function main() {
  // --- Core systems ---
  const renderer = new Renderer();
  const input = new InputManager();
  const ui = new UI();
  await ui.init();

  // --- Scene ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 20, 60);

  // Camera
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);
  renderer.setCamera(camera);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  scene.add(sun);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshPhongMaterial({ color: 0x2d5a27 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Demo cube (placeholder for player)
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0x4fc3f7 })
  );
  cube.position.y = 0.5;
  cube.castShadow = true;
  scene.add(cube);

  // GSAP intro animation
  gsap.from(cube.scale, { x: 0, y: 0, z: 0, duration: 0.8, ease: 'back.out(1.7)' });

  // --- Game loop ---
  const loop = new GameLoop(
    (delta) => {
      // Move cube with WASD
      const speed = 5 * delta;
      if (input.isDown('KeyW')) cube.position.z -= speed;
      if (input.isDown('KeyS')) cube.position.z += speed;
      if (input.isDown('KeyA')) cube.position.x -= speed;
      if (input.isDown('KeyD')) cube.position.x += speed;
    },
    () => renderer.render(scene)
  );

  loop.start();
}

main();
