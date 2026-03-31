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
  if (!data.token || !data.fingerprint) {
    return new Response("Token and fingerprint are required", { status: 400 });
  }

  const tokenData = await env.DB.prepare(
    "SELECT * FROM access_token WHERE token = ? AND fingerprint = ?",
  )
    .bind(data.token, data.fingerprint)
    .first();
  if (!tokenData) {
    return new Response("Invalid token", { status: 401 });
  }

  const user = await env.DB.prepare("SELECT * FROM chaperone WHERE id = ?")
    .bind(tokenData.chaperone_id)
    .first();
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  await env.DB.prepare("UPDATE chaperone SET last_login = ? WHERE id = ?")
    .bind(new Date().getTime(), user.id)
    .run();

  return new Response(
    JSON.stringify({
      email: user.email,
      is_admin: user.is_admin,
      id: user.id,
      hidden: user.hidden,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
