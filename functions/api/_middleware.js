import { handleCORS, handleOptions } from "../_cors.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return handleOptions(context.request);
  }

  const fingerprint = context.request.headers.get("fingerprint")
  const token = context.request.headers.get("token")
  const oAuthToken = context.request.headers.get("oAuthToken")

  if (token && fingerprint) {
    const accessToken = await context.env.DB.prepare("SELECT * FROM access_token WHERE token = ? AND fingerprint = ?").bind(token, fingerprint).first()
    if (!accessToken) {
      return new Response("Unauthorized", { status: 401 })
    }
    const user = await context.env.DB.prepare("SELECT * FROM chaperone WHERE id = ?").bind(accessToken.chaperone_id).first()
    if (!user) {
      return new Response("User not found", { status: 404 })
    }
    context.data.user = user
  } else if (oAuthToken) {
    try {
      const tokenInfo = await verify_access_token(oAuthToken)
      if (!tokenInfo) {
        return new Response("Unauthorized", { status: 401 })
      }

      const audience = tokenInfo.audience
      if (audience !== context.env.AUDIENCE) {
        await revoke_token(oAuthToken)
        return new Response("Invalid audience", { status: 401 })
      }

      const email = tokenInfo.email
      if (!email) {
        await revoke_token(oAuthToken)
        return new Response("Email not found in token", { status: 401 })
      }

      const user = await context.env.DB.prepare("SELECT * FROM chaperone WHERE email = ?").bind(email).first()
      if (!user) {
        await revoke_token(oAuthToken)
        return new Response("User not found", { status: 404 })
      }
      context.data.user = user
    } catch (error) {
      return new Response("Unauthorized", { status: 401 })
    }
  }
  else {
    return new Response("Unauthorized", { status: 401 })
  }

  return handleCORS(context.request, await context.next());
}


function verify_access_token(token) {
  return fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error("Unauthorized");
      }
      return data;
    });
}

function revoke_token(token) {
  return fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token })
  }).then(response => {
    if (!response.ok) {
      console.error(`Failed to revoke token: ${response.status}, ${response.statusText}`);
    }
  });
}