import { createApp } from "vue"
import ToastView from "./ToastView.vue";
export default {
    toast: null,
    install(app) {
        if (this.toast) {
            // 防止多次载入
            app.config.globalProperties.$Toast = this.toast
            return
        }
        // 创建toast实例，用于挂载
        let instance = createApp(ToastView)
        // 创建div元素装载toast对象
        let div = document.createElement("div")
        let body = document.body
        // 导入body中
        body.appendChild(div)
        this.toast = instance.mount(div)
        // 挂载vue身上
        app.config.globalProperties.$Toast = this.toast;
    }
}
