import { stressManager } from "@/lib/stress-manager";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const { action, type, value } = body;

  try {
    if (action === "stop-all") {
      await stressManager.stopAll();
      return Response.json({ ok: true, stress: stressManager.getStatus() });
    }

    if (action === "stop") {
      if (type === "cpu") stressManager.stopCpu();
      if (type === "memory") stressManager.stopMemory();
      if (type === "storage") await stressManager.stopStorage();
      if (type === "threads") stressManager.stopThreads();

      return Response.json({ ok: true, stress: stressManager.getStatus() });
    }

    if (action === "start") {
      if (type === "cpu") stressManager.startCpu(Number(value) || undefined);
      if (type === "memory") stressManager.startMemory(Number(value) || 512);
      if (type === "storage") await stressManager.startStorage(Number(value) || 512);
      if (type === "threads") stressManager.startThreads(Number(value) || 100);

      return Response.json({ ok: true, stress: stressManager.getStatus() });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: "Stress action failed", message: error.message },
      { status: 500 }
    );
  }
}
