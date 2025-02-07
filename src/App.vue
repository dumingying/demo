<template>
    <div
        id="app-main"
        style="width: 100vw; height: 100vh"
        @contextmenu.prevent=""
        @dragenter="$event.preventDefault()"
        @dragover="$event.preventDefault()"
        @drop="$event.preventDefault()"
        v-visibility-change="visibilityChange"
    >
        <div
            v-if="!sharedMiscState.isElectron"
            id="blur-container"
            class="blur-container"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                width="100%"
                height="100%"
                id="blurred_mkvvpnf50"
                class="blured-img"
                viewBox="0 0 1920 875"
                preserveAspectRatio="none"
            >
                <filter id="blur_mkvvpnf">
                    <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation="50"
                    ></feGaussianBlur>
                </filter>
                <image
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    externalResourcesRequired="true"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    xlink:href="https://static.wildfirechat.net/web_wfc_bg2.jpeg"
                    style="filter: url(#blur_mkvvpnf)"
                    preserveAspectRatio="none"
                ></image>
            </svg>
            <div class="blur-mask"></div>
        </div>
        <!--用来实现视频缩略图-->
        <div id="styled_video_container" class="styled_video_container">
            <video
                id="bgvid"
                playsinline
                autoplay
                muted
                loop
                crossorigin="anonymous"
            >
                <!-- <source src="http://thenewcode.com/assets/videos/polina.webm" type="video/webm">
                <source src="http://thenewcode.com/assets/videos/polina.mp4" type="video/mp4"> -->
            </video>
        </div>
        <notifications />
        <IpcMain />
        <router-view
            id="main-content-container"
            class="main-content-container"
        ></router-view>
    </div>
</template>

<script>
import store from "@/store";
import { isElectron, currentWindow } from "@/platform";
import IpcMain from "./ipc/ipcMain";
import wfc from "./wfc/client/wfc";
import { getItem, setItem } from "./ui/util/storageHelper";
export default {
    name: "App",
    data() {
        return {
            url: "",
            sharedMiscState: store.state.misc,
        };
    },
    methods: {
        visibilityChange(event, hidden) {
            store.setPageVisibility(!hidden);
            //   console.log("page visibilityChange", hidden);
            if (!hidden && !isElectron()) {
                wfc.onForeground();
            }
        },
        // onblur() {
        //   store.setPageVisibility(false);
        // },
        onfocus() {
            store.setPageVisibility(true);
        },
        async getDevices() {
            try {
                let res = await navigator.mediaDevices.enumerateDevices();
                let audioInList = res.filter((item) => {
                    return (
                        item.kind === "audioinput" &&
                        item.deviceId !== "communications"
                    );
                });
                let audioOutList = res.filter((item) => {
                    return (
                        item.kind === "audiooutput" &&
                        item.deviceId !== "communications"
                    );
                });
                let videoList = res.filter((item) => {
                    return item.kind === "videoinput";
                });
                // 媒体设备信息
                this.$store.dispatch("UpdateDeviceObj", {
                    hasAudio: !!audioInList.length,
                    hasVideo: !!videoList.length,
                    audioInList: audioInList,
                    audioOutList: audioOutList,
                    videoList: videoList,
                });
            } catch (error) {
                console.log(error, "---获取外接设备失败--");
            }
        },
    },

    created() {
        let root = document.documentElement;
        if (isElectron() || window.location.href.indexOf("voip") >= 0) {
            root.style.setProperty("--main-margin-left", "0px");
            root.style.setProperty("--main-margin-right", "0px");
            root.style.setProperty("--main-margin-top", "0px");
            root.style.setProperty("--main-margin-bottom", "0px");
            root.style.setProperty("--composite-message-page-width", "100vw");
            root.style.setProperty("--composite-message-page-height", "100vh");
        }

        if (this.sharedMiscState.isElectronWindowsOrLinux) {
            root.style.setProperty("--main-border-radius", "0px");
            root.style.setProperty("--home-menu-padding-top", "0px");

            //set window scrollbar style
            document.styleSheets[0].insertRule(
                "::-webkit-scrollbar{width:8px;}"
            );
            document.styleSheets[0].insertRule(
                "::-webkit-scrollbar-thumb{display:none;}"
            );
            document.styleSheets[0].insertRule(
                ":hover ::-webkit-scrollbar-thumb{display:block;border-radius:20px;background: #808080;}"
            );
        }
        window.addEventListener("blur", this.onblur);
        window.addEventListener("focus", this.onfocus);

        if (isElectron()) {
            currentWindow.minimizable = this.sharedMiscState.enableMinimize;
        }
    },

    mounted() {
        let href = window.location.href;
        if (href.indexOf("voip") >= 0 || href.indexOf("files") >= 0) {
            let app = document.getElementById("app-main");
            let el = document.getElementById("blur-container");
            el && app.removeChild(el);
            el = document.getElementById("styled_video_container");
            el && app.removeChild(el);
            el = document.getElementById("main-content-container");
        }

        this.$eventBus.$on("uploadFile", (file) => {
            if (!file) {
                return;
            }
            //   !wfc.isSupportBigFilesUpload()
            if (file.size > 200 * 1024 * 1024) {
                this.$alert({
                    width: 260,
                    height: 140,
                    content: this.$t("home.file_size_total"),
                    confirmText: this.$t("voip.i_known"),
                    cancelText: "",
                });
                // this.$notify({
                //     title: this.$t("web3.notice"),
                //     text: this.$t("home.file_size_total"),
                //     type: "warn",
                // });
            }
        });

        // 检测当前是否有外接设备
        try {
            // 获取音视频数据的api，这里需要给浏览器授权。audio和video都为true表示采集的既有音频又有视频数据
            // 监听外接设备变化
            navigator.mediaDevices.ondevicechange = this.getDevices;
            // 获取
            this.getDevices();
        } catch (error) {
            console.log(error, "无法调取摄像头");
        }
    },
    beforeUnmount() {
        this.$eventBus.$off("uploadFile");
        window.removeEventListener("blur", this.onblur);
        window.removeEventListener("focus", this.onfocus);
    },
    watch: {
        $route() {
            if (this.$route.path === "/" || this.$route.path === "/login") {
                store.setEnableMinimize(false);
            } else {
                store.setEnableMinimize(true);
            }
            if (!getItem("lang") && this.$i18n.locale) {
                setItem("lang", this.$i18n.locale);
            }
        },
    },
    components: {
        IpcMain,
    },
};
</script>

<!--should not scoped-->
<style lang="css">
:root {
    --main-border-radius: 10px;
    --main-margin-left: 80px;
    --main-margin-right: 80px;
    --main-margin-top: 50px;
    --main-margin-bottom: 50px;
    --tippy-right: 0px;
    --home-menu-padding-top: 60px;
    --composite-message-page-width: 100%;
    --composite-message-page-height: 100%;
    --scrollbar-window-width: 0px;
}

.tippy-tooltip {
    right: var(--tippy-right) !important;
    border: 1px solid #f5f5f5 !important;
    background-color: #fcfcfc !important;
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.125);
}

#app {
    position: relative;
}
.blur-container {
    overflow: hidden;
    height: 100vh;
    width: 100vw;
    z-index: -10;
    position: fixed;
    margin: 0;
}

.blur-container .blur-mask {
    position: absolute;
    left: 0;
    top: 0;
    height: 100vh;
    width: 100vw;
    background: rgba(0, 0, 0, 0.2);
    overflow: hidden;
}

.styled_video_container {
    position: fixed;
    top: 0;
    left: 0;
    width: auto;
    height: auto;
    z-index: -999;
    background-size: cover;
    transition: 1s opacity;
}

.main-content-container {
    z-index: 999;
    position: absolute;
    width: calc(100vw - var(--main-margin-left) - var(--main-margin-right));
    height: calc(100vh - var(--main-margin-top) - var(--main-margin-bottom));
    top: 0;
    left: 0;
    margin: var(--main-margin-top) var(--main-margin-right)
        var(--main-margin-bottom) var(--main-margin-left);
    display: flex;
    justify-content: center;
    align-items: center;
}
.main-content-container.single-container,
.main-content-container.multi-container {
    background-color: #292929;
}
em.vip-icon-em {
    width: 18px;
    height: 18px;
    display: inline-block;
    vertical-align: middle;
    margin-right: 2px;
}
em.vip-icon-0 {
    background: url("./assets/images/vip-0.png") no-repeat center center;
    background-size: 100%;
}
em.vip-icon-1 {
    background: url("./assets/images/vip-1.png") no-repeat center center;
    background-size: 100%;
}
em.vip-icon-2 {
    background: url("./assets/images/vip-2.png") no-repeat center center;
    background-size: 100%;
}
em.vip-icon-3 {
    background: url("./assets/images/vip-3.png") no-repeat center center;
    background-size: 100%;
}
em.vip-icon-4 {
    background: url("./assets/images/vip-4.png") no-repeat center center;
    background-size: 100%;
}
.viewer-container {
    background: rgba(0, 0, 0, 0.5);
}

/* ::-webkit-scrollbar {
  width: var(--scrollbar-window-width);
  height: 0px;
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  border-radius: 20px;
  -webkit-box-shadow: inset 0 0 1px rgba(202, 202, 202, 0.8);
  background-color: rgba(202, 202, 202, 0.8);
} */
</style>
