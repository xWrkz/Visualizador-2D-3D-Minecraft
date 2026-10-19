exports.handler = async (event, context) => {
    const clearSession = 'mc_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax;';
    const clearTier = 'mc_tier=; Path=/; Max-Age=0;';
    const clearUser = 'mc_user=; Path=/; Max-Age=0;';

    return {
        statusCode: 302,
        headers: {
            Location: '/?logout=success'
        },
        multiValueHeaders: {
            'Set-Cookie': [clearSession, clearTier, clearUser]
        }
    };
};
