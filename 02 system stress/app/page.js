"use client";

import { useCallback, useEffect, useState } from "react";

const REFRESH_MS = 1500;

const DEFAULTS = {
  cpu: 4,
  memory: 512,
  storage: 512,
  threads: 100,
};

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function formatCount(value) {
  return value == null ? "N/A" : value.toLocaleString();
}

function formatGB(value) {
  return `${Number(value ?? 0).toFixed(2)} GB`;
}

function ThreadStatRow({ label, value, hint }) {
  return (
    <div className="thread-stat-row">
      <span>{label}</span>
      <strong>{formatCount(value)}</strong>
      {hint ? <em>{hint}</em> : null}
    </div>
  );
}

function UtilBar({ percent, variant }) {
  const width = `${Math.min(100, Math.max(0, percent ?? 0))}%`;

  return (
    <div className="bar">
      <div className={`bar-fill ${variant}`} style={{ width }} />
    </div>
  );
}

function StressControl({ title, active, value, min, max, step, unit, onChange, onStart, onStop }) {
  return (
    <div className="control">
      <div className="control-head">
        <strong>{title}</strong>
        <span className={`badge ${active ? "on" : ""}`}>{active ? "Running" : "Idle"}</span>
      </div>
      <label htmlFor={`${title}-range`}>{unit}</label>
      <input
        id={`${title}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={active}
      />
      <p className="value-line">
        {value} {unit}
      </p>
      <div className="actions">
        <button className="primary" type="button" onClick={onStart} disabled={active}>
          Start loop
        </button>
        <button className="secondary" type="button" onClick={onStop} disabled={!active}>
          Stop
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("Connecting…");
  const [error, setError] = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [baselineThreads, setBaselineThreads] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/status");
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const nextData = await response.json();
      setData(nextData);

      if (baselineThreads == null && nextData.threads.processThreadCount != null) {
        setBaselineThreads(nextData.threads.processThreadCount);
      }

      setStatus(`Live metrics every ${REFRESH_MS / 1000}s`);
      setError(false);
    } catch (err) {
      setStatus(`Failed to load metrics: ${err.message}`);
      setError(true);
    }
  }, [baselineThreads]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function runStress(action, type, value) {
    setBusy(true);
    try {
      const response = await fetch("/api/stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type, value }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Stress request failed (${response.status})`);
      }
      await refresh();
    } catch (err) {
      setStatus(err.message);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const stress = data?.stress;
  const threads = data?.threads;
  const processThreads = threads?.processThreadCount;
  const processStates = threads?.processStates;
  const systemStates = threads?.systemStates;
  const threadLimits = threads?.limits;
  const threadDelta =
    baselineThreads != null && processThreads != null
      ? processThreads - baselineThreads
      : null;

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Load generator</p>
          <h1>System Stress</h1>
        </div>
        <div className="header-meta">
          <span className="pill live">Live loops</span>
          <span className="pill">{data?.hostname ?? "—"}</span>
          <span className="pill muted">{data?.cores ?? "—"} cores</span>
        </div>
      </header>

      <div className="layout">
        <aside className="panel">
          <h2>Stress controls</h2>
          <div className="controls">
            <StressControl
              title="CPU"
              active={stress?.active.cpu}
              value={settings.cpu}
              min={1}
              max={data?.cores ?? 10}
              step={1}
              unit="worker loops"
              onChange={(value) => setSettings((prev) => ({ ...prev, cpu: value }))}
              onStart={() => runStress("start", "cpu", settings.cpu)}
              onStop={() => runStress("stop", "cpu")}
            />

            <StressControl
              title="Memory"
              active={stress?.active.memory}
              value={settings.memory}
              min={128}
              max={4096}
              step={128}
              unit="MB to allocate"
              onChange={(value) => setSettings((prev) => ({ ...prev, memory: value }))}
              onStart={() => runStress("start", "memory", settings.memory)}
              onStop={() => runStress("stop", "memory")}
            />

            <StressControl
              title="Storage"
              active={stress?.active.storage}
              value={settings.storage}
              min={128}
              max={8192}
              step={128}
              unit="MB to allocate on disk"
              onChange={(value) => setSettings((prev) => ({ ...prev, storage: value }))}
              onStart={() => runStress("start", "storage", settings.storage)}
              onStop={() => runStress("stop", "storage")}
            />

            <StressControl
              title="Threads"
              active={stress?.active.threads}
              value={settings.threads}
              min={10}
              max={200}
              step={10}
              unit="worker threads"
              onChange={(value) => setSettings((prev) => ({ ...prev, threads: value }))}
              onStart={() => runStress("start", "threads", settings.threads)}
              onStop={() => runStress("stop", "threads")}
            />
          </div>

          <button
            className="danger"
            type="button"
            disabled={busy}
            onClick={() => runStress("stop-all")}
          >
            Stop all stress loops
          </button>
        </aside>

        <section className="card">
          <h2>What is happening right now</h2>

          <div className="metrics-grid">
            <div className="metric-card">
              <h3>CPU utilization</h3>
              <p className="metric-value">
                {data ? formatPercent(data.cpu.averageUtilizationPercent) : "—"}
              </p>
              <p className="metric-sub">Average across all cores</p>
              <UtilBar percent={data?.cpu.averageUtilizationPercent} variant="cpu" />
              <div className="core-list">
                {(data?.cpu.perCore ?? []).map((core) => (
                  <div className="core-item" key={core.core}>
                    Core {core.core + 1}
                    <strong>{formatPercent(core.utilizationPercent)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="metric-card">
              <h3>Memory</h3>
              <p className="metric-value">
                {data ? formatGB(data.memory.usedGB) : "—"}
              </p>
              <p className="metric-sub">
                {data
                  ? `${formatPercent(data.memory.utilizationPercent)} of ${formatGB(data.memory.totalGB)}`
                  : "—"}
              </p>
              <UtilBar percent={data?.memory.utilizationPercent} variant="memory" />
            </div>

            <div className="metric-card">
              <h3>Storage</h3>
              <p className="metric-value">
                {data ? formatGB(data.disk.usedGB) : "—"}
              </p>
              {data ? (
                <div className="metric-detail">
                  <span>{formatPercent(data.disk.utilizationPercent)} used</span>
                  <span>{formatGB(data.disk.freeGB)} free</span>
                  <span>{formatGB(data.disk.totalGB)} total</span>
                  <span className="metric-chip">{data.disk.path}</span>
                </div>
              ) : (
                <p className="metric-sub">—</p>
              )}
              <UtilBar percent={data?.disk.utilizationPercent} variant="disk" />
              <p className="metric-footer">
                {stress?.stats.storageAllocatedMB
                  ? `Stress app holding ${stress.stats.storageAllocatedMB} MB in ${stress.stats.storageFiles} files`
                  : "No storage allocated by stress app"}
              </p>
            </div>
          </div>

          <div className="metric-card metric-card-threads">
            <h3>Threads</h3>

              <div className="thread-section">
                <p className="thread-section-title">This Node app</p>
                <p className="metric-value">{formatCount(processThreads)}</p>
                <p className="metric-sub">
                  Total threads in this process
                  {threadDelta != null && threadDelta !== 0
                    ? ` (${threadDelta > 0 ? "+" : ""}${threadDelta} since page load)`
                    : ""}
                </p>
                <div className="thread-stats">
                  <ThreadStatRow label="Running" value={processStates?.running} />
                  <ThreadStatRow label="Sleeping" value={processStates?.sleeping} />
                  <ThreadStatRow label="Waiting" value={processStates?.waiting} />
                </div>
              </div>

              <div className="thread-section">
                <p className="thread-section-title">System-wide (all apps + OS)</p>
                <p className="metric-value">{formatCount(threads?.systemThreadCount)}</p>
                <p className="metric-sub">Total threads alive right now</p>
                <div className="thread-stats">
                  <ThreadStatRow label="Running" value={systemStates?.running} />
                  <ThreadStatRow label="Sleeping" value={systemStates?.sleeping} />
                  <ThreadStatRow label="Idle" value={systemStates?.idle} />
                  <ThreadStatRow label="Waiting (I/O)" value={systemStates?.waiting} />
                  {threads?.hiddenSystemThreads != null && threads.hiddenSystemThreads > 0 ? (
                    <ThreadStatRow
                      label="Kernel / hidden"
                      value={threads.hiddenSystemThreads}
                      hint="not listed by ps on macOS"
                    />
                  ) : null}
                </div>
              </div>

              <div className="thread-section">
                <p className="thread-section-title">Limits</p>
                <div className="thread-stats">
                  <ThreadStatRow
                    label="CPU cores (max parallel)"
                    value={threadLimits?.cpuCores}
                    hint="threads that can run on CPU at once"
                  />
                  {threadLimits?.maxThreads != null ? (
                    <>
                      <ThreadStatRow
                        label="Kernel max threads"
                        value={threadLimits.maxThreads}
                      />
                      <ThreadStatRow
                        label="Available headroom"
                        value={threadLimits.availableThreads}
                      />
                    </>
                  ) : (
                    <ThreadStatRow
                      label="Max processes (macOS)"
                      value={threadLimits?.maxProcesses}
                    />
                  )}
                </div>
                {threadLimits?.note ? (
                  <p className="metric-sub thread-note">{threadLimits.note}</p>
                ) : null}
              </div>

              <p className="metric-footer">
                {stress?.stats.threadWorkersSpawned
                  ? `Stress workers running: ${stress.stats.threadWorkersSpawned}`
                  : "No stress workers running"}
              </p>
          </div>

          <div className="stress-stats">
            <div>
              <span>CPU loops completed</span>
              <strong>{stress?.stats.loopsCompleted?.toLocaleString() ?? 0}</strong>
            </div>
            <div>
              <span>Memory held by stress app</span>
              <strong>{stress?.stats.memoryAllocatedMB ?? 0} MB</strong>
            </div>
            <div>
              <span>Storage held by stress app</span>
              <strong>{stress?.stats.storageAllocatedMB ?? 0} MB</strong>
            </div>
            <div>
              <span>Thread workers spawned</span>
              <strong>{stress?.stats.threadWorkersSpawned ?? 0}</strong>
            </div>
          </div>
        </section>
      </div>

      <p className={`status ${error ? "error" : ""}`}>{status}</p>
    </main>
  );
}
