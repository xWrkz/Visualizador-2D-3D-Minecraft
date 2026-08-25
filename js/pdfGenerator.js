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

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    
    const imgMaxWidth = pageWidth - (margin * 2);
    const imgMaxHeight = (pageHeight / 2) - (margin * 2);
    
    let isFirstPage = true;
    const originalLayer = parseInt(window.sliceSlider.value);
    
    if (window.mainGridHelper) window.mainGridHelper.visible = false;

    const marginBlocks = 1.2; 
    const camWidth = window.currentModelWidth + marginBlocks * 2;
    const camDepth = window.currentModelDepth + marginBlocks * 2;
    
    const pixelsPerBlock = 120;
    const targetWidth = Math.round(camWidth * pixelsPerBlock);
    const targetHeight = Math.round(camDepth * pixelsPerBlock);

    const canvasEl = window.renderer.domElement;
    const originalWidth = canvasEl.clientWidth;
    const originalHeight = canvasEl.clientHeight;
    
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
    
    for (let i = 1; i <= window.currentModelHeight; i++) {
        window.sliceSlider.value = i;
        window.sliceSlider.dispatchEvent(new Event('input'));

        await new Promise(r => requestAnimationFrame(r));
        window.renderer.render(window.scene, window.orthographicCamera);

        const imgData = window.renderer.domElement.toDataURL('image/jpeg', 1.0);
        const aspect = canvasEl.width / canvasEl.height;

        let drawWidth = imgMaxWidth;
        let drawHeight = drawWidth / aspect;

        if (drawHeight > imgMaxHeight) {
            drawHeight = imgMaxHeight;
            drawWidth = drawHeight * aspect;
        }

        const xOffset = margin + (imgMaxWidth - drawWidth) / 2;
        const isOdd = i % 2 !== 0;
        const yOffset = isOdd ? margin + 5 : (pageHeight / 2) + margin + 5;

        if (!isFirstPage && isOdd) {
            pdf.addPage();
        }

        pdf.setFontSize(16);
        pdf.setTextColor(0);
        pdf.text(`Capa ${i}`, pageWidth / 2, yOffset - 5, { align: 'center' });
        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, drawWidth, drawHeight);

        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text("© Wrkz - wrkzvisualizador.netlify.app", pageWidth - margin, yOffset + drawHeight + 5, { align: 'right' });

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
    
    window.sliceSlider.value = originalLayer;
    window.sliceSlider.dispatchEvent(new Event('input'));

    const visualizerTitle = document.getElementById('visualizer-title');
    const title = visualizerTitle.textContent.replace(/\s+/g, '_');
    pdf.save(`Guia_2D_${title}.pdf`);
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

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    
    const originalLayer = parseInt(window.sliceSlider.value);
    
    const canvasEl = window.renderer.domElement;
    const originalWidth = canvasEl.clientWidth;
    const originalHeight = canvasEl.clientHeight;
    
    const originalCamPos = window.perspectiveCamera.position.clone();
    const wasControlsEnabled = window.controls.enabled;
    window.controls.enabled = false;
    
    window.renderer.setSize(originalWidth * 2, originalHeight * 2, false);
    
    const maxDim = Math.max(window.currentModelWidth, window.currentModelDepth, window.currentModelHeight);
    const radius = maxDim * 1.2 + 2; 
    const camHeight = window.currentModelHeight * 0.8 + 2; 
    
    const anglesData = [
        { a: (3 * Math.PI) / 4, title: "Vista Frontal-Izquierda" },
        { a: Math.PI / 4,       title: "Vista Frontal-Derecha" },
        { a: (5 * Math.PI) / 4, title: "Vista Trasera-Izquierda" },
        { a: (7 * Math.PI) / 4, title: "Vista Trasera-Derecha" }
    ];

    for (let i = 1; i <= window.currentModelHeight; i++) {
        if (i > 1) pdf.addPage();
        
        pdf.setFontSize(16);
        pdf.setTextColor(0);
        pdf.text(`Progreso hasta Capa ${i}`, pageWidth / 2, margin + 5, { align: 'center' });
        
        window.sliceSlider.value = i;
        window.sliceSlider.dispatchEvent(new Event('input'));
        
        await new Promise(r => requestAnimationFrame(r));
        
        const gridMargin = 10;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2) - 20; 
        
        const cellWidth = (availableWidth - gridMargin) / 2;
        const cellHeight = (availableHeight - gridMargin) / 2 - 10; 
        
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
            
            window.renderer.render(window.scene, window.perspectiveCamera);
            const imgData = window.renderer.domElement.toDataURL('image/jpeg', 1.0);
            
            const col = a % 2;
            const row = Math.floor(a / 2);
            
            const cellX = margin + col * (cellWidth + gridMargin);
            const cellY = margin + 20 + row * (cellHeight + gridMargin + 10);
            
            pdf.setFontSize(10);
            pdf.setTextColor(50);
            pdf.text(angleData.title, cellX + cellWidth / 2, cellY - 2, { align: 'center' });
            
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
    
    window.sliceSlider.value = originalLayer;
    window.sliceSlider.dispatchEvent(new Event('input'));
    
    const visualizerTitle = document.getElementById('visualizer-title');
    const title = visualizerTitle.textContent.replace(/\s+/g, '_');
    pdf.save(`Guia_3D_${title}.pdf`);
}

// --- PDF Generation Logic (Inventory) ---
function generateInventoryPDF() {
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
                    imgObj: (child.material.map && child.material.map.image) ? child.material.map.image : null
                };
            }
            inventory[translatedName].count++;
            totalBlocks++;
        }
    });
    
    const items = Object.keys(inventory).map(name => {
        return { name: name, count: inventory[name].count, imgObj: inventory[name].imgObj };
    });
    items.sort((a, b) => b.count - a.count);
    
    function getImageDataUrl(imageObj) {
        if (!imageObj) return null;
        try {
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
    
    let y = margin;
    const visualizerTitle = document.getElementById('visualizer-title');
    const title = visualizerTitle.textContent;
    
    pdf.setFontSize(22);
    pdf.setTextColor(0);
    pdf.text("Lista de Materiales", pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    pdf.setFontSize(14);
    pdf.setTextColor(100);
    pdf.text(title, pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    pdf.setFontSize(12);
    pdf.setTextColor(150);
    pdf.text(`Total de bloques: ${totalBlocks}`, pageWidth / 2, y, { align: 'center' });
    y += 20;
    
    pdf.setFontSize(14);
    pdf.setTextColor(0);
    
    items.forEach((item) => {
        if (y > pageHeight - margin - 20) {
            pdf.addPage();
            y = margin + 10;
            pdf.setFontSize(14);
            pdf.setTextColor(0);
        }
        
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
        
        pdf.text(item.name, margin + 12, y);
        pdf.text(`${item.count} unidades`, pageWidth - margin, y, { align: 'right' });
        
        pdf.setDrawColor(220);
        pdf.line(margin, y + 4, pageWidth - margin, y + 4);
        
        y += 12;
    });
    
    const pageCount = (typeof pdf.getNumberOfPages === 'function') ? pdf.getNumberOfPages() : pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
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
