import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "users/me",
    method: "get"
  })
}

/** 获取用户列表 */
export function getUserListApi() {
  return request<any>({
    url: "user/list",
    method: "post"
  })
}

/** 新增用户 */
export function createUserApi(data: { username: string; usercount: string; password: string; role?: string }) {
  return request<any>({
    url: "user/create",
    method: "post",
    data
  })
}

/** 删除用户 */
export function deleteUserApi(id: number) {
  return request<any>({
    url: "user/delete",
    method: "post",
    data: { id }
  })
}