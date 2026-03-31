import { handleCORS, handleOptions } from "../_cors.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return handleOptions(context.request);
  }

  return handleCORS(context.request, await context.next());
}