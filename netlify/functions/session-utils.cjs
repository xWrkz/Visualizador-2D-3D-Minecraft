const crypto = require('crypto');

// Clave secreta para firmar sesiones.
// Prioriza SESSION_SECRET, luego PATREON_CLIENT_SECRET, y finalmente una clave de respaldo.
function getSecret() {
    return process.env.SESSION_SECRET || process.env.PATREON_CLIENT_SECRET || 'wrkz-mc-secure-session-salt-default-key-2026';
}

/**
 * Parsea el header Cookie de un evento de Netlify
 */
function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return list;

    cookieHeader.split(';').forEach(cookie => {
        let [name, ...rest] = cookie.split('=');
        name = name ? name.trim() : '';
        if (!name) return;
        const value = rest.join('=').trim();
        list[name] = decodeURIComponent(value);
    });
    return list;
}

/**
 * Firma un objeto de sesión con HMAC-SHA256
 */
function signSession(payload) {
    const secret = getSecret();
    const jsonStr = JSON.stringify(payload);
    const base64Payload = Buffer.from(jsonStr).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
    return `${base64Payload}.${signature}`;
}

/**
 * Verifica la firma HMAC-SHA256 y la expiración de un token de sesión
 */
function verifySession(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const secret = getSecret();
    const expectedSignature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');

    // Comparación en tiempo constante para mitigar ataques de timing
    try {
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSignature);
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            return null;
        }
    } catch {
        return null;
    }

    try {
        const payloadStr = Buffer.from(base64Payload, 'base64url').toString('utf8');
        const payload = JSON.parse(payloadStr);

        // Verificar expiración (exp en segundos)
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            return null; // Sesión expirada
        }

        return payload;
    } catch {
        return null;
    }
}

function getTierName(tier) {
    if (tier === 3) return "Arquitecto";
    if (tier === 2) return "Maestro";
    if (tier === 1) return "Básico";
    return "Público";
}

module.exports = {
    parseCookies,
    signSession,
    verifySession,
    getTierName
};
