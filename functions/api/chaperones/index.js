export async function onRequest({ request, env, data }) {
    if (request.method === "GET") {
        const last_read = request.headers.get("last-updated")
        let chaperones = [];
        const { results: allChaperones } = await env.DB.prepare("SELECT id FROM chaperone").all()
        if (last_read) {
            const { results } = await env.DB.prepare("SELECT * FROM chaperone WHERE last_updated > ?").bind(last_read).all()
            chaperones = results || []
        } else {
            const { results } = await env.DB.prepare("SELECT * FROM chaperone").all()
            chaperones = results || []
        }

        let responseData;
        let users = [];
        if (data.user.is_admin) {
            users = chaperones.map(user => ({ id: user.id, email: user.email, is_admin: user.is_admin, name: user.name, is_singing_chaperone: user.is_singing_chaperone, last_login: user.last_login, hidden: user.hidden }))
        } else {
            users = chaperones.map(user => ({ id: user.id, name: user.name, is_singing_chaperone: user.is_singing_chaperone, hidden: user.hidden }))
        }
        responseData = { chaperones: users, chaperone_ids: allChaperones.map(chaperone => chaperone.id) }
        return new Response(JSON.stringify(responseData), { status: 200, headers: { "Content-Type": "application/json" } })
    }

    else if (request.method === "PUT") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }
        let inputData;
        try {
            inputData = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }
        if ([inputData.name, inputData.email, inputData.is_admin, inputData.is_singing_chaperone].some(value => value === undefined || value === null)) {
            return new Response("All fields are required", { status: 400 })
        }

        const existingUser = await env.DB.prepare("SELECT * FROM chaperone WHERE email = ?").bind(inputData.email).first()
        if (existingUser) {
            return new Response("User with that email already exists", { status: 409 })
        }

        const { id } = await env.DB.prepare("INSERT INTO chaperone (name, email, is_admin, is_singing_chaperone) VALUES (?, ?, ?, ?) RETURNING id").bind(inputData.name, inputData.email, inputData.is_admin, inputData.is_singing_chaperone).first()

        const { results: allEvents } = await env.DB.prepare("SELECT id FROM event").all()
        await Promise.all(
            allEvents.map(event =>
                env.DB.prepare("INSERT INTO chaperone_availability (chaperone_id, event_id) VALUES (?, ?)").bind(id, event.id).run()
            )
        )

        return new Response(JSON.stringify({ id }), { status: 201 })
    }

    else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "GET,PUT",
            },
        })
    }
}