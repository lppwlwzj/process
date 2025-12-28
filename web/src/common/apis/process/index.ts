import { request } from "@/http/axios"
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

export function getProcessDetailApi(id: number) {
  return request<ApiResponseData<ProcessData>>({
    url: "process/detail",
    method: "post",
    data: { id }
  })
}

