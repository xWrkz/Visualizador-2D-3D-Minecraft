// --- Helper para texturas numéricas ---
function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'Bold 40px Arial';
    ctx.fillStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(text, 32, 32);
    ctx.fillText(text, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);
    return sprite;
}
// --- Helper Functions for PDF Generation ---
const loadImageAsync = (src) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
};

function getImageDataUrl(imageObj) {
    if (!imageObj) return null;
    try {
        if (typeof imageObj === 'string' && imageObj.startsWith('data:image')) {
            return imageObj;
        }
        if (typeof imageObj.src === 'string' && imageObj.src.startsWith('data:image')) {
            return imageObj.src;
        }
        const canvas = document.createElement('canvas');
        canvas.width = imageObj.width || 16;
        canvas.height = imageObj.height || 16;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    } catch (e) {
        return null; 
    }
}

const loadFontAsync = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const buffer = await response.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (e) {
        console.error("Error loading font:", e);
        return null;
    }
};

// --- PDF Generation Logic (2D) ---
async function generatePDF() {
    if (!window.currentModelGroup || window.currentModelHeight <= 0) return;
    
    if (!window.jspdf) {
        console.error("jsPDF no está cargado aún.");
        return;
    }

    if (!window.is2DMode) window.switchTo2DMode();
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const logoImg = await loadImageAsync('Portadas/LOGOMC.png');
    const logoDataUrl = logoImg ? getImageDataUrl(logoImg) : null;
    const fontTitleBase64 = await loadFontAsync('fonts/Minercraftory.ttf');
    const fontBodyBase64 = await loadFontAsync("fonts/mac_s_minecraft/macs_minecraft.ttf");

    if (fontTitleBase64) {
        pdf.addFileToVFS('Minercraftory.ttf', fontTitleBase64);
        pdf.addFont('Minercraftory.ttf', 'Minercraftory', 'normal');
    }
    if (fontBodyBase64) {
        pdf.addFileToVFS('MacMinecraft.ttf', fontBodyBase64);
        pdf.addFont('MacMinecraft.ttf', 'MacMinecraft', 'normal');
    }

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    
    const visualizerTitle = document.getElementById('visualizer-title');
    const title = visualizerTitle ? visualizerTitle.textContent : "Construccion";
    
    const canvasEl = window.renderer.domElement;
    const originalWidth = canvasEl.clientWidth;
    const originalHeight = canvasEl.clientHeight;
    
    // === 1. GENERAR PORTADA (COVER PAGE) ===
    const originalCamPos = window.perspectiveCamera.position.clone();
    const originalCamTarget = window.controls ? window.controls.target.clone() : new THREE.Vector3();
    const maxDim = Math.max(window.currentModelWidth, window.currentModelDepth, window.currentModelHeight);
    const radius = maxDim * 0.85 + 1;
    const camHeight = window.currentModelHeight * 0.6 + 1;

    const originalRotationY = window.currentModelGroup.rotation.y;
    window.currentModelGroup.rotation.y = 0;

    window.perspectiveCamera.position.set(radius * Math.cos(3 * Math.PI / 4), camHeight, radius * Math.sin(3 * Math.PI / 4));
    window.perspectiveCamera.lookAt(0, window.currentModelHeight / 2, 0);
    window.perspectiveCamera.updateProjectionMatrix();

    // Force all blocks to be visible for the cover
    window.currentModelGroup.traverse(child => {
        if (child.isMesh) {
            const rawType = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque";
            const cleanType = rawType.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
            const translatedType = typeof translateBlockName === 'function' ? translateBlockName(cleanType) : cleanType;
            if (window.hiddenBlockTypes && window.hiddenBlockTypes.has(translatedType)) {
                child.visible = false;
            } else {
                child.visible = true;
            }
        }
    });

    const oldClearColor = new THREE.Color();
    window.renderer.getClearColor(oldClearColor);
    window.renderer.setClearColor(0x28282b, 1);
    
    const coverRenderW = 1200;
    const coverRenderH = 800;
    window.renderer.setSize(coverRenderW, coverRenderH, false);
    window.perspectiveCamera.aspect = coverRenderW / coverRenderH;
    window.perspectiveCamera.updateProjectionMatrix();

    window.renderer.render(window.scene, window.perspectiveCamera);
    const coverImgData = window.renderer.domElement.toDataURL('image/jpeg', 0.9);

    window.renderer.setClearColor(oldClearColor, 1);

    window.perspectiveCamera.position.copy(originalCamPos);
    if(window.controls) window.controls.target.copy(originalCamTarget);
    window.perspectiveCamera.aspect = originalWidth / originalHeight;
    window.perspectiveCamera.updateProjectionMatrix();

    pdf.setFillColor(40, 40, 43);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.setFillColor(168, 85, 247);
    pdf.rect(0, 0, pageWidth, 5, 'F');
    pdf.rect(0, pageHeight - 5, pageWidth, 5, 'F');

    if (fontTitleBase64) pdf.setFont('Minercraftory', 'normal');
    pdf.setFontSize(26);
    pdf.setTextColor(255, 255, 255);
    pdf.text("GUIA DE CONSTRUCCION", pageWidth / 2, 35, { align: 'center' });

    if (logoDataUrl) pdf.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 15, 45, 30, 30);

    if (fontBodyBase64) pdf.setFont('MacMinecraft', 'normal');
    pdf.setFontSize(20);
    pdf.setTextColor(200, 200, 200);
    pdf.text(title, pageWidth / 2, 90, { align: 'center' });

    const coverImgW = 140;
    const coverImgH = 140 / (coverRenderW / coverRenderH);
    pdf.setDrawColor(80, 80, 85);
    pdf.setLineWidth(1);
    pdf.rect(pageWidth / 2 - coverImgW / 2, 105, coverImgW, coverImgH);
    pdf.addImage(coverImgData, 'JPEG', pageWidth / 2 - coverImgW / 2, 105, coverImgW, coverImgH);

    const bd = window.currentBuildData && window.currentBuildData.data ? window.currentBuildData.data : {};
    let currentY = 105 + coverImgH + 20;
    
    pdf.setFontSize(14);
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Dificultad: Nivel ${bd.difficulty || 1}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    pdf.text(`Tiempo Estimado: ${bd.time || 'N/A'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    pdf.text(`Dimensiones exactas: ${window.currentModelWidth} ancho x ${window.currentModelHeight} alto x ${window.currentModelDepth} prof.`, pageWidth / 2, currentY, { align: 'center' });

    // === 2. GENERAR CAPAS 2D ===
    pdf.addPage();
    let isFirstPage = true; 
    const originalLayer = parseInt(window.sliceSlider.value);
    
    if (window.mainGridHelper) window.mainGridHelper.visible = false;

    const marginBlocks = 2.5;
    const camWidth = window.currentModelWidth + marginBlocks * 2;
    const camDepth = window.currentModelDepth + marginBlocks * 2;
    
    const pixelsPerBlock = 120;
    const targetWidth = Math.round(camWidth * pixelsPerBlock);
    const targetHeight = Math.round(camDepth * pixelsPerBlock);

    window.renderer.setSize(targetWidth, targetHeight, false);
    
    const origLeft = window.orthographicCamera.left;
    const origRight = window.orthographicCamera.right;
    const origTop = window.orthographicCamera.top;
    const origBottom = window.orthographicCamera.bottom;
    
    window.orthographicCamera.left = -camWidth / 2;
    window.orthographicCamera.right = camWidth / 2;
    window.orthographicCamera.top = camDepth / 2;
    window.orthographicCamera.bottom = -camDepth / 2;
    window.orthographicCamera.updateProjectionMatrix();

    const coordGroup = new THREE.Group();
    const startX = -(window.currentModelWidth / 2);
    const startZ = -(window.currentModelDepth / 2);
    
    const customGrid = new THREE.GridHelper(100, 100, 0xffffff, 0xffffff);
    customGrid.material.opacity = 0.25;
    customGrid.material.transparent = true;
    customGrid.position.x = (window.currentModelWidth % 2 === 0) ? 0 : 0.5;
    customGrid.position.z = (window.currentModelDepth % 2 === 0) ? 0 : 0.5;
    coordGroup.add(customGrid);
    
    const axisZ = window.currentModelDepth / 2 + 0.5;
    for (let i = 0; i <= window.currentModelWidth; i++) {
        const sprite = createTextSprite(i.toString());
        sprite.position.set(startX + i, 0, axisZ);
        coordGroup.add(sprite);
    }
    
    const axisX = -(window.currentModelWidth / 2) - 0.5;
    for (let j = 0; j <= window.currentModelDepth; j++) {
        const sprite = createTextSprite(j.toString());
        sprite.position.set(axisX, 0, window.currentModelDepth / 2 - j);
        coordGroup.add(sprite);
    }
    
    coordGroup.position.y = 0.5;
    window.scene.add(coordGroup);
    
    const headerOffset = 55;
    // Reservar 55mm a la derecha para la lista de materiales, para que no tape la imagen
    const rightPanelWidth = 55;
    const imgMaxWidth = pageWidth - (margin * 2) - rightPanelWidth;
    const usableHeight = pageHeight - headerOffset - margin - 10;
    const imgMaxHeight = (usableHeight / 2) - 15; // 15mm de padding entre capas

    for (let i = 1; i <= window.currentModelHeight; i++) {
        const isOdd = i % 2 !== 0;
        
        if (!isFirstPage && isOdd) {
            pdf.addPage();
        }
        
        if (isOdd) {
            pdf.setFillColor(40, 40, 43);
            pdf.rect(0, 0, pageWidth, 45, 'F');
            pdf.setFillColor(168, 85, 247);
            pdf.rect(0, 45, pageWidth, 2, 'F');
            
            if (logoDataUrl) {
                pdf.addImage(logoDataUrl, 'PNG', 15, 7, 30, 30);
            }
            
            if (fontTitleBase64) pdf.setFont('Minercraftory', 'normal');
            pdf.setFontSize(20);
            pdf.setTextColor(255, 255, 255);
            pdf.text("Guia 2D por Capas", pageWidth / 2, 22, { align: 'center' });
            
            if (fontBodyBase64) pdf.setFont('MacMinecraft', 'normal');
            pdf.setFontSize(12);
            pdf.setTextColor(200, 200, 200);
            pdf.text(title, pageWidth / 2, 32, { align: 'center' });
        }

        window.sliceSlider.value = i;
        window.sliceSlider.dispatchEvent(new Event('input'));

        await new Promise(r => requestAnimationFrame(r));
        
        window.renderer.getClearColor(oldClearColor);
        window.renderer.setClearColor(0x28282b, 1);
        
        window.renderer.render(window.scene, window.orthographicCamera);
        const imgData = window.renderer.domElement.toDataURL('image/jpeg', 0.9);
        
        window.renderer.setClearColor(oldClearColor, 1);
        
        const aspect = targetWidth / targetHeight;
        let drawWidth = imgMaxWidth;
        let drawHeight = drawWidth / aspect;

        if (drawHeight > imgMaxHeight) {
            drawHeight = imgMaxHeight;
            drawWidth = drawHeight * aspect;
        }

        // Centrar en el area restante izquierda
        const xOffset = margin + (imgMaxWidth - drawWidth) / 2;
        const yOffset = isOdd ? headerOffset + 10 : headerOffset + (usableHeight / 2) + 15;

        const layerMaterials = {};
        let layerTotal = 0;
        window.currentModelGroup.traverse((child) => {
            if (child.isMesh) {
                const box = new THREE.Box3().setFromObject(child);
                const isAtLayer = box.max.y <= i + 0.2 && box.max.y > i - 0.8;
                if (isAtLayer) {
                    const rawName = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque";
                    const cleanName = rawName.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
                    let translatedName = typeof translateBlockName === 'function' ? translateBlockName(cleanName) : cleanName;
                    
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    if (size.y < 0.2) translatedName += " (Alfombra)";
                    else if (size.y > 0.3 && size.y < 0.6) translatedName += " (Losa)";
                    
                    if(!layerMaterials[translatedName]) layerMaterials[translatedName] = 0;
                    layerMaterials[translatedName]++;
                    layerTotal++;
                }
            }
        });

        if (fontTitleBase64) pdf.setFont('Minercraftory', 'normal');
        pdf.setFontSize(14);
        pdf.setTextColor(0);
        pdf.text(`Capa ${i}`, pageWidth / 2, yOffset - 3, { align: 'center' });
        
        pdf.setDrawColor(80, 80, 85);
        pdf.setLineWidth(0.5);
        pdf.rect(xOffset, yOffset, drawWidth, drawHeight);
        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, drawWidth, drawHeight);

        if (fontTitleBase64) pdf.setFont('Minercraftory', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(220, 220, 220);
        pdf.text("N", xOffset + drawWidth / 2, yOffset + 4, { align: 'center' });
        pdf.text("S", xOffset + drawWidth / 2, yOffset + drawHeight - 2, { align: 'center' });
        pdf.text("O", xOffset + 4, yOffset + drawHeight / 2, { align: 'left' });
        pdf.text("E", xOffset + drawWidth - 4, yOffset + drawHeight / 2, { align: 'right' });

        if (layerTotal > 0) {
            const matKeys = Object.keys(layerMaterials).sort((a,b) => layerMaterials[b] - layerMaterials[a]);
            const boxW = rightPanelWidth;
            const rowH = 4;
            const boxH = 8 + (matKeys.length * rowH);
            // Colocar la caja fuera de la imagen a la derecha
            const boxX = xOffset + drawWidth + 5;
            const boxY = yOffset;

            pdf.setFillColor(245, 245, 245);
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.2);
            pdf.rect(boxX, boxY, boxW, boxH, 'FD');

            if (fontBodyBase64) pdf.setFont('MacMinecraft', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(0, 0, 0);
            pdf.text("Materiales", boxX + 2, boxY + 5);

            pdf.setFontSize(7);
            let textY = boxY + 10;
            matKeys.forEach(mat => {
                const count = layerMaterials[mat];
                // Truncar un poco mas si es muy largo
                const matText = mat.length > 22 ? mat.substring(0, 22) + "..." : mat;
                pdf.text(matText, boxX + 2, textY);
                pdf.text(`x${count}`, boxX + boxW - 2, textY, { align: 'right' });
                textY += rowH;
            });
        }

        if (fontBodyBase64) pdf.setFont('MacMinecraft', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text("© Wrkz - wrkzvisualizador.netlify.app", pageWidth - margin, pageHeight - margin, { align: 'right' });

        isFirstPage = false;
    }

    window.scene.remove(coordGroup);
    coordGroup.traverse((child) => {
        if (child.isSprite) {
            child.material.map.dispose();
            child.material.dispose();
        }
    });
    
    if (window.mainGridHelper) window.mainGridHelper.visible = true;
    
    window.renderer.setSize(originalWidth, originalHeight);
    window.orthographicCamera.left = origLeft;
    window.orthographicCamera.right = origRight;
    window.orthographicCamera.top = origTop;
    window.orthographicCamera.bottom = origBottom;
    window.orthographicCamera.updateProjectionMatrix();
    
    window.currentModelGroup.rotation.y = originalRotationY;
    
    window.sliceSlider.value = originalLayer;
    window.sliceSlider.dispatchEvent(new Event('input'));

    const saveTitle = title.replace(/\s+/g, '_');
    pdf.save(`Guia_2D_${saveTitle}.pdf`);
}

// --- PDF Generation Logic (3D) ---
async function generate3DPDF() {
    if (!window.currentModelGroup || window.currentModelHeight <= 0) return;
    
    if (!window.jspdf) {
        console.error("jsPDF no está cargado aún.");
        return;
    }

    if (window.is2DMode) {
        window.switchTo3DMode();
        await new Promise(r => setTimeout(r, 150));
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Cargar logo y fuentes
    const logoImg = await loadImageAsync('Portadas/LOGOMC.png');
    const logoDataUrl = logoImg ? getImageDataUrl(logoImg) : null;
    const fontTitleBase64 = await loadFontAsync('fonts/Minercraftory.ttf');
    const fontBodyBase64 = await loadFontAsync("fonts/mac_s_minecraft/macs_minecraft.ttf");

    if (fontTitleBase64) {
        pdf.addFileToVFS('Minercraftory.ttf', fontTitleBase64);
        pdf.addFont('Minercraftory.ttf', 'Minercraftory', 'normal');
    }
    if (fontBodyBase64) {
        pdf.addFileToVFS('MacMinecraft.ttf', fontBodyBase64);
        pdf.addFont('MacMinecraft.ttf', 'MacMinecraft', 'normal');
    }

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    
    const visualizerTitle = document.getElementById('visualizer-title');
    const title = visualizerTitle.textContent;
    
    const originalLayer = parseInt(window.sliceSlider.value);
    
    const canvasEl = window.renderer.domElement;
    const originalWidth = canvasEl.clientWidth;
    const originalHeight = canvasEl.clientHeight;
    
    const originalCamPos = window.perspectiveCamera.position.clone();
    const wasControlsEnabled = window.controls.enabled;
    window.controls.enabled = false;
    
    // === 1. GENERAR PORTADA (COVER PAGE) ===
    const maxDim = Math.max(window.currentModelWidth, window.currentModelDepth, window.currentModelHeight);
    const radius = maxDim * 0.85 + 1; 
    const camHeight = window.currentModelHeight * 0.6 + 1; 

    const originalRotationY = window.currentModelGroup.rotation.y;
    window.currentModelGroup.rotation.y = 0;

    window.perspectiveCamera.position.set(radius * Math.cos(3 * Math.PI / 4), camHeight, radius * Math.sin(3 * Math.PI / 4));
    window.perspectiveCamera.lookAt(0, window.currentModelHeight / 2, 0);
    window.perspectiveCamera.updateProjectionMatrix();

    // Force all blocks to be visible for the cover
    window.currentModelGroup.traverse(child => {
        if (child.isMesh) {
            const rawType = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque";
            const cleanType = rawType.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
            const translatedType = typeof translateBlockName === 'function' ? translateBlockName(cleanType) : cleanType;
            if (window.hiddenBlockTypes && window.hiddenBlockTypes.has(translatedType)) {
                child.visible = false;
            } else {
                child.visible = true;
            }
        }
    });

    const oldClearColor = new THREE.Color();
    window.renderer.getClearColor(oldClearColor);
    window.renderer.setClearColor(0x28282b, 1);
    
    const coverRenderW = 1200;
    const coverRenderH = 800;
    window.renderer.setSize(coverRenderW, coverRenderH, false);
    window.perspectiveCamera.aspect = coverRenderW / coverRenderH;
    window.perspectiveCamera.updateProjectionMatrix();

    window.renderer.render(window.scene, window.perspectiveCamera);
    const coverImgData = window.renderer.domElement.toDataURL('image/jpeg', 0.9);

    window.renderer.setClearColor(oldClearColor, 1);

    // Dibujar Portada
    pdf.setFillColor(40, 40, 43);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.setFillColor(168, 85, 247);
    pdf.rect(0, 0, pageWidth, 5, 'F');
    pdf.rect(0, pageHeight - 5, pageWidth, 5, 'F');

    if (fontTitleBase64) pdf.setFont('Minercraftory', 'normal');
    pdf.setFontSize(26);
    pdf.setTextColor(255, 255, 255);
    pdf.text("GUIA DE CONSTRUCCION 3D", pageWidth / 2, 35, { align: 'center' });

    if (logoDataUrl) pdf.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 15, 45, 30, 30);

    if (fontBodyBase64) pdf.setFont('MacMinecraft', 'normal');
    pdf.setFontSize(20);
    pdf.setTextColor(200, 200, 200);
    pdf.text(title, pageWidth / 2, 90, { align: 'center' });

    const coverImgW = 140;
    const coverImgH = 140 / (coverRenderW / coverRenderH);
    pdf.setDrawColor(80, 80, 85);
    pdf.setLineWidth(1);
    pdf.rect(pageWidth / 2 - coverImgW / 2, 105, coverImgW, coverImgH);
    pdf.addImage(coverImgData, 'JPEG', pageWidth / 2 - coverImgW / 2, 105, coverImgW, coverImgH);

    const bd = window.currentBuildData && window.currentBuildData.data ? window.currentBuildData.data : {};
    let currentY = 105 + coverImgH + 20;
    
    pdf.setFontSize(14);
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Dificultad: Nivel ${bd.difficulty || 1}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    pdf.text(`Tiempo Estimado: ${bd.time || 'N/A'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    pdf.text(`Dimensiones exactas: ${window.currentModelWidth} ancho x ${window.currentModelHeight} alto x ${window.currentModelDepth} prof.`, pageWidth / 2, currentY, { align: 'center' });


    // === 2. GENERAR CAPAS 3D ===
    pdf.addPage();
    
    window.renderer.setSize(originalWidth * 2, originalHeight * 2, false);
    
    const anglesData = [
        { a: (3 * Math.PI) / 4, title: "Vista Frontal-Izquierda" },
        { a: Math.PI / 4,       title: "Vista Frontal-Derecha" },
        { a: (5 * Math.PI) / 4, title: "Vista Trasera-Izquierda" },
        { a: (7 * Math.PI) / 4, title: "Vista Trasera-Derecha" }
    ];

    for (let i = 1; i <= window.currentModelHeight; i++) {
        if (i > 1) pdf.addPage();
        
        // Header
        pdf.setFillColor(40, 40, 43); // Dark header background
        pdf.rect(0, 0, pageWidth, 45, 'F');
        
        // Accent line
        pdf.setFillColor(168, 85, 247); // Morado brillante
        pdf.rect(0, 45, pageWidth, 2, 'F');
        
        if (logoDataUrl) {
            pdf.addImage(logoDataUrl, 'PNG', 15, 7, 30, 30);
            try {
                pdf.saveGraphicsState();
                pdf.setGState(new jsPDF.GState({opacity: 0.05}));
                const wmSize = 120;
                pdf.addImage(logoDataUrl, 'PNG', (pageWidth - wmSize) / 2, (pageHeight - wmSize) / 2, wmSize, wmSize);
                pdf.restoreGraphicsState();
            } catch(e) {}
        }
        
        if (fontTitleBase64) pdf.setFont('Minercraftory', 'normal');
        pdf.setFontSize(20);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`Progreso hasta Capa ${i}`, pageWidth / 2, 22, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setTextColor(200, 200, 200);
        pdf.text(title, pageWidth / 2, 32, { align: 'center' });
        
        window.sliceSlider.value = i;
        window.sliceSlider.dispatchEvent(new Event('input'));
        
        await new Promise(r => requestAnimationFrame(r));
        
        const gridMargin = 10;
        const availableWidth = pageWidth - (margin * 2);
        const headerOffset = 55;
        const availableHeight = pageHeight - headerOffset - margin - 15; 
        
        const cellWidth = (availableWidth - gridMargin) / 2;
        const cellHeight = (availableHeight - gridMargin) / 2 - 8; 
        
        const cellAspect = cellWidth / cellHeight;
        const renderW = 1200;
        const renderH = Math.round(1200 / cellAspect);
        window.renderer.setSize(renderW, renderH, false);
        window.perspectiveCamera.aspect = cellAspect;
        
        for (let a = 0; a < 4; a++) {
            const angleData = anglesData[a];
            const angle = angleData.a;
            
            window.perspectiveCamera.position.set(
                radius * Math.cos(angle),
                camHeight,
                radius * Math.sin(angle)
            );
            window.perspectiveCamera.lookAt(0, window.currentModelHeight / 2, 0);
            window.perspectiveCamera.updateProjectionMatrix();
            
            // Fondo oscuro elegante para la captura
            const oldClearColor = new THREE.Color();
            window.renderer.getClearColor(oldClearColor);
            window.renderer.setClearColor(0x28282b, 1);
            
            window.renderer.render(window.scene, window.perspectiveCamera);
            const imgData = window.renderer.domElement.toDataURL('image/jpeg', 0.9);
            
            // Restaurar fondo
            window.renderer.setClearColor(oldClearColor, 1);
            
            const col = a % 2;
            const row = Math.floor(a / 2);
            
            const cellX = margin + col * (cellWidth + gridMargin);
            const cellY = headerOffset + 5 + row * (cellHeight + gridMargin + 8);
            
            if (fontBodyBase64) pdf.setFont('MacMinecraft', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(angleData.title, cellX + cellWidth / 2, cellY - 3, { align: 'center' });
            
            // Dibujar borde sutil alrededor de la imagen
            pdf.setDrawColor(80, 80, 85);
            pdf.setLineWidth(0.5);
            pdf.rect(cellX, cellY, cellWidth, cellHeight);
            pdf.addImage(imgData, 'JPEG', cellX, cellY, cellWidth, cellHeight);
        }
        
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text("© Wrkz - wrkzvisualizador.netlify.app", pageWidth - margin, pageHeight - margin, { align: 'right' });
    }
    
    window.renderer.setSize(originalWidth, originalHeight, false);
    window.perspectiveCamera.aspect = originalWidth / originalHeight;
    window.perspectiveCamera.position.copy(originalCamPos);
    window.perspectiveCamera.lookAt(0, 0, 0);
    window.perspectiveCamera.updateProjectionMatrix();
    window.controls.enabled = wasControlsEnabled;
    window.currentModelGroup.rotation.y = originalRotationY;
    
    window.sliceSlider.value = originalLayer;
    window.sliceSlider.dispatchEvent(new Event('input'));
    
    const saveTitle = title.replace(/\s+/g, '_');
    pdf.save(`Guia_3D_${saveTitle}.pdf`);
}

// --- PDF Generation Logic (Inventory) ---
async function generateInventoryPDF() {
    if (!window.currentModelGroup) return;
    
    if (!window.jspdf) {
        console.error("jsPDF no está cargado aún.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    
    const inventory = {};
    let totalBlocks = 0;
    
    window.currentModelGroup.traverse((child) => {
        if (child.isMesh) {
            const rawName = child.userData.trueMinecraftName || child.material.name || child.name || "Bloque Desconocido";
            const cleanName = rawName.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();
            let translatedName = typeof translateBlockName === 'function' ? translateBlockName(cleanName) : cleanName;
            
            // Detectar alfombras y losas por su altura
            const bbox = new THREE.Box3().setFromObject(child);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            
            if (size.y < 0.2) {
                translatedName += " (Alfombra)";
            } else if (size.y > 0.3 && size.y < 0.6) {
                translatedName += " (Losa)";
            }
            
            if (!inventory[translatedName]) {
                inventory[translatedName] = {
                    count: 0,
                    imgObj: (child.material.map && child.material.map.image) ? child.material.map.image : null,
                    rawName: cleanName.replace(/ /g, '_'),
                    meshRef: child
                };
            }
            inventory[translatedName].count++;
            totalBlocks++;
        }
    });
    
    const items = Object.keys(inventory).map(name => {
        return { name: name, count: inventory[name].count, imgObj: inventory[name].imgObj, rawName: inventory[name].rawName, meshRef: inventory[name].meshRef };
    });
    items.sort((a, b) => b.count - a.count);
    
    // Helper para renderizar un bloque en 3D isométrico (modo item)
    const getIsometricMeshDataUrl = (originalMesh) => {
        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 128;
            tempCanvas.height = 128;
            const tempRenderer = new THREE.WebGLRenderer({ canvas: tempCanvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
            tempRenderer.setClearColor(0x000000, 0);

            const tempScene = new THREE.Scene();
            const aspect = 1;
            const d = 0.8;
            const tempCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
            
            tempCamera.position.set(2, 2, 2);
            tempCamera.lookAt(0, 0, 0);

            const tempMesh = originalMesh.clone();
            // Centrar la malla
            const box = new THREE.Box3().setFromObject(tempMesh);
            const center = box.getCenter(new THREE.Vector3());
            tempMesh.position.sub(center);
            
            tempScene.add(tempMesh);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            tempScene.add(ambientLight);
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
            dirLight.position.set(5, 5, 2);
            tempScene.add(dirLight);

            tempRenderer.render(tempScene, tempCamera);
            const dataUrl = tempCanvas.toDataURL('image/png');
            
            tempRenderer.dispose();
            return dataUrl;
        } catch (e) {
            console.error("Error renderizando item 3D:", e);
            return null;
        }
    };

    // Intentar cargar los sprites de item, o renderizar en 3D
    for (const item of items) {
        if (item.rawName) {
            const itemImg = await loadImageAsync(`models/item/${item.rawName}.png`);
            if (itemImg) {
                item.imgObj = itemImg; // Usar sprite de la carpeta item
                item.isIsometric = false;
            } else if (item.meshRef) {
                // Fallback: Renderizar en 3D isométrico si es un bloque sin sprite
                const isometricDataUrl = getIsometricMeshDataUrl(item.meshRef);
                if (isometricDataUrl) {
                    item.imgObj = isometricDataUrl;
                    item.isIsometric = true;
                }
            }
        }
    }
    
    // Cargar logo
    const logoImg = await loadImageAsync('Portadas/LOGOMC.png');
    const logoDataUrl = logoImg ? getImageDataUrl(logoImg) : null;

    // Cargar las fuentes TTF
    const fontTitleBase64 = await loadFontAsync('fonts/Minercraftory.ttf');
    const fontBodyBase64 = await loadFontAsync("fonts/mac_s_minecraft/macs_minecraft.ttf");

    if (fontTitleBase64) {
        pdf.addFileToVFS('Minercraftory.ttf', fontTitleBase64);
        pdf.addFont('Minercraftory.ttf', 'Minercraftory', 'normal');
    }
    if (fontBodyBase64) {
        pdf.addFileToVFS('MacMinecraft.ttf', fontBodyBase64);
        pdf.addFont('MacMinecraft.ttf', 'MacMinecraft', 'normal');
    }

    let y = 0;
    const visualizerTitle = document.getElementById('visualizer-title');
    const title = visualizerTitle.textContent;
    
    // Header
    pdf.setFillColor(40, 40, 43); // Dark header background
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Accent line (Línea decorativa brillante)
    pdf.setFillColor(168, 85, 247); // Morado brillante
    pdf.rect(0, 45, pageWidth, 2, 'F');
    
    if (logoDataUrl) {
        pdf.addImage(logoDataUrl, 'PNG', 15, 7, 30, 30);
    }
    
    if (fontTitleBase64) pdf.setFont('Minercraftory', 'normal');
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Lista de Materiales", pageWidth / 2, 22, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(200, 200, 200);
    pdf.text(title, pageWidth / 2, 32, { align: 'center' });
    
    y = 62;
    
    if (fontBodyBase64) pdf.setFont('MacMinecraft', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Total de bloques: ${totalBlocks}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    let isEven = false;
    items.forEach((item) => {
        if (y > pageHeight - margin - 20) {
            pdf.addPage();
            y = margin + 10;
        }
        
        // Row background
        if (isEven) {
            pdf.setFillColor(248, 248, 250);
            pdf.rect(margin - 5, y - 8, pageWidth - (margin - 5) * 2, 12, 'F');
        }
        isEven = !isEven;
        
        if (item.imgObj) {
            try {
                const dataUrl = getImageDataUrl(item.imgObj);
                if (dataUrl) {
                    pdf.addImage(dataUrl, 'PNG', margin, y - 6, 8, 8);
                } else {
                    pdf.text("•", margin + 2, y - 1);
                }
            } catch (e) {
                console.error("Error al agregar imagen:", e);
                pdf.text("•", margin + 2, y - 1);
            }
        } else {
            pdf.text("•", margin + 2, y - 1);
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.text(item.name, margin + 12, y);
        
        // Stacks calculation
        let countText = `${item.count} ud.`;
        if (item.count >= 64) {
            const stacks = Math.floor(item.count / 64);
            const remainder = item.count % 64;
            countText = `${item.count} ud. (${stacks} Stacks` + (remainder > 0 ? ` + ${remainder}` : '') + `)`;
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(80, 80, 80);
        // Print text aligned to the right margin
        pdf.text(countText, pageWidth - margin, y, { align: 'right' });
        
        y += 12;
    });
    
    const pageCount = (typeof pdf.getNumberOfPages === 'function') ? pdf.getNumberOfPages() : pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Marca de agua
        if (logoDataUrl) {
            try {
                pdf.saveGraphicsState();
                pdf.setGState(new jsPDF.GState({opacity: 0.05}));
                const wmSize = 120;
                pdf.addImage(logoDataUrl, 'PNG', (pageWidth - wmSize) / 2, (pageHeight - wmSize) / 2, wmSize, wmSize);
                pdf.restoreGraphicsState();
            } catch (e) {
                console.warn("No se pudo añadir la marca de agua", e);
            }
        }
        
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text("© Wrkz - wrkzvisualizador.netlify.app", pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
    
    const saveTitle = title.replace(/\s+/g, '_');
    pdf.save(`Materiales_${saveTitle}.pdf`);
}

// --- Keydown Events ---
document.addEventListener('keydown', (e) => {
    const viewVisualizer = document.getElementById('view-visualizer');
    if (!viewVisualizer.classList.contains('active')) return;
    
    if (e.key.toLowerCase() === 'p') {
        console.log("Generando Guía PDF 2D...");
        generatePDF();
    }
    
    if (e.key.toLowerCase() === 'o') {
        console.log("Generando Guía PDF 3D...");
        generate3DPDF();
    }

    if (e.key.toLowerCase() === 'i') {
        console.log("Generando PDF de Materiales...");
        try {
            generateInventoryPDF();
        } catch (error) {
            console.error("Error crítico al generar PDF de inventario:", error);
        }
    }
});
