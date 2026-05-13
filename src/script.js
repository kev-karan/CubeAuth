import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let cubeGroup;
let currentSize = 3;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    createCube(currentSize);
    animate();
}

function createCube(size) {
    if (cubeGroup) scene.remove(cubeGroup);
    cubeGroup = new THREE.Group();

    const spacing = 1.05;
    const offset = (size - 1) / 2;

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                if (x === 0 || x === size - 1 || y === 0 || y === size - 1 || z === 0 || z === size - 1) {
                    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
                    const materials = [
                        new THREE.MeshStandardMaterial({ color: 0xff0000 }), // PosX - Vermelho
                        new THREE.MeshStandardMaterial({ color: 0xffa500 }), // NegX - Laranja
                        new THREE.MeshStandardMaterial({ color: 0xffffff }), // PosY - Branco
                        new THREE.MeshStandardMaterial({ color: 0xffff00 }), // NegY - Amarelo
                        new THREE.MeshStandardMaterial({ color: 0x0000ff }), // PosZ - Azul
                        new THREE.MeshStandardMaterial({ color: 0x00ff00 })  // NegZ - Verde
                    ];

                    const piece = new THREE.Mesh(geometry, materials);
                    piece.position.set((x - offset) * spacing, (y - offset) * spacing, (z - offset) * spacing);
                    cubeGroup.add(piece);
                }
            }
        }
    }
    scene.add(cubeGroup);
    camera.position.z = size * 2;
}

window.changeSize = (size) => {
    currentSize = size;
    createCube(size);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();