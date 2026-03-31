export async function onRequest({ request, env, params, data }) {
    const templateSlotID = params.template_slot_id
    if (request.method === "PATCH") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }

        let incomingData;
        try {
            incomingData = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }

        const fields = ["title", "details", "start", "end"]
        await Promise.all(
            fields
                .filter(field => field in incomingData)
                .map(field =>
                    env.DB
                        .prepare(`UPDATE template_chaperone_slot SET ${field} = ? WHERE id = ?`)
                        .bind(incomingData[field], templateSlotID)
                        .run()
                )
        )
        return new Response("Updated", { status: 200 })
    }

    if (request.method === "DELETE") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }
        await env.DB.prepare("DELETE FROM template_chaperone_slot WHERE id = ?").bind(templateSlotID).run()
        return new Response("Deleted", { status: 200 })
    }

    else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "PATCH,DELETE",
            },
        })
    }
}