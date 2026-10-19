const { generateOAuthState } = require('./session-utils.cjs');

exports.handler = async (event, context) => {
    const CLIENT_ID = process.env.PATREON_CLIENT_ID;
    const configuredRedirectUri = process.env.PATREON_REDIRECT_URI;

    if (!CLIENT_ID) {
        return {
            statusCode: 500,
            body: "Error: Falta variable de entorno PATREON_CLIENT_ID en Netlify."
        };
    }

    // Detectar el host y protocolo de la petición actual
    const host = event.headers['x-forwarded-host'] || event.headers.host || '';
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const origin = host ? `${proto}://${host}` : 'https://mcvisualizer.wrkz.net';

    // Determinar redirect_uri para Patreon:
    // Prioriza PATREON_REDIRECT_URI configurado en Netlify (para coincidir exactamente con el portal de Patreon)
    // Si no está definido, utiliza el origen actual.
    let redirectUri = configuredRedirectUri;
    if (!redirectUri) {
        redirectUri = `${origin}/.netlify/functions/patreon-callback`;
    }

    // Generar un token de estado firmado criptográficamente que incluye el origen de llamada
    // y el redirectUri utilizado, asegurando auto-validación y transferencia entre dominios
    const state = generateOAuthState({
        origin: origin,
        redirectUri: redirectUri
    });

    const patreonAuthUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identity%20identity.memberships&state=${state}`;

    const stateCookie = `mc_oauth_state=${state}; Path=/; Max-Age=900; HttpOnly; SameSite=Lax;`;

    return {
        statusCode: 302,
        headers: {
            Location: patreonAuthUrl,
            'Set-Cookie': stateCookie
        },
        multiValueHeaders: {
            'Set-Cookie': [stateCookie]
        }
    };
};

