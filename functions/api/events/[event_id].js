export async function onRequest({ request, env, params, data }) {

    if (request.method === "DELETE") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }
        await Promise.all([
            env.DB.prepare("DELETE FROM event WHERE id = ?").bind(params.event_id).run(),
            env.DB.prepare("DELETE FROM chaperone_availability WHERE event_id = ?").bind(params.event_id).run(),
            env.DB.prepare("DELETE FROM chaperone_slot WHERE event_id = ?").bind(params.event_id).run()
        ])
        return new Response("Deleted", { status: 200 })
    }

    else if (request.method === "PATCH") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }

        let jsonData;
        try {
            jsonData = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }

        const event = await env.DB.prepare("SELECT * FROM event WHERE id = ?").bind(params.event_id).first()
        if (!event) {
            return new Response("Event not found", { status: 404 })
        }

        if (new Date(event.start) <= new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) {
            return new Response("Cannot edit past events", { status: 400 })
        }

        const fields = ["title", "details", "start", "end", "location", "lead_chaperone", "juniors_present"]
        await Promise.all(
            fields
                .filter(field => field in jsonData)
                .map(field =>
                    env.DB
                        .prepare(`UPDATE event SET ${field} = ? WHERE id = ?`)
                        .bind(jsonData[field], params.event_id)
                        .run()
                )
        )

        return new Response("Updated", { status: 200 })
    }

    else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "GET,DELETE,PATCH",
            },
        })
    }
}