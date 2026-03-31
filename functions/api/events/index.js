export async function onRequest({ request, env, data }) {
    if (request.method === "GET") {
        const last_read = request.headers.get("last-updated")
        let events;
        if (last_read) {
            events = (await env.DB.prepare("SELECT * FROM event WHERE last_updated > ?").bind(last_read).all()).results
        } else {
            events = (await env.DB.prepare("SELECT * FROM event").all()).results
        }
        const { results: allEvents } = await env.DB.prepare("SELECT * FROM event").all()

        return new Response(JSON.stringify({ events, event_ids: allEvents.map(event => event.id) }), { status: 200 })
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

        if ([inputData.title, inputData.location, inputData.start, inputData.end].some(value => value === undefined || value === null)) {
            return new Response("Title, location, start and end are required", { status: 400 })
        }

        const { id } = await env.DB.prepare("INSERT INTO event (title, location, start, end) VALUES (?, ?, ?, ?) RETURNING id").bind(inputData.title, inputData.location, inputData.start, inputData.end).first()
        const fields = ["details", "lead_chaperone", "juniors_present"]
        await Promise.all(
            fields
                .filter(field => field in inputData)
                .map(field =>
                    env.DB
                        .prepare(`UPDATE event SET ${field} = ? WHERE id = ?`)
                        .bind(inputData[field], id)
                        .run()
                )
        )

        const { results: allChaperones } = await env.DB.prepare("SELECT id FROM chaperone").all()
        await Promise.all(allChaperones.map(chaperone => env.DB.prepare("INSERT INTO chaperone_availability (event_id, chaperone_id) VALUES (?, ?)").bind(id, chaperone.id).run()))

        return new Response(JSON.stringify({ id }), { status: 201 })
    }

    else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "GET",
            },
        })
    }
}
