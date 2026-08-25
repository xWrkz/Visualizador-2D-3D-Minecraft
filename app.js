// Three.js and OrbitControls are loaded globally from index.html

document.addEventListener('DOMContentLoaded', () => {
    // Hardcoded Collections (simulating an API/Database)
    const collections = [
        { id: 1, name: "Mini-Construcciones", locked: false, tier: null },
        { id: 2, name: "Mini-Construcciones Alucinantes", locked: false, tier: null },
        { id: 3, name: "Mini-Construcciones Asombrosas", locked: false, tier: null },
        { id: 4, name: "Mini-Construcciones Increibles", locked: false, tier: null },
        { id: 5, name: "Mini-Construcciones Mágicas", locked: false, tier: null }
    ];

    // Build data structure (Mocking database/JSON)
    const specificBuilds = {
        1: [
            { id: 1, title: "Creeper del Bosque", modelPath: "models/MC/creeper/", objFile: "Creeper Del Bosque.obj", mtlFile: "Creeper_Del_Bosque.mtl", imagePath: "Portada de Construcciones/MC/MC1.png" }
        ],
        2: [
            { id: 1, title: "La Estatua de la Rana", modelPath: "models/MCAL/estatua-rana/", objFile: "La Estatura de la Rana.obj", mtlFile: "La_Estatura_de_la_Rana.mtl", imagePath: "Portada de Construcciones/MCAL/MCAL1.png" }
        ],
        5: [
            { id: 1, title: "Espejo Mágico", modelPath: "models/MCM/espejo-magico/", objFile: "Espejo Magico.obj", mtlFile: "Espejo_Magico.mtl", imagePath: "Portada de Construcciones/MCM/MCM1.png" }
        ]
    };

    // --- DOM Elements ---
    const viewCatalog = document.getElementById('view-catalog');
    const viewVisualizer = document.getElementById('view-visualizer');
    
    const catalogGrid = document.getElementById('catalog-grid');
    const collectionTabs = document.querySelectorAll('#collection-tabs .menu-btn');
    const currentCollectionTitle = document.getElementById('current-collection-title');
    
    const btnBackCatalog = document.getElementById('btn-back-catalog');
    const visualizerTitle = document.getElementById('visualizer-title');
    const btn3D = document.getElementById('btn-3d');
    const btn2D = document.getElementById('btn-2d');
    const canvas3D = document.getElementById('canvas-3d');
    const canvas2D = document.getElementById('canvas-2d');
    
    const modal = document.getElementById('patreon-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const premiumBtns = document.querySelectorAll('.premium-btn');
    const requiredTierName = document.getElementById('required-tier-name');

    const currentUserTier = 2; // Simulated User Tier (2: Maestro)

    // --- Catalog Logic ---
    function generateCards(collectionId, collectionName) {
        catalogGrid.innerHTML = ''; 
        
        // Add Hero Image Card
        const banners = {
            1: "Portadas/MC.jpg",
            2: "Portadas/MCAL.jpeg",
            3: "Portadas/MCA.webp",
            4: "Portadas/MCI.jpeg",
            5: "Portadas/MCM.png"
        };
        
        if(banners[collectionId]) {
            const heroCard = document.createElement('div');
            heroCard.className = 'collection-hero-card';
            heroCard.innerHTML = `<img src="${banners[collectionId]}" alt="${collectionName}">`;
            catalogGrid.appendChild(heroCard);
        }

        const buildsData = specificBuilds[collectionId] || [];

        for (let i = 1; i <= 24; i++) {
            const specificData = buildsData.find(b => b.id === i);
            const buildTitle = specificData ? specificData.title : `Construcción #${i}`;
            const buildImage = specificData && specificData.imagePath ? `<img src="${specificData.imagePath}" alt="${buildTitle}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-cube"></i>`;
            
            const card = document.createElement('div');
            card.className = 'build-card';
            card.innerHTML = `
                <div class="card-image">
                    ${buildImage}
                </div>
                <div class="card-info">
                    <h4>${buildTitle}</h4>
                    <p>${collectionName}</p>
                </div>
            `;
            
            card.addEventListener('click', () => {
                openVisualizer({
                    title: buildTitle,
                    collection: collectionName,
                    data: specificData
                });
            });
            
            catalogGrid.appendChild(card);
        }
    }

    generateCards(collections[0].id, collections[0].name);

    collectionTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            collectionTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const collectionId = parseInt(tab.getAttribute('data-collection'));
            const collection = collections.find(c => c.id === collectionId);
            if(collection) {
                currentCollectionTitle.textContent = collection.name;
                generateCards(collectionId, collection.name);
            }
        });
    });

    // --- View Navigation Logic ---
    function openVisualizer(build) {
        visualizerTitle.textContent = build.title;
        viewCatalog.classList.remove('active');
        viewVisualizer.classList.add('active');
        
        window.dispatchEvent(new Event('resize'));

        if (build.data && build.data.modelPath) {
            loadModel(build.data.modelPath, build.data.objFile, build.data.mtlFile);
        } else {
            clearModel();
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
    
    // --- Three.js 3D Visualizer Setup ---
    let scene, renderer, controls;
    let perspectiveCamera, orthographicCamera, activeCamera;
    let mainAmbientLight, mainDirectionalLight;
    
    function switchTo3DMode() {
        btn3D.classList.add('active');
        btn2D.classList.remove('active');
        canvas3D.classList.add('active');
        canvas2D.classList.remove('active');
        canvas3D.classList.remove('blueprint-mode');
        
        if (controls) {
            controls.enableRotate = true;
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = Math.PI;
            if (activeCamera === orthographicCamera && perspectiveCamera) {
                perspectiveCamera.position.copy(lastPerspectivePosition);
            }
            activeCamera = perspectiveCamera;
            is2DMode = false;
            
            if(mainAmbientLight) mainAmbientLight.intensity = 0.6;
            if(mainDirectionalLight) mainDirectionalLight.intensity = 0.8;
            
            document.getElementById('pan-container').style.display = 'flex';
            document.getElementById('visualizer-controls').style.display = 'flex';
            
            // Re-evaluate visibility for 3D
            document.getElementById('slice-slider').dispatchEvent(new Event('input'));
        }
    }

    function switchTo2DMode() {
        btn2D.classList.add('active');
        btn3D.classList.remove('active');
        canvas2D.classList.add('active');
        // We keep canvas3D active as well underneath so we can see the sliced model
        canvas3D.classList.add('active'); 
        
        if (controls) {
            // Save perspective position
            lastPerspectivePosition.copy(perspectiveCamera.position);
            
            // Switch to orthographic camera pointing straight down
            activeCamera = orthographicCamera;
            is2DMode = true;
            canvas3D.classList.add('blueprint-mode');
            
            if(mainAmbientLight) mainAmbientLight.intensity = 2.0; // Flat lighting
            if(mainDirectionalLight) mainDirectionalLight.intensity = 0.0;
            
            // Lock rotation, only allow pan/zoom
            controls.enableRotate = false;
            
            // Update orthographic position to look top-down at center
            // Make sure camera is strictly top-down and high enough
            orthographicCamera.position.set(0, currentModelHeight * 2, 0);
            orthographicCamera.lookAt(0, 0, 0);
            
            document.getElementById('pan-container').style.display = 'none';
            document.getElementById('visualizer-controls').style.display = 'none';
            
            // Trigger slider update to immediately slice the model
            document.getElementById('slice-slider').dispatchEvent(new Event('input'));
        }
    }

    // --- Patreon Modal Logic ---
    premiumBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const requiredTier = parseInt(btn.getAttribute('data-tier'));
            if (currentUserTier < requiredTier) {
                if (requiredTier === 3) requiredTierName.textContent = 'Arquitecto ($9/mes)';
                modal.classList.add('active');
            } else {
                alert('Descargando archivo...');
            }
        });
    });

    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

    // --- Additional Three.js State Variables ---
    let currentModelGroup = null;
    let animationId = null;
    let isAutoRotating = true;
    let is2DMode = false;
    let lastPerspectivePosition = new THREE.Vector3();
    let currentModelHeight = 10;
    
    // Raycaster and Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh = null;
    let highlightBox = null;
    
    // UI Elements for Block Info
    const blockInfoPanel = document.getElementById('block-info-panel');
    const blockNameEl = document.getElementById('block-name');
    const blockCoordsEl = document.getElementById('block-coords');
    
    // Vertical Pan Slider for 3D Camera
    const panSlider = document.getElementById('pan-slider');
    let lastPanValue = 50;

    // Vertical Slice Slider for Layers
    const sliceSlider = document.getElementById('slice-slider');

    // Controls
    const btnTogglePlay = document.getElementById('btn-toggle-play');
    const btnRotateLeft = document.getElementById('btn-rotate-left');
    const btnRotateRight = document.getElementById('btn-rotate-right');

    btnTogglePlay.addEventListener('click', () => {
        isAutoRotating = !isAutoRotating;
        btnTogglePlay.innerHTML = isAutoRotating ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    });
    btnRotateLeft.addEventListener('click', () => { if (currentModelGroup) currentModelGroup.rotation.y -= 0.2; });
    btnRotateRight.addEventListener('click', () => { if (currentModelGroup) currentModelGroup.rotation.y += 0.2; });

    // Camera Panning
    panSlider.addEventListener('input', () => {
        if (is2DMode) return; // Disabled in 2D
        
        const diff = panSlider.value - lastPanValue;
        const offsetPercentage = diff / 50; 
        const maxPanRange = currentModelHeight; // Allow panning up/down by full model height
        
        const yOffset = offsetPercentage * maxPanRange;
        
        controls.target.y += yOffset;
        perspectiveCamera.position.y += yOffset;
        
        lastPanValue = panSlider.value;
    });

    // Layer Slicing (Visibility toggling instead of Clipping Planes)
    sliceSlider.addEventListener('input', () => {
        if (!currentModelGroup) return;
        
        const layer = parseInt(sliceSlider.value);
        
        // Update camera position in 2D to follow the layer, or stay high enough
        if (is2DMode) {
            orthographicCamera.position.y = currentModelHeight * 2;
        }

        // Toggle visibility of individual blocks based on their World Y position
        currentModelGroup.traverse((child) => {
            if (child.isMesh) {
                // Get the world bounding box of this specific block
                const box = new THREE.Box3().setFromObject(child);
                // box.max.y is the top of the block in world coordinates.
                // Since our model base is at Y=0, layer 1 has max Y=1, layer 2 has max Y=2, etc.
                
                if (is2DMode) {
                    // Show ONLY the blocks belonging to this exact layer
                    // We use an epsilon of 0.2 to account for floating point inaccuracies
                    child.visible = (box.max.y <= layer + 0.2 && box.max.y > layer - 0.8);
                } else {
                    // Show all blocks UP TO this layer
                    child.visible = (box.max.y <= layer + 0.2);
                }
            }
        });
    });

    init3D();

    function init3D() {
        const container = document.getElementById('canvas-3d');
        
        scene = new THREE.Scene();
        
        // Perspective Camera (3D)
        perspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        perspectiveCamera.position.set(10, 10, 10);
        perspectiveCamera.lookAt(0, 0, 0);

        // Orthographic Camera (2D Top Down)
        const aspect = container.clientWidth / container.clientHeight;
        const viewSize = 10; // Will be updated on load
        orthographicCamera = new THREE.OrthographicCamera(
            -viewSize * aspect, viewSize * aspect,
            viewSize, -viewSize,
            0.1, 1000
        );
        orthographicCamera.position.set(0, 20, 0);
        orthographicCamera.lookAt(0, 0, 0);

        activeCamera = perspectiveCamera;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        
        // Highlight Box for Selection
        highlightBox = new THREE.BoxHelper(undefined, 0x6366f1);
        highlightBox.material.depthTest = false;
        highlightBox.material.transparent = true;
        highlightBox.material.opacity = 0.9;
        highlightBox.visible = false;
        scene.add(highlightBox);
        
        // Mouse Move Event for Raycasting
        container.addEventListener('mousemove', onMouseMove);

        // Controls configuration
        controls = new THREE.OrbitControls(activeCamera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true; // Allows scrolling to pan vertically/horizontally
        controls.maxDistance = 500;

        mainAmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(mainAmbientLight);
        
        mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainDirectionalLight.position.set(10, 20, 10);
        scene.add(mainDirectionalLight);

        const gridHelper = new THREE.GridHelper(50, 50, 0x6366f1, 0x444444);
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        function resizeCanvas() {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                const aspect = container.clientWidth / container.clientHeight;
                
                // Update Perspective
                perspectiveCamera.aspect = aspect;
                perspectiveCamera.updateProjectionMatrix();

                // Update Orthographic
                const vSize = currentModelHeight > 0 ? currentModelHeight * 0.8 : 10;
                orthographicCamera.left = -vSize * aspect;
                orthographicCamera.right = vSize * aspect;
                orthographicCamera.top = vSize;
                orthographicCamera.bottom = -vSize;
                orthographicCamera.updateProjectionMatrix();

                renderer.setSize(container.clientWidth, container.clientHeight);
            }
        }

        window.addEventListener('resize', resizeCanvas);
        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(container);
    }

    function onMouseMove(event) {
        if (!currentModelGroup) return;

        const container = document.getElementById('canvas-3d');
        const rect = container.getBoundingClientRect();
        
        // Normalize mouse coordinates
        mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, activeCamera);

        // Find intersections
        const intersects = raycaster.intersectObject(currentModelGroup, true);

        if (intersects.length > 0) {
            // Find the first valid intersected object (ignore non-meshes)
            let object = null;
            for(let i=0; i<intersects.length; i++) {
                // Ensure we only select meshes that are currently visible
                if(intersects[i].object.type === 'Mesh' && intersects[i].object.visible) {
                    object = intersects[i].object;
                    break;
                }
            }
            
            if (object && hoveredMesh !== object) {
                hoveredMesh = object;
                
                // Show Highlight Box
                highlightBox.setFromObject(hoveredMesh);
                highlightBox.visible = true;

                // Extract Block Name (Mineways materials use block names)
                const rawName = hoveredMesh.material.name || hoveredMesh.name || "Bloque";
                const cleanName = rawName.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
                
                // Update Icon Texture
                const iconContainer = document.getElementById('block-icon-container');
                if (hoveredMesh.material.map && hoveredMesh.material.map.image) {
                    iconContainer.innerHTML = `<img src="${hoveredMesh.material.map.image.src}" style="width: 32px; height: 32px; image-rendering: pixelated; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">`;
                } else {
                    iconContainer.innerHTML = '<i class="fa-solid fa-cube"></i>';
                }
                // 1. Get intersection point in WORLD space
                const point = intersects[0].point;
                // 2. Add a small offset based on the face normal to get the block center reliably
                const faceNormal = intersects[0].face.normal;
                const blockCenterX = point.x - (faceNormal.x * 0.1);
                const blockCenterY = point.y - (faceNormal.y * 0.1);
                const blockCenterZ = point.z - (faceNormal.z * 0.1);
                
                const px = Math.floor(blockCenterX);
                const py = Math.floor(blockCenterY);
                const pz = Math.floor(blockCenterZ);
                
                // 3. Position the highlight box in WORLD space
                highlightBox.position.set(px + 0.5, py + 0.5, pz + 0.5);
                
                // 4. Attach to the global scene so it remains static (as requested)
                if (highlightBox.parent !== scene) {
                    scene.add(highlightBox);
                }
                highlightBox.visible = true;
                
                blockNameEl.textContent = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "Bloque";
                blockCoordsEl.textContent = `X: ${px}  Y: ${py}  Z: ${pz}`;
                
                blockInfoPanel.classList.remove('hidden');
            }
        } else {
            // Hide if not hovering over a visible mesh
            highlightBox.visible = false;
            hoveredMesh = null;
            blockInfoPanel.classList.add('hidden');
        }
    }

    function clearModel() {
        // Hide the selection box when loading a new model
        highlightBox.visible = false;
        
        if (currentModelGroup) {
            scene.remove(currentModelGroup);
            currentModelGroup = null;
        }
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        function animateFallback() {
            animationId = requestAnimationFrame(animateFallback);
            
            // Switch controls target to active camera
            controls.object = activeCamera;
            controls.update();
            renderer.render(scene, activeCamera);
        }
        animateFallback();
    }

    function loadModel(path, objFile, mtlFile) {
        clearModel(); 
        
        const mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath(path);
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
                
                // 1. Center the object and place base on Y=0
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                
                object.position.x += (object.position.x - center.x);
                object.position.y += (object.position.y - box.min.y);
                object.position.z += (object.position.z - center.z);
                
                // Calculate height in blocks
                const size = new THREE.Vector3();
                box.getSize(size);
                currentModelHeight = Math.ceil(size.y);
                
                // Configure slice slider for discrete layers (1 layer = 1 block height)
                sliceSlider.min = 1;
                sliceSlider.max = currentModelHeight;
                sliceSlider.step = 1;
                sliceSlider.value = currentModelHeight;
                
                // Reset slider position and tracking
                panSlider.value = 50;
                lastPanValue = 50;
                
                // Trigger visibility update
                sliceSlider.dispatchEvent(new Event('input'));
                
                // 2. Auto-fit camera based on model size
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = perspectiveCamera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraZ *= 1.5; // Zoom out a little bit
                
                perspectiveCamera.position.set(cameraZ, maxDim, cameraZ);
                perspectiveCamera.lookAt(0, maxDim / 2, 0);
                controls.target.set(0, maxDim / 2, 0); // Rotate around center of model
                
                // Update Orthographic camera scale based on model size
                const container = document.getElementById('canvas-3d');
                const aspect = container.clientWidth / container.clientHeight;
                const vSize = maxDim * 0.6;
                orthographicCamera.left = -vSize * aspect;
                orthographicCamera.right = vSize * aspect;
                orthographicCamera.top = vSize;
                orthographicCamera.bottom = -vSize;
                orthographicCamera.position.set(0, maxDim * 2, 0);
                orthographicCamera.lookAt(0, 0, 0);
                orthographicCamera.updateProjectionMatrix();

                currentModelGroup = object;
                scene.add(object);
                
                if (animationId) cancelAnimationFrame(animationId);

                function animate() {
                    animationId = requestAnimationFrame(animate);
                    controls.object = activeCamera;
                    controls.update();
                    
                    if (isAutoRotating && !is2DMode) {
                        object.rotation.y += 0.005;
                    } else if (is2DMode) {
                        // Reset rotation in 2D mode so it's perfectly top-down
                        object.rotation.y = 0;
                    }
                    
                    renderer.render(scene, activeCamera);
                }
                animate();
            });
        });
    }
});
