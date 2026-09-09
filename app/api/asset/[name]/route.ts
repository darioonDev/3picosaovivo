import { readAsset } from "@/lib/uploads";

/**
 * Serves an image uploaded through the admin panel. These live outside the
 * deploy directory (so they survive redeploys), which also means Next cannot
 * serve them as static files — hence this route.
 *
 * Public on purpose: the logo and the player poster appear on the public site.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const asset = await readAsset(name);
  if (!asset) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(asset.body), {
    status: 200,
    headers: {
      "Content-Type": asset.contentType,
      // Every upload gets a fresh random name, so the URL is immutable.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
