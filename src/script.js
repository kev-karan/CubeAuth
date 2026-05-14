import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isDraggingPiece = false;
let startClickPosition = new THREE.Vector2();
let selectedFaceNormal = null;
let selectedPiece = null;

let pivot; 
let dragDirection = null; 
let currentSlice = []; 

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
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 15;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    pivot = new THREE.Group();
    scene.add(pivot);

    createCube(currentSize);
    animate();
}

function getRotationAxis(faceNormal, dx, dy) {
    if (Math.abs(faceNormal.z) > 0.5) return Math.abs(dx) > Math.abs(dy) ? 'y' : 'x'; // Face Frente/Trás
    if (Math.abs(faceNormal.x) > 0.5) return Math.abs(dx) > Math.abs(dy) ? 'y' : 'z'; // Face Direita/Esquerda
    if (Math.abs(faceNormal.y) > 0.5) return Math.abs(dx) > Math.abs(dy) ? 'z' : 'x'; // Face Cima/Baixo
    return 'y';
}

function groupSlice(piece, axis) {
    pivot.rotation.set(0, 0, 0); 
    currentSlice = [];
    
    const sliceCoord = piece.position[axis]; 
    const pieces = [...cubeGroup.children]; 
    
    pieces.forEach(p => {
        if (Math.abs(p.position[axis] - sliceCoord) < 0.1) {
            currentSlice.push(p);
            pivot.attach(p);
        }
    });
}

function onPointerDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cubeGroup.children);

    if (intersects.length > 0) {
        isDraggingPiece = true;
        controls.enabled = false;
        
        selectedPiece = intersects[0].object;
        startClickPosition.set(event.clientX, event.clientY);
        
        selectedFaceNormal = intersects[0].face.normal.clone();
        selectedFaceNormal.transformDirection(selectedPiece.matrixWorld).round();
        
        const pieceToAnimate = selectedPiece;
        pieceToAnimate.scale.set(0.8, 0.8, 0.8);
        setTimeout(() => {
            pieceToAnimate.scale.set(1, 1, 1);
        }, 150);
    }
}

function onPointerMove(event) {
    if (!isDraggingPiece || !selectedPiece) return;

    const deltaX = event.clientX - startClickPosition.x;
    const deltaY = event.clientY - startClickPosition.y;

    if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5 && dragDirection === null) return;

    if (dragDirection === null) {
        dragDirection = getRotationAxis(selectedFaceNormal, deltaX, deltaY);
        groupSlice(selectedPiece, dragDirection);
    }

    if (dragDirection) {
        const rotationAmount = (Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY) * 0.01;
        pivot.rotation[dragDirection] = rotationAmount;
    }
}

function onPointerUp(event) {
    if (isDraggingPiece) {
        isDraggingPiece = false;
        controls.enabled = true;
        
        if (dragDirection !== null) {
            const snapAngle = Math.round(pivot.rotation[dragDirection] / (Math.PI / 2)) * (Math.PI / 2);
            pivot.rotation[dragDirection] = snapAngle;
            pivot.updateMatrixWorld();
            
            currentSlice.forEach(child => {
                cubeGroup.attach(child);
                
                child.position.x = Math.round(child.position.x * 1000) / 1000;
                child.position.y = Math.round(child.position.y * 1000) / 1000;
                child.position.z = Math.round(child.position.z * 1000) / 1000;

                child.rotation.x = Math.round(child.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
                child.rotation.y = Math.round(child.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
                child.rotation.z = Math.round(child.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
            });
        }
        
        dragDirection = null;
        selectedPiece = null;
    }
}

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

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
                        new THREE.MeshPhongMaterial({ color: 0xc41e3a, emissive: 0x220000, shininess: 80 }), // PosX - Vermelho
                        new THREE.MeshPhongMaterial({ color: 0xff5800, emissive: 0x331100, shininess: 80 }), // NegX - Laranja Vibrante
                        new THREE.MeshPhongMaterial({ color: 0xdddddd, emissive: 0x111111, shininess: 80 }), // PosY - Branco
                        new THREE.MeshPhongMaterial({ color: 0xffd500, emissive: 0x333300, shininess: 80 }), // NegY - Amarelo
                        new THREE.MeshPhongMaterial({ color: 0x0051ba, emissive: 0x001133, shininess: 80 }), // PosZ - Azul
                        new THREE.MeshPhongMaterial({ color: 0x009e60, emissive: 0x002211, shininess: 80 })  // NegZ - Verde
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