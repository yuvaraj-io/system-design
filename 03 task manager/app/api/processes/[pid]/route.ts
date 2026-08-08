import {
  getProcessDetailByPid,
  runProcessAction,
} from "@/services/processes/process.service";
import { processActionRequestSchema, processDetailSchema } from "@/types/api";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ pid: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { pid: pidParam } = await context.params;
    const pid = Number(pidParam);
    if (!Number.isInteger(pid) || pid <= 0) {
      return Response.json({ error: "Invalid PID" }, { status: 400 });
    }

    const detail = await getProcessDetailByPid(pid);
    if (!detail) {
      return Response.json({ error: "Process not found" }, { status: 404 });
    }

    const validated = processDetailSchema.parse(detail);
    return Response.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to load process detail", message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { pid: pidParam } = await context.params;
    const pid = Number(pidParam);
    if (!Number.isInteger(pid) || pid <= 0) {
      return Response.json({ error: "Invalid PID" }, { status: 400 });
    }

    const body = processActionRequestSchema.parse(await request.json());
    const result = await runProcessAction(pid, body.action, { nice: body.nice });
    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Action failed", message }, { status: 500 });
  }
}
