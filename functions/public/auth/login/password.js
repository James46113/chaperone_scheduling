import bcrypt from "bcryptjs";

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
  if (!data.email || !data.password || !data.fingerprint) {
    return new Response("Email, password and fingerprint are required", {
      status: 400,
    });
  }

  const user = await env.DB.prepare("SELECT * FROM chaperone WHERE email = ?")
    .bind(data.email)
    .first();
  if (!user) {
    return new Response("Incorrect email or password", { status: 401 });
  }

  const validPassword = await verifyPassword(data.password, user.password_hash);
  if (!validPassword) {
    return new Response("Incorrect email or password", { status: 401 });
  }

  await env.DB.prepare("UPDATE chaperone SET last_login = ? WHERE id = ?")
    .bind(new Date().getTime(), user.id)
    .run();

  const accessToken = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO access_token (token, fingerprint, chaperone_id) VALUES (?, ?, ?)",
  )
    .bind(accessToken, data.fingerprint, user.id)
    .run();

  return new Response(
    JSON.stringify({
      access_token: accessToken,
      email: user.email,
      is_admin: user.is_admin,
      id: user.id,
      hidden: user.hidden,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
