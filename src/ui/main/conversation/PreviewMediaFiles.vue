<template>
    <div class="preview-container">
        <Spin v-if="loading"></Spin>
        <div v-if="type" class="video-wrap">
            <video
                controls
                draggable="true"
                ref="video"
                :poster="posterImg"
                v-bind:src="videoInfo.src"
            />
        </div>
    </div>
</template>

<script>
import { ipcRenderer, currentWindow, remote } from "@/platform";
import { checkImFileExist } from "@/axios";
import wfc from "@/wfc/client/wfc";
import Config from "@/config";

import "viewerjs/dist/viewer.css";
import { api as viewerApi } from "v-viewer";
let $viewer;
export default {
    data() {
        return {
            type: "", // 0图片或者1视频
            images: [],
            options: {
                backdrop: false, // 遮罩层关闭
                button: false,
                navbar: false,
                title: false,
                fullscreen: false,
                loading: true,
                loop: true,
                transition: true,
                toolbar: {
                    zoomIn: true,
                    zoomOut: true,
                    reset: true,
                    play: false, // 播放
                    rotateLeft: true,
                    rotateRight: true,
                    flipHorizontal: true,
                    flipVertical: true,
                    prev: this.handlePrev,
                    next: this.handleNext,
                },
                hide: this.hide,
            },
            loading: true,
            brokenImage: require("@/assets/images/broken-image.png"),
            mediaLoaded: false,
            videoInfo: {},
        };
    },
    created() {
        this.loading = true;
        // 处理图片显示
        ipcRenderer.on("show-preview-window", (event, args) => {
            this.type = args.type;
            // type 0: 图片 1:视频
            if (this.type) {
                this.loading = false;
                this.videoInfo = args;
            } else {
                // 设置默认值 _isCheck:0
                this.images = args.images.map((item) => {
                    return {
                        ...item,
                        src: item.src || item.thumb || this.brokenImage, // src 为空时需要替补缩略图或者默认破损图，否则页面会空白
                        _isCheck: 0, // 初始标记为未检测图片
                        _isBrokenImage: !item.src, // 标记当前是否是 已经破损的图片
                    };
                });
                this.loading = !this.images.length;
                //当前图片设置已验证且为成功可查看
                if (!$viewer) {
                    $viewer = viewerApi({
                        options: {
                            ...this.options,
                            initialViewIndex: args.index,
                        },
                        images: this.images,
                    });
                }
            }
        });
    },
    computed: {
        posterImg() {
            if (!this.videoInfo.thumbnail) retrun;
            return `data:video/jpeg;base64,${this.videoInfo.thumbnail}`;
        },
    },
    mounted() {
        // 监听按键信息
        if (this.type === 0) {
            window.addEventListener("keydown", (e) => {
                const code = e.keyCode;
                if ([37, 39].includes(code)) {
                    this.setImageCheck();
                }
            });
        }
    },
    methods: {
        // 点击上一个
        handlePrev() {
            $viewer.prev(true);
            this.setImageCheck();
        },
        // 点击下一个
        handleNext() {
            $viewer.next(true);
            this.setImageCheck();
        },
        // 键盘，esc 关闭时窗口也要关闭
        hide() {
            currentWindow.close();
        },
        async setImageCheck() {
            this.$Toast.hide();
            //检查一下是否过期
            if (!this.images[$viewer.index]._isCheck) {
                try {
                    this.images[$viewer.index] = await this.handlerCheckImFile(
                        this.images[$viewer.index]
                    );
                    // 针对这类损坏的图片进行提示
                    if (
                        this.images[$viewer.index] &&
                        this.images[$viewer.index]._isBrokenImage
                    ) {
                        this.$Toast.show({
                            type: "error",
                            text: this.$t("message.expired", [
                                this.$t("common.photo"),
                            ]),
                            time: 2000,
                        });
                    }
                } catch (error) {}
            }
        },
        //检查图片是否过期
        handlerCheckImFile(item) {
            return new Promise(async (resolve, reject) => {
                // 标记为损坏的图片直接返回
                if (item && item._isBrokenImage) {
                    item._isCheck = -1;
                    resolve(item);
                    // 兼容移动端的相对路径图片
                } else if (item.src.startsWith("/fs/")) {
                    item.src = `${Config.STATIC_SERVER}/im-fs${item.src}`;
                } else if (item.src.startsWith("fs/")) {
                    item.src = `${Config.STATIC_SERVER}/im-fs/${item.src}`;
                }
                // 云盘资源暂时不用检测
                if (
                    item.src.indexOf(Config.CLOUD_IMG_SERVER) > -1 ||
                    item.src.indexOf(Config.CLOUD_IMG_SERVER_QA) > -1
                ) {
                    item._isCheck = 1;
                    resolve(item);
                } else {
                    try {
                        let res = await checkImFileExist({
                            userId: wfc.getUserId(),
                            url: item.src,
                        });
                        let { code } = res.data;
                        if (code === "000000") {
                            item._isCheck = 1;
                            resolve(item);
                        } else {
                            item._isCheck = -1;
                            item.src = item.thumb || this.brokenImage;
                            item._isBrokenImage = true;
                            resolve(item);
                        }
                    } catch (error) {
                        console.log(error);
                        this.$Message.error(this.$t("common.error_later"));
                        reject(item);
                    }
                }
            });
        },
    },
};
</script>
<style lang="less" scoped>
.preview-container {
    .video-wrap {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        video {
            max-width: 100%;
            max-height: 100%;
        }
    }
    .images {
        width: 100vw;
        height: 100vh;
    }
}
</style>
