window.start3DPreview = function(container, modelPath, objFile, mtlFile) {
    let animationId;
    let isStopped = false;
    
    // Create loading spinner
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'preview-loader';
    loaderDiv.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    container.appendChild(loaderDiv);

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d14); // Match the card background color

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    let loadedObject = null;

    // Load MTL and OBJ
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(modelPath);
    mtlLoader.setResourcePath('models/text/');
    mtlLoader.load(mtlFile, (materials) => {
        if (isStopped) return;
        materials.preload();
        
        // Ensure pixelated textures for Minecraft look
        for (const materialName in materials.materials) {
            const mat = materials.materials[materialName];
            if (mat.map) {
                mat.map.magFilter = THREE.NearestFilter;
                mat.map.minFilter = THREE.NearestFilter;
            }
        }
        
        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(modelPath);
        objLoader.load(objFile, (object) => {
            if (isStopped) return;
            
            loadedObject = object;
            
            // Center the object
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            object.position.x = -center.x;
            object.position.y = -center.y;
            object.position.z = -center.z;
            
            // Create a pivot group to rotate around center
            const pivot = new THREE.Group();
            pivot.add(object);
            scene.add(pivot);
            
            // Adjust camera position based on object size
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.5; // Zoom out a bit
            
            camera.position.z = cameraZ;
            camera.position.y = maxDim * 0.3; // Look slightly from above
            camera.lookAt(0, 0, 0);

            // Remove loader and show canvas
            if(loaderDiv.parentNode) {
                loaderDiv.parentNode.removeChild(loaderDiv);
            }
            container.appendChild(renderer.domElement);
            renderer.domElement.style.opacity = '0';
            
            // Fade in effect
            setTimeout(() => {
                if(!isStopped && renderer.domElement) {
                    renderer.domElement.style.transition = 'opacity 0.3s ease';
                    renderer.domElement.style.opacity = '1';
                }
            }, 50);

            // Animation loop
            const animate = function () {
                if (isStopped) return;
                animationId = requestAnimationFrame(animate);
                
                pivot.rotation.y += 0.01;
                renderer.render(scene, camera);
            };
            
            animate();
            
        }, undefined, (error) => {
            console.error('Error loading OBJ for preview:', error);
            if(loaderDiv.parentNode) loaderDiv.parentNode.removeChild(loaderDiv);
        });
    }, undefined, (error) => {
        console.error('Error loading MTL for preview:', error);
        if(loaderDiv.parentNode) loaderDiv.parentNode.removeChild(loaderDiv);
    });

    // Handle resize (though cards are mostly fixed size, good practice)
    const resizeObserver = new ResizeObserver(() => {
        if (!isStopped && container.clientWidth > 0 && container.clientHeight > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
    resizeObserver.observe(container);

    // Return an object with a stop method
    return {
        stop: function() {
            isStopped = true;
            resizeObserver.disconnect();
            
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            
            // Remove DOM elements
            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
            if (loaderDiv.parentNode) {
                loaderDiv.parentNode.removeChild(loaderDiv);
            }
            
            // Dispose Three.js resources to prevent memory leaks
            if (loadedObject) {
                loadedObject.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            }
            
            renderer.dispose();
        }
    };
};
