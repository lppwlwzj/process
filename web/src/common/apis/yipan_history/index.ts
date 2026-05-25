import { request } from "@/http/axios"

export interface YipanHistoryParams {
  customer_id?: number
  date?: string
  start_date?: string
  end_date?: string
  chairside_doctor?: string
  shape_quality_inspector?: string
}

export function getYipanHistoryApi(data: YipanHistoryParams) {
  return request({
    url: "/yipan/history",
    method: "post",
    data
  })
}
