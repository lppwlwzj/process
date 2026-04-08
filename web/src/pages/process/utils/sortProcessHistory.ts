import { progressOptions } from "../constant"

const PROGRESS_PRIORITY = ["che_jin", "shang_ci", "che_ci", "shang_you"] as const

export function getProgressSortOrder(progress: string): number {
  const pi = (PROGRESS_PRIORITY as readonly string[]).indexOf(progress)
  if (pi !== -1) return pi
  const idx = progressOptions.findIndex((o) => o.key === progress)
  return 100 + (idx === -1 ? 999 : idx)
}

export function sortProcessHistoryRows<
  T extends { technician?: string; progress: string; start_time?: string }
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const techCmp = (a.technician || "").localeCompare(b.technician || "", "zh-CN")
    if (techCmp !== 0) return techCmp
    const pa = getProgressSortOrder(a.progress)
    const pb = getProgressSortOrder(b.progress)
    if (pa !== pb) return pa - pb
    return (a.start_time || "").localeCompare(b.start_time || "")
  })
}
