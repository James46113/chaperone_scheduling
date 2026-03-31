export async function onRequest({ request, env, data, params }) {
    if (request.method === "DELETE") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }

        const chaperone = await env.DB.prepare("SELECT * FROM chaperone WHERE id = ?").bind(params.chaperone_id).first()
        if (!chaperone) {
            return new Response("Chaperone not found", { status: 404 })
        }

        if (chaperone.hidden) {
            return new Response("Forbidden", { status: 403 })
        }

        await Promise.all([
            env.DB.prepare("DELETE FROM chaperone WHERE id = ?").bind(params.chaperone_id).run(),
            env.DB.prepare("DELETE FROM chaperone_availability WHERE chaperone_id = ?").bind(params.chaperone_id).run(),
            env.DB.prepare("DELETE FROM access_token WHERE chaperone_id = ?").bind(params.chaperone_id).run(),
            env.DB.prepare("UPDATE chaperone_slot SET chaperone = NULL WHERE chaperone = ?").bind(params.chaperone_id).run()
        ])
        return new Response(null, { status: 204 })
    }

    else if (request.method === "PATCH") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }

        const chaperone = await env.DB.prepare("SELECT * FROM chaperone WHERE id = ?").bind(params.chaperone_id).first()
        if (!chaperone) {
            return new Response("Chaperone not found", { status: 404 })
        }

        let updateData;
        try {
            updateData = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }

        if ('is_admin' in updateData) {
            if (["James", "Choir Phone"].contains(chaperone.name)) {
                return new Response("Forbidden", { status: 403 })
            }
            await env.DB.prepare("UPDATE chaperone SET is_admin = ? WHERE id = ?").bind(updateData.is_admin, params.chaperone_id).run()
        }

        const fields = ["email", "is_singing_chaperone"]
        await Promise.all(
            fields
                .filter(field => field in updateData)
                .map(field =>
                    env.DB
                        .prepare(`UPDATE chaperone SET ${field} = ? WHERE id = ?`)
                        .bind(updateData[field], params.chaperone_id)
                        .run()
                )
        )

        return new Response(null, { status: 204 })
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