export type ProjectType = '面诊' | '备牙' | '戴牙' | '椅旁' | '复诊' | '雕蜡' | '蜡形试戴' // | '休息'

export interface Schedule {
  id: string
  date: string
  start_time: string
  end_time: string
  doctor_id: string
  doctor_name: string
  nurse_id?: string
  nurse_name?: string
  customer_id: string
  customer_name: string
  project: ProjectType
  room_id: string
  room: string
  remark?: string
  is_vip: boolean
  created_at: number
  updated_at: number
}

export interface ScheduleFilter {
  date?: string
  dateRange?: [string, string]
  doctor_id?: string
  room_id?: string
  projectproject_type?: ProjectType
}
