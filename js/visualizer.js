// --- View Navigation and DOM Elements ---
const viewCatalog = document.getElementById('view-catalog');
const viewVisualizer = document.getElementById('view-visualizer');
const btnBackCatalog = document.getElementById('btn-back-catalog');
const visualizerTitle = document.getElementById('visualizer-title');
const btn3D = document.getElementById('btn-3d');
const btn2D = document.getElementById('btn-2d');
const canvas3D = document.getElementById('canvas-3d');
const canvas2D = document.getElementById('canvas-2d');

window.openVisualizer = function(build) {
    visualizerTitle.textContent = build.title;
    viewCatalog.classList.remove('active');
    viewVisualizer.classList.add('active');

    window.dispatchEvent(new Event('resize'));

    if (build.data && build.data.modelPath) {
        window.loadModel(build.data.modelPath, build.data.objFile, build.data.mtlFile);
    } else {
        window.clearModel();
    }
}

btnBackCatalog.addEventListener('click', () => {
    viewVisualizer.classList.remove('active');
    viewCatalog.classList.add('active');
    switchTo3DMode(); // Reset to 3D when leaving
});

// --- Visualizer Tabs (2D / 3D) ---
btn3D.addEventListener('click', () => {
    switchTo3DMode();
});

btn2D.addEventListener('click', () => {
    switchTo2DMode();
});

// --- Three.js 3D Visualizer Global State ---
window.scene = null;
window.renderer = null;
window.controls = null;
window.perspectiveCamera = null;
window.orthographicCamera = null;
window.activeCamera = null;
window.mainAmbientLight = null;
window.mainDirectionalLight = null;
window.mainGridHelper = null;

window.currentModelGroup = null;
window.currentModelHeight = 0;
window.currentModelWidth = 0;
window.currentModelDepth = 0;

let animationId = null;
let isAutoRotating = true;
window.is2DMode = false;
let lastPerspectivePosition = new THREE.Vector3();

// Raycaster and Selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredMesh = null;
let highlightBox = null;

// UI Elements for Block Info
const blockInfoPanel = document.getElementById('block-info-panel');
const blockNameEl = document.getElementById('block-name');
const blockCoordsEl = document.getElementById('block-coords');

// Sliders and Controls
const panSlider = document.getElementById('pan-slider');
let lastPanValue = 50;
window.sliceSlider = document.getElementById('slice-slider');

const btnTogglePlay = document.getElementById('btn-toggle-play');
const btnRotateLeft = document.getElementById('btn-rotate-left');
const btnRotateRight = document.getElementById('btn-rotate-right');

btnTogglePlay.addEventListener('click', () => {
    isAutoRotating = !isAutoRotating;
    btnTogglePlay.innerHTML = isAutoRotating ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
});
btnRotateLeft.addEventListener('click', () => { if (window.currentModelGroup) window.currentModelGroup.rotation.y -= 0.2; });
btnRotateRight.addEventListener('click', () => { if (window.currentModelGroup) window.currentModelGroup.rotation.y += 0.2; });

panSlider.addEventListener('input', () => {
    if (window.is2DMode) return; 

    const diff = panSlider.value - lastPanValue;
    const offsetPercentage = diff / 50;
    const maxPanRange = window.currentModelHeight; 

    const yOffset = offsetPercentage * maxPanRange;

    window.controls.target.y += yOffset;
    window.perspectiveCamera.position.y += yOffset;

    lastPanValue = panSlider.value;
});

window.sliceSlider.addEventListener('input', () => {
    if (!window.currentModelGroup) return;

    const layer = parseInt(window.sliceSlider.value);

    if (window.is2DMode) {
        window.orthographicCamera.position.y = window.currentModelHeight * 2;
    }

    window.currentModelGroup.traverse((child) => {
        if (child.isMesh) {
            const box = new THREE.Box3().setFromObject(child);
            if (window.is2DMode) {
                child.visible = (box.max.y <= layer + 0.2 && box.max.y > layer - 0.8);
            } else {
                child.visible = (box.max.y <= layer + 0.2);
            }
        }
    });
});

window.switchTo3DMode = function() {
    btn3D.classList.add('active');
    btn2D.classList.remove('active');
    canvas3D.classList.add('active');
    canvas2D.classList.remove('active');
    canvas3D.classList.remove('blueprint-mode');

    if (window.controls) {
        window.controls.enableRotate = true;
        window.controls.minPolarAngle = 0;
        window.controls.maxPolarAngle = Math.PI;
        if (window.activeCamera === window.orthographicCamera && window.perspectiveCamera) {
            window.perspectiveCamera.position.copy(lastPerspectivePosition);
        }
        window.activeCamera = window.perspectiveCamera;
        window.is2DMode = false;

        if (window.mainAmbientLight) window.mainAmbientLight.intensity = 0.6;
        if (window.mainDirectionalLight) window.mainDirectionalLight.intensity = 0.8;

        document.getElementById('pan-container').style.display = 'flex';
        document.getElementById('visualizer-controls').style.display = 'flex';

        window.sliceSlider.dispatchEvent(new Event('input'));
    }
}

window.switchTo2DMode = function() {
    btn2D.classList.add('active');
    btn3D.classList.remove('active');
    canvas2D.classList.add('active');
    canvas3D.classList.add('active');

    if (window.controls) {
        lastPerspectivePosition.copy(window.perspectiveCamera.position);

        window.activeCamera = window.orthographicCamera;
        window.is2DMode = true;
        canvas3D.classList.add('blueprint-mode');

        if (window.mainAmbientLight) window.mainAmbientLight.intensity = 1.2;
        if (window.mainDirectionalLight) window.mainDirectionalLight.intensity = 0.0;

        window.controls.enableRotate = false;

        window.orthographicCamera.position.set(0, window.currentModelHeight * 2, 0);
        window.orthographicCamera.lookAt(0, 0, 0);

        document.getElementById('pan-container').style.display = 'none';
        document.getElementById('visualizer-controls').style.display = 'none';

        window.sliceSlider.dispatchEvent(new Event('input'));
    }
}

window.init3D = function() {
    const container = document.getElementById('canvas-3d');

    window.scene = new THREE.Scene();

    window.perspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    window.perspectiveCamera.position.set(10, 10, 10);
    window.perspectiveCamera.lookAt(0, 0, 0);

    const aspect = container.clientWidth / container.clientHeight;
    const viewSize = 10;
    window.orthographicCamera = new THREE.OrthographicCamera(
        -viewSize * aspect, viewSize * aspect,
        viewSize, -viewSize,
        0.1, 1000
    );
    window.orthographicCamera.position.set(0, 20, 0);
    window.orthographicCamera.lookAt(0, 0, 0);

    window.activeCamera = window.perspectiveCamera;

    window.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    window.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(window.renderer.domElement);

    highlightBox = new THREE.BoxHelper(undefined, 0x6366f1);
    highlightBox.material.depthTest = false;
    highlightBox.material.transparent = true;
    highlightBox.material.opacity = 0.9;
    highlightBox.visible = false;
    window.scene.add(highlightBox);

    container.addEventListener('mousemove', onMouseMove);

    window.controls = new THREE.OrbitControls(window.activeCamera, window.renderer.domElement);
    window.controls.enableDamping = true;
    window.controls.dampingFactor = 0.05;
    window.controls.screenSpacePanning = true; 
    window.controls.maxDistance = 500;

    window.mainAmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
    window.scene.add(window.mainAmbientLight);

    window.mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    window.mainDirectionalLight.position.set(10, 20, 10);
    window.scene.add(window.mainDirectionalLight);

    window.mainGridHelper = new THREE.GridHelper(50, 50, 0x6366f1, 0x444444);
    window.mainGridHelper.material.opacity = 0.2;
    window.mainGridHelper.material.transparent = true;
    window.scene.add(window.mainGridHelper);

    function resizeCanvas() {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            const aspect = container.clientWidth / container.clientHeight;

            window.perspectiveCamera.aspect = aspect;
            window.perspectiveCamera.updateProjectionMatrix();

            const vSize = window.currentModelHeight > 0 ? window.currentModelHeight * 0.8 : 10;
            window.orthographicCamera.left = -vSize * aspect;
            window.orthographicCamera.right = vSize * aspect;
            window.orthographicCamera.top = vSize;
            window.orthographicCamera.bottom = -vSize;
            window.orthographicCamera.updateProjectionMatrix();

            window.renderer.setSize(container.clientWidth, container.clientHeight);
        }
    }

    window.addEventListener('resize', resizeCanvas);
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
}

function onMouseMove(event) {
    if (!window.currentModelGroup) return;

    const container = document.getElementById('canvas-3d');
    const rect = container.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, window.activeCamera);
    const intersects = raycaster.intersectObject(window.currentModelGroup, true);

    if (intersects.length > 0) {
        let object = null;
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object.type === 'Mesh' && intersects[i].object.visible) {
                object = intersects[i].object;
                break;
            }
        }

        if (object && hoveredMesh !== object) {
            hoveredMesh = object;

            highlightBox.setFromObject(hoveredMesh);
            highlightBox.visible = true;

            const rawName = hoveredMesh.userData.trueMinecraftName || hoveredMesh.material.name || hoveredMesh.name || "Bloque";
            const cleanName = rawName.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
            let translatedName = typeof translateBlockName === 'function' ? translateBlockName(cleanName) : cleanName;

            // Detectar alfombras y losas por su altura
            const bbox = new THREE.Box3().setFromObject(hoveredMesh);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            
            if (size.y < 0.2) {
                translatedName += " (Alfombra)";
            } else if (size.y > 0.3 && size.y < 0.6) {
                translatedName += " (Losa)";
            }

            const iconContainer = document.getElementById('block-icon-container');
            if (hoveredMesh.material.map && hoveredMesh.material.map.image) {
                iconContainer.innerHTML = `<img src="${hoveredMesh.material.map.image.src}" style="width: 32px; height: 32px; image-rendering: pixelated; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">`;
            } else {
                iconContainer.innerHTML = '<i class="fa-solid fa-cube"></i>';
            }
            
            const point = intersects[0].point;
            const faceNormal = intersects[0].face.normal;
            const blockCenterX = point.x - (faceNormal.x * 0.1);
            const blockCenterY = point.y - (faceNormal.y * 0.1);
            const blockCenterZ = point.z - (faceNormal.z * 0.1);

            const px = Math.floor(blockCenterX);
            const py = Math.floor(blockCenterY);
            const pz = Math.floor(blockCenterZ);

            highlightBox.position.set(px + 0.5, py + 0.5, pz + 0.5);

            if (highlightBox.parent !== window.scene) {
                window.scene.add(highlightBox);
            }
            highlightBox.visible = true;

            blockNameEl.textContent = translatedName;
            blockCoordsEl.textContent = `X: ${px}  Y: ${py}  Z: ${pz}`;

            blockInfoPanel.classList.remove('hidden');
        }
    } else {
        highlightBox.visible = false;
        hoveredMesh = null;
        blockInfoPanel.classList.add('hidden');
    }
}

window.clearModel = function() {
    highlightBox.visible = false;

    if (window.currentModelGroup) {
        window.scene.remove(window.currentModelGroup);
        window.currentModelGroup = null;
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    function animateFallback() {
        animationId = requestAnimationFrame(animateFallback);
        window.controls.object = window.activeCamera;
        window.controls.update();
        window.renderer.render(window.scene, window.activeCamera);
    }
    animateFallback();
}

window.loadModel = function(path, objFile, mtlFile) {
    window.clearModel();
    
    // 1. Descargar y leer el archivo .obj como texto para extraer los nombres verdaderos
    const fullObjPath = path + objFile;
    fetch(fullObjPath)
        .then(response => response.text())
        .then(text => {
            const blockTypeMap = {};
            let currentType = null;
            const lines = text.split('\n');
            for (let line of lines) {
                line = line.trim();
                if (line.startsWith('# type: ')) {
                    currentType = line.substring(8).trim();
                } else if (line.startsWith('o ') || line.startsWith('g ')) {
                    if (currentType) {
                        const blockName = line.substring(2).trim();
                        blockTypeMap[blockName] = currentType;
                        currentType = null;
                    }
                }
            }

            // 2. Continuar con la carga normal 3D
            const mtlLoader = new THREE.MTLLoader();
            mtlLoader.setPath(path);
            mtlLoader.setResourcePath('models/text/'); // Apunta a la carpeta general
            mtlLoader.load(mtlFile, function (materials) {
                materials.preload();

                for (const materialName in materials.materials) {
                    const mat = materials.materials[materialName];
                    if (mat.map) {
                        mat.map.magFilter = THREE.NearestFilter;
                        mat.map.minFilter = THREE.NearestFilter;
                    }
                    mat.side = THREE.DoubleSide;
                }

                const objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.setPath(path);
                objLoader.load(objFile, function (object) {
                    
                    // Asignar el nombre verdadero a cada pieza 3D
                    object.traverse((child) => {
                        if (child.isMesh && blockTypeMap[child.name]) {
                            child.userData.trueMinecraftName = blockTypeMap[child.name];
                        }
                    });
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());

            object.position.x += (object.position.x - center.x);
            object.position.y += (object.position.y - box.min.y);
            object.position.z += (object.position.z - center.z);

            const size = new THREE.Vector3();
            box.getSize(size);
            window.currentModelHeight = Math.ceil(size.y);
            window.currentModelWidth = Math.ceil(size.x);
            window.currentModelDepth = Math.ceil(size.z);

            window.sliceSlider.min = 1;
            window.sliceSlider.max = window.currentModelHeight;
            window.sliceSlider.step = 1;
            window.sliceSlider.value = window.currentModelHeight;

            panSlider.value = 50;
            lastPanValue = 50;

            window.sliceSlider.dispatchEvent(new Event('input'));

            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = window.perspectiveCamera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.5; 

            window.perspectiveCamera.position.set(cameraZ, maxDim, cameraZ);
            window.perspectiveCamera.lookAt(0, maxDim / 2, 0);
            window.controls.target.set(0, maxDim / 2, 0); 

            const container = document.getElementById('canvas-3d');
            const aspect = container.clientWidth / container.clientHeight;
            const vSize = maxDim * 0.6;
            window.orthographicCamera.left = -vSize * aspect;
            window.orthographicCamera.right = vSize * aspect;
            window.orthographicCamera.top = vSize;
            window.orthographicCamera.bottom = -vSize;
            window.orthographicCamera.position.set(0, maxDim * 2, 0);
            window.orthographicCamera.lookAt(0, 0, 0);
            window.orthographicCamera.updateProjectionMatrix();

            window.currentModelGroup = object;
            window.scene.add(object);

            if (animationId) cancelAnimationFrame(animationId);

            function animate() {
                animationId = requestAnimationFrame(animate);
                window.controls.object = window.activeCamera;
                window.controls.update();

                if (isAutoRotating && !window.is2DMode) {
                    object.rotation.y += 0.005;
                } else if (window.is2DMode) {
                    object.rotation.y = 0;
                }

                window.renderer.render(window.scene, window.activeCamera);
            }
            animate();
        });
    });
}).catch(error => {
    console.error("Error Fetch OBJ:", error);
});
}
