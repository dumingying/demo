<template>
    <div class="login-container">
        <ElectronWindowsControlButtonView
            style="position: absolute; top: 0; right: 0"
            :maximizable="false"
            v-if="sharedMiscState.isElectronWindowsOrLinux"
        />
        <div class="drag-area" :style="dragAreaWidth"></div>
        <!-- 网络断开 -->
        <div class="offline-wrap" v-if="isOffline">
            <div class="offline-content">
                <img
                    src="../../assets/images/icon.png"
                    alt=""
                    draggable="false"
                />
                <p>{{ $t("login.network_connection_lost") }}</p>
                <span>{{ $t("login.check_network") }}</span>
            </div>
        </div>
        <div class="qr-container1" v-if="loginStatus == 1">
            <img
                v-if="qrCode"
                :src="qrCode"
                alt=""
                @error="mixinImgUrlAlt"
                draggable="false"
            />
            <p v-else-if="upgradeTip">{{ this.upgradeTip }}</p>
            <p v-else>{{ $t("misc.gen_qr_code") }}</p>
        </div>
        <div v-else class="qr-container">
            <img
                v-if="qrCode"
                :src="qrCode"
                alt=""
                @error="mixinImgUrlAlt"
                draggable="false"
            />
            <p v-else-if="upgradeTip">{{ this.upgradeTip }}</p>
            <p v-else>{{ $t("misc.gen_qr_code") }}</p>
            <ClipLoader
                v-if="loginStatus === 4"
                class="loading"
                :color="'white'"
                :height="'80px'"
                :width="'80px'"
            />
        </div>
        <div class="login-action-container">
            <!-- 等待扫码-->
            <div v-if="loginStatus === 0" class="pending-scan">
                <p>{{ $t("login.desc") }}</p>
            </div>
            <!-- 已经扫码-->
            <div v-else-if="loginStatus === 1" class="scanned">
                <p class="success-text new-single-line">
                    {{ userName + $t("login.scan_qr_success") }}
                </p>
                <p class="tip-text">{{ $t("login.confirm_login_tip") }}</p>
                <p class="remember-text">
                    {{ $t("login.remember_me") }}
                    <label class="checkbox-wrap">
                        <input
                            type="checkbox"
                            class="checkbox"
                            v-model="enableAutoLogin"
                        />
                        <span>
                            <Icon type="md-checkmark" />
                        </span>
                    </label>
                </p>
                <button @click="cancel" class="button-cancel">
                    {{ $t("login.cancel_login") }}
                </button>
            </div>

            <!-- 存在session，等待发送给客户端验证-->
            <div v-if="loginStatus === 2" class="pending-quick-login">
                <button
                    :disabled="!!disabledForceUpgrade"
                    @click="sendQuickLoginRequest"
                    :class="[
                        'button-confirm',
                        { disabled: disabledForceUpgrade },
                    ]"
                >
                    {{ $t("login.login") }}
                </button>
                <button
                    @click="cancel"
                    v-show="!disabledForceUpgrade"
                    class="button-cancel"
                >
                    {{ $t("login.switch_user") }}
                </button>
            </div>

            <!-- 已经发送登录请求-->
            <div v-else-if="loginStatus === 3" class="quick-login">
                <p>{{ $t("login.confirm_login_tip") }}</p>
                <button @click="cancel" class="button-cancel">
                    {{ $t("login.cancel_login") }}
                </button>
            </div>

            <!--开发调试时，自动登录-->
            <div v-else-if="loginStatus === 4">
                <p>{{ $t("login.data_sync") }}...</p>
            </div>
            <div v-if="resetIsShow" class="pending-scan">
                <p>
                    {{ $t(login.network_error) }}
                    <button
                        class="button-cancel_out"
                        @click="createPCLoginSession(null)"
                    >
                        {{ $t(login.try_again) }}
                    </button>
                </p>
            </div>
        </div>
        <!-- 版本检查 -->
        <UpdateVersion
            type="login"
            @setUpdateVersion="setUpdateVersion"
        ></UpdateVersion>
    </div>
</template>

<script>
import axios from "axios";
import {
    getPcSessionAjax,
    getSessionLogin,
    sendSyncLoginSession,
} from "@/axios";
import Config from "@/config";
import wfc from "../../wfc/client/wfc";
import PCSession from "@/wfc/model/pcsession";
import jrQRCode from "jr-qrcode";
import ClipLoader from "vue-spinner/src/ClipLoader";
import ConnectionStatus from "@/wfc/client/connectionStatus";
import EventType from "@/wfc/client/wfcEvent";
import IpcEventType from "../../ipcEventType";
import {
    getItem,
    setItem,
    removeItem,
    unClearItem,
} from "@/ui/util/storageHelper";
import { ipcRenderer, isElectron, currentWindow } from "@/platform";
import store from "@/store";
import ElectronWindowsControlButtonView from "@/ui/common/ElectronWindowsControlButtonView";
import pkg from "../../../package.json";
import UpdateVersion from "./UpdateVersion";

export default {
    name: "App",
    data() {
        return {
            sharedMiscState: store.state.misc,
            qrCode: "",
            userName: "",
            loginStatus: 0, //0 等待扫码； 1 已经扫码； 2 存在session，等待发送给客户端验证；3 已经发送登录请求 4 调试时，自动登录
            qrCodeTimer: null,
            appToken: "",
            lastAppToken: "",
            enableAutoLogin: false, // 默认不记住， 审核被拒
            resetIsShow: false,
            upgradeTip: null,
            disabledForceUpgrade: 0, // 当前版本更新类型
            lock: false,
            progressInfo: {
                show: false,
                percent: 0,
                text: "",
            },
            toJoinMeetingCode: "",
            isOffline: false,
            count: 0,
            sysLang: this.$i18n.locale,
        };
    },
    components: {
        ElectronWindowsControlButtonView,
        ClipLoader,
        UpdateVersion,
    },
    computed: {
        dragAreaWidth() {
            let styleObj = this.sharedMiscState.isElectronWindowsOrLinux
                ? { width: "calc(100% - 92px)" }
                : { width: "100%" };
            return styleObj;
        },
    },
    created() {
        removeItem("confer_code"); //清除会议号
        wfc.eventEmitter.on(
            EventType.ConnectionStatusChanged,
            this.onConnectionStatusChange
        );
        axios.defaults.headers.common["authToken"] = getItem("authToken");
        // 检查更新
        this.localLogin();
        setItem("lang", this.$i18n.locale);
        ipcRenderer.send("currentLocale", this.$i18n.locale);
        this.$store.dispatch("UpdateCurrentLanguage", this.$i18n.locale);
    },
    mounted() {
        ipcRenderer.send("login-page", { isLogin: true });

        window.addEventListener("online", this.handlerOnline);
        window.addEventListener("offline", this.handlerOffline);
        // 退出登录提示
        ipcRenderer.on("account-cancellation", () => {
            this.count++;
            this.count === 1 &&
                this.$Message.warning(this.$t("login.account_canceled"));
        });
        // 打开会议
        ipcRenderer.on("open-conference", (event, args) => {
            this.openDeepLinkAction("open-conference", args);
        });
        // 打开web3
        ipcRenderer.on("open-web3", (event, args) => {
            this.openDeepLinkAction("open-web3", args);
        });
        // 外部呼起app打开公众号主页
        ipcRenderer.on("open-channelInfo", (event, args) => {
            this.openDeepLinkAction("open-channelInfo", args);
        });
        ipcRenderer.on("sys-language", (event, args) => {
            this.sysLang = args === "ch" ? "zh" : "en";
        });
    },
    methods: {
        setEmptyCode(code) {
            let str = "";
            for (let i = 0; i < code.length; i++) {
                if (i % 3 === 0 && i > 0) {
                    str = str + " " + code.charAt(i);
                } else {
                    str = str + code.charAt(i);
                }
            }

            return str;
        },
        // 外链呼起app 相关交互
        openDeepLinkAction(type, args) {
            currentWindow.show();
            currentWindow.focus();
            let url = new URL(args).search;
            if (type === "open-conference") {
                this.toJoinMeetingCode = this.setEmptyCode(
                    window.atob(args.split("=")[1])
                );
                this.toJoinMeetingCode &&
                    setItem("to_join", this.toJoinMeetingCode);
            } else if (type === "open-web3") {
                this.toWeb3Url = this.mixinGetQueryString("url", url);
                this.toWeb3Url && setItem("to_web3Url", this.toWeb3Url);
            } else if (type === "open-channelInfo") {
                this.toChannelInfo = this.mixinGetQueryString("channelId", url);
                this.toChannelInfo &&
                    setItem("to_channelInfo", this.toChannelInfo);
            }
        },
        // 网络连接恢复！
        handlerOnline() {
            console.log("网络连接恢复！");
            this.isOffline = false;
            this.localLogin();
        },
        // 网络连接中断！
        handlerOffline() {
            console.log("网络连接中断！");
            this.isOffline = true;
        },
        // 本地登录
        localLogin() {
            let userId = getItem("userId");
            let token = getItem("token");
            // ====== 本地测试，调试用自动登录、 打包记得注释掉======= //
            // debug
            // wfc.connect(userId, token);
            // 记住登录
            if (userId && store.getEnableAutoLogin(userId) && token) {
                let portrait = getItem("userPortrait");
                this.qrCode = portrait || Config.DEFAULT_PORTRAIT_URL;
                this.loginStatus = 2;
                this.disabledForceUpgrade = 0;
            } else {
                this.resetLoginStatus();
            }
        },
        resetLoginStatus() {
            this.appToken = "";
            this.loginStatus = 0;
            this.qrCode = "";
            this.userName = "";
            removeItem("userId");
            removeItem("token");
            this.createPCLoginSession(null);
        },
        // 更新 设置
        setUpdateVersion(params) {
            let { upgradeTip, disabledForceUpgrade } = params;
            this.upgradeTip = upgradeTip;
            this.disabledForceUpgrade = disabledForceUpgrade;
        },
        // 设置二维码
        setQrCode(session, num) {
            if (session.version) {
                this.qrCode = jrQRCode.getQrBase64(
                    Config.QR_CODE_PREFIX_PC_SESSION +
                        session.token +
                        "?platform=" +
                        num +
                        "&version=" +
                        session.version
                );
            } else {
                this.qrCode = jrQRCode.getQrBase64(
                    Config.QR_CODE_PREFIX_PC_SESSION +
                        session.token +
                        "?platform=" +
                        num
                ); //mac 4  windows3
            }
        },
        async createPCLoginSession(userId) {
            // 不是登录页停止请求
            console.log(
                "非登录页面路径-停止刷新请求授权二维码~",
                this.$route.path
            );
            if (this.$route.path !== "/") return;
            try {
                const res = await getPcSessionAjax(
                    {
                        flag: 1,
                        device_name: "pc",
                        userId,
                        clientId: wfc.getClientId(),
                        platform: Config.getWFCPlatform(),
                        version: pkg.version,
                    },
                    { authToken: getItem("authToken") }
                );
                const { code, result, message } = res.data;
                this.isOffline = false;
                if (code === 0) {
                    this.resetIsShow = false;
                    let session = Object.assign(new PCSession(), result);
                    this.appToken = session.token;
                    /*服务端pc login session不存在*/
                    if (!userId || session.status === 0) {
                        let num = process.platform === "darwin" ? 4 : 3;
                        // 生成二维码
                        this.setQrCode(session, num);
                        // this.refreshQrCode()
                    }
                    // 去登录
                    this.login();
                } else {
                    this.resetIsShow = true;
                    this.$Message.error(
                        message || this.$t("common.error_later")
                    );
                }
            } catch (error) {
                console.log(error);
                this.resetIsShow = true;
            }
        },
        async login() {
            try {
                this.lastAppToken = this.appToken;
                let res = await getSessionLogin(this.appToken, {
                    authToken: getItem("authToken"),
                });
                let { code, result } = res.data;
                const { userId, token: imToken, portrait, userName } = result;
                switch (code) {
                    case 0: // 移动端点击了登录
                        let appAuthToken =
                            res.headers["authtoken"] ||
                            res.headers["authToken"];
                        if (appAuthToken) {
                            setItem("authToken", appAuthToken);
                            axios.defaults.headers.common["authToken"] =
                                appAuthToken;
                        }

                        if ([1, 3].includes(this.loginStatus)) {
                            wfc.connect(userId, imToken);
                            this.loginStatus = 4;
                            setItem("userId", userId);
                            setItem("token", imToken);
                            // 登录成功获取全局配置信息
                            this.mixinPrepare();
                            this.mixinPublicPermission();
                            this.mixinPluginsList();
                            this.sendTimeZone();
                            //秘密令牌状态
                            store.initSecretTokenConfig();
                        }
                        break;
                    case 8: // 会话不存在或已过期
                        this.loginStatus = 0;
                        this.createPCLoginSession(null);
                        break;
                    case 9: // 会话没有验证
                        this.qrCode = portrait || Config.DEFAULT_PORTRAIT_URL;
                        this.userName = userName;
                        setItem("userName", userName);
                        setItem("userPortrait", portrait);
                        this.loginStatus = this.loginStatus === 0 ? 1 : 3;
                        this.login();
                        break;
                    case 18: // 移动端点击了取消
                        //session is canceled, need clear last time login status
                        this.cancel();
                        break;
                    default:
                        this.lastAppToken = "";
                        // 504 过期，
                        this.resetLoginStatus();
                        break;
                }
            } catch (error) {
                // console.log(error)
                // 504 过期，
                this.resetLoginStatus();
            }
        },
        //loginStatus===2 点击登录
        sendQuickLoginRequest() {
            if (this.lock) return;
            this.createPCLoginSession(getItem("userId"));
            this.loginStatus = 3;
        },
        // 点击取消
        cancel() {
            this.loginStatus = 0;
            this.qrCode = null;
            // 切换用户时，先进行disconnect
            wfc.disconnect();
            unClearItem("lang");
            this.createPCLoginSession(null);
            this.toJoinMeetingCode &&
                setItem("to_join", this.toJoinMeetingCode);
            this.toWeb3Url && setItem("to_web3Url", this.toWeb3Url);
            this.toChannelInfo && setItem("to_channelInfo", this.toChannelInfo);
        },
        // 发送当前时区
        async sendTimeZone() {
            try {
                let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                let platform = Config.getWFCPlatform();
                let platObj = {
                    3: "window",
                    4: "osx",
                    7: "linux",
                };
                await sendSyncLoginSession({
                    userId: wfc.getUserId(),
                    sessionId: "",
                    deviceInfo: platObj[platform],
                    timeZone: timeZone,
                    appLang: this.$i18n.locale,
                    sysLang: this.sysLang,
                    appVersion: pkg.version,
                });
            } catch (error) {}
        },
        // 检测链接状态
        onConnectionStatusChange(status) {
            if (
                status === ConnectionStatus.ConnectionStatusLogout ||
                status === ConnectionStatus.ConnectionStatusRejected ||
                status === ConnectionStatus.ConnectionStatusSecretKeyMismatch ||
                status === ConnectionStatus.ConnectionStatusKickedOff ||
                status === ConnectionStatus.ConnectionStatusTokenIncorrect
            ) {
                this.cancel();
                unClearItem("lang");
            }
            //   status 0：正在连接 1：（ConnectionStatusConnected）已连接 2：接收
            if (status === ConnectionStatus.ConnectionStatusConnected) {
                if (isElectron()) {
                    ipcRenderer.send("logined", {
                        closeWindowToExit:
                            getItem(
                                wfc.getUserId() + "-" + "closeWindowToExit"
                            ) === "1",
                    });
                }
                this.$router.replace({ path: "/home" });
                if (
                    isElectron() ||
                    Config.CLIENT_ID_STRATEGY === 1 ||
                    Config.CLIENT_ID_STRATEGY === 2
                ) {
                    isElectron() &&
                        ipcRenderer.send(IpcEventType.LOGINED, {
                            closeWindowToExit:
                                getItem(
                                    wfc.getUserId() + "-" + "closeWindowToExit"
                                ) === "1",
                        });
                    if (this.enableAutoLogin) {
                        store.setEnableAutoLogin(this.enableAutoLogin);
                    }
                }
            }
        },
    },

    beforeUnmount() {
        wfc.eventEmitter.removeListener(
            EventType.ConnectionStatusChanged,
            this.onConnectionStatusChange
        );
        window && window.removeEventListener("online", this.handlerOnline);
        window && window.removeEventListener("offline", this.handlerOffline);
    },
    unmounted() {
        this.qrCodeTimer && clearInterval(this.qrCodeTimer);
    },
};
</script>

<style lang="less" scoped>
.login-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .offline-wrap {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        z-index: 1;
        text-align: center;
        vertical-align: middle;
        display: inline;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 30px;
        -webkit-app-region: drag;

        .offline-content {
            -webkit-app-region: drag;

            img {
                width: 100px;
                height: 100px;
                -webkit-user-drag: none;
                border-radius: 3px;
            }

            p {
                margin-top: 10px;
                font-size: 16px;
                color: #f40;
                font-weight: bold;
            }

            span {
                font-size: 12px;
                color: #666;
            }
        }
    }

    .qr-container {
        border-radius: 3px;
        width: 200px;
        height: 200px;
        background-color: #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        margin-top: 60px;

        img {
            width: 200px;
            height: 200px;
            border-radius: 3px;
            object-fit: cover;
        }

        .loading {
            position: absolute;
            border-width: 4px;
        }
    }

    .qr-container1 {
        border-radius: 3px;
        width: 100px;
        height: 100px;
        background-color: #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        margin-top: 60px;

        img {
            width: 100px;
            height: 100px;
            border-radius: 3px;
            object-fit: cover;
        }
    }

    .login-action-container {
        min-height: 120px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-size: 14px;
        text-align: center;
        margin-top: 8px;

        label {
            margin-top: 30px;
            font-size: 12px;
            color: gray;
        }

        button {
            outline: none;
            font-size: 14px;
            border: none;
            border-radius: 3px;
        }

        .success-text {
            margin-top: 10px;
            color: #1dbb88;
            font-weight: bold;
            letter-spacing: 0.05em;
            font-size: 14px;
        }
    }
}

.pending-scan,
.scanned,
.pending-quick-login,
.quick-login {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    line-height: 25px;
}

.scanned p:nth-child(2) {
    margin-top: 10px;
}

.button-cancel_out {
    margin-top: 30px;
    background-color: transparent;
    color: #4168e0;
}

.button-cancel {
    margin-top: 10px;
    background-color: transparent;
    color: gray;
    font-size: 14px;
}

.button-cancel:active,
.button-cancel:hover {
    color: #4168e0;
}

.remember-text {
    margin-top: 10px;
    position: relative;
    padding-right: 20px;
    font-size: 12px;

    .checkbox {
        width: 14px;
        height: 14px;
        border: none;
        top: 5px;
        opacity: 0;
        position: absolute;
        right: 0;
        z-index: 1;
    }

    .checkbox + span {
        position: absolute;
        width: 14px;
        height: 14px;
        z-index: 0;
        top: 5px;
        right: 0;
        border: 1px solid #ccc;
        border-radius: 3px;
        overflow: hidden;
    }

    .checkbox + span i {
        display: none;
    }

    .checkbox:checked + span {
        background: #1dbb88;
        border: 1px solid #1dbb88;
    }

    .checkbox:checked + span i {
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-size: 12px;
    }
}

.button-confirm {
    width: 120px;
    height: 32px;
    color: #fff;
    font-weight: 500;
    background-color: #1dbb88;
}

.button-confirm:hover,
.button-confirm:active {
    background-color: #1bab7c;
}

.button-confirm.disabled,
.button-confirm.disabled:hover,
.button-confirm.disabled:active {
    background-color: #d5ced1;
}

.drag-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 92px;
    height: 60px;
    z-index: -1;
    -webkit-app-region: drag;
}
</style>
