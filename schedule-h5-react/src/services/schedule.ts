import { request } from '@/utils/request'
import { ScheduleFilter } from '@/types/schedule'

export function getScheduleList(filter: ScheduleFilter): Promise<any> {
  return request({
    url: '/schedule/list',
    method: 'POST',
    data: filter
  })
}

export function deleteSchedule(id: number): Promise<any> {
  return request({
    url: '/schedule/delete',
    method: 'POST',
    data: { id }
  })
}
