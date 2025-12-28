import { request } from "@/http/axios"

export interface ProcessHistoryParams {
  customer_id: number
}

export function getProcessHistoryApi(data: ProcessHistoryParams) {
  return request({
    url: "/process_history/list",
    method: "post",
    data
  })
}

export function addProcessHistoryApi(data: any) {
  return request({
    url: "/process_history/add",
    method: "post",
    data
  })
}
