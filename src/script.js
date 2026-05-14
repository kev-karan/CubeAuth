import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isDraggingPiece = false;
let startDragPoint3D = new THREE.Vector3();
let dragPlane = new THREE.Plane();
let rotationAxisVector = new THREE.Vector3();
let dragLine = new THREE.Vector3();let selectedFaceNormal = null;
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
        
        selectedFaceNormal = intersects[0].face.normal.clone();
        selectedFaceNormal.transformDirection(selectedPiece.matrixWorld).round();
        
        startDragPoint3D.copy(intersects[0].point);
        dragPlane.setFromNormalAndCoplanarPoint(selectedFaceNormal, startDragPoint3D);
        
        const pieceToAnimate = selectedPiece;
        pieceToAnimate.scale.set(0.8, 0.8, 0.8);
        setTimeout(() => {
            if(pieceToAnimate) pieceToAnimate.scale.set(1, 1, 1);
        }, 150);
    }
}

function onPointerMove(event) {
    if (!isDraggingPiece || !selectedPiece) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let currentDragPoint3D = new THREE.Vector3();
    let intersect = raycaster.ray.intersectPlane(dragPlane, currentDragPoint3D);

    if (!intersect) return;

    let dragVector3D = currentDragPoint3D.clone().sub(startDragPoint3D);

    if (dragVector3D.length() < 0.1 && dragDirection === null) return;

    if (dragDirection === null) {
        let absX = Math.abs(dragVector3D.x);
        let absY = Math.abs(dragVector3D.y);
        let absZ = Math.abs(dragVector3D.z);

        if (absX > absY && absX > absZ) dragLine.set(1, 0, 0);
        else if (absY > absX && absY > absZ) dragLine.set(0, 1, 0);
        else dragLine.set(0, 0, 1);

        rotationAxisVector.crossVectors(selectedFaceNormal, dragLine).round();

        if (Math.abs(rotationAxisVector.x) > 0) dragDirection = 'x';
        else if (Math.abs(rotationAxisVector.y) > 0) dragDirection = 'y';
        else if (Math.abs(rotationAxisVector.z) > 0) dragDirection = 'z';

        groupSlice(selectedPiece, dragDirection);
    }

    if (dragDirection) {
        let dragDistance = dragVector3D.dot(dragLine);
        let axisMultiplier = rotationAxisVector[dragDirection];
        
        let speed = 1.5; 
        pivot.rotation[dragDirection] = dragDistance * axisMultiplier * speed;
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
                        new THREE.MeshPhongMaterial({ color: 0xff5800, emissive: 0x331100, shininess: 80 }), // NegX - Laranja
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