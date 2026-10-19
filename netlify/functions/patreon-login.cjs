const { generateOAuthState } = require('./session-utils.cjs');

exports.handler = async (event, context) => {
    const CLIENT_ID = process.env.PATREON_CLIENT_ID;
    const REDIRECT_URI = process.env.PATREON_REDIRECT_URI; 

    if (!CLIENT_ID || !REDIRECT_URI) {
        return {
            statusCode: 500,
            body: "Error: Faltan variables de entorno PATREON_CLIENT_ID o PATREON_REDIRECT_URI en Netlify."
        };
    }

    // Generar un token de estado firmado criptográficamente (contiene timestamp + nonce + firma HMAC)
    // Esto garantiza que el estado sea auto-validable sin depender de cookies que Safari o Chrome puedan bloquear en redirecciones externas
    const state = generateOAuthState();
    const patreonAuthUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identity%20identity.memberships&state=${state}`;

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
