import { request } from "@/http/axios"

/** 获取客户列表 */
export function getCustomerListApi(data?: any) {
  return request<any>({
    url: "customer/list",
    method: "post",
    data: data || {}
  })
}

/** 新增客户 */
export function createCustomerApi(data: any) {
  return request<any>({
    url: "customer/create",
    method: "post",
    data
  })
}

/** 更新客户 */
export function updateCustomerApi(data: any) {
  return request<any>({
    url: "customer/update",
    method: "post",
    data
  })
}

/** 删除客户 */
export function deleteCustomerApi(id: number) {
  return request<any>({
    url: "customer/delete",
    method: "post",
    data: { id }
  })
}

/** 批量删除客户 */
export function batchDeleteCustomerApi(ids: number[]) {
  return request<any>({
    url: "customer/batchDelete",
    method: "post",
    data: { ids }
  })
}

/** 获取客户详情 */
export function getCustomerDetailApi(id: number) {
  return request<any>({
    url: "customer/detail",
    method: "post",
    data: { id }
  })
}

/** 生成二维码 */
export function generateQrCodeApi(data: { id: number; page?: string }) {
  return request<any>({
    url: "user/getQrImg",
    method: "post",
    data
  })
}

/** 生成问卷二维码 */
export function generateSurveyQrCodeApi(data: { id: number }) {
  return request<any>({
    url: "customer/generateSurveyQrCode",
    method: "post",
    data
  })
}

