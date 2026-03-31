export async function onRequest({ request, env }) {

    if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "POST",
            },
        })
    }

    let data;
    try {
        data = await request.json()
    } catch (error) {
        return new Response("Invalid JSON", { status: 400 })
    }
    if (!data.refreshToken) {
        return new Response("Refresh token is required", { status: 400 })
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            refresh_token: data.refreshToken,
            client_id: env.CLIENT_ID,
            client_secret: env.CLIENT_SECRET,
            grant_type: "refresh_token"
        })
    })

    let responseData;
    try {
        responseData = await response.json()
    } catch (error) {
        return new Response("Error parsing response from Google", { status: 400 })
    }

    if (responseData.error) {
        return new Response(`Error from Google: ${responseData.error}`, { status: 400 })
    }

    return new Response(JSON.stringify({
        access_token: responseData.access_token,
        id_token: responseData.id_token,
        expires_in: responseData.expires_in
    }), { status: 200, headers: { "Content-Type": "application/json" } })
}