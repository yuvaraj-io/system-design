"use client";

import { useCallback, useEffect, useState } from "react";

const REFRESH_MS = 3000;

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function formatGB(value) {
  return `${Number(value ?? 0).toFixed(2)} GB`;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString();
}

function UtilBar({ percent, variant }) {
  const width = `${Math.min(100, Math.max(0, percent ?? 0))}%`;

  return (
    <div className="bar">
      <div className={`bar-fill ${variant}`} style={{ width }} />
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("Connecting…");
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/system-info");

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const nextData = await response.json();
      setData(nextData);
      setStatus(`Auto-refreshing every ${REFRESH_MS / 1000}s`);
      setError(false);
    } catch (err) {
      setStatus(`Failed to load system info: ${err.message}`);
      setError(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Live monitor</p>
          <h1>System Info</h1>
        </div>
        <div className="header-meta">
          <span className="pill">{data?.hostname ?? "—"}</span>
          <span className="pill muted">{data?.platform ?? "—"}</span>
          <span className="pill muted">
            {data ? `Updated ${formatTime(data.timestamp)}` : "Updating…"}
          </span>
        </div>
      </header>

      <section className="grid">
        <article className="card highlight">
          <h2>CPU</h2>
          <p className="metric">{data?.cores ?? "—"}</p>
          <p className="label">cores available</p>
          <div className="util-block">
            <div className="util-header">
              <span>Overall utilization</span>
              <strong>{data ? formatPercent(data.cpu.averageUtilizationPercent) : "—"}</strong>
            </div>
            <UtilBar
              percent={data?.cpu.averageUtilizationPercent}
              variant="cpu"
            />
          </div>
          <div className="core-list">
            {(data?.cpu.perCore ?? []).map((core) => (
              <div className="core-item" key={core.core}>
                <span>Core {core.core + 1}</span>
                <strong>{formatPercent(core.utilizationPercent)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Memory</h2>
          <p className="metric">{data ? formatGB(data.memory.totalGB) : "—"}</p>
          <p className="label">total RAM</p>
          <div className="util-block">
            <div className="util-header">
              <span>Used</span>
              <strong>
                {data
                  ? `${formatGB(data.memory.usedGB)} (${formatPercent(data.memory.utilizationPercent)})`
                  : "—"}
              </strong>
            </div>
            <UtilBar percent={data?.memory.utilizationPercent} variant="memory" />
            <p className="subtext">
              {data ? `${formatGB(data.memory.freeGB)} free` : "—"}
            </p>
          </div>
        </article>

        <article className="card">
          <h2>Storage</h2>
          <p className="metric">{data ? formatGB(data.disk.totalGB) : "—"}</p>
          <p className="label">{data ? `mount: ${data.disk.path}` : "—"}</p>
          <div className="util-block">
            <div className="util-header">
              <span>Used</span>
              <strong>
                {data
                  ? `${formatGB(data.disk.usedGB)} (${formatPercent(data.disk.utilizationPercent)})`
                  : "—"}
              </strong>
            </div>
            <UtilBar percent={data?.disk.utilizationPercent} variant="disk" />
            <p className="subtext">
              {data ? `${formatGB(data.disk.freeGB)} free` : "—"}
            </p>
          </div>
        </article>

        <article className="card">
          <h2>Threads</h2>
          <p className="metric">
            {data?.threads.processThreadCount == null
              ? "N/A"
              : data.threads.processThreadCount.toLocaleString()}
          </p>
          <p className="label">threads in this app</p>
          <div className="thread-stats">
            <div>
              <span className="stat-label">System-wide threads</span>
              <span className="stat-value">
                {data?.threads.systemThreadCount == null
                  ? "N/A"
                  : data.threads.systemThreadCount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="stat-label">Node active handles</span>
              <span className="stat-value">
                {data?.threads.nodeProcessActiveHandles ?? "N/A"}
              </span>
            </div>
            <div>
              <span className="stat-label">Node active requests</span>
              <span className="stat-value">
                {data?.threads.nodeProcessActiveRequests ?? "N/A"}
              </span>
            </div>
          </div>
        </article>
      </section>

      <p className={`status ${error ? "error" : ""}`}>{status}</p>
    </main>
  );
}
