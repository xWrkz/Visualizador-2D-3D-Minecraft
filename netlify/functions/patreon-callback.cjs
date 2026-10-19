const { parseCookies, signSession, verifyOAuthState } = require('./session-utils.cjs');

exports.handler = async (event, context) => {
    const code = event.queryStringParameters && event.queryStringParameters.code;
    const receivedState = event.queryStringParameters && event.queryStringParameters.state;

    const CLIENT_ID = process.env.PATREON_CLIENT_ID;
    const CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;
    const REDIRECT_URI = process.env.PATREON_REDIRECT_URI;

    // 1. Validar Token Anti-CSRF
    // Primero validamos la firma criptográfica del estado (inmune a pérdida de cookies en redirecciones)
    const isStateValid = verifyOAuthState(receivedState);

    if (!isStateValid) {
        // Fallback: verificar con cookie por compatibilidad
        const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
        const cookies = parseCookies(cookieHeader);
        const expectedState = cookies.mc_oauth_state;

        if (!receivedState || !expectedState || receivedState !== expectedState) {
            console.error('[Patreon Callback] CSRF validation failed. state:', receivedState, 'cookieState:', expectedState);
            return {
                statusCode: 403,
                body: "Error de seguridad: Estado de autenticación inválido o expirado. Por favor, intenta conectar Patreon nuevamente."
            };
        }
    }

    if (!code) {
        return { 
            statusCode: 400, 
            body: `Error: No se recibió código de autorización de Patreon. Parámetros recibidos: ${JSON.stringify(event.queryStringParameters)}` 
        };
    }

    try {
        // 2. Intercambiar el código por un Access Token
        const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Error fetching token:', tokenData);
            return { statusCode: 400, body: "Error autenticando con Patreon: " + tokenData.error };
        }

        const accessToken = tokenData.access_token;

        // 3. Consultar la identidad y suscripciones del usuario
        const identityResponse = await fetch('https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields[tier]=amount_cents,title', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const identityData = await identityResponse.json();
        
        let userTier = 0; // 0 = Público / Sin suscripción
        let userName = "Usuario";

        if (identityData && identityData.data) {
            userName = identityData.data.attributes.full_name || "Usuario";
            
            if (identityData.included) {
                const tiers = identityData.included.filter(item => item.type === 'tier');
                let maxCents = 0;
                
                // Encontrar el tier más alto que está pagando actualmente
                tiers.forEach(tier => {
                    const cents = tier.attributes.amount_cents;
                    if (cents > maxCents) maxCents = cents;
                });

                // Asignación de niveles basada en el precio (en centavos de dólar)
                // Ej: 500 = $5.00 (Arquitecto), 300 = $3.00 (Maestro)
                if (maxCents >= 500) {
                    userTier = 3;
                } else if (maxCents >= 300) {
                    userTier = 2;
                } else if (maxCents > 0) {
                    userTier = 1; // Tier básico
                }
            }
        }

        // 4. Crear un token de sesión criptográficamente firmado (HMAC-SHA256)
        const sessionPayload = {
            tier: userTier,
            user: userName,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 días
        };
        const sessionToken = signSession(sessionPayload);

        // Cookies seguras:
        // mc_session: HttpOnly, firmada, no manipulable por JavaScript
        const sessionCookie = `mc_session=${sessionToken}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly;`;
        // Limpiar cookie temporal de estado OAuth
        const clearStateCookie = `mc_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax;`;
        // Limpiar cualquier cookie vieja de mc_tier en texto plano
        const clearOldTierCookie = `mc_tier=; Path=/; Max-Age=0;`;
        const clearOldUserCookie = `mc_user=; Path=/; Max-Age=0;`;

        return {
            statusCode: 302,
            headers: {
                Location: '/?auth=success'
            },
            multiValueHeaders: {
                'Set-Cookie': [sessionCookie, clearStateCookie, clearOldTierCookie, clearOldUserCookie]
            }
        };

    } catch (error) {
        console.error('Error en callback:', error);
        return { statusCode: 500, body: "Error interno del servidor en Netlify." };
    }
};
