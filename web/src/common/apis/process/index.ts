import { request } from "@/http/axios"
import { getToken } from "@@/utils/cache/cookies"
import axios from "axios"
import type { ProcessData, ProcessFormData, ProcessListRequest } from "./type"

export function getProcessListApi(params: ProcessListRequest) {
  return request<ApiResponseData<{ list: ProcessData[]; total: number }>>({
    url: "process/list",
    method: "post",
    data: params
  })
}

export function createProcessApi(data: ProcessFormData) {
  return request<ApiResponseData<null>>({
    url: "process/create",
    method: "post",
    data
  })
}

export function updateProcessApi(data: ProcessFormData) {
  return request<ApiResponseData<null>>({
    url: "process/update",
    method: "post",
    data
  })
}

export function deleteProcessApi(id: number) {
  return request<ApiResponseData<null>>({
    url: "process/delete",
    method: "post",
    data: { id }
  })
}

export function batchDeleteProcessApi(ids: number[]) {
  return request<ApiResponseData<null>>({
    url: "process/batchDelete",
    method: "post",
    data: { ids }
  })
}

export function getProcessDetailApi(id: number) {
  return request<ApiResponseData<ProcessData>>({
    url: "process/detail",
    method: "post",
    data: { id }
  })
}

export function updateTechnicianVideoApi(data: { customer_id: number; technician_video: string }) {
  return request<ApiResponseData<null>>({
    url: "process/updateTechnicianVideo",
    method: "post",
    data
  })
}

export function updateChairsideVideoApi(data: { customer_id: number; chairside_video: string }) {
  return request<ApiResponseData<null>>({
    url: "yipan/updateChairsideVideo",
    method: "post",
    data
  })
}

export function updateWebVideoApi(data: { customer_id: number; web_video: string }) {
  return request<ApiResponseData<null>>({
    url: "process/updateWebVideo",
    method: "post",
    data
  })
}

export function uploadFileApi(file: File, id?: string | number) {
  const formData = new FormData()
  formData.append("file", file)
  if (id) {
    formData.append("id", String(id))
  }
  const timestamp = Date.now()
  const fileName = `video_${timestamp}_${id || 'unknown'}.mp4`
  formData.append("name", fileName)
  
  const token = getToken()
  return axios.post<ApiResponseData<{ img_url: string }>>(
    `${import.meta.env.VITE_BASE_URL}/upload`,
    formData,
    {
      headers: {
        "Authorization": token || undefined,
        "Content-Type": "multipart/form-data"
      },
      timeout: 60000
    }
  ).then(res => res.data)
}
