import { request } from "@/http/axios"

export interface YipanHistoryParams {
  customer_id: number
}

export function getYipanHistoryApi(data: YipanHistoryParams) {
  return request({
    url: "/yipan/history",
    method: "post",
    data
  })
}
