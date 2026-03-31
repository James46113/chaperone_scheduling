export async function onRequest({ request, env, params, data }) {
    const templateID = params.template_id

    if (request.method === "DELETE") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }

        if ([2, 3].includes(parseInt(templateID))) {
            return new Response("Cannot delete default templates", { status: 400 })
        }

        const template = await env.DB.prepare("SELECT * FROM template_event WHERE id = ?").bind(templateID).first()
        if (!template) {
            return new Response("Template not found", { status: 404 })
        }

        await Promise.all([env.DB.prepare("DELETE FROM template_event WHERE id = ?").bind(templateID).run(),
        env.DB.prepare("DELETE FROM template_chaperone_slot WHERE template_id = ?").bind(templateID).run()
        ])
        return new Response("Deleted", { status: 200 })
    }

    else if (request.method === "PATCH") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }

        const template = await env.DB.prepare("SELECT * FROM template_event WHERE id = ?").bind(templateID).first()
        if (!template) {
            return new Response("Template not found", { status: 404 })
        }

        let incomingData;
        try {
            incomingData = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }

        const fields = ["title", "details", "start", "end", "location", "template_name", "juniors_present"]
        await Promise.all(
            fields
                .filter(field => field in incomingData)
                .map(field =>
                    env.DB
                        .prepare(`UPDATE template_event SET ${field} = ? WHERE id = ?`)
                        .bind(incomingData[field], templateID)
                        .run()
                )
        )
        return new Response("Updated", { status: 200 })
    }
}