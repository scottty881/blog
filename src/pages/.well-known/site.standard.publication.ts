import { PUBLICATION_URI } from "../../lib/atproto.mjs";

export function GET() {
  return new Response(PUBLICATION_URI, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
