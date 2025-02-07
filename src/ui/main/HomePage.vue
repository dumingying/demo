<template>
    <div class="home-container" ref="home-container">
        <ElectronWindowsControlButtonView
            style="position: absolute; top: 0; right: 0"
            v-if="sharedMiscState.isElectronWindowsOrLinux"
        />
        <div class="home">
            <section
                :class="[
                    'menu-container',
                    currentPage === 'web3' && toggleMenubar
                        ? 'toggle-menu'
                        : '',
                ]"
            >
                <!-- todo tippy example -->
                <div :style="setMarginTop">
                    <tippy
                        to="#infoTrigger"
                        interactive
                        :animate-fill="false"
                        placement="right"
                        distant="7"
                        theme="light"
                        animation="fade"
                        trigger="click"
                        :arrow="true"
                    >
                        <template #content>
                            <UserCardView
                                v-if="sharedContactState.selfUserInfo"
                                @close="closeUserCard"
                                :user-info="sharedContactState.selfUserInfo"
                            />
                        </template>
                    </tippy>

                    <a
                        class="avatar-wrap"
                        :style="setVipLevelStyle"
                        @click.prevent
                    >
                        <img
                            v-if="sharedContactState.selfUserInfo"
                            ref="userCardTippy"
                            id="infoTrigger"
                            class="avatar"
                            draggable="false"
                            alt=""
                            @click.prevent="onClickPortrait"
                            @error="mixinImgUrlAlt"
                            :src="
                                mixinDefaultPortrait(
                                    sharedContactState.selfUserInfo.portrait
                                )
                            "
                        />
                        <!-- 是否是会员 -->
                        <figure
                            class="vip-icon"
                            v-if="permissionList.isAppCharge"
                        >
                            <img :src="vipIcon" alt="" draggable="false" />
                        </figure>
                    </a>
                </div>
                <nav class="menu">
                    <ul>
                        <!-- 会议 -->
                        <li>
                            <img
                                :title="$t('home.chain_task')"
                                :alt="$t('home.chain_task')"
                                draggable="false"
                                :src="
                                    activeIcon([
                                        '/home',
                                        '/home/contact',
                                        '/home/conversation',
                                        '/home/historyconference',
                                    ])
                                "
                                @click="go2Page('/home')"
                            />
                        </li>
                        <!-- 轻应用 -->
                        <li>
                            <img
                                :title="$t('home.chain_plugin')"
                                :alt="$t('home.chain_plugin')"
                                draggable="false"
                                :src="activeIcon(['/home/web3'])"
                                @click="go2Page('/home/web3')"
                            />
                        </li>
                        <!-- 云盘 -->
                        <li>
                            <img
                                :title="$t('common.cloud_disk')"
                                :alt="$t('common.cloud_disk')"
                                draggable="false"
                                :src="activeIcon(['/home/cloud'])"
                                @click="go2Page('/home/cloud')"
                            />
                        </li>
                        <li>
                            <span v-if="latestVersion" class="red-icon"></span>
                            <img
                                :title="$t('setting.setting')"
                                :alt="$t('setting.setting')"
                                ref="setting"
                                draggable="false"
                                :src="activeIcon(['/home/setting'])"
                                @click="go2Page('/home/setting')"
                            />
                        </li>
                    </ul>
                </nav>
            </section>
            <router-view v-slot="{ Component, route }">
                <keep-alive>
                    <component :is="Component" :key="route.path" />
                </keep-alive>
            </router-view>

            <div
                v-if="sharedMiscState.connectionStatus === -1"
                class="unconnected"
            >
                {{ $t("login.network_connection_lost") }}
            </div>
            <div class="drag-area" :style="dragAreaLeft"></div>
            <UseDraggable
                v-if="!sharedMiscState.isElectron"
                class="voip-div-container"
                draggable="true"
                :initial-value="{ x: '50%', y: '50%' }"
                :prevent-default="true"
                v-bind:class="{
                    single: voipProxy.type === 'single',
                    multi: voipProxy.type === 'multi',
                    conference: voipProxy.type === 'conference',
                }"
            >
                <Single v-if="voipProxy.type === 'single'" ref="handle-id" />
                <Multi v-if="voipProxy.type === 'multi'" ref="handle-id" />
                <Conference
                    v-if="voipProxy.type === 'conference'"
                    ref="handle-id"
                />
            </UseDraggable>
        </div>
        <!-- 版本检查 -->
        <UpdateVersion type="home"></UpdateVersion>
    </div>
</template>
<script>
import UserCardView from "@/ui/main/user/UserCardView";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import EventType from "@/wfc/client/wfcEvent";
import ConnectionStatus from "@/wfc/client/connectionStatus";
import ElectronWindowsControlButtonView from "@/ui/common/ElectronWindowsControlButtonView";
import { ipcRenderer, isElectron, currentWindow } from "@/platform";

import avenginekit from "@/wfc/av/internal/engine.min";
import CallEndReason from "@/wfc/av/engine/callEndReason";
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";
import localStorageEmitter from "@/ipc/localStorageEmitter";

import { getItem, setItem, removeItem } from "../util/storageHelper";
import { getJoinMeeting, getMyMeeting } from "@/axios";
import EnterPassWord from "../voip/conference/EnterPassWord";
import RequestMeeting from "../voip/conference/RequestMeeting";
import UpdateVersion from "./UpdateVersion";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";

import Single from "../voip/Single";
import Multi from "../voip/Multi";
import Conference from "../voip/Conference";
import "tippy.js/dist/tippy.css";
import { UseDraggable } from "@vueuse/components";
import pkg from "../../../package.json";
export default {
    data() {
        return {
            sharedContactState: store.state.contact,
            sharedMiscState: store.state.misc,
            shareConversationState: store.state.conversation,
            supportConference: avenginekit.startConference !== undefined,
            isSetting: false,
            fileWindow: null,
            voipProxy: avenginekitproxy,
            draggableValue: {
                handle: undefined,
                boundingElement: undefined,
                resetInitialPos: true,
            },
            currentPage: "conferencePage", // 当前页面
        };
    },
    watch: {
        $route(a, b) {
            this.currentPage = this.$route.name;
            if (this.currentPage === "web3" && this.toggleMenubar) {
                this.$store.dispatch("UpdateToogleMenuBar", true);
            }
            // 检查更新
            if (this.currentPage) {
                this.$eventBus.$emit("update-version", "home");
            }
            // 路径变更,关闭弹窗
            this.$modal.hideAll();
        },
    },
    methods: {
        // 更新头像信息
        onClickPortrait() {
            let userInfo = wfc.getUserInfo(
                this.sharedContactState.selfUserInfo.uid,
                true
            );
            setItem("userName", userInfo.displayName);
            this.mixinPublicPermission();
        },
        // 点击左侧图标导航
        go2Page(path) {
            if (this.$router.currentRoute.value.path === path) return;
            this.$router.replace(path);
        },
        closeUserCard() {
            this.$refs["userCardTippy"]._tippy.hide();
        },
        onConnectionStatusChange(status) {
            if (
                status === ConnectionStatus.ConnectionStatusRejected ||
                status === ConnectionStatus.ConnectionStatusLogout ||
                status === ConnectionStatus.ConnectionStatusSecretKeyMismatch ||
                status === ConnectionStatus.ConnectionStatusTokenIncorrect ||
                status === ConnectionStatus.ConnectionStatusKickedOff ||
                // TODO 断网时，显示网络断开状态
                // || status === ConnectionStatus.ConnectionStatusUnconnected
                wfc.getUserId() === ""
            ) {
                if (this.$router.currentRoute.value.path !== "/") {
                    this.$router.replace({ path: "/" });
                }
                if (
                    status ===
                        ConnectionStatus.ConnectionStatusSecretKeyMismatch ||
                    status === ConnectionStatus.ConnectionStatusLogout ||
                    status ===
                        ConnectionStatus.ConnectionStatusTokenIncorrect ||
                    status === ConnectionStatus.ConnectionStatusKickedOff ||
                    status === ConnectionStatus.ConnectionStatusRejected
                ) {
                    let autoLogin =
                        getItem(wfc.getUserId() + "-" + "autoLogin") === "1";
                    if (!autoLogin) {
                        removeItem("userId");
                        removeItem("token");
                    }
                    avenginekitproxy.forceCloseVoipWindow();
                    avenginekitproxy.closeChatRoomWindow();
                    // 被挤掉 （样式还原）
                    if (
                        isElectron() &&
                        status === ConnectionStatus.ConnectionStatusKickedOff
                    ) {
                        // 关闭所有弹窗
                        this.$modal.hideAll();
                        ipcRenderer.send("logouted", status);
                    }
                }
            }
        },

        joinConference(userId, data) {
            console.log("会议信息>>>>>:" + data, "参会人>>>>:" + userId);
            let { imCreateMeeting, isPasswordNeed, password } = data;
            if (
                imCreateMeeting.host !== userId &&
                isPasswordNeed === 1 &&
                password
            ) {
                this.$modal.show(
                    EnterPassWord,
                    { title: this.$t("voip.meeting_password") },
                    null,
                    {
                        name: "EnterPassWord-modal",
                        width: 300,
                        height: 160,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    {
                        "before-close": (event) => {
                            console.log("Closing...", event, event.params);
                            if (event.params) {
                                const { params, meetingPassWord } =
                                    event.params;
                                // 点击加入会议
                                if (params && meetingPassWord) {
                                    this.nextJoinMeeting(meetingPassWord, data);
                                }
                            }
                        },
                    }
                );
            } else {
                this.nextJoinMeeting("", data);
            }
        },
        // 进入会议
        nextJoinMeeting(meetingPassWord, meetingInfo, callback) {
            const userId = wfc.getUserId();
            const { isPasswordNeed, password, imCreateMeeting } = meetingInfo;
            if (meetingPassWord && password && meetingPassWord !== password) {
                this.$Message.warning(this.$t("voip.password_wrong"));
                return;
            }
            // 主持人且有摄像头设备可以以互动模式入会
            let isAudience = imCreateMeeting.host === userId ? false : true;
            getJoinMeeting({
                isAudience: Number(isAudience), // 是否互动模式 1  观众模式入会 0  主播模式入会
                code: meetingInfo.code, //会议号
                status: "",
                isPasswordNeed: isPasswordNeed,
                password: meetingPassWord || password,
            }).then((res) => {
                const { code, data, message } = res.data;
                if (code == "000000") {
                    let cmc = data.imCreateMeeting;
                    setItem("confer_code", data.meetingId);
                    avenginekitproxy.joinConference(
                        data.meetingId, //callId 会议id
                        false, //audioOnly 是否只开启音频
                        cmc.pin, //pin 会议pin码
                        cmc.host, //host 会议主持人
                        data.title, //title 会议标题
                        cmc.description, //desc 会议描述
                        isAudience, // audience 是否是以观众角色入会
                        false, //  advance 是否是高级会议
                        true, // false 是打开 true 是关闭 muteAudio 是否是静音加入会议
                        true, // false 是打开 true 是关闭 muteVideo 是否是关闭摄像头加入会议
                        {
                            video: true,
                            audio: true,
                        } //extra 一些额外信息，主要用于将信息传到音视频通话窗口
                    );
                    callback && callback();
                } else if (code === "5000021") {
                    // 非指定会议弹窗申请
                    this.$modal.show(
                        RequestMeeting,
                        {
                            title: this.$t("voip.private_meeting_title"),
                            meetingInfo: data,
                        },
                        null,
                        {
                            name: "RequestMeeting-modal",
                            width: 340,
                            height: 266,
                            clickToClose: false, // 点击模态框是否关闭
                        },
                        {
                            "before-close": (event) => {},
                        }
                    );
                } else {
                    this.$Message.warning(message);
                }
            });
        },
        insertStr(soure, start, newStr) {
            return soure.slice(0, start) + newStr + soure.slice(start);
        },
        // 加入会议 ， 获取会议具体信息，
        async handleRequestMeeting(meetingCode) {
            try {
                removeItem("to_join"); // 清除会议号
                let res = await getMyMeeting({
                    userId: wfc.getUserId(),
                    code: meetingCode,
                });
                this.$Toast.hide();
                const { code, data, message } = res.data;
                if (code == "000000") {
                    this.joinConference(wfc.getUserId(), data);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.$Toast.hide();
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 外链呼起app 相关交互
        openDeepLinkAction(type, args) {
            let url = new URL(args).search;
            switch (type) {
                case "open-conference":
                    let meetingCode = window.atob(args.split("=")[1]);
                    meetingCode = this.insertStr(meetingCode, 3, " ");
                    meetingCode = this.insertStr(meetingCode, 7, " ");
                    console.log(
                        args + "----open-conference",
                        "会议号:" + meetingCode
                    );
                    wfc.getUserId() && this.handleRequestMeeting(meetingCode);
                    break;
                case "open-web3":
                    let web3Url = this.mixinGetQueryString("url", url);
                    // 打开web3页面
                    if (wfc.getUserId() && web3Url) {
                        this.mixinGo2Web3View(web3Url, 1);
                        removeItem("to_web3Url");
                    }
                    break;
                case "open-channelInfo":
                    let channelId = this.mixinGetQueryString("channelId", url);
                    // 去公众号主页
                    if (wfc.getUserId() && channelId) {
                        this.mixinGo2ChannelInfo(channelId);
                        removeItem("to_channelInfo");
                    }
                    break;
                default:
                    console.log("未匹配到");
                    break;
            }
        },
    },

    computed: {
        toggleMenubar() {
            return this.$store.state.toggleMenubar;
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
        // 媒体设备信息
        externalDevice() {
            return this.$store.state.deviceObj;
        },
        dragAreaLeft() {
            // 68为左边菜单栏的宽度，250为会话列表的宽度 ，140为window 右侧缩小放大关闭按钮的宽度
            let windowStyleObj = {
                conferencePage: {
                    width: "calc(100% - 208px)",
                    height: "24px",
                    left: "68px",
                    rigth: "140px",
                },
                historyConference: {
                    width: "calc(100% - 208px)",
                    height: "24px",
                    left: "68px",
                    rigth: "140px",
                },
                conversation: {
                    width: "calc(100% - 208px)",
                    height: "24px",
                    left: "68px",
                    rigth: "140px",
                },
                contact: {
                    width: "calc(100% - 208px)",
                    height: "24px",
                    left: "68px",
                    rigth: "140px",
                },
                setting: {
                    width: "calc(100% - 208px)",
                    left: "68px",
                    rigth: "140px",
                },
                web3: {
                    width: "calc(100% - 208px)",
                    height: "20px",
                    left: "68px",
                    rigth: "140px",
                },
                cloud: {
                    width: "calc(100% - 208px)",
                    left: "68px",
                    rigth: "140px",
                },
            };
            let macStyleObj = {
                conferencePage: {
                    width: "calc(100% - 68px)",
                    left: "68px",
                    rigth: "0",
                },
                historyConference: {
                    width: "calc(100% - 68px)",
                    left: "68px",
                    height: "28px",
                    rigth: "0",
                },
                conversation: {
                    width: "calc(100% - 106px)",
                    height: "24px",
                    left: "68px",
                    rigth: "50px",
                },
                contact: {
                    width: "calc(100% - 68px)",
                    height: "24px",
                    left: "68px",
                    rigth: "0px",
                },
                setting: {
                    width: "calc(100% - 68px)",
                    left: "68px",
                    rigth: "0",
                },
                web3: {
                    width: "calc(100% - 68px)",
                    height: "20px",
                    left: "68px",
                    rigth: "0",
                },
                cloud: {
                    width: "calc(100% - 68px)",
                    left: "68px",
                    rigth: "0",
                },
            };
            return process.platform === "darwin"
                ? macStyleObj[this.currentPage]
                : windowStyleObj[this.currentPage];
        },
        activeIcon() {
            return (path) => {
                let currentRoute = this.$router.currentRoute.value.path;
                // 云盘多个路径
                if (path.length === 4) {
                    return require(`../../assets/images/${
                        path.includes(currentRoute)
                            ? "meet-new-active.svg"
                            : "meet-new.svg"
                    }`);
                }
                let pathObj = {
                    "/home/web3": require(`../../assets/images/${
                        path.includes(currentRoute)
                            ? "light-app-active.svg"
                            : "light-app.svg"
                    }`),
                    "/home/setting": require(`../../assets/images/${
                        path.includes(currentRoute)
                            ? "setting-active.svg"
                            : "setting.svg"
                    }`),
                    "/home/cloud": require(`../../assets/images/${
                        path.includes(currentRoute)
                            ? "cloud-active.svg"
                            : "cloud.svg"
                    }`),
                };
                return pathObj[path];
            };
        },
        // 展示会员图标
        vipIcon() {
            return require(`../../assets/images/vip-${this.permissionList.vipLevel}.png`);
        },
        setVipLevelStyle() {
            let styleObj = {
                0: "rgba(121, 121, 121, 0.5)",
                1: "linear-gradient(90deg, rgba(248, 208, 105, 0.5) 0%, rgba(255, 188, 83, 0.5) 100%)",
                2: "linear-gradient(90deg, rgba(255, 160, 78, 0.6) 0%, rgba(244, 99, 36, 0.6) 100%)",
                3: "linear-gradient(90deg, rgba(235, 33, 113, 0.6) 0%, rgba(31, 62, 202, 0.6) 100%)",
                4: "linear-gradient(135deg, rgba(29, 187, 136, 0.6) 12.5%, rgba(9, 15, 69, 0.6) 88.54%)",
            };
            return {
                background: styleObj[this.permissionList.vipLevel],
            };
        },
        setMarginTop() {
            return {
                "margin-top":
                    window.process.platform === "darwin" ? "0" : "20px",
            };
        },
        latestVersion() {
            let isLatest = this.mixinCompareVersion(
                pkg.version,
                this.$store.state.newVersion
            );
            return isLatest === 1 ? this.$store.state.newVersion : "";
        },
    },

    async created() {
        wfc.eventEmitter.on(
            EventType.ConnectionStatusChanged,
            this.onConnectionStatusChange
        );
        this.onConnectionStatusChange(wfc.getConnectionStatus());
        // 草稿不用同步
        wfc.setDisableSyncDraft(false);
        localStorageEmitter.on("join-conference-failed", (sender, args) => {
            let reason = args.reason;
            let session = args.session;
            if (reason === CallEndReason.RoomNotExist) {
                this.$notify({
                    title: this.$t("voip.meeting_end"),
                    text:
                        session.host === wfc.getUserId()
                            ? this.$t("voip.current_meeting_end")
                            : this.$t("voip.host_meeting"),
                    type: "warn",
                });
            } else if (reason === CallEndReason.RoomParticipantsFull) {
                this.$notify({
                    title: this.$t("voip.join_meeting_failed"),
                    text: this.$t("voip.full_participants"),
                    type: "warn",
                });
            }
        });
        // 在会议中点击进群
        localStorageEmitter.on("conference-to-group", (sender, args) => {
            if (isElectron()) {
                currentWindow.show();
                currentWindow.focus();
            }

            let timer = setTimeout(() => {
                let conversation = new Conversation(
                    ConversationType.Group,
                    args,
                    0
                );
                store.setCurrentConversation(conversation);
                if (
                    this.$router.currentRoute.value.path !==
                    "/home/conversation"
                ) {
                    this.$router.replace("/home/conversation");
                }
                timer && clearTimeout(timer);
            }, 500);
        });

        localStorageEmitter.on("message-openUrl", (event, args) => {
            // console.log("message-openUrl", args, args.urlAddress);
            currentWindow.show();
            currentWindow.focus();
            this.mixinGo2Web3View(args.urlAddress);
        });
    },

    mounted() {
        ipcRenderer.send("login-page", { isLogin: false });
        avenginekitproxy.onVoipCallErrorCallback = (errorCode) => {
            if (errorCode === -1) {
                this.$notify({
                    title: this.$t("common.tip"), //title: '不能发起或接听新的音视频通话',
                    text: this.$t("voip.current_meeting_calling"), //目前有音视频通话正在进行中
                    type: "warn",
                });
            } else if (errorCode === -2) {
                this.$notify({
                    title: this.$t("voip.not_audio_video"),
                    text: this.$t("voip.answer_phone"),
                    type: "warn",
                });
            } else if (errorCode === -3) {
                this.$notify({
                    title: this.$t("common.tip"),
                    text: this.$t("voip.performed_try_again"),
                    type: "warn",
                });
            }
        };
        // 外链呼起app进入会议
        ipcRenderer.on("open-conference", (event, args) => {
            this.openDeepLinkAction("open-conference", args);
        });
        // 会议id存在的进入会议
        let tojoinId = getItem("to_join") || "";
        if (tojoinId && wfc.getUserId()) {
            this.handleRequestMeeting(tojoinId);
        }
        // 历史记录搜索中打开轻应用
        ipcRenderer.on("message-history-openUrl", (event, args) => {
            //   console.log("message-history-openUrl", args, args.urlAddress);
            currentWindow.show();
            currentWindow.focus();
            this.mixinGo2Web3View(args.urlAddress);
        });

        // 外链呼起app打开轻应用
        ipcRenderer.on("open-web3", (event, args) => {
            this.openDeepLinkAction("open-web3", args);
        });
        //web3链接存在的话 打开轻应用
        let web3UrlStr = getItem("to_web3Url") || "";
        if (web3UrlStr && wfc.getUserId()) {
            this.mixinGo2Web3View(web3UrlStr, 1);
            removeItem("to_web3Url");
        }
        // 外部呼起app打开公众号主页
        ipcRenderer.on("open-channelInfo", (event, args) => {
            this.openDeepLinkAction("open-channelInfo", args);
        });
        //公众号id存在的话 进入对应的公众号主页
        let channelId = getItem("to_channelInfo") || "";
        if (channelId && wfc.getUserId()) {
            removeItem("to_channelInfo");
        }

        // 监听会员信息变更
        ipcRenderer.on("vip-change-permission", () => {
            this.mixinPublicPermission();
        });

        ipcRenderer.on("send-join-conference", (ev, args) => {
            this.nextJoinMeeting("", args, () => {
                ipcRenderer.send("join-conference-result");
            });
        });
    },
    unmounted() {
        wfc.eventEmitter.removeListener(
            EventType.ConnectionStatusChanged,
            this.onConnectionStatusChange
        );
        // 关闭弹窗
        this.$modal.hide("add-conference-modal");
    },
    components: {
        Conference,
        Multi,
        Single,
        UserCardView,
        ElectronWindowsControlButtonView,
        UseDraggable,
        UpdateVersion,
    },
};
</script>

<style lang="css" scoped>
.home {
    display: flex;
    width: calc(100vw - var(--main-margin-left) - var(--main-margin-right));
    height: calc(100vh - var(--main-margin-top) - var(--main-margin-bottom));
    justify-content: center;
    align-items: center;
    background-color: white;
    border-radius: var(--main-border-radius);
}

.menu-container {
    width: 68px;
    min-width: 68px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(180deg, #292a2c 0%, #483a3a 100%);
    border-top-left-radius: var(--main-border-radius);
    border-bottom-left-radius: var(--main-border-radius);
    padding: var(--home-menu-padding-top) 0 20px 0;
    -webkit-app-region: drag;
    position: relative;
    z-index: 9999;
}

.menu-container.toggle-menu {
    display: none;
}

.avatar-wrap {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: block;
    position: relative;
    z-index: 99;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-wrap .avatar {
    width: 48px;
    height: 48px;
    display: block;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.23);
}

.avatar-wrap .vip-icon {
    position: absolute;
    right: -3px;
    width: 20px;
    height: 20px;
    bottom: -3px;
    z-index: 98;
}

.avatar-wrap .vip-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.menu {
    flex: 1;
    margin-top: 20px;
}

.menu ul {
    height: 100%;
    display: flex;
    flex-direction: column;
    -webkit-app-region: drag;
}

.menu ul li {
    width: 100%;
    height: 60px;
    display: flex;
    align-items: center;
    position: relative;
}

.menu ul li i {
    cursor: default;
}

.menu ul li:last-of-type {
    margin-top: auto;
}

.menu .menu-item {
    position: relative;
}

.menu .menu-item .badge {
    position: absolute;
    color: white;
    font-size: 10px;
    background-color: red;
    border-radius: 8px;
    width: 16px;
    height: 16px;
    line-height: 16px;
    font-style: normal;
    text-align: center;
    right: -12px;
    top: 4px;
}
.red-icon {
    position: absolute;
    color: white;
    background-color: red;
    border-radius: 50%;
    width: 6px;
    height: 6px;
    right: 0;
    top: 18px;
}
i {
    font-size: 26px;
    color: #868686;
    outline-color: red;
    cursor: pointer;
}

i:hover {
    color: #1dbb88;
}

i.active {
    color: #1dbb88;
}

.drag-area {
    position: absolute;
    top: 0;
    height: 60px;
    z-index: -1;
    -webkit-app-region: drag;
}

.unconnected {
    position: absolute;
    top: 0;
    left: 68px;
    right: 0;
    color: red;
    padding: 15px 0;
    text-align: center;
    background: #f2f2f280;
    /*box-shadow: 0 0 1px #000;*/
}

.voip-div-container {
    background: #292929;
    position: fixed;
    margin: auto;
    border-radius: 5px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
    display: flex;
    flex-direction: column;
}

.voip-div-container.single {
    width: 360px;
    height: 640px;
}

.voip-div-container.multi {
    width: 960px;
    height: 600px;
}

.voip-div-container.conference {
    width: 960px;
    height: 600px;
}

.voip-div-container .title {
    text-align: center;
    padding: 5px 0;
    background: #b6b6b6;
    display: flex;
    justify-content: center;
    align-content: center;
}

.voip-div-container .title i {
    pointer-events: none;
}

.voip-div-container .title i:hover {
    color: #868686;
}

.voip-div-container .title i:active {
    color: #868686;
}

.voip-div-container .content {
    flex: 1;
    border: none;
}

.more-setting-wrap {
    z-index: 10;
    bottom: 22px;
    left: 72px;
    position: absolute;
    width: 120px;
    height: 110px;
    background: #3f3536;
    box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    padding: 0 20px;
    box-sizing: border-box;
}

.more-setting-wrap li {
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #ffffff;
    margin-top: 24px;
}
</style>
