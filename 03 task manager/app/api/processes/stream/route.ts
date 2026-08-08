import { getProcessListSnapshot } from "@/services/processes/process.service";
import { processListSnapshotSchema } from "@/types/api";

export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("connected", { message: "SSE stream started" });

      while (!closed) {
        try {
          const snapshot = await getProcessListSnapshot();
          const validated = processListSnapshotSchema.parse(snapshot);
          send("snapshot", validated);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          send("error", { message });
        }

        await new Promise((resolve) => setTimeout(resolve, validatedInterval()));
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function validatedInterval() {
  return 1_000;
}
