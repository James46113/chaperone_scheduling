export async function onRequest({ request, env, data }) {
    if (request.method === "GET") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }
        const { results } = await env.DB.prepare("SELECT * FROM chaperone_availability").all()
        return new Response(JSON.stringify(results), { status: 200 })
    } else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "GET",
            },
        })
    }
}