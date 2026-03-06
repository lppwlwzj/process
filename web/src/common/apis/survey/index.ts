import type { SurveyListRequest, SurveyListResponse } from "./type"
import { request } from "@/http/axios"

export function getSurveyListApi(data: SurveyListRequest) {
  return request<SurveyListResponse>({
    url: "survey/list",
    method: "post",
    data
  })
}
