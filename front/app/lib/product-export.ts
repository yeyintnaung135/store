const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type ExportJobStatus = {
  jobId: string;
  status: string;
  progress: number | object;
  rowCount?: number;
  failedReason?: string;
  createdAt: string;
  finishedAt: string | null;
};

async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function createProductExport(token: string) {
  return apiRequest<{ jobId: string; status: string; message: string }>(
    "/admin/products/export",
    token,
    { method: "POST" },
  );
}

export function getProductExportStatus(jobId: string, token: string) {
  return apiRequest<ExportJobStatus>(
    `/admin/products/export/${encodeURIComponent(jobId)}`,
    token,
  );
}

export async function downloadProductExport(jobId: string, token: string) {
  const response = await fetch(
    `${API_URL}/admin/products/export/${encodeURIComponent(jobId)}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? `Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "products.xlsx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}
