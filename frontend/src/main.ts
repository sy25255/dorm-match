import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'

const app = createApp(App)

// 全局错误处理：捕获所有未处理错误，防止白屏
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Global Error]', err, info)
  // 不抛出，防止应用崩溃白屏
}
// Vue 3 中 warnHandler 捕获警告
app.config.warnHandler = (msg, _instance, _trace) => {
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    console.warn('[Network Warning]', msg)
  }
}
// 全局 Promise 拒绝处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
  event.preventDefault() // 阻止默认的错误输出，防止应用崩溃
})

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
