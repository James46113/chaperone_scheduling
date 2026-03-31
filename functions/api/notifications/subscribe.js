export async function onRequest({ request, env }) {
    if (request.method === "POST") {
        let data;
        try {
            data = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }
        const { chaperone_id, subscription } = data
        if (!chaperone_id || !subscription) {
            return new Response("Chaperone ID and subscription are required", { status: 400 })
        }

        const existingSubscription = await env.DB.prepare("SELECT * FROM notification_subscription WHERE chaperone_id = ? AND subscription = ?").bind(chaperone_id, JSON.stringify(subscription)).first()

        if (existingSubscription) {
            return new Response("Subscription already exists", { status: 400 })
        }

        await env.DB.prepare("INSERT INTO notification_subscription (chaperone_id, subscription) VALUES (?, ?)").bind(chaperone_id, JSON.stringify(subscription)).run()
        return new Response(null, { status: 201 })
    }

    else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "POST",
            },
        })
    }
}