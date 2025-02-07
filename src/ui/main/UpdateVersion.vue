<template>
    <div class="update-progress" v-if="progressInfo.show">
        <div class="mask"></div>
        <div class="progress-content" :style="styleWidth">
            <h4 class="title">
                {{ $t("setting.version_update") }}
                <Icon
                    type="md-close"
                    class="close"
                    v-show="showCloseIcon"
                    @click="handlerClose"
                />
            </h4>
            <div class="content">
                <p v-if="progressInfo.text" class="detail">
                    {{ progressInfo.text }}
                </p>
                <div v-if="progressInfo.percent" class="detail">
                    <p>{{ $t("setting.download") }}</p>
                    <Progress :percent="progressInfo.percent" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ipcRenderer } from "@/platform";
import pkg from "../../../package.json";
import { getPcVersion } from "@/axios";
export default {
    props: {
        type: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            showCloseIcon: false,
            progressInfo: {
                show: false,
                percent: 0,
                text: "",
            },
        };
    },
    created() {
        if (this.type === "login") {
            this.getVersion("login");
        }
    },
    mounted() {
        // 检查更新
        this.$eventBus.$on("update-version", (type) => {
            console.log("update-version", type);
            this.getVersion(type);
        });
        // 错误信息
        ipcRenderer.on("update-error", (e, error) => {
            console.log("update-error", e, error);
            this.showCloseIcon = true;
        });
        //当有可用更新的时候触发。 更新将自动下载。
        ipcRenderer.on("update-available", (a, b) => {
            console.log("update-available", a, b);
            this.progressInfo.show = true;
            this.progressInfo.text = this.$t("setting.downloading");
        });

        ipcRenderer.on("download-progress", (a, progressOb) => {
            console.log("download-progress", progressOb);
            this.progressInfo.text = "";
            this.progressInfo.percent = parseInt(Number(progressOb.percent));
        });
        // 在更新下载完成的时候触发。
        ipcRenderer.on("update-downloaded", (a, b) => {
            console.log("update-downloaded", a, b);
            this.progressInfo.text = this.$t("setting.download_completed");
            this.progressInfo.percent = 0;
            const timer = setTimeout(() => {
                this.progressInfo.show = false;
                timer && clearTimeout(timer);
            }, 2000);
        });
    },
    computed: {
        styleWidth() {
            return {
                width: this.type === "login" ? "calc(100% - 20px)" : "400px",
            };
        },
    },
    methods: {
        //检查更新
        async getVersion(type) {
            try {
                const res = await getPcVersion({});
                const { data, code, message } = res.data;
                if (code === "000000" && data) {
                    this.$store.dispatch("UpdateNewVersion", data.version);
                    let forceUpgrade = Number(data.forceUpgrade);
                    // data.forceUpgrade  0:非强制更新  1:强制更新  2 :无更新提醒 3、未发布状态，（pc 无）
                    if (
                        forceUpgrade !== 2 &&
                        this.mixinCompareVersion(pkg.version, data.version) == 1
                    ) {
                        type === "login" &&
                            this.$emit("setUpdateVersion", {
                                disabledForceUpgrade: 1,
                                upgradeTip: this.$t("setting.download_tip"),
                            });

                        //0一样 1当前版本小 -1当前版本大
                        //检查更新
                        switch (forceUpgrade) {
                            case 0:
                                // 有取消按钮
                                if (["setting", "login"].includes(type)) {
                                    this.$alert({
                                        title: this.$t("web3.notice"),
                                        content: `<div style="max-height:100px;overflow:auto;">${data.content}</div>`,
                                        confirmText: this.$t(
                                            "setting.confirm_update"
                                        ),
                                        cancelText: this.$t("common.cancel"),
                                        width: type === "login" ? "280" : "",
                                        clickToClose: false,
                                        confirmCallback: () => {
                                            ipcRenderer.send("checkForUpdate");
                                        },
                                        cancelCallback: () => {
                                            type === "login" &&
                                                this.$emit("setUpdateVersion", {
                                                    disabledForceUpgrade: 0,
                                                    upgradeTip: "",
                                                });
                                        },
                                    });
                                }
                                break;
                            case 1:
                                // 没有取消按钮 、 强制更新
                                this.$alert({
                                    title: this.$t("web3.notice"),
                                    content: `<div style="max-height:100px;overflow:auto;">${data.content}</div>`,
                                    confirmText: this.$t(
                                        "setting.confirm_update"
                                    ),
                                    width: type === "login" ? "280" : "",
                                    clickToClose: false,
                                    cancelText: "",
                                    confirmCallback: () => {
                                        ipcRenderer.send("checkForUpdate");
                                    },
                                });

                                break;
                        }
                    } else if (type === "setting") {
                        this.$alert({
                            content: this.$t("setting.not_new_version"),
                            isText: true,
                            height: 150,
                            confirmText: this.$t("setting.ok"),
                            cancelText: "",
                        });
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        handlerClose() {
            this.progressInfo.show = false;
            this.type === "login" &&
                this.$emit("setUpdateVersion", {
                    disabledForceUpgrade: 0,
                    upgradeTip: "",
                });
        },
    },
    beforeUnmount() {
        this.$eventBus.$off("update-version");
    },
};
</script>
<style lang="less" scoped>
.update-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    .mask {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.2);
        z-index: 99;
    }
    .progress-content {
        position: relative;
        background: #ffff;
        z-index: 100;
        max-width: 400px;
        height: 140px;
        padding: 5px 10px;
        border-radius: 5px;
        .title {
            text-align: center;
            line-height: 40px;
            font-size: 16px;
            vertical-align: middle;
            .close {
                position: absolute;
                z-index: 1;
                right: 10px;
                top: 14px;
                font-size: 24px;
            }
        }
        .content {
            margin: 20px 10px;
            .detail {
                font-size: 14px;
            }
        }
    }
}
</style>
