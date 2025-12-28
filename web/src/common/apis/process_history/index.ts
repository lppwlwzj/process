import { request } from "@/http/axios"

export interface ProcessHistoryData {
  id: number
  customer_id: number
  customer_name: string
  progress: string
  technician: string
  start_time: string
  duration_minutes: number | null
  previous_progress: string | null
  previous_technician: string | null
  created_at: string
}

export interface AddHistoryRequest {
  customer_id: number
  customer_name: string
  progress: string
  technician: string
  start_time: string
}

export function addProcessHistoryApi(data: AddHistoryRequest) {
  return request<ApiResponseData<any>>({
    url: "process_history/add",
    method: "post",
    data
  })
}

export function getProcessHistoryApi(customer_id: number) {
  return request<ApiResponseData<ProcessHistoryData[]>>({
    url: "process_history/list",
    method: "post",
    data: { customer_id }
  })
}
