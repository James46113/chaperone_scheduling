export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "POST",
      },
    });
  }

  let data;
  try {
    data = await request.json();
  } catch (error) {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!data.email) {
    return new Response("Email is required", { status: 400 });
  }

  const user = await env.DB.prepare("SELECT * FROM chaperone WHERE email = ?")
    .bind(data.email)
    .first();
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  await env.DB.prepare("UPDATE chaperone SET last_login = ? WHERE id = ?")
    .bind(new Date().getTime(), user.id)
    .run();
  return new Response(
    JSON.stringify({
      is_admin: user.is_admin,
      id: user.id,
      hidden: user.hidden,
    }),
    { status: 200 },
  );
}
