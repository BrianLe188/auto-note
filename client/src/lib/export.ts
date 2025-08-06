export async function downloadFile(
  url: string,
  params?: Record<string, string>,
) {
  try {
    const queryParams = params ? new URLSearchParams(params).toString() : "";
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;

    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header or use a default
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "download";

    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="([^"]+)"/);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    const blob = await response.blob();

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, filename };
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}

export async function exportMeetings(filters: {
  format?: "csv" | "json";
  status?: string;
  date?: string;
}) {
  return downloadFile("/api/export/meetings", filters);
}

export async function exportActionItems(filters: {
  format?: "csv" | "json";
  priority?: string;
  status?: string;
}) {
  return downloadFile("/api/export/action-items", filters);
}

export async function exportMeeting(
  meetingId: string,
  format: "txt" | "json" = "txt",
) {
  return downloadFile(`/api/export/meeting/${meetingId}`, { format });
}
