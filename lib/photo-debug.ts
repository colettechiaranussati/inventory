export interface PhotoFlowDebug {
  step: string
  timestamp: string
  data: any
  success: boolean
  error?: string
}

class PhotoDebugger {
  private logs: PhotoFlowDebug[] = []
  private isEnabled = process.env.NODE_ENV === "development"

  log(step: string, data: any, success = true, error?: string) {
    if (!this.isEnabled) return

    const logEntry: PhotoFlowDebug = {
      step,
      timestamp: new Date().toISOString(),
      data: typeof data === "object" ? JSON.parse(JSON.stringify(data)) : data,
      success,
      error,
    }

    this.logs.push(logEntry)
    console.log(`[PhotoDebug] ${step}:`, logEntry)
  }

  getLogs(): PhotoFlowDebug[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const photoDebugger = new PhotoDebugger()

// Helper function to validate photo URL
export function validatePhotoUrl(url: string | null | undefined): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: "Photo URL is empty or null" }
  }

  if (typeof url !== "string") {
    return { valid: false, error: "Photo URL is not a string" }
  }

  if (!url.startsWith("http")) {
    return { valid: false, error: "Photo URL does not start with http/https" }
  }

  if (!url.includes("supabase")) {
    return { valid: false, error: "Photo URL does not appear to be from Supabase" }
  }

  return { valid: true }
}
