const fs = require('fs');
const path = require('path');
const { parseCookies, verifySession } = require('./session-utils.cjs');

exports.handler = async (event, context) => {
    // 1. Extraer la ruta solicitada
    let rawPath = '';
    if (event.queryStringParameters && event.queryStringParameters.path) {
        rawPath = event.queryStringParameters.path;
    } else {
        // En caso de que se invoque directamente vía splat
        const prefix = '/.netlify/functions/get-model';
        if (event.path.startsWith(prefix)) {
            rawPath = event.path.slice(prefix.length);
        } else {
            rawPath = event.path;
        }
    }

    // Normalizar y limpiar la ruta para prevenir ataques de Path Traversal
    rawPath = decodeURIComponent(rawPath).replace(/^\/+/, '');
    const cleanPath = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');
    const normalizedSlashPath = cleanPath.replace(/\\/g, '/');

    // 2. Comprobar si es un archivo de texturas públicas o uno de los modelos gratuitos
    const lowerPath = normalizedSlashPath.toLowerCase().replace(/^models\//, '');
    
    // Lista de modelos gratuitos (Nivel 0 / Público)
    const freeModelPrefixes = [
        'mc/creeper',
        'mcal/estatua-rana',
        'mci/estatua-unicornio',
        'mcm/espejo-magico'
    ];

    const freeTexturePrefixes = [
        'text/',
        'block/',
        'items/'
    ];

    const isFreeModel = freeModelPrefixes.some(prefix => lowerPath.startsWith(prefix));
    const isTexture = freeTexturePrefixes.some(prefix => lowerPath.startsWith(prefix));

    if (!isFreeModel && !isTexture) {
        // 3. Modelo Premium: Validar sesión criptográfica y nivel de Patreon
        const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
        const cookies = parseCookies(cookieHeader);
        const sessionToken = cookies.mc_session;
        const session = verifySession(sessionToken);

        const userTier = session ? (session.tier || 0) : 0;

        if (userTier < 2) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                },
                body: JSON.stringify({
                    error: "Acceso denegado: Se requiere una membresía activa de Patreon (Nivel Maestro o superior) para acceder a los archivos de este modelo 3D.",
                    requiredTier: 2,
                    currentTier: userTier
                })
            };
        }
    }

    // 4. Localizar el archivo en el sistema
    // Probar posibles ubicaciones según el entorno de Netlify Functions
    let relativeSubpath = cleanPath;
    if (relativeSubpath.startsWith('models/')) {
        relativeSubpath = relativeSubpath.replace(/^models\//, '');
    }

    const candidateBases = [
        path.join(process.cwd(), 'public/models'),
        path.join(process.cwd(), 'dist/models'),
        path.join(__dirname, '../../public/models'),
        path.join(__dirname, '../../dist/models'),
        path.join(__dirname, 'models')
    ];

    let targetFilePath = null;
    for (const base of candidateBases) {
        const potential = path.resolve(base, relativeSubpath);
        // Verificar que no se escape de la carpeta base (defensa contra path traversal)
        if (potential.startsWith(path.resolve(base)) && fs.existsSync(potential) && fs.statSync(potential).isFile()) {
            targetFilePath = potential;
            break;
        }
    }

    if (!targetFilePath) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Archivo no encontrado: ${cleanPath}` })
        };
    }

    // 5. Determinar Content-Type y enviar respuesta
    const ext = path.extname(targetFilePath).toLowerCase();
    let contentType = 'application/octet-stream';
    let isBinary = false;

    if (ext === '.obj' || ext === '.mtl' || ext === '.txt') {
        contentType = 'text/plain; charset=utf-8';
    } else if (ext === '.png') {
        contentType = 'image/png';
        isBinary = true;
    } else if (ext === '.jpg' || ext === '.jpeg') {
        contentType = 'image/jpeg';
        isBinary = true;
    } else if (ext === '.json') {
        contentType = 'application/json';
    }

    try {
        if (isBinary) {
            const buffer = fs.readFileSync(targetFilePath);
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'private, max-age=86400'
                },
                isBase64Encoded: true,
                body: buffer.toString('base64')
            };
        } else {
            const text = fs.readFileSync(targetFilePath, 'utf8');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'private, max-age=86400'
                },
                body: text
            };
        }
    } catch (err) {
        console.error('Error leyendo modelo:', err);
        return {
            statusCode: 500,
            body: "Error leyendo el archivo del modelo en el servidor."
        };
    }
};
