import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import router from "./routers";

import wfc from "./wfc/client/wfc";
import VueTippy from "vue-tippy";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import VCalendar from "v-calendar";
import "v-calendar/style.css";

import VueContext from "@madogai/vue-context/dist/vue-context";

import VModal from "./vendor/vue-js-modal";
import uploader from "vue-simple-uploader";
import "vue-simple-uploader/dist/style.css";

import "./global.css";
import "./wfc.css";
import "./assets/fonts/icomoon/style.css";

import store from "@/store";
import visibility from "./vendor/vue-visibility-change";
import { isElectron } from "@/platform";
import { getItem } from "./ui/util/storageHelper";

import { createI18n, I18nT } from "vue-i18n";
import Notifications from "@kyvg/vue3-notification";

import Alert from "@/ui/common/Alert";
import Toast from "@/ui/common/Toast";
import Picker from "@/ui/common/Picker";
import PickerGroup from "@/ui/common/PickerGroup";
import Forward from "@/ui/common/Forward";
import Voip from "@/ui/common/Voip";

import mixins from "./mixins";
import ViewUIPlus from "view-ui-plus";
import "view-ui-plus/dist/styles/viewuiplus.css";
import zh from "view-ui-plus/dist/locale/zh-CN";
import en from "view-ui-plus/dist/locale/en-US";

import vuexStore from "./vuex";

import xss from "xss";
import mitt from "mitt";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// init
{
    // pc
    if (isElectron()) {
        let href = window.location.href;
        let path = href.substring(href.indexOf("#") + 1);
        console.log("init", href, path);
        if (
            path === "/" /*login*/ ||
            path.startsWith("/home") ||
            href.indexOf("#") === -1
        ) {
            wfc.init();
            // 双网环境配置
            //// 设置网络策略
            //wfc.setBackupAddressStrategy(0)
            //// 设置备选网络
            //wfc.setBackupAddress('192.168.10.11', 80)
            store.init(true);
        } else {
            wfc.attach();

            // TODO 优化，有的窗口并不需要store，或者不需要加载所有默认数据
            store.init(false);
        }
        // web
    } else {
        wfc.init();
        // 双网环境配置
        // 可以根据访问网页的地址，配置是否切换备选网络策略
        // 比如公网，通过域名访问，采用默认的主网络；内网，通过ip访问，使用备选网络
        // 需要在wfc.connect之前调用
        // if (new URL(window.origin).host.startsWith('192.168.2.169')) {
        //     // 设置备选网络不走WSS
        //     Config.USE_WSS = false;
        //     // 设置网络策略
        //     wfc.setBackupAddressStrategy(2)
        //     // 设置备选网络
        //     wfc.setBackupAddress('192.168.10.11', 80)
        // }
        store.init(true);
    }
}
// init end
app.use(
    VueTippy,
    // optional
    {
        directive: "tippy", // => v-tippy
        component: "tippy", // => <tippy/>
        componentSingleton: "tippy-singleton", // => <tippy-singleton/>,
        defaultProps: {
            theme: "light",
            placement: "auto-end",
            allowHTML: true,
        }, // => Global default options * see all props
    }
);

I18nT.props.scope.default = "global";
const i18n = createI18n({
    // 使用localStorage存储语言状态是为了保证页面刷新之后还是保持原来选择的语言状态
    locale: getItem("lang") ? getItem("lang") : "zh-CN", // 定义默认语言为中文
    globalInjection: true,
    allowComposition: true,
    fallbackLocale: "zh-CN",
    legacy: false,
    messages: {
        "zh-CN": {
            ...require("@/assets/lang/zh-CN.json"),
            ...zh,
        },
        // "zh-TW": require("@/assets/lang/zh-TW.json"),
        en: {
            ...require("@/assets/lang/en.json"),
            ...en,
        },
    },
});
app.use(i18n);
app.use(ViewUIPlus, { i18n });
app.use(uploader);
app.use(VCalendar, {});

app.component("vue-context", VueContext);
app.use(VueContext);
app.use(visibility);
app.use(VModal);

app.use(Alert);
app.use(Toast);
app.use(Picker);
app.use(PickerGroup);
app.use(Forward);
app.use(Voip);
app.use(vuexStore);
app.use(Notifications);
app.use(router);
app.use(xss);
// 使 v-real-img 在所有组件中都可用
app.directive("real-img", async (el, binding) => {
    let imgURL = binding.value;
    // 获取图片地址
    let defaultURL = el.getAttribute("default-img"); // 获取默认图片地址
    if (imgURL) {
        let exist = await new Promise((resolve) => {
            var img = new Image();
            img.onload = function () {
                if (this.complete === true) {
                    resolve(true);
                    img = null;
                }
            };
            img.onerror = function () {
                resolve(false);
                img = null;
            };
            img.src = imgURL;
        });
        if (exist) {
            el.setAttribute("src", imgURL);
            el.setAttribute("data-error", "");
        } else {
            if (defaultURL) {
                el.setAttribute("src", defaultURL);
                el.setAttribute("data-error", "error");
            }
        }
    }
});

app.config.globalProperties.$router = router;
app.config.globalProperties.$store = vuexStore;

app.mixin(mixins);

const eventBus = mitt();
eventBus.$on = eventBus.on;
eventBus.$off = eventBus.off;
eventBus.$emit = eventBus.emit;
app.config.globalProperties.$eventBus = eventBus;

app.config.globalProperties.xss = xss;
app.config.globalProperties.xssOptions = () => {
    let whiteList = xss.getDefaultWhiteList();
    window.__whiteList = whiteList;
    //xss 处理的时候，默认会将 img 便签的class属性去除，导致 emoji 表情显示太大
    //这儿配置保留 img 标签的style、class、src、alt、id 属性
    whiteList.img = ["style", "class", "src", "alt", "id"];
    return {
        whiteList,
    };
};

app.config.globalProperties.$set = (obj, key, value) => (obj[key] = value);

app.mount("#app");
