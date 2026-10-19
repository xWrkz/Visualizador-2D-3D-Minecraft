const { parseCookies, signSession, verifyOAuthState, decodeOAuthState } = require('./session-utils.cjs');

exports.handler = async (event, context) => {
    const code = event.queryStringParameters && event.queryStringParameters.code;
    const receivedState = event.queryStringParameters && event.queryStringParameters.state;

    const CLIENT_ID = process.env.PATREON_CLIENT_ID;
    const CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;

    // 1. Validar Token Anti-CSRF
    // Decodificar metadata del estado firmado con HMAC
    const stateData = decodeOAuthState(receivedState);
    let isStateValid = !!stateData;

    if (!isStateValid) {
        // Fallback: verificar con cookie por compatibilidad con navegadores que mantienen cookies
        const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
        const cookies = parseCookies(cookieHeader);
        const expectedState = cookies.mc_oauth_state;

        if (receivedState && expectedState && receivedState === expectedState) {
            isStateValid = true;
        }
    }

    if (!isStateValid) {
        console.error('[Patreon Callback] CSRF validation failed. state:', receivedState);
        return {
            statusCode: 302,
            headers: {
                Location: '/?auth=expired'
            }
        };
    }

    if (!code) {
        return { 
            statusCode: 302, 
            headers: {
                Location: '/?auth=error'
            }
        };
    }

    try {
        // 2. Intercambiar el código por un Access Token
        // Usar exactamente el mismo redirect_uri registrado en el state
        const tokenRedirectUri = (stateData && stateData.r) || process.env.PATREON_REDIRECT_URI || 'https://wrkzvisualizador.netlify.app/.netlify/functions/patreon-callback';

        const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: tokenRedirectUri
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Error fetching token from Patreon:', tokenData);
            return {
                statusCode: 302,
                headers: {
                    Location: '/?auth=error'
                }
            };
        }

        // 3. Consultar la identidad, foto de perfil y suscripciones del usuario
        const identityUrl = 'https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields[tier]=amount_cents,title&fields[user]=full_name,image_url,thumb_url';
        const identityResponse = await fetch(identityUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const identityData = await identityResponse.json();
        
        let userTier = 0; // 0 = Público / Sin suscripción
        let userName = "Usuario";
        let userAvatar = null;

        if (identityData && identityData.data) {
            const attrs = identityData.data.attributes || {};
            userName = attrs.full_name || "Usuario";
            userAvatar = attrs.thumb_url || attrs.image_url || null;
            
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
            avatar: userAvatar,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 días
        };
        const sessionToken = signSession(sessionPayload);

        // Cookies seguras
        const sessionCookie = `mc_session=${sessionToken}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly;`;
        const clearStateCookie = `mc_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax;`;
        const clearOldTierCookie = `mc_tier=; Path=/; Max-Age=0;`;
        const clearOldUserCookie = `mc_user=; Path=/; Max-Age=0;`;

        // 5. Determinar la redirección de retorno
        // Si el usuario comenzó en un dominio distinto (ej. mcvisualizer.wrkz.net pero Patreon devolvió a wrkzvisualizador.netlify.app),
        // transferimos la sesión al dominio de origen mediante set-session para que la cookie exista en el dominio correcto.
        const currentHost = (event.headers['x-forwarded-host'] || event.headers.host || '').toLowerCase();
        const originUrl = (stateData && stateData.o) ? stateData.o : '';
        let destination = '/?auth=success';

        if (originUrl) {
            try {
                const parsedOrigin = new URL(originUrl);
                const originHost = parsedOrigin.host.toLowerCase();
                if (originHost && currentHost && originHost !== currentHost) {
                    destination = `${parsedOrigin.origin}/.netlify/functions/set-session?token=${encodeURIComponent(sessionToken)}&redirect=${encodeURIComponent('/?auth=success')}`;
                }
            } catch (err) {
                console.warn('[Patreon Callback] Error determinando host de destino:', err);
            }
        }

        return {
            statusCode: 302,
            headers: {
                Location: destination
            },
            multiValueHeaders: {
                'Set-Cookie': [sessionCookie, clearStateCookie, clearOldTierCookie, clearOldUserCookie]
            }
        };

    } catch (error) {
        console.error('Error en callback:', error);
        return {
            statusCode: 302,
            headers: {
                Location: '/?auth=error'
            }
        };
    }
};

