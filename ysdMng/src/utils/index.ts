import { materialOptions } from "../pages/process/constant"
interface MaterialItem {
  material: string
  quantity: number | string
}

export const loadImage = async (url: string): Promise<{ buffer: ArrayBuffer; extension: string } | null> => {
    // // #region agent log
    // fetch('http://127.0.0.1:7242/ingest/bb47517f-5071-4ad6-9697-ce0644c52969', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'process/index.vue:loadImage:entry', message: '开始加载图片', data: { url }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // // #endregion
    try {
      const response = await fetch(url)
      // // #region agent log
      // fetch('http://127.0.0.1:7242/ingest/bb47517f-5071-4ad6-9697-ce0644c52969', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'process/index.vue:loadImage:fetch', message: 'fetch响应状态', data: { url, ok: response.ok, status: response.status, statusText: response.statusText }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // // #endregion
      if (!response.ok) {
        console.error("图片加载失败:", url, response.status)
        // // #region agent log
        // fetch('http://127.0.0.1:7242/ingest/bb47517f-5071-4ad6-9697-ce0644c52969', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'process/index.vue:loadImage:error', message: '响应不OK', data: { url, status: response.status }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // // #endregion
        return null
      }
      const arrayBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || ''
      let extension = 'jpeg'
  
      if (contentType.includes('png')) {
        extension = 'png'
      } else if (contentType.includes('gif')) {
        extension = 'gif'
      } else {
        const urlLower = url.toLowerCase()
        if (urlLower.includes('.png')) {
          extension = 'png'
        } else if (urlLower.includes('.gif')) {
          extension = 'gif'
        }
      }
      // // #region agent log
      // fetch('http://127.0.0.1:7242/ingest/bb47517f-5071-4ad6-9697-ce0644c52969', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'process/index.vue:loadImage:success', message: '图片加载成功', data: { url, bufferSize: arrayBuffer.byteLength, contentType, extension }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // // #endregion
  
      return { buffer: arrayBuffer, extension }
    } catch (error) {
      console.error("加载图片失败:", url, error)
      // // #region agent log
      // fetch('http://127.0.0.1:7242/ingest/bb47517f-5071-4ad6-9697-ce0644c52969', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'process/index.vue:loadImage:catch', message: '图片加载异常', data: { url, error: String(error) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // // #endregion
      return null
    }
  }

  export const getMaterialLabel = (materialValue: string | string[]) => {
    if (!materialValue) return "-"
  
    const values = typeof materialValue === 'string' ? materialValue.split(',') : materialValue
    const labels = values.map(val => {
      const material = materialOptions.find(m => m.value === val)
      return material ? material.label : val
    })
  
    return labels.join(', ')
  }


export const formatMaterials = (materials?: MaterialItem[]) => {
    if (!materials || materials.length === 0) return "-"
    return materials.map(item => `${getMaterialLabel(item.material)}:${item.quantity}颗`).join("，")
  }
  
  export const formatEdgeSeating = (value?: number | string) => {
    if (value === 1) return "已就位"
    if (value === 0) return "未就位"
    return "-"
  }
  
  export const formatOcclusionStatus = (value?: number | string) => {
    if (value === 1) return "正常"
    if (value === 0) return "不正常"
    return "-"
  }
  
  export const formatDailyWearStatus = (value?: number | string) => {
    if (value === 1) return "已戴牙"
    if (value === 0) return "未戴牙"
    return "-"
  }