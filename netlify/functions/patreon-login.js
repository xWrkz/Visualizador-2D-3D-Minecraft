exports.handler = async (event, context) => {
    const CLIENT_ID = process.env.PATREON_CLIENT_ID;
    const REDIRECT_URI = process.env.PATREON_REDIRECT_URI; 

    if (!CLIENT_ID || !REDIRECT_URI) {
        return {
            statusCode: 500,
            body: "Error: Faltan variables de entorno PATREON_CLIENT_ID o PATREON_REDIRECT_URI en Netlify."
        };
    }

    const patreonAuthUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identity%20identity[memberships]`;

    return {
        statusCode: 302,
        headers: {
            Location: patreonAuthUrl,
        }
    };
};
