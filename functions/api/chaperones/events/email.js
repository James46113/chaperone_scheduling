export async function onRequest({ request, env, data }) {
    if (request.method === "POST") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }
        const { results: chaperones } = await env.DB.prepare("SELECT * FROM chaperone").all()
        const emailPayloads = []
        const notificationPayloads = []
        for (const chaperone of chaperones) {
            const assignedSlots = await env.DB.prepare("SELECT * FROM chaperone_slot WHERE chaperone = ?").bind(chaperone.id).all()
            const assignedEvents = []

            for (const slot of assignedSlots.results) {
                const event = await env.DB.prepare("SELECT * FROM event WHERE id = ?").bind(slot.event_id).first()
                if (event.start < new Date().getTime()) {
                    continue
                }
                assignedEvents.push(event)
            }

            if (assignedEvents.length === 0) {
                continue
            }
            emailPayloads.push(buildNotifyEventsEmail(chaperone, assignedEvents))
            notificationPayloads.push({ chaperone_id: chaperone.id, title: "Your Chaperone Schedule", body: "The chaperones schedule has been updated.", url: `https://chaperones.steelcitychoristers.org.uk/schedule?id=${chaperone.id}` })
        }
        await Promise.all([
            Promise.all(emailPayloads.map(payload => env.MAIL_QUEUE.send(payload))),
            Promise.all(notificationPayloads.map(payload => env.NOTIFICATION_QUEUE.send(payload)))
        ])
        return new Response("Emails and notifications sent", { status: 200 })
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
    const TEMPLATE = `
        <p>Hi ${chaperone.name},</p>
        <p>Here are the upcoming events that you are scheduled to chaperone:</p>
        <ul>
            ${events.map(event => `<li>${new Date(event.start).toLocaleString('en-GB')} - ${event.title}</li>`).join("")}
        </ul>
        <br />
        <p>For more information, please visit the Chaperones System.</p>
        <a href="https://chaperones.steelcitychoristers.org.uk/schedule?id=${chaperone.id}" target="_blank"
        rel="noopener noreferrer"
        style="background-color: #a80056; color: white; border: none; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; border-radius: 4px; text-decoration: none;">
        Your Events
        </a>
        <p>Thank you</p>
    `
    return {
        to: chaperone.email,
        subject: "Your Chaperone Schedule",
        html: TEMPLATE
    }
}