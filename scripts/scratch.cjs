const fs = require('fs');
const path = require('path');

const models = [
    "public/models/MC/creeper/Creeper Del Bosque.obj",
    "public/models/MCAL/estatua-rana/La Estatua de la Rana.obj",
    "public/models/MCI/estatua-unicornio/Estatua del Unicornio.obj",
    "public/models/MCM/espejo-magico/Espejo Magico.obj"
];

models.forEach(model => {
    try {
        const content = fs.readFileSync(model, 'utf-8');
        const lines = content.split('\n');
        let blockCount = 0;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        lines.forEach(line => {
            if (line.startsWith('v ')) {
                const parts = line.trim().split(/\s+/);
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (z < minZ) minZ = z;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
                if (z > maxZ) maxZ = z;
            } else if (line.startsWith('usemtl ')) {
                blockCount++;
            }
        });

        const width = Math.ceil(maxX - minX);
        const height = Math.ceil(maxY - minY);
        const depth = Math.ceil(maxZ - minZ);
        
        // El blockCount por usemtl podría ser inexacto si un bloque usa múltiples usemtl.
        // Contemos 'o ' o 'g ' dependiendo de cómo se exportaron.
        let objCount = 0;
        lines.forEach(line => {
            if (line.startsWith('o ') || line.startsWith('g ')) {
                objCount++;
            }
        });

        console.log(`Model: ${model}`);
        console.log(`Dimensions (WxHxD): ${width}x${height}x${depth}`);
        console.log(`Objects/Groups: ${objCount}, usemtl count: ${blockCount}`);
        console.log('---');
    } catch (e) {
        console.error('Error reading ' + model + ': ' + e.message);
    }
});
