import type { ScheduleData, ScheduleListRequest, ScheduleCreateRequest, ScheduleUpdateRequest } from "./type"
import { request } from "@/http/axios"

export function getScheduleListApi(data: ScheduleListRequest) {
  return request<ScheduleData[]>({
    url: "schedule/list",
    method: "post",
    data
  })
}

export function createScheduleApi(data: ScheduleCreateRequest) {
  return request<{ id: number }>({
    url: "schedule/create",
    method: "post",
    data
  })
}

export function updateScheduleApi(data: ScheduleUpdateRequest) {
  return request<any>({
    url: "schedule/update",
    method: "post",
    data
  })
}

export function deleteScheduleApi(id: number) {
  return request<any>({
    url: "schedule/delete",
    method: "post",
    data: { id }
  })
}

export function getScheduleDetailApi(id: number) {
  return request<ScheduleData>({
    url: "schedule/detail",
    method: "post",
    data: { id }
  })
}
