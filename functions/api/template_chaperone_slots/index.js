export async function onRequest({ request, env, data }) {
    if (request.method === "GET") {
        const last_read = request.headers.get("last-updated")
        const { results: allSlots } = await env.DB.prepare("SELECT id FROM template_chaperone_slot").all()
        if (last_read) {
            const { results: templateSlots } = await env.DB.prepare("SELECT * FROM template_chaperone_slot WHERE last_updated > ?").bind(last_read).all()
            return new Response(JSON.stringify({
                "template_slots": templateSlots,
                "template_slot_ids": allSlots.map(slot => slot.id)
            }), { status: 200 })
        }
        return new Response(JSON.stringify({
            "template_slots": allSlots,
            "template_slot_ids": allSlots.map(slot => slot.id)
        }), { status: 200 })
    }


    if (request.method === "PUT") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }

        let incomingData;
        try {
            incomingData = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }

        if ([incomingData.template_id, incomingData.title, incomingData.start, incomingData.end].some(value => value === undefined || value === null)) {
            return new Response("Template ID, title, start and end are required", { status: 400 })
        }

        const { id } = await env.DB.prepare("INSERT INTO template_chaperone_slot (template_id, title, details, start, end) VALUES (?, ?, ?, ?, ?) RETURNING id")
            .bind(incomingData.template_id, incomingData.title, incomingData.details || "", incomingData.start, incomingData.end)
            .first()
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