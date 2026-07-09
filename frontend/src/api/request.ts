/** 智翼平台 — Axios 请求封装 */

import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  // 开发环境使用相对路径走 Vite 代理，生产环境由 .env.production 指定
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
})

// ── 请求拦截器：自动注入 Bearer Token ──
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── 响应拦截器：统一错误处理 ──
request.interceptors.response.use(
  (res) => {
    const body = res.data
    // 统一响应格式 { code, message, data }
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) {
        return body.data as unknown
      }
      // 业务错误（silent 模式下不弹窗）
      if (!(res.config as any)?.silent) {
        ElMessage.error(body.message || '请求失败')
      }
      return Promise.reject(new Error(body.message))
    }
    return body
  },
  (error) => {
    // 401 始终提示并跳转（不跟随 silent）
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else if (error.response?.status === 403) {
      if (!(error.config as any)?.silent) {
        ElMessage.error('无权访问该资源')
      }
    } else if (!error.config?.url?.includes('/summaries/generate')) {
      // SSE 接口的错误在 useSSE 中处理，不出全局弹窗
      if (!(error.config as any)?.silent) {
        if (error.response) {
          // 服务端返回了 HTTP 错误
          // FastAPI 的 HTTPException 格式为 { detail: { message: "..." } }
          // 普通业务错误格式为 { message: "..." }
          const msg =
            (error.response.data as any)?.detail?.message ||
            error.response.data?.message ||
            `请求失败 (${error.response.status})`
          ElMessage.error(msg)
        } else if (error.code === 'ECONNABORTED') {
          ElMessage.error('请求超时，请稍后重试')
        } else {
          // 无响应 = 网络不通或后端未启动
          ElMessage.error('无法连接到服务器，请确认后端服务已启动')
        }
      }
    }
    return Promise.reject(error)
  },
)

/** GET 请求 */
export function get<T = unknown>(url: string, params?: object, config?: object): Promise<T> {
  return request.get(url, { params, ...config }) as Promise<T>
}

/** POST 请求 */
export function post<T = unknown>(url: string, data?: object, config?: object): Promise<T> {
  return request.post(url, data, config) as Promise<T>
}

/** PUT 请求 */
export function put<T = unknown>(url: string, data?: object, config?: object): Promise<T> {
  return request.put(url, data, config) as Promise<T>
}

/** DELETE 请求 */
export function del<T = unknown>(url: string, config?: object): Promise<T> {
  return request.delete(url, config) as Promise<T>
}

/** PATCH 请求 */
export function patch<T = unknown>(url: string, data?: object, config?: object): Promise<T> {
  return request.patch(url, data, config) as Promise<T>
}

export default request
