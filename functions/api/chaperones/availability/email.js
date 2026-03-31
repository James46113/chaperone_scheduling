export async function onRequest({ request, env, data }) {
    if (!data.user.is_admin) {
        return new Response("Forbidden", { status: 403 })
    }

    if (request.method === "POST") {
        const { results: chaperones } = await env.DB.prepare("SELECT * FROM chaperone").all()
        const { results: allAvailability } = await env.DB.prepare("SELECT * FROM chaperone_availability").all()
        const { results: allEvents } = await env.DB.prepare("SELECT * FROM event WHERE start >= ?").bind(new Date().getTime()).all()

        const emailPayloads = []
        const notificationPayloads = []
        for (const chaperone of chaperones) {
            const availability = allAvailability.filter(a => a.chaperone_id === chaperone.id)
            const notGivenAvailabilitiesEvents = []
            for (const avail of availability) {
                if (avail.available !== null) continue
                const event = allEvents.find(e => e.id === avail.event_id)
                if (event) {
                    notGivenAvailabilitiesEvents.push(event)
                }
            }

            notificationPayloads.push({ chaperone_id: chaperone.id, title: "Please Give Your Availability", body: `Please give your availability to chaperone for upcoming events`, url: "https://chaperones.steelcitychoristers.org.uk?view=list" })
            emailPayloads.push(buildNotifyEventsEmail(chaperone, notGivenAvailabilitiesEvents.sort((a, b) => new Date(a.start) - new Date(b.start))))
        }

        await Promise.all([
            Promise.all(notificationPayloads.map(payload => env.NOTIFICATION_QUEUE.send(payload))),
            Promise.all(emailPayloads.map(payload => env.MAIL_QUEUE?.send(payload)))
        ])

        return new Response("Notifications sent", { status: 200 })

    } else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "POST",
            },
        })
    }
}


function buildNotifyEventsEmail(chaperone, events) {
    const TEMPLATE = `<p>Hi ${chaperone.name},</p>
        <p>Please give your availability to chaperone for the following upcoming events:</p>
        <ul>
        ${events.map(event => `<li>${new Date(event.start).toLocaleDateString('en-GB')} - ${event.title} on </li>`).join("")}
        </ul>
        <br />
        <a href="https://chaperones.steelcitychoristers.org.uk?view=list" target="_blank" rel="noopener noreferrer"
        style="background-color: #a80056; color: white; border: none; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; border-radius: 4px; text-decoration: none;">
        Give Availability
        </a>
        <p>Thank you</p>`

    return {
        to: chaperone.email,
        subject: "Upcoming Events - Please Give Your Availability",
        html: TEMPLATE,
    }
}