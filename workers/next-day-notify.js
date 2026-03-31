export default {
    async scheduled(event, env, ctx) {

        const now = new Date()
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        const endOfTomorrow = new Date(startOfTomorrow.getFullYear(), startOfTomorrow.getMonth(), startOfTomorrow.getDate(), 23, 59, 59)

        const { results: eventsTomorrow } = await env.DB
            .prepare("SELECT * FROM event WHERE start >= ? AND start <= ?")
            .bind(startOfTomorrow.getTime(), endOfTomorrow.getTime())
            .all()

        await Promise.all(eventsTomorrow.map(async event => {

            const { results: slots } = await env.DB.prepare("SELECT * FROM chaperone_slot WHERE event_id = ?").bind(event.id).all()
            return Promise.all(
                slots
                    .filter(slot => slot.chaperone)
                    .map(slot =>
                        env.NOTIFICATION_QUEUE.send({
                            chaperone_id: slot.chaperone,
                            title: "Chaperoning Tomorrow",
                            body: `You are scheduled to chaperone at "${event.title}" tomorrow.`,
                            url: `https://chaperones.steelcitychoristers.org.uk/schedule?id=${slot.chaperone}`
                        })
                    )
            )
        }))
        return new Response(":)", { status: 200 });
    }
}