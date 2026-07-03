// ================================================================
// 智翼 (ZhiYi) — Axios 请求封装
// 统一拦截器：Token 注入、错误处理、响应解包
// ================================================================

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import type { IApiResponse } from './types'

// ── 创建 Axios 实例 ──
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ================================================================
// 请求拦截器：自动注入 Token
// ================================================================
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ================================================================
// 响应拦截器：解包 data + 统一错误处理
// ================================================================
instance.interceptors.response.use(
  (res: AxiosResponse<IApiResponse>) => {
    const body = res.data

    // 业务层错误（code !== 0）
    if (body.code !== 0) {
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message || '请求失败'))
    }

    // 成功：直接返回 data（业务代码无需 .data.data）
    return body.data as any
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    switch (status) {
      case 401:
        // Token 过期或无效 → 清除登录态 → 跳转登录
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (router.currentRoute.value.path !== '/login') {
          ElMessage.error('登录已过期，请重新登录')
          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.value.fullPath },
          })
        }
        break
      case 403:
        ElMessage.error('无权执行该操作')
        break
      case 404:
        ElMessage.error(message || '请求的资源不存在')
        break
      case 429:
        ElMessage.warning('请求过于频繁，请稍后再试')
        break
      case 500:
        ElMessage.error('服务器内部错误，请稍后再试')
        break
      default:
        ElMessage.error(message || '网络异常，请检查连接')
    }

    return Promise.reject(error)
  }
)

// ================================================================
// 类型安全的请求方法
// ================================================================

/** GET 请求 */
export function get<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.get(url, { params, ...config })
}

/** POST 请求 */
export function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.post(url, data, config)
}

/** PUT 请求 */
export function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.put(url, data, config)
}

/** PATCH 请求 */
export function patch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.patch(url, data, config)
}

/** DELETE 请求 */
export function del<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return instance.delete(url, config)
}

export default instance
