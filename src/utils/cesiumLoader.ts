// Cesium 加载器工具
export class CesiumLoader {
  private static cesium: any = null
  private static loadingPromise: Promise<any> | null = null

  static async loadCesium(): Promise<any> {
    if (this.cesium) {
      return this.cesium
    }

    if (this.loadingPromise) {
      return this.loadingPromise
    }

    this.loadingPromise = this.loadCesiumInternal()
    this.cesium = await this.loadingPromise
    return this.cesium
  }

  private static async loadCesiumInternal(): Promise<any> {
    return new Promise((resolve, reject) => {
      // 检查全局 Cesium
      if (window.Cesium) {
        console.log('✅ Cesium 已从全局加载')
        resolve(window.Cesium)
        return
      }

      // 检查是否已经加载了 Cesium 脚本
      const existingScript = document.querySelector('script[src*="Cesium.js"]')
      if (existingScript) {
        // 等待脚本加载完成
        existingScript.addEventListener('load', () => {
          if (window.Cesium) {
            console.log('✅ Cesium 脚本加载完成')
            resolve(window.Cesium)
          } else {
            reject(new Error('Cesium 脚本加载失败'))
          }
        })
        existingScript.addEventListener('error', () => {
          reject(new Error('Cesium 脚本加载失败'))
        })
        return
      }

      // 动态加载 Cesium 脚本
      const script = document.createElement('script')
      script.src = '/my_page/cesium/Cesium.js'
      script.async = true
      script.onload = () => {
        if (window.Cesium) {
          console.log('✅ Cesium 脚本动态加载完成')
          resolve(window.Cesium)
        } else {
          reject(new Error('Cesium 脚本加载失败'))
        }
      }
      script.onerror = () => {
        reject(new Error('Cesium 脚本加载失败'))
      }
      document.head.appendChild(script)

      // 同时加载 CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/my_page/cesium/Widgets/widgets.css'
      document.head.appendChild(link)
    })
  }

  static getCesium(): any {
    if (!this.cesium) {
      throw new Error('Cesium 尚未加载，请先调用 loadCesium()')
    }
    return this.cesium
  }
}

// 扩展 Window 接口
declare global {
  interface Window {
    Cesium: any;
  }
}



