export async function onRequest({ request, env, data }) {

    if (request.method === "GET") {
        const lastRead = request.headers.get("last-updated")
        let slots;
        if (lastRead) {
            slots = await env.DB.prepare("SELECT * FROM chaperone_slot WHERE last_updated > ?").bind(lastRead).all()
        } else {
            slots = await env.DB.prepare("SELECT * FROM chaperone_slot").all()
        }
        const allSlots = await env.DB.prepare("SELECT id FROM chaperone_slot").all()
        return new Response(JSON.stringify({
            slots: slots.results,
            slot_ids: allSlots.results.map(slot => slot.id)
        }), { status: 200 })
    }

    else if (request.method === "PUT") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }
        let incomingData;
        try {
            incomingData = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }
        if ([incomingData.title, incomingData.start, incomingData.end, incomingData.event_id].some(value => value === undefined || value === null)) {
            return new Response("Title, start, end and event_id are required", { status: 400 })
        }

        const { id } = await env.DB.prepare("INSERT INTO chaperone_slot (title, details, start, end, event_id) VALUES (?, ?, ?, ?, ?) RETURNING id").bind(incomingData.title, incomingData.details || "", incomingData.start, incomingData.end, incomingData.event_id).first()


        const fields = ["details", "chaperone"]
        await Promise.all(
            fields
                .filter(field => field in incomingData)
                .map(field =>
                    env.DB
                        .prepare(`UPDATE chaperone_slot SET ${field} = ? WHERE id = ?`)
                        .bind(incomingData[field], id)
                        .run()
                )
        )

        return new Response(JSON.stringify({ id }), { status: 201 })
    } else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "GET,PUT",
            },
        })
    }
}
