export interface ScheduleData {
  id: number
  project: string
  doctor_id: number
  nurse_id?: number
  customer_id: number
  room?: string
  start_time: string
  duration: number
  end_time: string
  remark?: string
  doctor_name?: string
  nurse_name?: string
  customer_name?: string
  created_at?: string
  updated_at?: string
}

export interface ScheduleListRequest {
  date?: string
  dateRange?: [string, string]
  doctor_id?: number
}

export interface ScheduleCreateRequest {
  project: string
  doctor_id: number
  nurse_id?: number
  customer_id: number
  room: string
  start_time: string
  duration: number
  remark?: string
}

export interface ScheduleUpdateRequest extends ScheduleCreateRequest {
  id: number
}
