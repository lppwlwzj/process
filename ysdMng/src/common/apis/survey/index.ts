import type { SurveyListRequest, SurveyListResponse } from "./type"
import { request } from "@/http/axios"

export function getSurveyListApi(data: SurveyListRequest) {
  return request<SurveyListResponse>({
    url: "survey/list",
    method: "post",
    data
  })
}

export function deleteSurveyApi(id: number) {
  return request({
    url: "survey/delete",
    method: "post",
    data: { id }
  })
}
