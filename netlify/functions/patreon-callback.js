exports.handler = async (event, context) => {
    const code = event.queryStringParameters.code;

    const CLIENT_ID = process.env.PATREON_CLIENT_ID;
    const CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;
    const REDIRECT_URI = process.env.PATREON_REDIRECT_URI;

    if (!code) {
        return { statusCode: 400, body: "Error: No se recibió código de autorización de Patreon." };
    }

    try {
        // 1. Intercambiar el código por un Access Token
        // Usamos la API fetch global que Netlify (Node 18+) soporta por defecto
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

        // 2. Consultar la identidad y suscripciones del usuario
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

        // 3. Crear una Cookie de sesión y redirigir al catálogo
        const cookieStr = `mc_tier=${userTier}; Path=/; Max-Age=2592000; SameSite=Lax;`;
        const nameCookieStr = `mc_user=${encodeURIComponent(userName)}; Path=/; Max-Age=2592000; SameSite=Lax;`;

        return {
            statusCode: 302,
            headers: {
                Location: '/'
            },
            multiValueHeaders: {
                'Set-Cookie': [cookieStr, nameCookieStr]
            }
        };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: "Error interno del servidor en Netlify." };
    }
};
