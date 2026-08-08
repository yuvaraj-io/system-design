import { getProcessListSnapshot } from "@/services/processes/process.service";
import { processListSnapshotSchema } from "@/types/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getProcessListSnapshot();
    const validated = processListSnapshotSchema.parse(snapshot);
    return Response.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      { error: "Failed to list processes", message },
      { status: 500 }
    );
  }
}
