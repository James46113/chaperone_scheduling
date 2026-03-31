export async function onRequest({ request, env, params, data }) {
  const slotId = params.slot_id;

  if (request.method === "PATCH") {
    if (!data.user.is_admin) {
      return new Response("Forbidden", { status: 403 });
    }

    let inputData;
    try {
      inputData = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    if (!inputData) {
      return new Response("Invalid Data", { status: 400 });
    }

    const slot = await env.DB.prepare(
      "SELECT * FROM chaperone_slot WHERE id = ?",
    )
      .bind(slotId)
      .first();
    if (!slot) {
      return new Response("Chaperone Slot not found", { status: 404 });
    }

    const fields = ["title", "details", "start", "end", "chaperone"];
    await Promise.all(
      fields
        .filter((field) => field in inputData)
        .map((field) =>
          env.DB.prepare(`UPDATE chaperone_slot SET ${field} = ? WHERE id = ?`)
            .bind(inputData[field], slotId)
            .run(),
        ),
    );

    return new Response(JSON.stringify({ error: "" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else if (request.method === "DELETE") {
    if (!data.user.is_admin) {
      return new Response("Forbidden", { status: 403 });
    }
    const slot = await env.DB.prepare(
      "SELECT * FROM chaperone_slot WHERE id = ?",
    )
      .bind(slotId)
      .first();
    if (!slot) {
      return new Response("Chaperone Slot not found", { status: 404 });
    }

    await env.DB.prepare("DELETE FROM chaperone_slot WHERE id = ?")
      .bind(slotId)
      .run();
    return new Response(JSON.stringify({ error: "" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "PATCH,GET,DELETE",
      },
    });
  }
}
