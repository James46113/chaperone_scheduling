export async function onRequest({ request, env, data }) {
    if (request.method === "GET") {
        const last_read = request.headers.get("last-updated")
        const { results: allTemplates } = await env.DB.prepare("SELECT * FROM template_event").all()
        if (last_read) {
            const { results: templates } = await env.DB.prepare("SELECT * FROM template_event WHERE last_updated > ?").bind(last_read).all()
            return new Response(JSON.stringify({ templates, template_ids: allTemplates.map(t => t.id) }), { status: 200 })
        }
        return new Response(JSON.stringify({ templates: allTemplates, template_ids: allTemplates.map(t => t.id) }), { status: 200 })
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

        if ([incomingData.start, incomingData.end, incomingData.title, incomingData.location, incomingData.template_name].some(value => value === undefined || value === null)) {
            return new Response("Start, end, title, location and template name are required", { status: 400 })
        }

        const { id } = await env.DB.prepare("INSERT INTO template_event (title, location, start, end, template_name, details, juniors_present) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id")
            .bind(incomingData.title, incomingData.location, incomingData.start, incomingData.end, incomingData.template_name, incomingData.details || null, incomingData.juniors_present || 0)
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