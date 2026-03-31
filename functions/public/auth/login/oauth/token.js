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
    if (!data.code) {
        return new Response("Code is required", { status: 400 })
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code: data.code,
            client_id: env.CLIENT_ID,
            client_secret: env.CLIENT_SECRET,
            redirect_uri: env.HOSTNAME,
            grant_type: 'authorization_code'
        })
    })

    const tokenData = await response.json()
    if (tokenData.error) {
        console.error(`Error: ${tokenData.error}`)
        return new Response(JSON.stringify(tokenData), { status: 400, headers: { "Content-Type": "application/json" } })
    }

    return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        id_token: tokenData.id_token,
        expires_in: tokenData.expires_in
    }), { status: 200, headers: { "Content-Type": "application/json" } })
}