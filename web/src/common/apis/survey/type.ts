export interface SurveyRatingItem {
  id: number
  customer_id: string
  customer_name: string | null
  reception: number
  consultant: number
  photographer: number
  doctor: number
  nurse: number
  wax_designer: number
  audio_url: string | null
  created_at: string
}

export interface SurveyListRequest {
  customer_id?: string
  start_date?: string
  end_date?: string
  page?: number
  pageSize?: number
}

export interface SurveyListResponse {
  re: SurveyRatingItem[]
  total: number
}
