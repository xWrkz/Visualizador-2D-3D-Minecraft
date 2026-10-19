const { verifySession } = require('./session-utils.cjs');

exports.handler = async (event, context) => {
    const token = event.queryStringParameters && event.queryStringParameters.token;
    const redirectParam = (event.queryStringParameters && event.queryStringParameters.redirect) || '/?auth=success';

    if (!token) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: '<h3>Error: Token de sesión ausente.</h3><p><a href="/">Volver al visualizador</a></p>'
        };
    }

    const session = verifySession(token);
    if (!session) {
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: '<h3>Error de seguridad: Token de sesión inválido o expirado.</h3><p><a href="/">Volver al visualizador</a></p>'
        };
    }

    // El token es auténtico y fue firmado por nuestro servidor con HMAC-SHA256
    const sessionCookie = `mc_session=${token}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly;`;
    const clearStateCookie = `mc_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax;`;
    const clearOldTierCookie = `mc_tier=; Path=/; Max-Age=0;`;
    const clearOldUserCookie = `mc_user=; Path=/; Max-Age=0;`;

    // Validar redirección segura (evitar open redirects externos)
    const safeRedirect = (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) ? redirectParam : '/?auth=success';

    return {
        statusCode: 302,
        headers: {
            Location: safeRedirect
        },
        multiValueHeaders: {
            'Set-Cookie': [sessionCookie, clearStateCookie, clearOldTierCookie, clearOldUserCookie]
        }
    };
};
