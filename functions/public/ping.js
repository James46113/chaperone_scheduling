export async function onRequest({ request, env }) {
    return new Response("pong", { status: 200 })
}