import "server-only";

/**
 * Same-origin proxy for the HLS stream — mirrors the camera-24h (Sentinela)
 * /live route so the Olhar app plays the SAME live feed. The page is served
 * over HTTP(S) but the RTSP→HLS gateway on the VPS speaks plain HTTP; the
 * browser fetches the manifest/segments from THIS origin (/live/*) and the
 * server fetches them from the gateway (server-to-server, no mixed-content).
 *
 * HLS_UPSTREAM overrides the gateway base URL; it defaults to the project's
 * VPS gateway so the stream works with zero config.
 */
const UPSTREAM = process.env.HLS_UPSTREAM || "http://177.7.39.222:8888";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!UPSTREAM) {
    return new Response("HLS_UPSTREAM not configured.", { status: 503 });
  }

  const { path } = await params;
  // Guard against path traversal; only forward simple segment/manifest names.
  const safe = path.filter((p) => p !== ".." && p !== ".").join("/");
  const target = `${UPSTREAM.replace(/\/$/, "")}/${safe}`;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return new Response("Upstream gateway unreachable.", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(`Upstream error (${upstream.status}).`, {
      status: upstream.status === 404 ? 404 : 502,
    });
  }

  const isManifest = safe.endsWith(".m3u8");
  const contentType = isManifest
    ? "application/vnd.apple.mpegurl"
    : upstream.headers.get("content-type") ?? "video/mp2t";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": isManifest
        ? "no-cache, no-store, must-revalidate"
        : "public, max-age=60",
    },
  });
}
