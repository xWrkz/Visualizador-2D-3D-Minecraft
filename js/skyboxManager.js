class SkyboxManager {
    constructor() {
        this.sphereMesh = null;
        this.currentSky = 'none';
        this.starsMesh = null;
    }

    init(scene) {
        this.scene = scene;
        
        // Sphere for background
        const geo = new THREE.SphereGeometry(800, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ 
            side: THREE.BackSide,
            color: 0x111111 // Default dark background
        });
        this.sphereMesh = new THREE.Mesh(geo, mat);
        this.sphereMesh.visible = false;
        this.scene.add(this.sphereMesh);
        
        // Bind selector
        const select = document.getElementById('skybox-select');
        if (select) {
            select.addEventListener('change', (e) => {
                this.setSkybox(e.target.value);
                if (window.UIAudioManager) window.UIAudioManager.playClick();
            });
        }
    }

    setSkybox(type) {
        this.currentSky = type;
        
        if (this.starsMesh) {
            this.starsMesh.visible = false;
        }

        if (type === 'none') {
            this.sphereMesh.visible = false;
            this.scene.background = null;
            return;
        }

        this.sphereMesh.visible = true;
        this.scene.background = null;

        let canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        let ctx = canvas.getContext('2d');
        let gradient = ctx.createLinearGradient(0, 0, 0, 1024);

        if (type === 'day') {
            gradient.addColorStop(0, '#4fa0ff');
            gradient.addColorStop(0.5, '#82c0ff');
            gradient.addColorStop(1, '#e0f0ff');
        } else if (type === 'sunset') {
            gradient.addColorStop(0, '#2b1a4a');
            gradient.addColorStop(0.4, '#873d61');
            gradient.addColorStop(0.7, '#d96c4a');
            gradient.addColorStop(1, '#ffb854');
        } else if (type === 'night') {
            gradient.addColorStop(0, '#020111');
            gradient.addColorStop(0.5, '#0a0a2a');
            gradient.addColorStop(1, '#1a1a3a');
            
            // Draw stars dynamically
            if (!this.starsMesh) {
                this.createStars();
            }
            this.starsMesh.visible = true;
        } else if (type === 'end') {
            // End dimension: dark purple noise
            ctx.fillStyle = '#1e0f2b';
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let i = 0; i < 5000; i++) {
                let x = Math.random() * 1024;
                let y = Math.random() * 1024;
                ctx.fillRect(x, y, 2, 2);
            }
        }

        if (type !== 'end') {
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1024, 1024);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        
        if (this.sphereMesh.material.map) {
            this.sphereMesh.material.map.dispose();
        }
        
        this.sphereMesh.material.map = texture;
        this.sphereMesh.material.color.setHex(0xffffff); // reset base color
        this.sphereMesh.material.needsUpdate = true;
    }

    createStars() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const posArray = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 1500;
        }
        
        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.8
        });
        
        this.starsMesh = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starsMesh);
    }

    update(delta) {
        if (this.currentSky === 'none') return;

        // Slow rotation (e.g. 1 full rotation every 300 seconds)
        const rotationSpeed = (Math.PI * 2) / 300; 
        
        if (this.sphereMesh && this.sphereMesh.visible) {
            this.sphereMesh.rotation.y += rotationSpeed * delta;
        }
        if (this.starsMesh && this.starsMesh.visible) {
            this.starsMesh.rotation.y += rotationSpeed * delta;
        }
    }
}

window.UISkyboxManager = new SkyboxManager();
