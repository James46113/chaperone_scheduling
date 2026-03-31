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
    }
    catch (error) {
        return new Response("Invalid JSON", { status: 400 })
    }
    const token = data.token
    if (!token) {
        return new Response("Token is required", { status: 400 })
    }

    const row = await env.DB
        .prepare("SELECT password_reset_expiry FROM chaperone WHERE password_reset_token = ?")
        .bind(token)
        .first()

    const expiry = row?.password_reset_expiry
    if (!expiry) {
        return new Response("Token invalid", { status: 404 })
    }
    if (new Date(expiry) < new Date()) {
        return new Response("Token expired", { status: 400 })
    }

    return new Response(null, { status: 200 })
}