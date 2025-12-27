import { request } from "@/http/axios"

/** 获取客户列表 */
export function getCustomerListApi() {
  return request<any>({
    url: "customer/list",
    method: "post"
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

/** 获取客户详情 */
export function getCustomerDetailApi(id: number) {
  return request<any>({
    url: "customer/detail",
    method: "post",
    data: { id }
  })
}

