const { parseCookies, verifySession, getTierName } = require('./session-utils.cjs');

exports.handler = async (event, context) => {
    // Solo permitir GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies.mc_session;

    const session = verifySession(sessionToken);

    if (session) {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            },
            body: JSON.stringify({
                authenticated: true,
                tier: session.tier || 0,
                user: session.user || 'Usuario',
                tierName: getTierName(session.tier || 0)
            })
        };
    }

    // Sesión no válida o no iniciada
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
            authenticated: false,
            tier: 0,
            user: null,
            tierName: 'Público'
        })
    };
};
