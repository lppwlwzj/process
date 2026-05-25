import { request } from "@/http/axios"

export interface LaxingRecordParams {
  customer_id?: number
  technician?: string
  intraoral_adjuster?: string
  start_date?: string
  end_date?: string
}

export function getLaxingRecordListApi(data: LaxingRecordParams) {
  return request({
    url: "/yipan/getLaxingRecordList",
    method: "post",
    data
  })
}
