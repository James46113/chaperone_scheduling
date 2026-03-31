import bcrypt from "bcryptjs"

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
    if (!data.new_password || !data.token) {
        return new Response("New password and token are required", { status: 400 })
    }

    const { id: userId, password_reset_expiry: expiry } = await env.DB.prepare("SELECT id, password_reset_expiry FROM chaperone WHERE password_reset_token = ?").bind(data.token).first()
    if (!userId) {
        return new Response("User not found", { status: 404 })
    }
    if (new Date(expiry) < new Date()) {
        return new Response("Token expired", { status: 400 })
    }

    const passwordHash = await hashPassword(data.new_password)
    await env.DB.prepare("UPDATE chaperone SET password_hash = ?, password_reset_token = NULL, password_reset_expiry = NULL WHERE id = ?").bind(passwordHash, userId).run()
    await env.DB.prepare("DELETE FROM access_token WHERE chaperone_id = ?").bind(userId).run()

    return new Response(null, { status: 201 })
}

async function hashPassword(password) {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
}