"use client";

import { useEffect, useRef, useState } from "react";
import {
  createProductExport,
  downloadProductExport,
  getProductExportStatus,
  type ExportJobStatus,
} from "@/app/lib/product-export";
import { getAccessToken } from "@/app/lib/auth";

export default function ProductExportPage() {
  const [job, setJob] = useState<ExportJobStatus | null>(null);
  const [jobId, setJobId] = useState("");
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const busyRef = useRef(false);

  async function startExport() {
    if (busyRef.current) return;

    busyRef.current = true;
    setStarting(true);
    setError("");
    setNotice("");
    setJob(null);

    try {
      const token = getAccessToken();

      if (!token) {
        throw new Error("Please log in as an admin first.");
      }

      const result = await createProductExport(token);
      setJobId(result.jobId);
      setNotice("Export job added to the queue.");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start export.");
    } finally {
      busyRef.current = false;
      setStarting(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const token = getAccessToken();
        if (!token) throw new Error("Please log in again.");

        const result = await getProductExportStatus(jobId, token);
        if (cancelled) return;

        setJob(result);

        if (
          ["waiting", "active", "delayed", "waiting-children"].includes(
            result.status,
          )
        ) {
          timer = setTimeout(poll, 2000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to check job status.",
          );
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, refreshKey]);

  async function downloadFile() {
    if (!jobId || downloading) return;

    setDownloading(true);
    setError("");

    try {
      const token = getAccessToken();
      if (!token) throw new Error("Please log in again.");

      await downloadProductExport(jobId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  const progress = typeof job?.progress === "number" ? job.progress : 0;

  const completed = job?.status === "completed";
  const failed = job?.status === "failed";

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <p className="text-sm font-medium text-blue-600">ADMIN / PRODUCTS</p>
        <h1 className="mt-2 text-3xl font-bold">Export Products</h1>
        <p className="mt-2 text-gray-500">
          Export your product catalog to an Excel spreadsheet.
        </p>
      </header>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Excel Export</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your export runs in the background. You can download the file when the
          job finishes.
        </p>

        <button
          type="button"
          onClick={startExport}
          disabled={starting}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? "Starting export..." : "Export to Excel"}
        </button>
      </section>

      {notice && (
        <p role="status" className="rounded-lg bg-blue-50 p-3 text-blue-800">
          {notice}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      {jobId && (
        <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Export Status</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
              {job?.status ?? "queued"}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Job ID</p>
            <code className="break-all text-sm">{jobId}</code>
          </div>

          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {completed && (
            <p className="text-sm text-green-700">
              Export completed. Products exported: {job?.rowCount ?? 0}
            </p>
          )}

          {failed && (
            <p className="text-sm text-red-700">
              {job?.failedReason ?? "Export failed."}
            </p>
          )}

          <button
            type="button"
            onClick={downloadFile}
            disabled={!completed || downloading}
            className="rounded-lg border px-5 py-3 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? "Downloading..." : "Download Excel"}
          </button>
        </section>
      )}
    </main>
  );
}
