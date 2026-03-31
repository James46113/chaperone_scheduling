export async function onRequest({ request, env, params, data }) {
    if (request.method === "GET") {
        if (data.user.id !== parseInt(params.chaperone_id)) {
            return new Response("Forbidden", { status: 403 })
        }
        const chaperoneId = params.chaperone_id
        const { results: availability } = await env.DB.prepare("SELECT * FROM chaperone_availability WHERE chaperone_id = ?").bind(chaperoneId).all()
        return new Response(JSON.stringify(availability || []), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    else if (request.method === "PATCH") {

        if (data.user.id !== parseInt(params.chaperone_id)) {
            return new Response("Forbidden", { status: 403 })
        }

        let patchData;

        try {
            patchData = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }

        if ([patchData.available, patchData.event_id].some(value => value === undefined || value === null)) {
            return new Response("Availability and event_id are required", { status: 400 })
        }

        const { result } = await env.DB.prepare("SELECT * FROM chaperone_availability WHERE chaperone_id = ? AND event_id = ?").bind(params.chaperone_id, patchData.event_id).first()

        if (result && !patchData.available) {

            const chaperone = await env.DB.prepare("SELECT * FROM chaperone WHERE id = ?").bind(params.chaperone_id).first()
            const event = await env.DB.prepare("SELECT * FROM event WHERE id = ?").bind(patchData.event_id).first()

            if (chaperone && event) {

                const emailPayload = {
                    to: "chaperones@steelcitychoristers.org.uk",
                    subject: `Chaperone Unavailability - ${new Date(event.start).toLocaleDateString('en-GB')}`,
                    html: `${chaperone.name} has attempted to update their availability for the event: "${event.title}" on ${new Date(event.start).toLocaleDateString('en-GB')} to unavailable, but they are already assigned to the event.\nThey have been told to contact you, but please ensure that the event is covered.\n\nSteel City Choristers Chaperone System`
                }

                await env.MAIL_QUEUE.send(emailPayload)
            } else {
                return new Response("Chaperone or event not found", { status: 404 })
            }
        }

        await env.DB.prepare("UPDATE chaperone_availability SET available = ? WHERE chaperone_id = ? AND event_id = ?").bind(patchData.available, params.chaperone_id, patchData.event_id).run()
        return new Response(JSON.stringify({ success: true }), { status: 200 })
    } else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "GET,PATCH",
            },
        })
    }
}