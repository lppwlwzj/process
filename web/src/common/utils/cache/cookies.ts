// 统一处理 Cookie

import { CacheKey } from "@@/constants/cache-key"
import Cookies from "js-cookie"

export function getToken() {
  return Cookies.get(CacheKey.TOKEN)
}

export function setToken(token: string) {
  Cookies.set(CacheKey.TOKEN, token)
  // 存储 token 过期时间：当前时间 + 3 天（3 * 24 * 60 * 60 * 1000 毫秒）
  const expiresTime = Date.now() + 31 * 24 * 60 * 60 * 1000
  Cookies.set(CacheKey.TOKEN_EXPIRES, expiresTime.toString())
}

export function removeToken() {
  Cookies.remove(CacheKey.TOKEN)
  Cookies.remove(CacheKey.TOKEN_EXPIRES)
}

export function getTokenExpires(): number | null {
  const expires = Cookies.get(CacheKey.TOKEN_EXPIRES)
  return expires ? parseInt(expires, 10) : null
}

export function isTokenExpired(): boolean {
  const expires = getTokenExpires()
  if (!expires) return false // 如果没有过期时间，不视为过期（兼容旧数据）
  return Date.now() > expires
}
