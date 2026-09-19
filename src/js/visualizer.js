import * as THREE from 'three';
import { UISkyboxManager } from './skyboxManager.js';
import { UIAudioManager } from './audioManager.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { translateBlockName, getSlug } from './data.js';

// --- View Navigation and DOM Elements ---
const viewCatalog = document.getElementById('view-catalog');
const viewVisualizer = document.getElementById('view-visualizer');
const btnBackCatalog = document.getElementById('btn-back-catalog');
const visualizerTitle = document.getElementById('visualizer-title');
const btn3D = document.getElementById('btn-3d');
const btn2D = document.getElementById('btn-2d');
const btnCrafting = document.getElementById('btn-crafting');
const canvas3D = document.getElementById('canvas-3d');
const canvas2D = document.getElementById('canvas-2d');
const panelCrafting = document.getElementById('panel-crafting');

export function openVisualizer(build, fromHistory = false) {
    window.currentBuildData = build;
    visualizerTitle.textContent = build.title;
    viewCatalog.classList.remove('active');
    viewVisualizer.classList.add('active');

    // Add to history if not triggered by popstate
    if (!fromHistory) {
        const slug = getSlug(build.title);
        const newUrl = window.location.pathname + '?build=' + encodeURIComponent(slug);
        if (window.location.search !== '?build=' + encodeURIComponent(slug)) {
            window.history.pushState({ build: slug }, '', newUrl);
        }
    }

    window.dispatchEvent(new Event('resize'));

    if (build.data && build.data.modelPath) {
        window.loadModel(build.data.modelPath, build.data.objFile, build.data.mtlFile);
    } else {
        window.clearModel();
    }

    // --- Iniciar Tour Interactivo ---
    if (false) { // Disabled tour to prevent screen dimming bug
        window.tourTimeout = setTimeout(() => {
            // Support for Driver.js v1.0+
            let driverFn = null;
            if (window.driver && window.driver.js && typeof window.driver.js.driver === 'function') {
                driverFn = window.driver.js.driver;
            } else if (window.driver && typeof window.driver.driver === 'function') {
                driverFn = window.driver.driver;
            } else if (typeof window.driver === 'function') {
                driverFn = window.driver;
            }

            if (driverFn) {
                const driverObj = driverFn({
                    showProgress: true,
                    doneBtnText: '¡Entendido!',
                    closeBtnText: 'Cerrar',
                    nextBtnText: 'Siguiente',
                    prevBtnText: 'Atrás',
                    steps: [
                        { element: '#slice-container', popover: { title: 'Corte por Capas', description: 'Usa este control para visualizar la construcción capa por capa. ¡Ideal para construir paso a paso!', side: "left", align: 'start' } },
                        { element: '#right-controls-container', popover: { title: 'Herramientas de Construcción', description: 'Aquí encontrarás herramientas avanzadas como la cinta métrica, inventario, minimapa y el botón para simular la construcción.', side: "top", align: 'center' } },
                        { element: '#btn-build-play', popover: { title: 'Simulador', description: 'Haz clic aquí para ver cómo se coloca bloque por bloque automáticamente.', side: "top", align: 'center' } },
                        { element: '#btn-inventory', popover: { title: 'Lista de Materiales', description: 'Comprueba qué bloques y cuántos necesitas para esta construcción.', side: "top", align: 'center' } },
                        { element: '#btn-ruler', popover: { title: 'Cinta Métrica', description: 'Haz clic en dos bloques diferentes para medir la distancia exacta entre ellos.', side: "top", align: 'center' } },
                        { element: '#btn-2d', popover: { title: 'Vistas 2D y 3D', description: 'Cambia a la vista 2D para imprimir los planos exactos desde arriba.', side: "right", align: 'center' } }
                    ],
                    onDestroyStarted: () => {
                        localStorage.setItem('wrkz_tour_completed', 'true');
                        if (driverObj.destroy) driverObj.destroy();
                    }
                });
                window.currentDriver = driverObj;
                driverObj.drive();
            } else {
                console.error("Driver.js no se cargó correctamente en window.");
            }
        }, 1000); // Esperar 1 segundo a que cargue el modelo
    }
}

btnBackCatalog.addEventListener('click', () => {
    if (window.location.search.includes('?build=')) {
        window.history.pushState({ view: 'catalog' }, '', window.location.pathname + '?view=catalog');
        // Force a popstate event to trigger main.js routing
        window.dispatchEvent(new Event('popstate'));
    } else {
        viewVisualizer.classList.remove('active');
        viewCatalog.classList.add('active');
        switchTo3DMode(); // Reset to 3D when leaving
    }
});

// Logo en el visualizador -> regresa a la página principal arriba
const visualizerLogo = document.getElementById('visualizer-logo');
if (visualizerLogo) {
    visualizerLogo.addEventListener('click', () => {
        window.history.pushState({ view: 'landing' }, '', window.location.pathname);
        window.dispatchEvent(new Event('popstate'));
        setTimeout(() => {
            document.getElementById('view-landing').scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    });
}

// --- Visualizer Tabs (2D / 3D) ---
btn3D.addEventListener('click', () => {
    switchTo3DMode();
});

btn2D.addEventListener('click', () => {
    switchTo2DMode();
});

btnCrafting.addEventListener('click', () => {
    switchToCraftingMode();
});

function switchToCraftingMode() {
    if (window.tourTimeout) clearTimeout(window.tourTimeout);
    if (window.currentDriver && window.currentDriver.destroy) {
        try {
            window.currentDriver.destroy();
        } catch (e) {
            console.error("Error destroying driver:", e);
        }
    }

    if (btn3D) btn3D.classList.remove('active');
    if (btn2D) btn2D.classList.remove('active');
    if (btnCrafting) btnCrafting.classList.add('active');

    if (canvas3D) canvas3D.classList.remove('active');
    if (canvas2D) canvas2D.classList.remove('active');

    // Generar datos antes de mostrar
    try {
        if (typeof generateInventory === 'function') {
            generateInventory();
        }
    } catch (e) {
        console.error("Error generating inventory:", e);
    }

    const panel = document.getElementById('panel-crafting');
    if (panel) {
        panel.classList.add('active');
    }
}

// Removed duplicated switchTo3DMode and switchTo2DMode

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

// --- Audio Manager ---
window.BlockAudioManager = {
    buffers: {},
    audioCtx: null,
    lastPlayTime: 0,
    init: async function () {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) { }

        const loadSound = async (name, url) => {
            try {
                if (!this.audioCtx) return;
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                this.buffers[name] = audioBuffer;
            } catch (e) { console.warn("Audio load error:", e); }
        };

        loadSound('stone', 'models/block/deepslate/place1.ogg');
        loadSound('wood', 'models/block/cherry_wood/step1.ogg');
        loadSound('iron', 'models/block/iron/step1.ogg');
        loadSound('sand', 'models/block/sand/sand1.ogg');
    },
    play: function (blockName) {
        if (!this.audioCtx) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = performance.now();
        let dynamicThrottle = 20;
        try {
            if (typeof buildSpeed !== 'undefined') {
                dynamicThrottle = Math.max(15, 30 / buildSpeed);
            }
        } catch (e) { }

        if (now - this.lastPlayTime < dynamicThrottle) return;
        this.lastPlayTime = now;

        let type = 'stone'; // Default
        let lower = (blockName || "").toLowerCase();

        if (lower.includes("wood") || lower.includes("planks") || lower.includes("log") || lower.includes("fence") || lower.includes("door") || lower.includes("chest") || lower.includes("sign")) {
            type = 'wood';
        } else if (lower.includes("iron") || lower.includes("gold") || lower.includes("metal") || lower.includes("copper") || lower.includes("diamond") || lower.includes("netherite")) {
            type = 'iron';
        } else if (lower.includes("sand") || lower.includes("dirt") || lower.includes("gravel") || lower.includes("grass")) {
            type = 'sand';
        }

        if (this.buffers[type]) {
            try {
                const source = this.audioCtx.createBufferSource();
                source.buffer = this.buffers[type];

                const gainNode = this.audioCtx.createGain();
                gainNode.gain.value = 0.4;

                source.connect(gainNode);
                gainNode.connect(this.audioCtx.destination);

                source.playbackRate.value = 0.9 + Math.random() * 0.2; // Variación orgánica

                source.start(0);
            } catch (e) { }
        }
    }
};
window.BlockAudioManager.init();

window.currentModelGroup = null;
window.currentModelHeight = 0;
window.currentModelWidth = 0;
window.currentModelDepth = 0;

let animationId = null;
let isAutoRotating = true;
window.is2DMode = false;
let lastPerspectivePosition = new THREE.Vector3();

// --- 3D Scene Variables ---
let hoveredMesh = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const physicsRaycaster = new THREE.Raycaster();

let highlightBox;

// Block Visibility State
window.hiddenBlockTypes = new Set();

// Variables para animación de construcción
let isBuilding = false;
let buildCurrentIndex = 0;
let buildOrderedMeshes = [];
let buildSpeed = 0.25;

// Variables para Primera Persona
let fpControls;
let isFirstPerson = false;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let canJump = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let savedCameraPosition = new THREE.Vector3();
let savedCameraTarget = new THREE.Vector3();

// UI Elements for Block Info
const blockInfoPanel = document.getElementById('block-info-panel');
const blockNameEl = document.getElementById('block-name');
const blockCoordsEl = document.getElementById('block-coords');

// Sliders and Controls
const panSlider = document.getElementById('pan-slider');
let lastPanValue = 50;
window.sliceSliderXMin = document.getElementById('slice-slider-x-min');
window.sliceSliderXMax = document.getElementById('slice-slider-x-max');
window.sliceSliderYMin = document.getElementById('slice-slider-y-min');
window.sliceSliderYMax = document.getElementById('slice-slider-y-max');
window.sliceSliderZMin = document.getElementById('slice-slider-z-min');
window.sliceSliderZMax = document.getElementById('slice-slider-z-max');
window.sliceSlider = window.sliceSliderYMax; // Keep for compatibility with 2D mode where needed

const btnTogglePlay = document.getElementById('btn-toggle-play');
const btnRotateLeft = document.getElementById('btn-rotate-left');
const btnRotateRight = document.getElementById('btn-rotate-right');

const btnBlockFilter = document.getElementById('btn-block-filter');
const blockFilterModal = document.getElementById('block-filter-modal');
const closeFilterModal = document.getElementById('close-block-filter'); // Fixed ID based on HTML

const btnInventory = document.getElementById('btn-inventory');
const inventoryModal = document.getElementById('inventory-modal');
const closeInventoryModal = document.getElementById('close-inventory-modal');
const inventoryList = document.getElementById('inventory-list');
const inventoryTotalCount = document.getElementById('inventory-total-count');

const btnExplode = document.getElementById('btn-explode');
let isExploded = false;

const btnRuler = document.getElementById('btn-ruler');
const rulerInfoPanel = document.getElementById('ruler-info-panel');
const rulerInstructions = document.getElementById('ruler-instructions');
const rulerResults = document.getElementById('ruler-results');
let isMeasuring = false;
let measurePoints = [];
let measureMeshes = [];

function clearMeasurements() {
    measureMeshes.forEach(mesh => window.scene.remove(mesh));
    measureMeshes = [];
}

const btnGhostMode = document.getElementById('btn-ghost-mode');
window.isGhostMode = false;
window.ghostMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0.15, depthWrite: false });

let minimapCamera = null;
let minimapPlayerMarker = null;
let minimapRenderer = null;
let isMinimapActive = false;

const btnMinimapToggle = document.getElementById('btn-minimap-toggle');
const minimapWrapper = document.getElementById('minimap-wrapper');

if (btnMinimapToggle) {
    btnMinimapToggle.addEventListener('click', () => {
        isMinimapActive = !isMinimapActive;
        if (isMinimapActive) {
            btnMinimapToggle.style.background = 'var(--primary-color)';
            btnMinimapToggle.style.color = 'white';
            if (minimapWrapper) minimapWrapper.style.display = 'block';
        } else {
            btnMinimapToggle.style.background = 'var(--bg-card)';
            btnMinimapToggle.style.color = 'var(--text-primary)';
            if (minimapWrapper) minimapWrapper.style.display = 'none';
        }
    });
}

const btnBuildPlay = document.getElementById('btn-build-play');
const btnBuildStop = document.getElementById('btn-build-stop');
const btnBuildStepForward = document.getElementById('btn-build-step-forward');
const btnBuildStepBack = document.getElementById('btn-build-step-back');
const btnFirstPerson = document.getElementById('btn-first-person');
const buildActiveControls = document.getElementById('build-active-controls');



const speedSelect = document.getElementById('custom-speed-select');
const currentSpeedDisplay = document.getElementById('current-speed-display');
const speedMenu = document.getElementById('speed-options-menu');

const fpBlocker = document.getElementById('fp-blocker');
const btnExitFp = document.getElementById('btn-exit-fp');
const crosshair = document.getElementById('crosshair');

// Helper to update visibility and slider based on index
function updateBuildVisibilityToIndex(targetIndex) {
    targetIndex = Math.max(0, Math.min(Math.floor(targetIndex), buildOrderedMeshes.length));

    // Set visibility
    const maxY = parseInt(window.sliceSliderYMax.value);
    const minY = parseInt(window.sliceSliderYMin.value);
    const minX = parseInt(window.sliceSliderXMin.value);
    const maxX = parseInt(window.sliceSliderXMax.value);
    const minZ = parseInt(window.sliceSliderZMin.value);
    const maxZ = parseInt(window.sliceSliderZMax.value);

    for (let i = 0; i < buildOrderedMeshes.length; i++) {
        const child = buildOrderedMeshes[i];
        if (i < targetIndex) {
            const rawType = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque";
            const cleanType = rawType.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
            const translatedType = typeof translateBlockName === 'function' ? translateBlockName(cleanType) : cleanType;
            if (!window.hiddenBlockTypes.has(translatedType)) {
                if (window.is2DMode) {
                    const box = child.userData.box;
                    if (box) {
                        const isAtLayerY = box.max.y <= maxY + 0.2 && box.max.y > maxY - 0.8 && box.min.y >= minY - 0.2;
                        const isWithinLimitX = box.max.x <= maxX + 0.2 && box.min.x >= minX - 0.2;
                        const isWithinLimitZ = box.max.z <= maxZ + 0.2 && box.min.z >= minZ - 0.2;
                        child.visible = isAtLayerY && isWithinLimitX && isWithinLimitZ;
                    } else {
                        child.visible = false;
                    }
                } else {
                    child.visible = true;
                }
            } else {
                child.visible = false;
            }
        } else {
            child.visible = false;
        }
    }

    // Update slider
    if (targetIndex > 0) {
        const lastBlock = buildOrderedMeshes[targetIndex - 1];
        const layerY = Math.ceil(lastBlock.userData.box.max.y);
        window.sliceSlider.value = layerY;
    } else {
        window.sliceSlider.value = window.sliceSlider.min;
    }

    return targetIndex;
}

if (speedSelect && speedMenu) {
    speedSelect.addEventListener('click', (e) => {
        speedMenu.style.display = speedMenu.style.display === 'none' ? 'flex' : 'none';
        e.stopPropagation(); // Evitar que clics fuera lo cierren inmediatamente si agregamos un listener global
    });

    document.querySelectorAll('.speed-option').forEach(option => {
        option.addEventListener('click', (e) => {
            buildSpeed = parseFloat(e.target.dataset.value);
            currentSpeedDisplay.textContent = e.target.textContent;
        });
        option.addEventListener('mouseover', () => option.style.background = 'rgba(255,255,255,0.1)');
        option.addEventListener('mouseout', () => option.style.background = 'transparent');
    });

    // Cerrar al hacer clic en cualquier otro lado
    document.addEventListener('click', (e) => {
        if (!speedSelect.contains(e.target)) {
            speedMenu.style.display = 'none';
        }
    });
}

if (btnBuildPlay) {
    btnBuildPlay.addEventListener('click', () => {
        if (isBuilding) {
            isBuilding = false;
            btnBuildPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
        } else {
            if (buildCurrentIndex >= buildOrderedMeshes.length) {
                buildCurrentIndex = 0;
                buildOrderedMeshes.forEach(child => child.visible = false);
                window.sliceSlider.value = window.sliceSlider.min;
            } else if (buildCurrentIndex === 0) {
                buildOrderedMeshes.forEach(child => child.visible = false);
            }
            isBuilding = true;
            btnBuildPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
            if (buildActiveControls) buildActiveControls.style.display = 'flex';
        }
    });
}

if (btnBuildStepForward) {
    btnBuildStepForward.addEventListener('click', () => {
        isBuilding = false;
        if (btnBuildPlay) btnBuildPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
        if (buildOrderedMeshes.length > 0) {
            let previousIndex = Math.floor(buildCurrentIndex);
            buildCurrentIndex = updateBuildVisibilityToIndex(buildCurrentIndex + 1);
            let targetIndex = Math.floor(buildCurrentIndex);
            if (targetIndex > previousIndex && targetIndex <= buildOrderedMeshes.length) {
                const child = buildOrderedMeshes[targetIndex - 1];
                const rawType = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque";
                const cleanType = rawType.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
                if (window.BlockAudioManager) window.BlockAudioManager.play(cleanType);
            }
        }
    });
}

if (btnBuildStepBack) {
    btnBuildStepBack.addEventListener('click', () => {
        isBuilding = false;
        if (btnBuildPlay) btnBuildPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
        if (buildOrderedMeshes.length > 0) {
            buildCurrentIndex = updateBuildVisibilityToIndex(buildCurrentIndex - 1);
        }
    });
}

if (btnBuildStop) {
    btnBuildStop.addEventListener('click', () => {
        isBuilding = false;
        buildCurrentIndex = buildOrderedMeshes.length;
        window.sliceSlider.value = window.sliceSlider.max;
        window.sliceSlider.dispatchEvent(new Event('input'));
        btnBuildPlay.innerHTML = '<i class="fa-solid fa-hammer"></i>';
        if (buildActiveControls) buildActiveControls.style.display = 'none';
    });
}

function exitFirstPersonMode() {
    if (fpControls && fpControls.isLocked) {
        fpControls.unlock();
    }
    isFirstPerson = false;
    const fpBlocker = document.getElementById('fp-blocker');
    if (fpBlocker) fpBlocker.style.display = 'none';
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    window.controls.enabled = true;

    // Restore controls
    document.getElementById('pan-container').style.display = 'flex';
    document.getElementById('visualizer-controls').style.display = 'flex';

    // Restore controls
    document.getElementById('pan-container').style.display = 'flex';
    document.getElementById('visualizer-controls').style.display = 'flex';

    // Restore orbit camera target to the center of the model
    // so that zooming (mouse wheel) works correctly again.
    const targetY = window.currentModelHeight ? window.currentModelHeight / 2 : 0;
    window.controls.target.set(0, targetY, 0);
    window.controls.update();
}

if (btnFirstPerson) {
    btnFirstPerson.addEventListener('click', () => {
        btnFirstPerson.blur(); // Remove focus to prevent Spacebar from triggering it again
        if (!fpControls) {
            alert('PointerLockControls no está cargado');
            return;
        }

        if (isFirstPerson) {
            exitFirstPersonMode();
        } else {
            // Activate first person mode
            isFirstPerson = true;
            window.controls.enabled = false;

            // Si la cámara orbital actual está muy lejos o muy alta, 
            // podemos centrarla en la construcción a nivel del suelo.
            if (window.currentModelGroup) {
                // Spawn safely on the ground at a distance from the model
                let mHeight = window.currentModelHeight || 20;
                window.perspectiveCamera.position.set(
                    window.controls.target.x,
                    1.6, // altura jugador a nivel del suelo
                    window.controls.target.z + (mHeight / 2) + 10 // Safely outside the model
                );
                window.perspectiveCamera.lookAt(window.controls.target);
            }

            fpControls.lock();
        }
    });
}

if (btnBlockFilter) btnBlockFilter.addEventListener('click', () => blockFilterModal.classList.add('active'));
if (closeFilterModal) closeFilterModal.addEventListener('click', () => blockFilterModal.classList.remove('active'));
if (blockFilterModal) blockFilterModal.addEventListener('click', (e) => {
    if (e.target === blockFilterModal) blockFilterModal.classList.remove('active');
});

// Inventory Modal
if (btnInventory) {
    btnInventory.addEventListener('click', () => {
        try {
            generateInventory();
        } catch (e) {
            console.error(e);
        }
        inventoryModal.classList.add('active');
    });
}
if (closeInventoryModal) closeInventoryModal.addEventListener('click', () => inventoryModal.classList.remove('active'));
if (inventoryModal) inventoryModal.addEventListener('click', (e) => {
    if (e.target === inventoryModal) inventoryModal.classList.remove('active');
});

if (btnExplode) {
    btnExplode.addEventListener('click', () => {
        isExploded = !isExploded;
        if (isExploded) {
            btnExplode.style.background = 'var(--primary-color)';
            btnExplode.style.color = 'white';
        } else {
            btnExplode.style.background = 'var(--bg-card)';
            btnExplode.style.color = 'var(--text-primary)';
        }
    });
}

// Setup Show/Hide All for Inventory
const btnFilterAll = document.getElementById('btn-filter-all');
const btnFilterNone = document.getElementById('btn-filter-none');

if (btnFilterAll) {
    btnFilterAll.addEventListener('click', () => {
        if (!window.currentModelGroup) return;
        window.currentModelGroup.traverse((child) => {
            if (child.isMesh) {
                const rawType = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque";
                const cleanType = rawType.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
                const translatedType = typeof translateBlockName === 'function' ? translateBlockName(cleanType) : cleanType;
                window.hiddenBlockTypes.add(translatedType);
            }
        });
        generateInventory(); // re-render to update visuals
        window.sliceSlider.dispatchEvent(new Event('input'));
    });
}

if (btnFilterNone) {
    btnFilterNone.addEventListener('click', () => {
        window.hiddenBlockTypes.clear();
        generateInventory(); // re-render to update visuals
        window.sliceSlider.dispatchEvent(new Event('input'));
    });
}

function generateInventory() {
    if (!window.currentModelGroup) return;

    const blockCounts = {};
    const blockIcons = {};
    let total = 0;

    window.currentModelGroup.traverse((child) => {
        if (child.isMesh) {
            try {
                let rawType = child.userData.englishId || child.userData.trueMinecraftName || (child.material ? child.material.name : undefined) || child.name || "Bloque";

                rawType = String(rawType); // Garantizar que sea string
                const cleanType = rawType.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
                let translatedType = typeof translateBlockName === 'function' ? translateBlockName(cleanType) : cleanType;

                const bbox = new THREE.Box3().setFromObject(child);
                const size = new THREE.Vector3();
                bbox.getSize(size);
                
                if (size.y < 0.2) {
                    translatedType += " (Alfombra)";
                } else if (size.y > 0.3 && size.y < 0.6) {
                    translatedType += " (Losa)";
                }

                if (!blockCounts[translatedType]) {
                    blockCounts[translatedType] = 0;
                    let mat = child.material;
                    if (Array.isArray(mat) && mat.length > 0) {
                        mat = mat.find(m => m && m.name && String(m.name).includes && !String(m.name).includes("bottom")) || mat[0];
                    }
                    let englishId = child.userData && child.userData.englishId ? child.userData.englishId : "";
                    
                    let finalEnglishId = englishId;
                    if (size.y < 0.2 && finalEnglishId.includes("wool")) {
                        finalEnglishId = finalEnglishId.replace("wool", "carpet");
                    }

                    if (finalEnglishId && finalEnglishId !== "Bloque") {
                        blockIcons[translatedType] = `models/items/${finalEnglishId}.png`;
                    } else if (mat && mat.name) {
                        blockIcons[translatedType] = `models/items/${mat.name}.png`;
                    } else if (mat && mat.map && mat.map.image) {
                        blockIcons[translatedType] = mat.map.image.src;
                    }
                }
                blockCounts[translatedType]++;
                total++;
            } catch (e) {
                console.warn("Error processing block:", child.name, e);
            }
        }
    });

    inventoryList.innerHTML = '';

    // Actualizar también la UI de Crafteos
    if (window.craftingUI) {
        window.craftingUI.updateData(blockCounts, blockIcons);
    }

    // Sort by count descending
    const sortedTypes = Object.keys(blockCounts).sort((a, b) => blockCounts[b] - blockCounts[a]);

    sortedTypes.forEach(type => {
        const count = blockCounts[type];
        const iconSrc = blockIcons[type];

        const card = document.createElement('div');
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '0.4rem';
        card.style.background = 'var(--bg-panel)';
        card.style.padding = '0.5rem';
        card.style.borderRadius = '0.5rem';
        card.style.border = '1px solid var(--border-color)';

        const iconHTML = iconSrc
            ? `<img loading="lazy" src="${iconSrc}" style="width: 48px; height: 48px; border-radius: 4px;" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.webp');}else{this.onerror=null; this.outerHTML='<div style=\\'width: 32px; height: 32px; background: #333; display: flex; align-items: center; justify-content: center; border-radius: 4px;\\'><i class=\\'fa-solid fa-cube\\'></i></div>';}">`
            : `<div style="width: 32px; height: 32px; background: #333; display: flex; align-items: center; justify-content: center; border-radius: 4px;"><i class="fa-solid fa-cube"></i></div>`;

        let countText = `x${count}`;
        if (count >= 64) {
            const stacks = Math.floor(count / 64);
            const remainder = count % 64;
            countText = `${count} <span style="font-size:0.75rem; color:#aaa;">(${stacks} Stacks` + (remainder > 0 ? ` + ${remainder}` : '') + `)</span>`;
        }

        card.innerHTML = `
            ${iconHTML}
            <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.85rem; font-weight: bold; white-space: normal; word-break: break-word;" title="${type}">${type}</div>
                <div style="font-size: 0.9rem; font-weight: normal; color: var(--primary-color);">${countText}</div>
            </div>
        `;

        // Setup toggle logic
        card.style.cursor = 'pointer';
        card.style.transition = 'opacity 0.2s, filter 0.2s';

        const updateCardVisuals = () => {
            if (window.hiddenBlockTypes.has(type)) {
                card.style.opacity = '0.5';
                card.style.filter = 'grayscale(100%)';
            } else {
                card.style.opacity = '1';
                card.style.filter = 'none';
            }
        };
        updateCardVisuals();

        card.addEventListener('click', () => {
            if (window.hiddenBlockTypes.has(type)) {
                window.hiddenBlockTypes.delete(type);
            } else {
                window.hiddenBlockTypes.add(type);
            }
            updateCardVisuals();
            window.sliceSlider.dispatchEvent(new Event('input'));
        });

        inventoryList.appendChild(card);
    });

    inventoryTotalCount.textContent = total;
}

// Ruler Mode
if (btnRuler) {
    btnRuler.addEventListener('click', () => {
        isMeasuring = !isMeasuring;
        const recipeContainer = document.getElementById('block-info-recipe');
        if (isMeasuring) {
            btnRuler.style.background = 'var(--primary-color)';
            rulerInfoPanel.classList.remove('hidden');
            blockInfoPanel.classList.add('hidden'); // Ocultar info de bloque
            if (recipeContainer) recipeContainer.classList.add('hidden'); // Ocultar receta
            rulerInstructions.textContent = "Haz clic en el primer bloque.";
            rulerResults.style.display = 'none';
            measurePoints = [];
            clearMeasurements();
        } else {
            btnRuler.style.background = 'var(--bg-card)';
            rulerInfoPanel.classList.add('hidden');
            measurePoints = [];
            clearMeasurements();
            // Refrescar bloque hover actual
            updateHoveredBlock();
        }
    });
}

// Global click for ruler (Tap detection for mobile + PC)
function handleRulerClick(event) {
    if (!isMeasuring || !window.currentModelGroup || isFirstPerson) return;

    // Ignore clicks on UI elements
    if (event.target && (event.target.closest('.modal-overlay') || event.target.closest('.control-btn') || event.target.closest('.block-info') || event.target.closest('.sidebar'))) return;

    if (hoveredMesh) {
        const bbox = new THREE.Box3().setFromObject(hoveredMesh);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        measurePoints.push(center);

        if (measurePoints.length === 1) {
            clearMeasurements(); // Borrar medida anterior al iniciar una nueva
            rulerInstructions.textContent = "Punto 1 seleccionado. Haz clic en el segundo bloque.";

            // Add a small marker for point 1
            const geo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
            const mat = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(center);
            window.scene.add(mesh);
            measureMeshes.push(mesh);

        } else if (measurePoints.length === 2) {
            rulerInstructions.innerHTML = "Medición completada.<br>Haz clic en otro bloque<br>para iniciar de nuevo.";

            const p1 = measurePoints[0];
            const p2 = measurePoints[1];

            // Calculate differences (add 1 to include both start and end blocks in block distances)
            const dx = Math.round(Math.abs(p1.x - p2.x)) + 1;
            const dy = Math.round(Math.abs(p1.y - p2.y)) + 1;
            const dz = Math.round(Math.abs(p1.z - p2.z)) + 1;

            // Direct distance
            const directDist = p1.distanceTo(p2).toFixed(1);

            rulerResults.innerHTML = `Ancho (X): ${dx}<br>Alto (Y): ${dy}<br>Prof (Z): ${dz}<br><span style="color:#a8b1ff">Directa: ${directDist}m</span>`;
            rulerResults.style.display = 'block';

            // Clear point 1 marker before drawing final lines
            clearMeasurements();

            // Draw line
            const points = [p1, p2];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x6366f1, linewidth: 3, depthTest: false });
            const line = new THREE.Line(geometry, material);
            window.scene.add(line);
            measureMeshes.push(line);

            // Draw point markers
            const pointGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
            const pointMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true });
            const m1 = new THREE.Mesh(pointGeo, pointMat);
            m1.position.copy(p1);
            const m2 = new THREE.Mesh(pointGeo, pointMat);
            m2.position.copy(p2);
            window.scene.add(m1);
            window.scene.add(m2);
            measureMeshes.push(m1, m2);

            // Reset for next click
            measurePoints = [];
        }
    }
}

// Ghost Mode
if (btnGhostMode) {
    btnGhostMode.addEventListener('click', () => {
        window.isGhostMode = !window.isGhostMode;
        btnGhostMode.style.background = window.isGhostMode ? 'var(--primary-color)' : 'var(--bg-card)';

        // Force refresh slider
        window.sliceSlider.dispatchEvent(new Event('input'));

        // Fix: Ocultar inmediatamente los bloques cortados al salir del modo fantasma
        // para evitar que se reproduzca la animación de "flote" con los bloques opacos
        if (!window.isGhostMode && window.currentModelGroup) {
            window.currentModelGroup.traverse((child) => {
                if (child.isMesh && child.userData.isSliced) {
                    child.visible = false;
                }
            });
        }
    });
}

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

function updateSlicing(e) {
    if (!window.currentModelGroup) return;

    if (e && e.isTrusted) {
        isBuilding = false;
        if (btnBuildPlay) btnBuildPlay.innerHTML = '<i class="fa-solid fa-hammer"></i>';
        if (buildActiveControls) buildActiveControls.style.display = 'none';
        buildCurrentIndex = buildOrderedMeshes.length; // Force restart if played again
    }

    // Force min to be <= max dynamically for UX
    if (e && e.target) {
        if (e.target.id.includes('-min')) {
            const maxSlider = document.getElementById(e.target.id.replace('-min', '-max'));
            if (parseInt(e.target.value) > parseInt(maxSlider.value)) e.target.value = maxSlider.value;
        } else if (e.target.id.includes('-max')) {
            const minSlider = document.getElementById(e.target.id.replace('-max', '-min'));
            if (parseInt(e.target.value) < parseInt(minSlider.value)) e.target.value = minSlider.value;
        }
    }

    const minY = parseInt(window.sliceSliderYMin.value);
    const maxY = parseInt(window.sliceSliderYMax.value);
    const maxH = parseInt(window.sliceSliderYMax.max);
    
    const layerIndicatorY = document.getElementById('layer-indicator-y');
    if (layerIndicatorY) {
        if (minY === 0 && Math.abs(maxY - maxH) <= 1) { // Tolerate small precision diffs
            layerIndicatorY.textContent = `Total: ${maxH}`;
        } else {
            if (minY === 0 || minY === 1) {
                layerIndicatorY.textContent = `${maxY}`;
            } else if (minY === maxY) {
                layerIndicatorY.textContent = `${maxY}`;
            } else {
                layerIndicatorY.textContent = `${minY} - ${maxY}`;
            }
        }
    }

    const minX = parseInt(window.sliceSliderXMin.value);
    const maxX = parseInt(window.sliceSliderXMax.value);
    const minZ = parseInt(window.sliceSliderZMin.value);
    const maxZ = parseInt(window.sliceSliderZMax.value);
    const limitMaxX = parseInt(window.sliceSliderXMax.max);
    const limitMinX = parseInt(window.sliceSliderXMin.min);
    const limitMaxZ = parseInt(window.sliceSliderZMax.max);
    const limitMinZ = parseInt(window.sliceSliderZMin.min);

    const layerIndicatorX = document.getElementById('layer-indicator-x');
    if (layerIndicatorX) {
        if (minX === limitMinX && maxX === limitMaxX) {
            layerIndicatorX.textContent = `Total: ${limitMaxX - limitMinX}`;
        } else if (minX === maxX) {
            layerIndicatorX.textContent = `${maxX}`;
        } else {
            layerIndicatorX.textContent = `${minX} a ${maxX}`;
        }
    }

    const layerIndicatorZ = document.getElementById('layer-indicator-z');
    if (layerIndicatorZ) {
        if (minZ === limitMinZ && maxZ === limitMaxZ) {
            layerIndicatorZ.textContent = `Total: ${limitMaxZ - limitMinZ}`;
        } else if (minZ === maxZ) {
            layerIndicatorZ.textContent = `${maxZ}`;
        } else {
            layerIndicatorZ.textContent = `${minZ} a ${maxZ}`;
        }
    }

    if (window.is2DMode) {
        window.orthographicCamera.position.y = window.currentModelHeight * 2;
    }

    window.currentModelGroup.traverse((child) => {
        if (child.isMesh) {
            const rawType = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque";
            const cleanType = rawType.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
            const translatedType = typeof translateBlockName === 'function' ? translateBlockName(cleanType) : cleanType;

            if (window.hiddenBlockTypes.has(translatedType)) {
                child.userData.isHiddenType = true;
                child.visible = false;
                return;
            } else {
                child.userData.isHiddenType = false;
            }

            const box = child.userData.box;
            if (!box) return;

            const isWithinLimitY = box.max.y <= maxY + 0.2 && box.min.y >= minY - 0.2;
            const isWithinLimitX = box.max.x <= maxX + 0.2 && box.min.x >= minX - 0.2;
            const isWithinLimitZ = box.max.z <= maxZ + 0.2 && box.min.z >= minZ - 0.2;

            const isAtLayerY = box.max.y <= maxY + 0.2 && box.max.y > maxY - 0.8 && box.min.y >= minY - 0.2;
            const isWithinVolume = isWithinLimitY && isWithinLimitX && isWithinLimitZ;

            if (window.is2DMode) {
                child.visible = isAtLayerY && isWithinLimitX && isWithinLimitZ;
            } else {
                child.userData.isSliced = !isWithinVolume;
                if (!isBuilding) {
                    if (window.isGhostMode) {
                        child.visible = true;
                    } else {
                        // Si no es modo construcción ni fantasma, animate() se encargará de ocultarlo 
                        // después de la animación de encogimiento.
                        if (!child.userData.isSliced) {
                            child.visible = true; // Asegurar que sea visible si volvió al volumen
                        }
                    }
                }
            }

            if (window.isGhostMode && !window.is2DMode) {
                if (!child.userData.originalMaterial) child.userData.originalMaterial = child.material;
                child.material = !isWithinVolume ? window.ghostMaterial : child.userData.originalMaterial;
            } else if (child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
            }
        }
    });
}

window.sliceSliderXMin.addEventListener('input', updateSlicing);
window.sliceSliderXMax.addEventListener('input', updateSlicing);
window.sliceSliderYMin.addEventListener('input', updateSlicing);
window.sliceSliderYMax.addEventListener('input', updateSlicing);
window.sliceSliderZMin.addEventListener('input', updateSlicing);
window.sliceSliderZMax.addEventListener('input', updateSlicing);

export function switchTo3DMode() {
    document.body.classList.remove('is-2d-mode');
    btn3D.classList.add('active');
    btn2D.classList.remove('active');
    if (btnCrafting) btnCrafting.classList.remove('active');
    canvas3D.classList.add('active');
    if (canvas2D) canvas2D.classList.remove('active');
    if (panelCrafting) {
        panelCrafting.classList.remove('active');
        panelCrafting.style.display = '';
        panelCrafting.style.opacity = '';
        panelCrafting.style.zIndex = '';
        panelCrafting.style.pointerEvents = '';
    }
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
        
        if (typeof window.UISkyboxManager !== 'undefined') {
            window.UISkyboxManager.setSkybox('night');
        } else {
            window.scene.background = null;
        }
        window.scene.fog = null;
        if (window.currentModelGroup) {
            window.currentModelGroup.traverse((child) => {
                if (child.userData && child.userData.isBlueprintEdge) child.visible = false;
            });
        }

        if (window.mainAmbientLight) window.mainAmbientLight.intensity = 1.5;
        if (window.mainDirectionalLight) window.mainDirectionalLight.intensity = 2.5;

        document.getElementById('pan-container').style.display = 'flex';
        document.getElementById('visualizer-controls').style.display = 'flex';
        const fpBtn = document.getElementById('btn-first-person');
        if (fpBtn) fpBtn.style.display = 'flex';
        const rulerBtn = document.getElementById('btn-ruler');
        if (rulerBtn) rulerBtn.style.display = 'flex';
        const ghostBtn = document.getElementById('btn-ghost-mode');
        if (ghostBtn) ghostBtn.style.display = 'flex';

        window.sliceSlider.dispatchEvent(new Event('input'));
    }
}

window.switchTo2DMode = function () {
    document.body.classList.add('is-2d-mode');
    btn2D.classList.add('active');
    btn3D.classList.remove('active');
    if (btnCrafting) btnCrafting.classList.remove('active');
    if (canvas2D) canvas2D.classList.add('active');
    canvas3D.classList.add('active'); // El modo 2D usa el canvas 3D con cámara ortográfica
    if (panelCrafting) {
        panelCrafting.classList.remove('active');
        panelCrafting.style.display = '';
        panelCrafting.style.opacity = '';
        panelCrafting.style.zIndex = '';
        panelCrafting.style.pointerEvents = '';
    }

    if (window.controls) {
        lastPerspectivePosition.copy(window.perspectiveCamera.position);

        window.activeCamera = window.orthographicCamera;
        window.is2DMode = true;
        canvas3D.classList.add('blueprint-mode');
        
        if (typeof window.UISkyboxManager !== 'undefined') {
            window.UISkyboxManager.setSkybox('none');
        }
        window.scene.background = null;
        window.scene.fog = null;
        if (window.currentModelGroup) {
            window.currentModelGroup.traverse((child) => {
                if (child.userData && child.userData.isBlueprintEdge) child.visible = true;
            });
        }

        if (window.mainAmbientLight) window.mainAmbientLight.intensity = 1.5;
        if (window.mainDirectionalLight) window.mainDirectionalLight.intensity = 2.5;

        window.controls.enableRotate = false;

        window.orthographicCamera.position.set(0, window.currentModelHeight * 2, 0);
        window.orthographicCamera.lookAt(0, 0, 0);

        document.getElementById('pan-container').style.display = 'none';
        document.getElementById('visualizer-controls').style.display = 'none';
        const fpBtn = document.getElementById('btn-first-person');
        if (fpBtn) fpBtn.style.display = 'none';
        const rulerBtn = document.getElementById('btn-ruler');
        if (rulerBtn) rulerBtn.style.display = 'flex';
        const ghostBtn = document.getElementById('btn-ghost-mode');
        if (ghostBtn) ghostBtn.style.display = 'none';

        window.sliceSlider.dispatchEvent(new Event('input'));
    }
}

export function init3D() {
    const container = document.getElementById('canvas-3d');

    window.scene = new THREE.Scene();
    if (typeof window.UISkyboxManager !== 'undefined') {
        window.UISkyboxManager.init(window.scene);
        window.UISkyboxManager.setSkybox('night');
    }

    window.perspectiveCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
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
    window.orthographicCamera.up.set(0, 0, -1);
    window.orthographicCamera.lookAt(0, 0, 0);

    window.activeCamera = window.perspectiveCamera;

    window.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    window.renderer.setPixelRatio(window.devicePixelRatio);
    window.renderer.shadowMap.enabled = true;
    window.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(window.renderer.domElement);

    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
    highlightBox = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x6366f1 }));
    highlightBox.material.depthTest = false;
    highlightBox.material.transparent = true;
    highlightBox.material.opacity = 0.9;
    highlightBox.visible = false;
    window.scene.add(highlightBox);

    container.addEventListener('mousemove', onMouseMove);
    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };
    container.addEventListener('pointerdown', (e) => {
        pointerDownTime = performance.now();
        pointerDownPos.x = e.clientX;
        pointerDownPos.y = e.clientY;
        onMouseMove(e);
    });
    container.addEventListener('pointerup', (e) => {
        const timeDiff = performance.now() - pointerDownTime;
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (timeDiff < 500 && dist < 15) {
            handleRulerClick(e);
        }
    });

    window.controls = new OrbitControls(window.activeCamera, window.renderer.domElement);
    window.controls.enableDamping = true;
    window.controls.dampingFactor = 0.05;
    window.controls.screenSpacePanning = true;
    window.controls.maxDistance = 500;

    // --- Configurar PointerLockControls ---
    if (PointerLockControls) {
        fpControls = new PointerLockControls(window.perspectiveCamera, document.body);

        fpControls.addEventListener('lock', function () {
            const fpBlocker = document.getElementById('fp-blocker');
            if (fpBlocker) fpBlocker.style.display = 'none';
            const crosshair = document.getElementById('crosshair');
            if (crosshair) crosshair.style.display = 'block';

            // Hide unused UI in first person mode
            document.getElementById('pan-container').style.display = 'none';
            document.getElementById('visualizer-controls').style.display = 'none';

            isFirstPerson = true;
            prevTime = performance.now();
            velocity.set(0, 0, 0); // Reset velocity to fall smoothly
        });

        fpControls.addEventListener('unlock', function () {
            if (isFirstPerson) {
                exitFirstPersonMode();
            }
        });

        window.scene.add(window.perspectiveCamera);

        const onKeyDown = function (event) {
            if (!isFirstPerson) return;
            if (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea') return;
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': moveForward = true; break;
                case 'ArrowLeft':
                case 'KeyA': moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS': moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD': moveRight = true; break;
                case 'Space': moveUp = true; break;
            }
        };

        const onKeyUp = function (event) {
            if (!isFirstPerson) return;
            if (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea') return;
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': moveForward = false; break;
                case 'ArrowLeft':
                case 'KeyA': moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS': moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD': moveRight = false; break;
                case 'Space': moveUp = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        document.addEventListener('wheel', (e) => {
            if (!isFirstPerson || !window.sliceSlider) return;
            const direction = e.deltaY > 0 ? -1 : 1;
            const newValue = parseInt(window.sliceSlider.value) + direction;
            const min = parseInt(window.sliceSlider.min);
            const max = parseInt(window.sliceSlider.max);

            if (newValue >= min && newValue <= max) {
                window.sliceSlider.value = newValue;
                window.sliceSlider.dispatchEvent(new Event('input'));
            }
        });

        const fpBlocker = document.getElementById('fp-blocker');
        if (fpBlocker) {
            fpBlocker.addEventListener('click', function () {
                fpControls.lock();
            });
        }

        const btnExitFp = document.getElementById('btn-exit-fp');
        if (btnExitFp) {
            btnExitFp.addEventListener('click', function (e) {
                e.stopPropagation();
                exitFirstPersonMode();
            });
        }
    }
    // --------------------------------------

    window.mainAmbientLight = new THREE.AmbientLight(0xffffff, 1.5);
    window.scene.add(window.mainAmbientLight);

    window.mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    window.mainDirectionalLight.position.set(20, 40, 20);
    window.mainDirectionalLight.castShadow = true;
    window.mainDirectionalLight.shadow.mapSize.width = 2048;
    window.mainDirectionalLight.shadow.mapSize.height = 2048;
    window.mainDirectionalLight.shadow.camera.near = 0.5;
    window.mainDirectionalLight.shadow.camera.far = 150;
    window.mainDirectionalLight.shadow.camera.left = -50;
    window.mainDirectionalLight.shadow.camera.right = 50;
    window.mainDirectionalLight.shadow.camera.top = 50;
    window.mainDirectionalLight.shadow.camera.bottom = -50;
    window.mainDirectionalLight.shadow.bias = -0.001;
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

            let max2D = Math.max(window.currentModelWidth || 0, window.currentModelDepth || 0);
            if (max2D === 0) max2D = window.currentModelHeight || 10;
            let vSize = max2D * 0.6; // 60% radius (gives 10% padding around the 50% radius)
            if (aspect < 1) vSize = vSize / aspect;
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
    if (isFirstPerson) return; // Handle in animate loop instead
    if (!window.currentModelGroup) return;

    const container = document.getElementById('canvas-3d');
    const rect = container.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    updateHoveredBlock();
}

function updateHoveredBlock() {
    if (!window.currentModelGroup) return;

    raycaster.setFromCamera(mouse, window.activeCamera);
    const intersects = raycaster.intersectObject(window.currentModelGroup, true);

    if (intersects.length > 0) {
        let hitIntersect = null;
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object.type === 'Mesh' && intersects[i].object.visible) {
                hitIntersect = intersects[i];
                break;
            }
        }

        if (hitIntersect) {
            let object = hitIntersect.object;
            let localPoint = hitIntersect.point;
            let localNormal = hitIntersect.face.normal;
            let targetGroup = window.scene;

            if (window.currentModelGroup) {
                targetGroup = window.currentModelGroup;
                localPoint = targetGroup.worldToLocal(hitIntersect.point.clone());
                localNormal = hitIntersect.face.normal.clone().transformDirection(targetGroup.matrixWorld.clone().invert()).normalize();
            }

        const blockCenterX = localPoint.x - (localNormal.x * 0.1);
        const blockCenterY = localPoint.y - (localNormal.y * 0.1);
        const blockCenterZ = localPoint.z - (localNormal.z * 0.1);

        const px = Math.floor(blockCenterX);
        const py = Math.floor(blockCenterY);
        const pz = Math.floor(blockCenterZ);
        
        const coordsStr = `${px},${py},${pz}`;

        if (object && (hoveredMesh !== object || window.lastHoveredCoords !== coordsStr)) {
            hoveredMesh = object;
            window.lastHoveredCoords = coordsStr;

            highlightBox.visible = true;

            let finalHoverMatName = hoveredMesh.material ? (Array.isArray(hoveredMesh.material) ? hoveredMesh.material[0].name : hoveredMesh.material.name) : undefined;
            const rawName = hoveredMesh.userData.englishId || hoveredMesh.userData.trueMinecraftName || finalHoverMatName || hoveredMesh.name || "Bloque";
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
            let mat = hoveredMesh.material;
            if (Array.isArray(mat) && mat.length > 0) {
                mat = mat.find(m => m.name && !m.name.includes("bottom")) || mat[0];
            }
            const englishId = hoveredMesh.userData.englishId || "";
            if (englishId && englishId !== "Bloque") {
                let fallback = mat && mat.map && mat.map.image ? mat.map.image.src : '';
                iconContainer.innerHTML = `<img loading="lazy" src="models/items/${englishId}.png" style="width: 48px; height: 48px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.webp');}else if(this.src!=='${fallback}'){this.src='${fallback}';}">`;
            } else if (mat && mat.name) {
                let fallback = mat.map && mat.map.image ? mat.map.image.src : '';
                iconContainer.innerHTML = `<img loading="lazy" src="models/items/${mat.name}.png" style="width: 48px; height: 48px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.webp');}else if(this.src!=='${fallback}'){this.src='${fallback}';}">`;
            } else {
                iconContainer.innerHTML = '<i class="fa-solid fa-cube"></i>';
            }

            // Set size based on block type (carpet/slab)
            let boxHeight = 1.02;
            let boxYOffset = 0.5;
            if (translatedName.includes("Alfombra")) {
                boxHeight = 0.1;
                boxYOffset = 0.05;
            } else if (translatedName.includes("Losa")) {
                boxHeight = 0.5;
                boxYOffset = 0.25;
            }
            highlightBox.scale.set(1, boxHeight / 1.02, 1);
            
            highlightBox.position.set(px + 0.5, py + boxYOffset, pz + 0.5);

            if (highlightBox.parent !== targetGroup) {
                targetGroup.add(highlightBox);
            }
            highlightBox.visible = true;

            blockNameEl.textContent = translatedName;
            blockCoordsEl.textContent = `X: ${px}  Y: ${py}  Z: ${pz}`;

            // Render recipe if available
            const recipeContainer = document.getElementById('block-info-recipe');
            if (recipeContainer) {
                let lookupName = (englishId || (mat && mat.name) || cleanName).replace(/_/g, ' ').toLowerCase();
                if (lookupName === "nether portal") lookupName = "obsidian";
                
                const recipes = window.blockRecipes ? window.blockRecipes[lookupName] : null;
                
                if (recipes && recipes.length > 0) {
                    const recipe = recipes[0];
                    let recipeHtml = '<h5 style="margin: 0 0 5px 0; color: #fff; font-size: 0.9rem; letter-spacing: 1px;">Receta</h5>';
                    
                    if (recipe.type === "crafting_table") {
                        recipeHtml += '<div style="display: grid; grid-template-columns: repeat(3, 36px); gap: 4px; background: #c6c6c6; padding: 6px; border: 3px solid #373737; border-top-color: #fff; border-left-color: #fff; box-shadow: inset -2px -2px 0px #555, inset 2px 2px 0px #fff; border-radius: 4px;">';
                        for (let i = 0; i < 9; i++) {
                            const item = recipe.ingredients[i];
                            let imgHtml = '';
                            if (item) {
                                const itemPath = `models/items/${item.replace(/ /g, '_')}.png`;
                                imgHtml = `<img loading="lazy" src="${itemPath}" style="width: 100%; height: 100%; image-rendering: pixelated; filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.3));" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.webp');}else{this.style.display='none';}">`;
                            }
                            recipeHtml += `<div style="width: 36px; height: 36px; background: #8b8b8b; border: 2px solid #373737; border-bottom-color: #fff; border-right-color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: inset -1px -1px 0px #555, inset 1px 1px 0px #fff;" title="${item || ''}">${imgHtml}</div>`;
                        }
                        recipeHtml += '</div>';
                    } else if (recipe.type === "furnace") {
                         recipeHtml += '<div style="display: flex; flex-direction: column; align-items: center; background: #c6c6c6; padding: 6px; border: 3px solid #373737; border-top-color: #fff; border-left-color: #fff; box-shadow: inset -2px -2px 0px #555, inset 2px 2px 0px #fff; border-radius: 4px;">';
                         const item = recipe.ingredients[0];
                         const itemPath = `models/items/${item.replace(/ /g, '_')}.png`;
                         recipeHtml += `<div style="width: 36px; height: 36px; background: #8b8b8b; border: 2px solid #373737; border-bottom-color: #fff; border-right-color: #fff; box-shadow: inset -1px -1px 0px #555, inset 1px 1px 0px #fff;" title="${item}"><img loading="lazy" src="${itemPath}" style="width: 100%; height: 100%; image-rendering: pixelated; filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.3));" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.webp');}else{this.style.display='none';}"></div>`;
                         recipeHtml += `<i class="fa-solid fa-fire" style="font-size: 18px; color: #ff7b00; margin: 8px 0; filter: drop-shadow(1px 1px 0px rgba(0,0,0,0.5));"></i>`;
                         recipeHtml += `<div style="width: 36px; height: 36px; background: #8b8b8b; border: 2px solid #373737; border-bottom-color: #fff; border-right-color: #fff; box-shadow: inset -1px -1px 0px #555, inset 1px 1px 0px #fff; display: flex; align-items: center; justify-content: center;" title="Combustible"><img loading="lazy" src="models/items/coal.png" style="width: 80%; height: 80%; image-rendering: pixelated; filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.3));" onerror="this.style.display='none';"></div>`;
                         recipeHtml += '</div>';
                    } else if (recipe.type === "stonecutter") {
                         recipeHtml += '<div style="display: flex; flex-direction: column; align-items: center; background: #c6c6c6; padding: 6px; border: 3px solid #373737; border-top-color: #fff; border-left-color: #fff; box-shadow: inset -2px -2px 0px #555, inset 2px 2px 0px #fff; border-radius: 4px;">';
                         recipeHtml += `<img loading="lazy" src="models/items/stonecutter.png" style="width: 24px; height: 24px; image-rendering: pixelated; filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.3)); margin-bottom: 8px;" title="Cortapiedras" onerror="this.style.display='none';">`;
                         const item = recipe.ingredients[0];
                         const itemPath = `models/items/${item.replace(/ /g, '_')}.png`;
                         recipeHtml += `<div style="width: 36px; height: 36px; background: #8b8b8b; border: 2px solid #373737; border-bottom-color: #fff; border-right-color: #fff; box-shadow: inset -1px -1px 0px #555, inset 1px 1px 0px #fff;" title="${item}"><img loading="lazy" src="${itemPath}" style="width: 100%; height: 100%; image-rendering: pixelated; filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.3));" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.webp');}else{this.style.display='none';}"></div>`;
                         recipeHtml += '</div>';
                    }
                    
                    if (recipeHtml !== '<h5 style="margin: 0 0 5px 0; color: #fff; font-size: 0.9rem; letter-spacing: 1px;">Receta</h5>' && !isMeasuring) {
                        recipeContainer.innerHTML = recipeHtml;
                        recipeContainer.classList.remove('hidden');
                    } else {
                        recipeContainer.classList.add('hidden');
                    }
                } else {
                    recipeContainer.classList.add('hidden');
                }
            }

            if (!isMeasuring) {
                blockInfoPanel.classList.remove('hidden');
            } else {
                blockInfoPanel.classList.add('hidden');
            }
            }
        }
    } else {
        if (hoveredMesh !== null || window.lastHoveredCoords !== null) {
            highlightBox.visible = false;
            hoveredMesh = null;
            window.lastHoveredCoords = null;
            blockInfoPanel.classList.add('hidden');
            const recipeContainer = document.getElementById('block-info-recipe');
            if (recipeContainer) recipeContainer.classList.add('hidden');
        }
    }
}

window.clearModel = function () {
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

        if (isFirstPerson && fpControls && fpControls.isLocked) {
            const time = performance.now();
            const delta = (time - prevTime) / 1000;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            velocity.y -= 9.8 * 20.0 * delta; // Gravity

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize(); // consistent movements in all directions

            const speed = 90.0;
            if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

            const playerPos = window.perspectiveCamera.position;
            canJump = false;

            // Floor collision for empty grid (y=0)
            if (playerPos.y <= 1.6) {
                velocity.y = Math.max(0, velocity.y);
                playerPos.y = 1.6;
                canJump = true;
            }

            if (moveUp && canJump) {
                velocity.y = 45.0;
            }

            fpControls.moveRight(-velocity.x * delta);
            fpControls.moveForward(-velocity.z * delta);
            window.perspectiveCamera.position.y += velocity.y * delta;

            prevTime = time;
        } else if (!isFirstPerson && window.controls) {
            window.controls.update();
        }

        window.renderer.render(window.scene, window.activeCamera);
    }
    animateFallback();
}

window.loadModel = function (path, objFile, mtlFile) {
    window.clearModel();

    // 2. Continuar con la carga normal 3D
    const cacheBuster = '?v=' + Date.now();
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(path);
    mtlLoader.setResourcePath('models/text/'); // Apunta a la carpeta general
    THREE.DefaultLoadingManager.setURLModifier((url) => {
        if (url.includes('.png') || url.includes('.jpg')) {
            // Mineways sometimes exports textures into subfolders (like 'uni/') inside the MTL file.
            // We force all textures to load directly from models/text/ to avoid 404s.
            let filename = url.substring(url.lastIndexOf('/') + 1);
            return 'models/text/' + filename + '?v=' + Date.now();
        }
        return url;
    });
    mtlLoader.load(mtlFile + cacheBuster, function (materials) {
        materials.preload();

        // Reset animated materials list for new models
        window.animatedMaterials = [];
        
        for (const materialName in materials.materials) {
            const mat = materials.materials[materialName];
            if (mat.map) {
                mat.map.magFilter = THREE.NearestFilter;
                mat.map.minFilter = THREE.NearestMipmapLinearFilter;
                
                // Fix para texturas animadas conocidas (portal, agua, lava, fuego)
                if (materialName === 'nether_portal' || materialName.includes('water') || materialName.includes('lava') || materialName.includes('fire')) {
                    const frames = 32;
                    mat.map.repeat.set(1, 1 / frames);
                    mat.map.offset.set(0, 1 - (1 / frames)); 
                    
                    window.animatedMaterials.push({
                        material: mat,
                        frames: frames,
                        currentFrame: 0,
                        timeElapsed: 0,
                        frameDuration: 0.05 // 20 FPS
                    });
                }
                
                mat.map.needsUpdate = true;
            }
            if (mat.alphaMap) {
                mat.alphaMap = null;
            }
            
            // Fix Mineways semi-transparency and washed out emissive issues
            mat.opacity = 1.0;
            if (materialName === 'nether_portal' || materialName.includes('glass')) {
                mat.transparent = true;
                mat.opacity = 0.8; 
                mat.depthWrite = false; // Fix para que no se vea cortado al rotar la cámara
            } else {
                mat.transparent = false;
                mat.depthWrite = true;
            }
            
            mat.alphaTest = 0.1; // Cutout for leaves, webs, etc
            mat.side = THREE.DoubleSide;
        }

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);

        fetch(path + objFile + cacheBuster)
            .then(response => {
                if (!response.ok) throw new Error("Error loading OBJ: " + response.status);
                return response.text();
            })
            .then(text => {
                // Parse Mineways # type: comments to map block IDs to true names
                const blockTypeMapping = {};
                let currentType = null;
                const lines = text.split('\n');
                for (let line of lines) {
                    if (line.startsWith('# type: ')) {
                        currentType = line.substring(8).trim();
                    } else if (line.startsWith('o ') || line.startsWith('g ')) {
                        const objName = line.substring(2).trim();
                        if (currentType && objName.startsWith('block_')) {
                            blockTypeMapping[objName] = currentType;
                        }
                    }
                }

                const object = objLoader.parse(text);

                // Asignar el nombre verdadero a cada pieza 3D
                const uniqueBlocks = new Map();

                object.traverse((child) => {
                    if (child.isMesh) {
                        let blockName = "";

                        let baseName = child.name;
                        let match = baseName.match(/(block_[0-9]+)/);
                        if (match) {
                            baseName = match[1];
                        }

                        if (blockTypeMapping[baseName]) {
                            blockName = blockTypeMapping[baseName];
                        }

                        if (!blockName && child.name) {
                            let cleanChildName = child.name.replace(/_/g, ' ').replace(/[0-9]/g, '').trim().toLowerCase();
                            if (window.blockTypeMap && window.blockTypeMap[cleanChildName]) {
                                blockName = window.blockTypeMap[cleanChildName];
                            } else {
                                // Fallback to translating the material name if no group name is found
                                let matName = child.material ? (Array.isArray(child.material) ? child.material[0].name : child.material.name) : undefined;
                                if (matName) {
                                    let cleanMatName = matName.replace(/_/g, ' ').replace(/[0-9]/g, '').trim().toLowerCase();
                                    if (window.blockTypeMap && window.blockTypeMap[cleanMatName]) {
                                        blockName = window.blockTypeMap[cleanMatName];
                                    }
                                }
                            }
                        }

                        let matNameRaw = child.material ? (Array.isArray(child.material) ? child.material[0].name : child.material.name) : "";
                        let isSlabOrStairs = blockName && (
                            blockName.toLowerCase().includes("slab") ||
                            blockName.toLowerCase().includes("stairs") ||
                            blockName.toLowerCase().includes("losa") ||
                            blockName.toLowerCase().includes("escalera")
                        );
                        if (matNameRaw && !isSlabOrStairs) {
                            if (matNameRaw.includes("quartz_pillar")) {
                                blockName = "quartz pillar";
                            } else if (matNameRaw.includes("chiseled_quartz_block")) {
                                blockName = "chiseled quartz block";
                            } else if (matNameRaw.includes("quartz_bricks")) {
                                blockName = "quartz bricks";
                            } else if (matNameRaw.includes("quartz_block_bottom")) {
                                blockName = "smooth quartz block";
                            } else if (matNameRaw.includes("quartz_block_side")) {
                                blockName = "quartz block";
                            }
                        }
                        let englishId = "";
                        if (blockName) {
                            englishId = blockName.toLowerCase().replace(/ /g, '_');
                            if (englishId === "smooth_quartz_block") englishId = "smooth_quartz";
                        } else if (matNameRaw) {
                            englishId = matNameRaw.replace(/_bottom$/, '').replace(/_top$/, '').replace(/_side$/, '').replace(/_[0-9]+$/, '');
                        }
                        child.userData.englishId = englishId;

                        child.castShadow = true;
                        child.receiveShadow = true;

                        const edgeGeo = new THREE.EdgesGeometry(child.geometry);
                        // Usar negro para el borde, con depthTest: false para que resalte por encima de la geometría
                        const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, depthTest: false });
                        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
                        edges.visible = window.is2DMode === true;
                        edges.userData.isBlueprintEdge = true;
                        child.add(edges);

                        // SAFE FIX: Apply to Quartz variants (English or Spanish names)
                        if (blockName.includes("Cuarzo") || blockName.toLowerCase().includes("quartz")) {
                            const texLoader = new THREE.TextureLoader();
                            function fixMap(mat) {
                                if (!mat || !mat.name) return mat;
                                let newMat = mat.clone();
                                let newTexPath = null;

                                // "top", "bottom" and normal mats come from Mineways base assignments
                                let isTop = newMat.name.includes("top");
                                let isBottom = newMat.name.includes("bottom");
                                let isSide = !isTop && !isBottom;

                                const lName = blockName.toLowerCase();
                                if (lName === "bloque de cuarzo liso" || lName === "cuarzo liso" || lName === "escaleras de cuarzo liso" || lName === "losa de cuarzo liso" || lName === "smooth quartz block" || lName === "smooth quartz" || lName === "smooth quartz stairs" || lName === "smooth quartz slab") {
                                    newTexPath = 'models/text/quartz_block_bottom.png?v=9';
                                } else if (lName === "bloque de cuarzo" || lName === "escaleras de cuarzo" || lName === "losa de cuarzo" || lName === "quartz block" || lName === "quartz stairs" || lName === "quartz slab" || lName === "quartz") {
                                    newTexPath = 'models/text/quartz_block_side.png?v=9';
                                } else if (lName === "ladrillos de cuarzo" || lName === "quartz bricks") {
                                    newTexPath = 'models/text/quartz_bricks.png?v=9';
                                } else if (lName === "pilar de cuarzo" || lName === "quartz pillar") {
                                    if (isTop || isBottom) {
                                        newTexPath = 'models/text/quartz_pillar_top.png?v=9';
                                    } else {
                                        newTexPath = 'models/text/quartz_pillar.png?v=9';
                                    }
                                } else if (lName === "bloque de cuarzo cincelado" || lName === "chiseled quartz block") {
                                    if (isTop || isBottom) {
                                        newTexPath = 'models/text/chiseled_quartz_block_top.png?v=9';
                                    } else {
                                        newTexPath = 'models/text/chiseled_quartz_block.png?v=9';
                                    }
                                }

                                if (newTexPath) {
                                    const tex = texLoader.load(newTexPath);
                                    tex.magFilter = THREE.NearestFilter;
                                    tex.minFilter = THREE.NearestMipmapLinearFilter;
                                    tex.colorSpace = THREE.SRGBColorSpace;
                                    newMat.map = tex;
                                    newMat.needsUpdate = true;
                                }
                                return newMat;
                            }

                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material = child.material.map(mat => fixMap(mat));
                                } else {
                                    child.material = fixMap(child.material);
                                }
                            }
                        }

                        let finalMatName = child.material ? (Array.isArray(child.material) ? child.material[0].name : child.material.name) : undefined;
                        let validChildName = (child.name && !child.name.toLowerCase().includes("mesh")) ? child.name : null;
                        const rawName = child.userData.trueMinecraftName || validChildName || finalMatName || "Bloque";
                        const cleanName = rawName.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
                        const translated = typeof translateBlockName === 'function' ? translateBlockName(cleanName) : cleanName;

                        if (!uniqueBlocks.has(translated)) {
                            let imageSrc = null;
                            let matForIcon = child.material;
                            if (Array.isArray(matForIcon) && matForIcon.length > 0) {
                                matForIcon = matForIcon.find(m => m.name && !m.name.includes("bottom")) || matForIcon[0];
                            }
                            let englishId = child.userData.englishId || "";
                            if (englishId && englishId !== "Bloque") {
                                imageSrc = `models/items/${englishId}.png`;
                            } else if (matForIcon && matForIcon.name) {
                                imageSrc = `models/items/${matForIcon.name}.png`;
                            }
                            uniqueBlocks.set(translated, { name: translated, imageSrc: imageSrc });
                        }
                    }
                });

                // Generar UI de toggles de bloques
                const togglesContainer = document.getElementById('block-toggles-container');
                if (togglesContainer) {
                    togglesContainer.innerHTML = '';
                    window.hiddenBlockTypes.clear(); // Reset on new model

                    const sortedBlocks = Array.from(uniqueBlocks.values()).sort((a, b) => a.name.localeCompare(b.name));

                    sortedBlocks.forEach(blockData => {
                        const blockName = blockData.name;
                        const wrapper = document.createElement('label');
                        wrapper.style.display = 'flex';
                        wrapper.style.alignItems = 'center';
                        wrapper.style.gap = '0.4rem';
                        wrapper.style.cursor = 'pointer';
                        wrapper.style.padding = '0.5rem';
                        wrapper.style.borderRadius = '0.5rem';
                        wrapper.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        wrapper.style.border = '1px solid var(--border-color)';
                        wrapper.style.transition = 'background-color 0.2s';
                        wrapper.onmouseover = () => wrapper.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        wrapper.onmouseout = () => wrapper.style.backgroundColor = 'rgba(255,255,255,0.05)';

                        let iconHtml = '<i class="fa-solid fa-cube" style="font-size: 24px; color: var(--text-secondary);"></i>';
                        if (blockData.imageSrc) {
                            iconHtml = `<img loading="lazy" src="${blockData.imageSrc}" style="width: 48px; height: 48px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" onerror="this.outerHTML='<i class=\\'fa-solid fa-cube\\' style=\\'font-size: 24px; color: var(--text-secondary);\\'></i>'">`;
                        }

                        wrapper.innerHTML = `
                                <input type="checkbox" checked style="width: 18px; height: 18px; accent-color: var(--accent-color);">
                                <div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px;">
                                    ${iconHtml}
                                </div>
                                <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-primary); flex: 1;">${blockName}</span>
                            `;

                        // Attach event listener since innerHTML destroys it
                        const newCheckbox = wrapper.querySelector('input');
                        newCheckbox.addEventListener('change', (e) => {
                            if (e.target.checked) {
                                window.hiddenBlockTypes.delete(blockName);
                                wrapper.style.opacity = '1';
                                wrapper.style.filter = 'none';
                            } else {
                                window.hiddenBlockTypes.add(blockName);
                                wrapper.style.opacity = '0.6';
                                wrapper.style.filter = 'grayscale(100%)';
                            }
                            window.sliceSlider.dispatchEvent(new Event('input'));
                        });

                        togglesContainer.appendChild(wrapper);
                    });
                }

                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());

                object.position.x += (object.position.x - center.x);
                object.position.y += (object.position.y - box.min.y);
                object.position.z += (object.position.z - center.z);

                // Populate and sort buildOrderedMeshes
                buildOrderedMeshes = [];
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.userData.box = new THREE.Box3().setFromObject(child);
                        buildOrderedMeshes.push(child);
                    }
                });
                buildOrderedMeshes.sort((a, b) => {
                    const yA = Math.round(a.userData.box.max.y * 10) / 10;
                    const yB = Math.round(b.userData.box.max.y * 10) / 10;
                    if (yA !== yB) return yA - yB;

                    const xA = Math.round(a.userData.box.min.x * 10) / 10;
                    const xB = Math.round(b.userData.box.min.x * 10) / 10;
                    if (xA !== xB) return xA - xB;

                    const zA = Math.round(a.userData.box.min.z * 10) / 10;
                    const zB = Math.round(b.userData.box.min.z * 10) / 10;
                    return zA - zB;
                });
                buildOrderedMeshes.forEach((child, idx) => child.userData.buildIndex = idx);
                buildCurrentIndex = buildOrderedMeshes.length;
                isBuilding = false;
                if (btnBuildPlay) btnBuildPlay.innerHTML = '<i class="fa-solid fa-hammer"></i>';
                const buildActiveControls = document.getElementById('build-active-controls');
                if (buildActiveControls) buildActiveControls.style.display = 'none';

                const size = new THREE.Vector3();
                box.getSize(size);
                window.currentModelHeight = Math.ceil(size.y);
                window.currentModelWidth = Math.ceil(size.x);
                window.currentModelDepth = Math.ceil(size.z);

                const maxH = window.currentModelHeight;
                const maxX = Math.ceil(window.currentModelWidth / 2) + 1;
                const minX = -Math.ceil(window.currentModelWidth / 2) - 1;
                const maxZ = Math.ceil(window.currentModelDepth / 2) + 1;
                const minZ = -Math.ceil(window.currentModelDepth / 2) - 1;

                window.sliceSliderYMin.min = 0; window.sliceSliderYMin.max = maxH; window.sliceSliderYMin.value = 0;
                window.sliceSliderYMax.min = 0; window.sliceSliderYMax.max = maxH; window.sliceSliderYMax.value = maxH;
                
                const layerIndicatorY = document.getElementById('layer-indicator-y');
                if (layerIndicatorY) {
                    layerIndicatorY.textContent = `Total: ${maxH}`;
                }

                window.sliceSliderXMin.min = minX; window.sliceSliderXMin.max = maxX; window.sliceSliderXMin.value = minX;
                window.sliceSliderXMax.min = minX; window.sliceSliderXMax.max = maxX; window.sliceSliderXMax.value = maxX;

                const layerIndicatorX = document.getElementById('layer-indicator-x');
                if (layerIndicatorX) {
                    layerIndicatorX.textContent = `Total: ${maxX - minX}`;
                }

                window.sliceSliderZMin.min = minZ; window.sliceSliderZMin.max = maxZ; window.sliceSliderZMin.value = minZ;
                window.sliceSliderZMax.min = minZ; window.sliceSliderZMax.max = maxZ; window.sliceSliderZMax.value = maxZ;

                const layerIndicatorZ = document.getElementById('layer-indicator-z');
                if (layerIndicatorZ) {
                    layerIndicatorZ.textContent = `Total: ${maxZ - minZ}`;
                }

                panSlider.value = 50;
                lastPanValue = 50;

                // Minimap Setup
                const mapSize = Math.max(window.currentModelWidth, window.currentModelDepth) + 20;
                minimapCamera = new THREE.OrthographicCamera(-mapSize / 2, mapSize / 2, mapSize / 2, -mapSize / 2, 0.1, 1000);
                minimapCamera.position.set(0, window.currentModelHeight + 50, 0);
                minimapCamera.lookAt(0, 0, 0);

                if (!minimapRenderer) {
                    minimapRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                    minimapRenderer.setSize(160, 160); // match CSS wrapper size
                    minimapRenderer.setClearColor(0x000000, 0);
                    if (minimapWrapper) {
                        minimapWrapper.appendChild(minimapRenderer.domElement);
                    }
                }

                if (minimapPlayerMarker) window.scene.remove(minimapPlayerMarker);
                const markerGeo = new THREE.ConeGeometry(1.5, 3, 8);
                markerGeo.rotateX(-Math.PI / 2); // Point forward (-Z)
                const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3333, depthTest: false });
                minimapPlayerMarker = new THREE.Mesh(markerGeo, markerMat);
                minimapPlayerMarker.layers.set(1); // Layer 1 only for minimap

                minimapCamera.layers.enable(0); // See model
                minimapCamera.layers.enable(1); // See marker

                window.perspectiveCamera.layers.disable(1);
                window.orthographicCamera.layers.disable(1);

                window.scene.add(minimapPlayerMarker);

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
                let max2DDim = Math.max(size.x, size.z);
                let vSize = max2DDim * 0.6;
                if (aspect < 1) vSize = vSize / aspect;
                window.orthographicCamera.left = -vSize * aspect;
                window.orthographicCamera.right = vSize * aspect;
                window.orthographicCamera.top = vSize;
                window.orthographicCamera.bottom = -vSize;
                window.orthographicCamera.position.set(0, maxDim * 2, 0);
                window.orthographicCamera.lookAt(0, 0, 0);
                window.orthographicCamera.updateProjectionMatrix();

                window.currentModelGroup = object;
                window.scene.add(object);

                // Populate the crafting inventory now that the model is loaded
                if (typeof generateInventory === 'function') {
                    generateInventory();
                }

                if (animationId) cancelAnimationFrame(animationId);

                function animate() {
                    animationId = requestAnimationFrame(animate);

                    let now = performance.now();
                    if (!window.lastAnimateTime) window.lastAnimateTime = now;
                    let globalDelta = (now - window.lastAnimateTime) / 1000;
                    window.lastAnimateTime = now;

                    if (UISkyboxManager && UISkyboxManager.update) {
                        UISkyboxManager.update(globalDelta);
                    }
                    
                    // Actualizar animaciones de texturas (portal, agua, etc)
                    if (window.animatedMaterials && window.animatedMaterials.length > 0) {
                        for (let i = 0; i < window.animatedMaterials.length; i++) {
                            const anim = window.animatedMaterials[i];
                            anim.timeElapsed += globalDelta;
                            if (anim.timeElapsed >= anim.frameDuration) {
                                anim.timeElapsed = 0;
                                anim.currentFrame = (anim.currentFrame + 1) % anim.frames;
                                // Three.js Y is bottom-to-top (0 to 1). Frame 0 is at the top.
                                const yOffset = 1 - ((anim.currentFrame + 1) / anim.frames);
                                anim.material.map.offset.set(0, yOffset);
                            }
                        }
                    }

                    if (isFirstPerson && fpControls && fpControls.isLocked) {
                        const time = performance.now();
                        const delta = (time - prevTime) / 1000;

                        velocity.x -= velocity.x * 10.0 * delta;
                        velocity.z -= velocity.z * 10.0 * delta;
                        velocity.y -= 9.8 * 20.0 * delta; // Gravity

                        direction.z = Number(moveForward) - Number(moveBackward);
                        direction.x = Number(moveRight) - Number(moveLeft);
                        direction.normalize(); // consistent movements in all directions

                        const speed = 90.0;
                        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
                        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

                        // Collision detection
                        if (window.currentModelGroup) {
                            const playerHeight = 1.6;
                            const playerPos = window.perspectiveCamera.position;

                            // Downward raycast (Floor)
                            physicsRaycaster.set(playerPos, new THREE.Vector3(0, -1, 0));
                            let intersects = physicsRaycaster.intersectObject(window.currentModelGroup, true);
                            const visibleIntersects = intersects.filter(i => i.object.visible && i.face && i.face.normal.y > 0.5);

                            canJump = false;
                            if (visibleIntersects.length > 0 && visibleIntersects[0].distance <= playerHeight + 0.1) {
                                if (velocity.y < 0) {
                                    velocity.y = 0; // Stop falling
                                    playerPos.y = visibleIntersects[0].point.y + playerHeight;
                                }
                                canJump = true;
                            }

                            // Horizontal raycasts (Walls)
                            const localDirs = [
                                { dir: new THREE.Vector3(0, 0, -1), var: 'z', check: (v) => v < 0 }, // Forward
                                { dir: new THREE.Vector3(0, 0, 1), var: 'z', check: (v) => v > 0 },  // Backward
                                { dir: new THREE.Vector3(1, 0, 0), var: 'x', check: (v) => v < 0 },  // Right
                                { dir: new THREE.Vector3(-1, 0, 0), var: 'x', check: (v) => v > 0 }  // Left
                            ];

                            localDirs.forEach(ld => {
                                if (ld.check(velocity[ld.var])) {
                                    let worldDir = ld.dir.clone().applyQuaternion(window.perspectiveCamera.quaternion);
                                    worldDir.y = 0;
                                    worldDir.normalize();

                                    // Check eye level
                                    physicsRaycaster.set(playerPos, worldDir);
                                    let hits = physicsRaycaster.intersectObject(window.currentModelGroup, true);
                                    let visHits = hits.filter(h => h.object.visible && h.face && Math.abs(h.face.normal.y) < 0.5);

                                    // Check foot level
                                    const footPos = playerPos.clone();
                                    footPos.y -= 1.4;
                                    physicsRaycaster.set(footPos, worldDir);
                                    let footHits = physicsRaycaster.intersectObject(window.currentModelGroup, true);
                                    let visFootHits = footHits.filter(h => h.object.visible && h.face && Math.abs(h.face.normal.y) < 0.5);

                                    if ((visHits.length > 0 && visHits[0].distance < 0.8) ||
                                        (visFootHits.length > 0 && visFootHits[0].distance < 0.8)) {
                                        velocity[ld.var] = 0;
                                    }
                                }
                            });
                        }

                        // Grid floor collision (y=0)
                        if (window.perspectiveCamera.position.y <= 1.6) {
                            velocity.y = Math.max(0, velocity.y);
                            window.perspectiveCamera.position.y = 1.6;
                            canJump = true;
                        }

                        if (moveUp && canJump) {
                            velocity.y = 45.0; // Jump force
                        }

                        fpControls.moveRight(-velocity.x * delta);
                        fpControls.moveForward(-velocity.z * delta);
                        window.perspectiveCamera.position.y += velocity.y * delta;

                        // Fall off world reset (backup)
                        if (window.perspectiveCamera.position.y < -50) {
                            window.perspectiveCamera.position.y = window.currentModelHeight ? window.currentModelHeight * 1.5 : 20;
                            velocity.y = 0;
                        }

                        // Update hovered block info based on center of screen
                        mouse.x = 0;
                        mouse.y = 0;
                        updateHoveredBlock();

                        prevTime = time;
                    } else if (!isFirstPerson && window.controls) {
                        window.controls.object = window.activeCamera;
                        window.controls.update();
                    }

                    if (isAutoRotating && !window.is2DMode && !isFirstPerson) {
                        object.rotation.y += 0.005;
                    } else if (window.is2DMode) {
                        object.rotation.y = 0;
                    }

                    // Animación de Vista Explosionada
                    if (window.currentModelGroup && window.currentModelGroup.children) {
                        for (let i = 0; i < window.currentModelGroup.children.length; i++) {
                            const child = window.currentModelGroup.children[i];
                            if (child.userData && child.userData.box) {
                                const layerY = Math.max(0, Math.round(child.userData.box.max.y * 10) / 10);
                                const center = child.userData.box.getCenter(new THREE.Vector3());
                                
                                let targetY = isExploded ? layerY * 0.5 : 0;
                                let targetX = isExploded ? center.x * 0.3 : 0;
                                let targetZ = isExploded ? center.z * 0.3 : 0;

                                // Cinematic floating logic para los cortes
                                let isCut = false;
                                if (!isBuilding && !isExploded && window.sliceSliderYMax && !window.is2DMode && !window.isGhostMode) {
                                    const sliceYMax = parseInt(window.sliceSliderYMax.value);
                                    const sliceYMin = parseInt(window.sliceSliderYMin.value);
                                    const sliceXMax = parseInt(window.sliceSliderXMax.value);
                                    const sliceXMin = parseInt(window.sliceSliderXMin.value);
                                    const sliceZMax = parseInt(window.sliceSliderZMax.value);
                                    const sliceZMin = parseInt(window.sliceSliderZMin.value);

                                    const maxH = parseInt(window.sliceSliderYMax.max);
                                    const maxW = parseInt(window.sliceSliderXMax.max);
                                    const maxD = parseInt(window.sliceSliderZMax.max);
                                    const minW = parseInt(window.sliceSliderXMin.min);
                                    const minD = parseInt(window.sliceSliderZMin.min);

                                    if (child.userData.box.min.y >= sliceYMax - 0.2 && sliceYMax < maxH) {
                                        targetY = 5; isCut = true;
                                    }
                                    if (child.userData.box.max.y <= sliceYMin + 0.2 && sliceYMin > 0) {
                                        targetY = -5; isCut = true;
                                    }
                                    
                                    if (child.userData.box.min.x >= sliceXMax - 0.2 && sliceXMax < maxW) {
                                        targetX = 5; isCut = true;
                                    }
                                    if (child.userData.box.max.x <= sliceXMin + 0.2 && sliceXMin > minW) {
                                        targetX = -5; isCut = true;
                                    }
                                    
                                    if (child.userData.box.min.z >= sliceZMax - 0.2 && sliceZMax < maxD) {
                                        targetZ = 5; isCut = true;
                                    }
                                    if (child.userData.box.max.z <= sliceZMin + 0.2 && sliceZMin > minD) {
                                        targetZ = -5; isCut = true;
                                    }
                                }

                                if (isExploded || (!isBuilding && !window.is2DMode && !window.isGhostMode)) {
                                    if (child.userData.isSliced && !child.visible && !isExploded) {
                                        // Si el bloque ya está oculto por un corte previo, teletransportarlo
                                        // instantáneamente a su nuevo destino para evitar que se vea volando
                                        child.position.y = targetY;
                                        child.position.x = targetX;
                                        child.position.z = targetZ;
                                    } else {
                                        child.position.y += (targetY - child.position.y) * 0.15;
                                        child.position.x += (targetX - child.position.x) * 0.15;
                                        child.position.z += (targetZ - child.position.z) * 0.15;
                                    }
                                    
                                    const distToTarget = Math.abs(targetY - child.position.y) + Math.abs(targetX - child.position.x) + Math.abs(targetZ - child.position.z);
                                    
                                    // Update visibility ONLY when exploded or when doing cinematic slices
                                    // If building, ghost, or 2D mode, we leave visibility alone!
                                    if (child.userData.isHiddenType) {
                                        child.visible = false;
                                    } else if (window.is2DMode) {
                                        // Forzar visibilidad en modo 2D cada frame para evitar bugs con isExploded
                                        const box = child.userData.box;
                                        if (box) {
                                            const sMinY = window.sliceSliderYMin ? parseInt(window.sliceSliderYMin.value) : 0;
                                            const sMaxY = window.sliceSliderYMax ? parseInt(window.sliceSliderYMax.value) : 100;
                                            const isAtLayerY = box.max.y <= sMaxY + 0.2 && box.max.y > sMaxY - 0.8 && box.min.y >= sMinY - 0.2;
                                            child.visible = isAtLayerY;
                                        }
                                    } else if (child.userData.buildIndex !== undefined && child.userData.buildIndex >= buildCurrentIndex) {
                                        child.visible = false;
                                    } else if (isExploded) {
                                        child.visible = !child.userData.isSliced;
                                    } else if (child.userData.isSliced) {
                                        if (isCut && distToTarget >= 0.2) {
                                            child.visible = true;
                                        } else {
                                            child.visible = false;
                                        }
                                    } else {
                                        child.visible = true;
                                    }
                                } else {
                                    child.position.set(0, 0, 0);
                                    // Do NOT force visibility here!
                                    // updateSlicing() and the build loop handle visibility for other modes.
                                }
                            }
                        }
                    }

                    if (isBuilding) {
                        const targetIndex = Math.min(Math.floor(buildCurrentIndex + buildSpeed), buildOrderedMeshes.length);
                        for (let i = Math.floor(buildCurrentIndex); i < targetIndex; i++) {
                            const child = buildOrderedMeshes[i];
                            const rawType = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque";
                            const cleanType = rawType.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
                            const translatedType = typeof translateBlockName === 'function' ? translateBlockName(cleanType) : cleanType;

                            if (!window.hiddenBlockTypes.has(translatedType)) {
                                child.visible = true;
                                if (window.BlockAudioManager) {
                                    window.BlockAudioManager.play(cleanType);
                                }
                            }
                        }
                        buildCurrentIndex += buildSpeed;

                        if (buildCurrentIndex >= 1 && buildCurrentIndex <= buildOrderedMeshes.length + buildSpeed) {
                            const lastBlockIndex = Math.min(Math.floor(buildCurrentIndex) - 1, buildOrderedMeshes.length - 1);
                            if (lastBlockIndex >= 0) {
                                const lastBlock = buildOrderedMeshes[lastBlockIndex];
                                const layerY = Math.ceil(lastBlock.userData.box.max.y);
                                window.sliceSlider.value = layerY;
                            }
                        }

                        if (buildCurrentIndex >= buildOrderedMeshes.length) {
                            isBuilding = false;
                            if (btnBuildPlay) btnBuildPlay.innerHTML = '<i class="fa-solid fa-hammer"></i>';
                            const buildActiveControls = document.getElementById('build-active-controls');
                            if (buildActiveControls) buildActiveControls.style.display = 'none';
                        }
                    }

                    window.renderer.render(window.scene, window.activeCamera);

                    // Render minimap si está activo
                    if (isMinimapActive && minimapCamera && minimapRenderer) {
                        let mapYLevel;

                        if (isFirstPerson && fpControls) {
                            const playerPos = window.perspectiveCamera.position;
                            if (minimapPlayerMarker) {
                                minimapPlayerMarker.position.set(playerPos.x, playerPos.y, playerPos.z);
                                const euler = new THREE.Euler().setFromQuaternion(window.activeCamera.quaternion, 'YXZ');
                                minimapPlayerMarker.rotation.y = euler.y;
                                minimapPlayerMarker.visible = true;
                            }
                            // Recorte dinámico al techo (plano de planta real)
                            mapYLevel = playerPos.y + 1.0;
                        } else {
                            if (minimapPlayerMarker) minimapPlayerMarker.visible = false;
                            mapYLevel = parseFloat(window.sliceSlider.value) + 1.0;
                        }

                        // Posicionar la cámara del minimapa para que mire hacia abajo desde mapYLevel
                        minimapCamera.position.set(0, mapYLevel, 0);
                        minimapCamera.lookAt(0, 0, 0);

                        // Configurar 'far' para que no renderice nada por encima de mapYLevel
                        minimapCamera.near = 0.1;
                        minimapCamera.far = mapYLevel + 10;
                        minimapCamera.updateProjectionMatrix();

                        minimapRenderer.render(window.scene, minimapCamera);
                    }
                }
                animate();
            })
            .catch(error => {
                console.error("Error Fetch OBJ:", error);
            });
    });
}
