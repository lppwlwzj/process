import { request } from "@/http/axios"

const YSD_MNG_API = "/api/ysdMng"

export interface YsdPhoneRow {
  id: number
  username: string
  phone: string
  remark: string | null
  contact_status: number
  created_at: string
  updated_at: string
}

export interface YsdPhoneListParams {
  start_date?: string
  end_date?: string
  phone?: string
  contact_status?: number | ""
  currentPage?: number
  pageSize?: number
}

export function getYsdPhoneListApi(data: YsdPhoneListParams) {
  return request<{ list: YsdPhoneRow[]; total: number }>({
    baseURL: "",
    url: `${YSD_MNG_API}/phone/list`,
    method: "post",
    data
  })
}

export function updateYsdPhoneApi(data: {
  id: number
  username: string
  phone: string
  remark?: string | null
  contact_status: number
}) {
  return request({
    baseURL: "",
    url: `${YSD_MNG_API}/phone/update`,
    method: "post",
    data
  })
}

export function deleteYsdPhoneApi(id: number) {
  return request({
    baseURL: "",
    url: `${YSD_MNG_API}/phone/delete`,
    method: "post",
    data: { id }
  })
}
