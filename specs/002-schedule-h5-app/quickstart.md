# Quick Start: React移动端H5应用开发指南

**Date**: 2026-01-26  
**Feature**: 智能排班助手H5前端应用 - React技术栈迁移

## 项目初始化

### 1. 创建项目

```bash
# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest schedule-h5-react -- --template react-ts

cd schedule-h5-react

# 安装依赖
npm install
```

### 2. 安装核心依赖

```bash
# 路由
npm install react-router-dom@6

# 状态管理
npm install zustand

# 日期处理
npm install dayjs

# HTTP请求
npm install axios

# 样式处理
npm install sass clsx

# 开发依赖
npm install -D @types/react-router-dom
```

### 3. 项目结构设置

```bash
mkdir -p src/{components,pages,stores,services,utils,hooks,types,styles}
mkdir -p src/components/{ChatMessage,ScheduleItem,Calendar,TabBar}
mkdir -p src/pages/{Chat,Schedule}
mkdir -p src/pages/Schedule/Detail
mkdir -p public
```

## 核心功能实现

### 1. 配置 Vite

创建 `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3006',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'utils-vendor': ['dayjs', 'axios', 'zustand']
        }
      }
    }
  }
})
```

### 2. 配置 TypeScript

更新 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. 类型定义

创建 `src/types/chat.ts`:

```typescript
export type MessageRole = 'user' | 'assistant'
export type MessageType = 'text' | 'confirm' | 'error'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  type?: MessageType
  scheduleData?: SuggestedSchedule
  isStreaming?: boolean
}

export interface SuggestedSchedule {
  project: string
  doctor_id: number
  doctor_name: string
  nurse_id?: number
  nurse_name?: string
  customer_id: number
  customer_name: string
  room: string
  start_time: string
  duration: number
  remark?: string
}
```

创建 `src/types/schedule.ts`:

```typescript
export type ProjectType = '面诊' | '备牙' | '戴牙' | '椅旁' | '复诊' | '雕蜡' | '蜡形试戴'

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
  project_type: ProjectType
  room_id: string
  room_name: string
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
  project_type?: ProjectType
}
```

### 4. HTTP请求工具

创建 `src/utils/request.ts`:

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data
    if (code === 0) {
      return data || response.data
    } else {
      return Promise.reject(new Error(message || '请求失败'))
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return instance.request<T>(config)
}

export default instance
```

### 5. SSE流式响应工具

创建 `src/utils/sse.ts`:

```typescript
export interface SSEMessage {
  type: 'chunk' | 'complete'
  content?: string
  data?: any
}

export async function* streamSSE(
  url: string,
  data: any
): AsyncGenerator<SSEMessage, void, unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          yield data
        } catch (e) {
          console.error('Failed to parse SSE data:', e)
        }
      }
    }
  }
}
```

### 6. 状态管理 - ChatStore

创建 `src/stores/chatStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatMessage } from '@/types/chat'

interface ChatStoreState {
  sessionId: string
  messages: ChatMessage[]
  isConnecting: boolean
  error: string | null
  setSessionId: (id: string) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  clearMessages: () => void
  setConnecting: (connecting: boolean) => void
  setError: (error: string | null) => void
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set) => ({
      sessionId: '',
      messages: [],
      isConnecting: false,
      error: null,
      setSessionId: (id) => set({ sessionId: id }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          )
        })),
      clearMessages: () => set({ messages: [] }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setError: (error) => set({ error })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages
      })
    }
  )
)
```

### 7. 状态管理 - ScheduleStore

创建 `src/stores/scheduleStore.ts`:

```typescript
import { create } from 'zustand'
import { Schedule, ScheduleFilter } from '@/types/schedule'

interface ScheduleStoreState {
  scheduleList: Schedule[]
  selectedDate: string | null
  filter: ScheduleFilter
  loading: boolean
  error: string | null
  setScheduleList: (schedules: Schedule[]) => void
  addSchedule: (schedule: Schedule) => void
  setSelectedDate: (date: string | null) => void
  setFilter: (filter: Partial<ScheduleFilter>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useScheduleStore = create<ScheduleStoreState>((set) => ({
  scheduleList: [],
  selectedDate: null,
  filter: {},
  loading: false,
  error: null,
  setScheduleList: (schedules) => set({ scheduleList: schedules }),
  addSchedule: (schedule) =>
    set((state) => ({ scheduleList: [...state.scheduleList, schedule] })),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setFilter: (filter) =>
    set((state) => ({ filter: { ...state.filter, ...filter } })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))
```

### 8. API服务

创建 `src/services/aiSchedule.ts`:

```typescript
import { streamSSE } from '@/utils/sse'
import { request } from '@/utils/request'
import { SuggestedSchedule } from '@/types/chat'

export async function* sendChatMessage(
  params: {
    session_id?: string
    message: string
    user_id?: number
  }
): AsyncGenerator<any, void, unknown> {
  yield* streamSSE('/api/ai-schedule/chat', params)
}

export function confirmSchedule(data: {
  session_id: string
  suggested_schedule: SuggestedSchedule
  is_vip_priority?: boolean
}) {
  return request({
    url: '/api/ai-schedule/confirm',
    method: 'POST',
    data
  })
}

export function getChatHistory(sessionId: string) {
  return request({
    url: `/api/ai-schedule/history/${sessionId}`,
    method: 'GET'
  })
}
```

创建 `src/services/schedule.ts`:

```typescript
import { request } from '@/utils/request'
import { ScheduleFilter, Schedule } from '@/types/schedule'

export function getScheduleList(filter: ScheduleFilter): Promise<Schedule[]> {
  return request({
    url: '/api/schedule/list',
    method: 'POST',
    data: filter
  })
}
```

### 9. 自定义Hooks

创建 `src/hooks/useSSE.ts`:

```typescript
import { useEffect, useRef } from 'react'
import { sendChatMessage } from '@/services/aiSchedule'
import { useChatStore } from '@/stores/chatStore'

export function useSSE() {
  const { addMessage, updateMessage, setConnecting, setError } = useChatStore()
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = async (
    message: string,
    sessionId?: string,
    userId?: number
  ) => {
    abortControllerRef.current = new AbortController()
    setConnecting(true)
    setError(null)

    try {
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: message,
        timestamp: Date.now()
      }
      addMessage(userMessage)

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      }
      addMessage(assistantMessage)

      for await (const chunk of sendChatMessage({
        session_id: sessionId,
        message,
        user_id: userId
      })) {
        if (chunk.type === 'chunk') {
          updateMessage(assistantMessage.id, {
            content: (assistantMessage.content || '') + (chunk.content || '')
          })
        } else if (chunk.type === 'complete') {
          updateMessage(assistantMessage.id, {
            content: chunk.data?.response || assistantMessage.content,
            isStreaming: false,
            scheduleData: chunk.data?.suggested_schedule
          })
        }
      }
    } catch (error: any) {
      setError(error.message || '发送消息失败')
      updateMessage(assistantMessage.id, {
        isStreaming: false,
        type: 'error'
      })
    } finally {
      setConnecting(false)
    }
  }

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return { sendMessage }
}
```

### 10. 路由配置

创建 `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChatPage from '@/pages/Chat'
import SchedulePage from '@/pages/Schedule'
import ScheduleDetailPage from '@/pages/Schedule/Detail'
import TabBar from '@/components/TabBar'
import './styles/index.scss'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/schedule/detail" element={<ScheduleDetailPage />} />
      </Routes>
      <TabBar />
    </BrowserRouter>
  )
}

export default App
```

### 11. 移动端适配样式

创建 `src/styles/variables.scss`:

```scss
// 颜色变量
$primary-color: #3cc51f;
$text-color: #333333;
$bg-color: #FFFBF5;
$border-color: #e5e5e5;

// 字体大小（基于375px设计稿）
$font-size-base: 16px;
$font-size-small: 14px;
$font-size-large: 18px;
```

创建 `src/styles/mixins.scss`:

```scss
@mixin mobile-only {
  @media (max-width: 768px) {
    @content;
  }
}

@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

创建 `src/styles/index.scss`:

```scss
@import './variables';
@import './mixins';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: calc(100vw / 375 * 16);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: $bg-color;
  color: $text-color;
  font-size: $font-size-base;
  overflow-x: hidden;
}

@media (orientation: landscape) {
  html {
    font-size: calc(100vh / 667 * 16);
  }
}
```

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm run test
```

## 下一步

1. 实现 ChatMessage 组件
2. 实现 ScheduleItem 组件
3. 实现 Calendar 组件
4. 实现 TabBar 组件
5. 实现 Chat 页面
6. 实现 Schedule 页面
7. 实现 Schedule Detail 页面
8. 添加错误处理和加载状态
9. 优化移动端体验
10. 编写测试用例
