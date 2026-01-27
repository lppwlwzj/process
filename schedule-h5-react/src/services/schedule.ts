import { request } from '@/utils/request'
import { ScheduleFilter, Schedule } from '@/types/schedule'

export function getScheduleList(filter: ScheduleFilter): Promise<Schedule[]> {
  return request({
    url: '/api/schedule/list',
    method: 'POST',
    data: filter
  })
}
