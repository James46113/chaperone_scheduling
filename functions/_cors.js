const ALLOWED_ORIGINS = [
    "http://localhost:3001",
    "https://scc-chaperones-app.pages.dev",
    "https://chaperones.steelcitychoristers.org.uk",
];

const DEFAULT_ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const DEFAULT_ALLOWED_HEADERS = "Content-Type,fingerprint,token,oAuthToken,last-updated";

function applyCorsHeaders(request, headers) {
    const origin = request.headers.get("Origin");
    const requestedMethod = request.headers.get("Access-Control-Request-Method");
    const requestedHeaders = request.headers.get("Access-Control-Request-Headers");

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers.set("Access-Control-Allow-Origin", origin);
    }

    headers.set("Access-Control-Allow-Methods", requestedMethod || DEFAULT_ALLOWED_METHODS);
    headers.set("Access-Control-Allow-Headers", requestedHeaders || DEFAULT_ALLOWED_HEADERS);
    headers.set("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
}

export function handleCORS(request, response) {
    applyCorsHeaders(request, response.headers);
    return response;
}

export function handleOptions(request) {
    const headers = new Headers();
    applyCorsHeaders(request, headers);
    return new Response(null, { status: 204, headers });
}