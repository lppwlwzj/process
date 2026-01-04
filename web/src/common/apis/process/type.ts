export interface ProcessData {
  id: number
  customer_name: string
  wear_time: string
  progress: string
  technician: string
  material?: string
  image?: string
    remark?: string
    technician_audio?: string
    technician_video?: string
    chairside_audio?: string
    chairside_video?: string
    start_chairside_time?: string
    complete_chairside_time?: string
    chairside_doctor?: string
    daily_wear_status?: number
    created_at?: string
    updated_at?: string
}  
  
  export interface ProcessFormData {
    id?: number
    customer_name: string
    wear_time: string
    progress: string
    technician: string
  material?: string
  image?: string
  remark?: string
  technician_audio?: string
  technician_video?: string
  chairside_audio?: string
  chairside_video?: string
    start_chairside_time?: string
    complete_chairside_time?: string
    chairside_doctor?: string
  daily_wear_status?: number
}

export interface ProcessListRequest {
  currentPage: number
  pageSize: number
  customer_name?: string
    progress?: string
    technician?: string
 } 