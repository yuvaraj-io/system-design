import { getSystemMetrics } from "@/services/processes/process.service";
import { systemSnapshotSchema } from "@/types/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getSystemMetrics();
    const validated = systemSnapshotSchema.parse(snapshot);
    return Response.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to load system metrics", message }, { status: 500 });
  }
}
