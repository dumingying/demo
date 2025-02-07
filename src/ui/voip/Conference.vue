<!--export default class CallState {-->
<!--static STATUS_IDLE = 0;-->
<!--static STATUS_OUTGOING = 1;-->
<!--static STATUS_INCOMING = 2;-->
<!--static STATUS_CONNECTING = 3;-->
<!--static STATUS_CONNECTED = 4;-->
<!--}-->
<template>
    <div
        class="flex-column flex-align-center flex-justify-center voip-container"
        ref="contentContainerWrap"
    >
        <div v-if="isOffline" class="error-wrap">
            {{ $t("voip.network_disconnected") }}
        </div>
        <template v-if="sharedMiscState.isElectron">
            <!-- 共享操作条 -->
            <ScreenShareControlView
                v-if="session && session.screenSharing"
                :participantUserInfos="participantUserInfos"
                :audioList="audioList"
                :isRequestMeeting="isRequestMeeting"
                :isShowChatRoom="isShowChatRoom"
                :myMeetingData="myMeetingData"
                @actionPublicStatus="actionPublicStatus"
                @handlerSetMedia="handlerSetMedia"
                type="conference"
            />
            <h1 style="display: none">
                Voip-Conference 运行在新的window，和主窗口数据是隔离的！！
            </h1>
        </template>
        <!-- 正常显示屏 -->
        <div
            v-if="session"
            class="conference-container"
            :style="{
                display:
                    session.screenSharing && sharedMiscState.isElectron
                        ? 'none'
                        : 'flex',
            }"
        >
            <div class="conference-main-content-container" ref="conferenceMain">
                <!--nav-->
                <nav>
                    <p class="meeting-id">
                        {{ $t("voip.meeting_id") }}: {{ myMeetingData.code }}
                        <span class="copy-btn" @click="copy">
                            {{ $t("common.copy") }}
                        </span>
                    </p>
                    <p class="meeting-title single-line">{{ session.title }}</p>
                    <!-- 网络信息展示 -->
                    <div class="wifi-duration">
                        <!-- <div class="wifi">
                          <div class="wifi-info">
                            <span>延迟： <em>{{ wifiInfo.delay }}ms</em></span>
                            <span>丢包率：<em>{{ wifiInfo.loss }}</em></span>
                          </div>
                          <figure @click.prevent="handlerWifi">
                            <img alt=""
                                :src="wifiImage"
                                draggable="false" />
                          </figure>
                        </div> -->
                        <p class="duration">{{ duration }}</p>
                    </div>
                </nav>
                <!--main-->
                <div style="width: 100%; height: 100%; position: relative">
                    <!-- loading -->
                    <div class="loading-wrap" v-show="viewLoading">
                        <SpinLoading></SpinLoading>
                        <p>{{ $t("voip.network_connecting") }}</p>
                    </div>
                    <section
                        class="content-container video"
                        ref="contentContainer"
                    >
                        <!--participants 包含自己-->
                        <div
                            v-for="participant in participantUserInfos"
                            :key="`${participant.uid}-${participant._isScreenSharing}`"
                            :style="{
                                margin:
                                    participantUserInfos.length > 1
                                        ? '4px'
                                        : '0',
                            }"
                            :class="[
                                'participant-video-item',
                                { highlight: participant._volume > 0 },
                                screenClassName(participant.uid),
                                {
                                    myHighlight:
                                        participant.uid === selfUserInfo.uid,
                                },
                            ]"
                            @dblclick="handleDblclick(participant.uid)"
                        >
                            <video
                                v-if="showVideoDom(participant)"
                                :class="[
                                    'video',
                                    screenClassName(participant.uid),
                                ]"
                                :style="{
                                    objectFit: participant._isScreenSharing
                                        ? 'contain'
                                        : 'fit',
                                }"
                                :srcObject.prop="participant._stream"
                                :muted="participant.uid === selfUserInfo.uid"
                                playsInline
                                autoPlay
                            />
                            <!-- 头像背景 -->
                            <template v-else>
                                <div
                                    :style="setBackground(participant.portrait)"
                                    class="bg"
                                ></div>
                                <div class="other-avatar-wrap">
                                    <img
                                        class="avatar"
                                        @error="mixinImgUrlAlt"
                                        draggable="false"
                                        :src="
                                            mixinDefaultPortrait(
                                                participant.portrait
                                            )
                                        "
                                        :alt="participant"
                                    />
                                </div>
                            </template>
                            <audio
                                v-if="
                                    !participant._isAudience &&
                                    participant.uid !== selfUserInfo.uid &&
                                    participant._stream
                                "
                                :srcObject.prop="participant._stream"
                                :muted="participant.uid === selfUserInfo.uid"
                                :ref="participant.uid + '-audio'"
                                autoPlay
                            />
                            <div class="info-container">
                                <span
                                    class="host-wrap"
                                    v-if="participant._isHost"
                                >
                                    {{ $t("voip.host") }}
                                </span>
                                <span
                                    :class="[
                                        'info-name',
                                        {
                                            'my-name':
                                                participant.uid ===
                                                selfUserInfo.uid,
                                        },
                                    ]"
                                    >{{ mixinGetUserName(participant) }}</span
                                >
                            </div>
                            <div class="video-audio-icon">
                                <span class="audio">
                                    <img
                                        v-show="participant._volume > 0"
                                        draggable="false"
                                        :src="setVolume(participant._volume)"
                                    />
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
                <!-- 弹幕缩小 -->
                <div
                    :class="['chat-room-barrage', { visible: isShowBarrage }]"
                    v-if="currentConversationInfo"
                >
                    <div :class="['barrage-wrap', { 'show-close': showClose }]">
                        <BarrageMessageContentView
                            from="small"
                            ref="smallBarrageMessage"
                            :currentConversationInfo="currentConversationInfo"
                            :currentChatRoomMessageList="
                                currentChatRoomMessageList
                            "
                        >
                        </BarrageMessageContentView>
                        <span class="close" @click="handlerClose">
                            <Icon type="ios-close-circle" />
                        </span>
                    </div>
                    <div class="input-wrap">
                        <BarrageInputView
                            from="small"
                            :currentConversationInfo="currentConversationInfo"
                        ></BarrageInputView>
                        <div class="input-icon" @click="handlerInput"></div>
                        <div class="close-icon" @click="handlerClose">
                            <Icon type="md-close" />
                        </div>
                    </div>
                </div>
                <div
                    :class="[
                        'show-chat-room-icon',
                        isShowBarrage ? 'hidden' : '',
                    ]"
                    @click="handlerShowBarrage"
                ></div>
                <!--actions-->
                <ul
                    :class="[
                        'media-wrap',
                        { show: isShowAudio || isShowVideo },
                    ]"
                    :style="{
                        left: isShowAudio ? '26%' : isShowVideo ? '38%' : -200,
                    }"
                >
                    <li
                        v-for="(item, index) in mediaList"
                        class="media-li"
                        :key="index"
                    >
                        <template v-if="item.list && item.list.length">
                            <span class="name">{{ item.name }}</span>
                            <div
                                v-for="(ele, i) in item.list"
                                :class="['label', ele._checked ? 'active' : '']"
                                @click="handlerSetMedia(ele)"
                                :key="`${index}-${i}`"
                            >
                                <Icon type="md-checkmark" v-if="ele._checked" />
                                <p>{{ ele.label }}</p>
                            </div>
                        </template>
                    </li>
                </ul>
                <!-- 管理弹窗 -->
                <ul
                    :class="['manage-wrap', { show: isShowManage }]"
                    :style="{ left: isShowManage ? '60%' : -200 }"
                >
                    <li class="name">
                        {{ $t("voip.management") }}
                        <input
                            @change="onPickFile($event)"
                            ref="cloudFileInput"
                            class="icon-ion-android-attach"
                            type="file"
                            style="display: none"
                        />
                    </li>
                    <template v-for="item in manageList">
                        <li
                            v-if="item.isShow"
                            class="label"
                            :key="item.value"
                            @click.stop="handleClickManage(item)"
                        >
                            <img :src="item.icon" />
                            <p>{{ item.name }}</p>
                            <span v-if="!item.value">
                                ({{ participantUserInfos.length }})
                            </span>
                        </li>
                    </template>
                </ul>
                <!-- 底部操作条 -->
                <footer :class="{ 'min-style': showParticipantList }">
                    <div class="duration-action-container">
                        <div class="action-container">
                            <!-- 打开音频 -->
                            <div class="action">
                                <div class="action-icon" @click="muteAudio(0)">
                                    <img
                                        v-if="
                                            !session.audience &&
                                            !session.audioMuted
                                        "
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_audio.png"
                                    />
                                    <img
                                        v-else
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_audio_mute.png"
                                    />
                                    <p>
                                        {{
                                            !session.audience &&
                                            !session.audioMuted
                                                ? $t("voip.mute")
                                                : $t("voip.unmute")
                                        }}
                                    </p>
                                </div>
                                <div
                                    class="action-media"
                                    v-if="
                                        audioList[0].list.length ||
                                        audioList[1].list.length
                                    "
                                    ref="actionAudio"
                                    @click="moreAction(0)"
                                >
                                    <Icon type="md-arrow-dropdown" />
                                </div>
                            </div>
                            <!-- 打开摄像头 -->
                            <div class="action">
                                <div
                                    class="action-icon"
                                    v-if="!session.screenSharing"
                                    @click="muteVideo(0)"
                                >
                                    <img
                                        v-if="
                                            !session.audience &&
                                            !session.videoMuted
                                        "
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_video.png"
                                    />
                                    <img
                                        v-else
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_video_mute.png"
                                    />
                                    <p class="single-line">
                                        {{
                                            !session.audience &&
                                            !session.videoMuted
                                                ? $t("voip.turn_off_video")
                                                : $t("voip.turn_on_video")
                                        }}
                                    </p>
                                </div>
                                <div
                                    v-if="videoList.list.length"
                                    class="action-media"
                                    ref="actionVideo"
                                    @click="moreAction(1)"
                                >
                                    <Icon type="md-arrow-dropdown" />
                                </div>
                            </div>
                            <!-- 开始共享 -->
                            <div class="action">
                                <div class="action-icon" @click="screenShare">
                                    <img
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_screen_sharing.png"
                                    />
                                    <p class="single-line">
                                        {{ $t("voip.share_screen") }}
                                    </p>
                                </div>
                            </div>
                            <!-- 更多操作 -->
                            <div class="action" @click.stop="moreAction(2)">
                                <div class="action-icon">
                                    <em
                                        class="red-request"
                                        v-if="isRequestMeeting"
                                    ></em>
                                    <img
                                        class="action-img"
                                        src="@/assets/images/manage.png"
                                        draggable="false"
                                    />
                                    <p>{{ $t("voip.management") }}</p>
                                </div>
                                <div class="action-manage" ref="actionManage">
                                    <Icon type="md-arrow-dropdown" />
                                </div>
                            </div>
                            <!-- 邀请 -->
                            <div class="action">
                                <div class="action-icon" @click.stop="invite">
                                    <img
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_invite.png"
                                    />
                                    <p>{{ $t("voip.invite") }}</p>
                                </div>
                            </div>
                        </div>
                        <!-- 退出 -->
                        <div class="quit-btn">
                            <div class="action-icon" @click="hangup">
                                <img
                                    class="action-img"
                                    draggable="false"
                                    src="@/assets/images/av_conference_end_call.png"
                                />
                                <p>{{ $t("voip.leave_meeting") }}</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
            <!-- 成员模块 -->
            <ParticipantList
                v-if="showParticipantList"
                :showParticipantList="showParticipantList"
                :participantUserInfos="participantUserInfos"
                :selfUserInfo="selfUserInfo"
                :myMeetingData="myMeetingData"
                :permissionList="permissionList"
                :session="session"
                @hideParticipantList="hideParticipantList"
                @invite="invite"
            ></ParticipantList>
            <!-- 聊天室 -->
            <div
                class="chat-room-wrap"
                v-if="isShowChatRoom && currentConversationInfo"
            >
                <div class="barrage-wrap">
                    <BarrageMessageContentView
                        from="large"
                        ref="largeBarrageMessage"
                        :currentConversationInfo="currentConversationInfo"
                        :currentChatRoomMessageList="currentChatRoomMessageList"
                    ></BarrageMessageContentView>
                </div>
                <div class="input-wrap">
                    <BarrageInputView
                        from="large"
                        :currentConversationInfo="currentConversationInfo"
                    ></BarrageInputView>
                </div>
            </div>
        </div>
        <!-- 上传文档 -->
        <HistoryUploadDoc></HistoryUploadDoc>
    </div>
</template>

<script>
import ConferenceInviteMessageContent from "../../wfc/av/messages/conferenceInviteMessageContent";
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import localStorageEmitter from "../../ipc/localStorageEmitter";
import {
    isElectron,
    remote,
    currentWindow,
    ipcRenderer,
    dialog,
} from "@/platform";
import ScreenOrWindowPicker from "./ScreenOrWindowPicker";
import ScreenShareTip from "./conference/ScreenShareTip";
import CallEndReason from "../../wfc/av/engine/callEndReason";
import ScreenShareControlView from "./ScreenShareControlView";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import CallSessionCallback from "../../wfc/av/engine/callSessionCallback";
import avenginekit from "../../wfc/av/internal/engine.min";
import CallState from "@/wfc/av/engine/callState";
import UserInfo from "@/wfc/model/userInfo";

import ShareScreenNotificationMessageContent from "@/wfc/av/messages/customMessages/notification/shareScreenNotificationMessageContent";
import ForwardDesignatedMemberView from "@/ui/voip/conference/ForwardDesignatedMemberView";
import BarrageMessageContentView from "./chatRoom/BarrageMessageContentView";
import QuickMeetingContent from "@/wfc/av/messages/customMessages/quickMeetingContent";
import PickDesignatedMember from "./conference/PickDesignatedMember";
import AudienceOverflowTip from "./conference/AudienceOverflowTip";
import HistoryUploadDoc from "./conference/history/HistoryUploadDoc";
import ParticipantList from "./conference/ParticipantList";
import BarrageInputView from "./chatRoom/BarrageInputView";
import ConferAction from "./conference/ConferAction";
import CountDown from "./conference/CountDown.vue";
import { vOnClickOutside } from "@vueuse/components";

import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";
import EventType from "@/wfc/client/wfcEvent";
import SpinLoading from "@/ui/common/SpinLoading";
import Message from "@/wfc/messages/message";

import { getItem, setItem, removeItem } from "@/ui/util/storageHelper";
import { tipsContent } from "@/ui/common/Tips";
import { copyText } from "../util/clipboard";
import store from "../../store";
import wfc from "@/wfc/client/wfc";

import dayjs from "dayjs";
import { markRaw } from "vue";
import {
    getShareScreenState,
    getUpdateShareScreenState,
    getMyMeeting,
    getUpdateMeeting,
    getGenerateShortUrlV1,
    inviteCheck,
    leftMeeting,
    recordMeetingError,
    meetingHistoryDetail,
    getCloudUsedSpace,
} from "@/axios";

export default {
    name: "Conference",
    data() {
        return {
            session: null,
            audioOnly: false,
            muted: false,
            status: 1,
            selfUserInfo: null,
            participantUserInfos: [],
            startTimestamp: 0,
            currentTimestamp: 0,

            showParticipantList: false,
            sharedMiscState: store.state.misc,
            sharedConversationState: store.state.conversation,
            sharedPickState: store.state.pick,
            shareScreenStatus: 2,
            shareScreenUser: new Object(),
            changeScreenId: 0, // 双击切换全屏
            isHangup: false, // 是否点击退出和结束会议
            mediaDevices: [], // 设备信息
            isShowAudio: false, // 显示音频设备
            isShowVideo: false, // 显示视频设备
            audioList: [
                {
                    name: this.$t("common.speaker"), //输出设备 audiooutput
                    key: 0,
                    list: [],
                },
                {
                    name: this.$t("common.microphone"), //输入设备 audioinput
                    key: 1,
                    list: [],
                },
            ],
            videoList: {
                name: this.$t("common.camera"), //摄像头
                key: 0,
                list: [],
            },
            storageMedia: "",
            wifiInfo: { delay: 0, loss: "0" },
            delayTimers: 0, // 大于3次 提示
            screenWindowLock: false, // 共享屏幕锁
            checkAudioIn: 0,
            checkVideoIn: 0,
            videoInputDeviceIndex: 0,
            inviteLock: false,
            userCreateDate: 0,
            myMeetingData: { code: "" }, // 当前会议信息
            chatRoomInfo: null, // 聊天室信息
            showClose: false,
            isShowBarrage: false,
            isShowChatRoom: false,
            currentConversationInfo: null,
            refreshUserInfoInternal: 0,
            isOffline: false,
            startShareScreenLock: false, // 共享按钮锁
            viewLoading: false,
            joinChatCount: 0, //加入聊天室次数
            isRequestMeeting: false,
            manageList: [
                {
                    name: this.$t("voip.member"),
                    value: 0,
                    isShow: true,
                    icon: require("@/assets/images/av-members-icon.png"),
                },
                {
                    name: this.$t("voip.discuss_group"),
                    isShow: false,
                    value: 1,
                    icon: require("@/assets/images/av-group-icon.png"),
                },
                {
                    name: this.$t("voip.document"),
                    isShow: true,
                    value: 2,
                    icon: require("@/assets/images/av-doc-icon.png"),
                },
                {
                    name: this.$t("common.upload_document"),
                    isShow: true,
                    value: 3,
                    icon: require("@/assets/images/av-cloud-upload-icon.png"),
                },
            ],
            isShowManage: false,
            meetingDetail: null, //查询会议是否绑定群组和
            pingTimer: null,
            pingLock: false,
            currentChatRoomMessageList: [],
            isOrgVip: "", // 是否是组织人员
            currentMeetingInfo: "",
        };
    },
    components: {
        ScreenShareControlView,
        BarrageInputView,
        BarrageMessageContentView,
        ParticipantList,
        SpinLoading,
        HistoryUploadDoc,
    },
    computed: {
        permissionList() {
            return this.$store.state.permissionList;
        },
        // 媒体设备信息
        externalDevice() {
            return this.$store.state.deviceObj;
        },
        mediaList() {
            return this.isShowAudio
                ? this.audioList
                : this.isShowVideo
                ? [this.videoList]
                : [];
        },
        // 信号图片展示
        wifiImage() {
            let num = Number(this.wifiInfo.delay);
            let src = "";
            if (num <= 100) {
                src = require("../../assets/images/wifi-100.png");
            } else if (num <= 200) {
                src = require("../../assets/images/wifi-200.png");
            } else if (num <= 500) {
                src = require("../../assets/images/wifi-500.png");
            } else {
                src = require("../../assets/images/wifi-600.png");
            }
            return src;
        },
        // 时间显示
        duration() {
            if (this.currentTimestamp <= 0) {
                return "00:00";
            }
            let timeStamp = this.currentTimestamp - this.startTimestamp;
            return this.mixinTimestampFormat(timeStamp);
        },
        // 添加切换全屏类名
        screenClassName() {
            return (uid) => {
                return (
                    this.participantUserInfos &&
                    this.participantUserInfos.length &&
                    (this.changeScreenId === uid
                        ? "full-screen"
                        : (this.shareScreenUser.uid !== uid ||
                              this.shareScreenStatus) &&
                          this.changeScreenId
                        ? "hidden-screen"
                        : "")
                );
            };
        },
        // 设置头像背景图
        setBackground() {
            return (portrait) => {
                const img = this.mixinDefaultPortrait(portrait);
                return {
                    background: `url(${img}) no-repeat center center`,
                    backgroundSize: "cover",
                };
            };
        },
        // 设置声音图标
        setVolume() {
            return (volume) => {
                const obj = {
                    20: [10, 20],
                    40: [30, 40],
                    60: [50, 60],
                    80: [70, 80],
                };
                let count = volume * 100;
                let num;
                if (count < 5) {
                    num = 0;
                } else if (count <= 99) {
                    num = String(count).substring(1, 0) * 10;
                    for (const key in obj) {
                        num = obj[key].includes(num) ? key : num;
                    }
                } else {
                    num = 100;
                }
                return require(`@/assets/images/av_conference_audio_icon_${num}.png`);
            };
        },
        audioList1() {
            return this.audioList[1];
        },
        showVideoDom() {
            return (participant) => {
                return (
                    !participant._isAudience &&
                    (this.selfUserInfo.uid === participant.uid
                        ? !this.session.videoMuted
                        : !participant._isVideoMuted) &&
                    participant._stream
                );
            };
        },
    },
    watch: {
        externalDevice: {
            handler(n) {
                console.log(n, "媒体设备发生变更了==>> externalDevice");
                let { audioOutList, audioInList, videoList } = n;
                audioOutList.forEach((item) => {
                    if (item.deviceId === "default") {
                        for (let i = 0; i < audioOutList.length; i++) {
                            if (
                                item.groupId === audioOutList[i].groupId &&
                                audioOutList[i].deviceId !== "default"
                            ) {
                                item._deviceId = audioOutList[i].deviceId;
                                return;
                            }
                        }
                    } else {
                        item._deviceId = item.deviceId;
                    }
                });
                audioInList.forEach((item) => {
                    if (item.deviceId === "default") {
                        for (let i = 0; i < audioInList.length; i++) {
                            if (
                                item.groupId === audioInList[i].groupId &&
                                audioOutList[i].deviceId !== "default"
                            ) {
                                item._deviceId = audioInList[i].deviceId;
                                return;
                            }
                        }
                    } else {
                        item._deviceId = item.deviceId;
                    }
                });
                // 获取设备列表
                this.audioList[0].list = audioOutList.map((item) => {
                    let { label, kind, groupId, deviceId, _deviceId } = item;
                    return { label, kind, groupId, deviceId, _deviceId };
                });
                this.audioList[1].list = audioInList.map((item) => {
                    let { label, kind, groupId, deviceId, _deviceId } = item;
                    return { label, kind, groupId, deviceId, _deviceId };
                });
                this.videoList.list = videoList.map((item) => {
                    let { label, kind, groupId, deviceId } = item;
                    return { label, kind, groupId, deviceId };
                });
                this.setDeviceId();
            },
            deep: true,
            immediate: true,
        },
        "videoList.list"(n, o) {
            // 关闭摄像头
            if (!n.length && this.session && !this.session.videoMuted) {
                console.log(n, "videoList", this.checkVideoIn);
                if (!this.checkVideoIn) {
                    this.muteVideo(1);
                }
            }
        },
        "audioList1.list"(n, o) {
            // 关闭麦克风
            if (!n.length && this.session && !this.session.audioMuted) {
                console.log(n, "audioList1", this.checkAudioIn);
                if (!this.checkAudioIn) {
                    this.muteAudio(1);
                }
            }
        },
        participantUserInfos: {
            deep: true,
            handler(infos) {
                this.resetScreenArrangement(infos);
                let ref = this.$refs[this.selfUserInfo.uid + "-audio"];
                if (ref && ref.length > 0) {
                    this.$refs[
                        this.selfUserInfo.uid + "-audio"
                    ][0].muted = true;
                }
            },
        },
        delayTimers(n, o) {
            if (n > 3) {
                if (!this.isOffline) {
                    this.viewLoading = true;
                }
                this.delayTimers = 0;
            }
        },
        "sharedConversationState.currentConversationMessageList": {
            handler: function (n, o) {
                this.currentChatRoomMessageList = n;
                this.scrollBottom();
            },
            deep: true,
            immediate: true,
        },
    },
    created() {
        document.title = this.$t("login.chainpal");
        // this.refreshUserInfoInternal = setInterval(() => {
        //   this.refreshUserInfos()
        // }, 3 * 1000)
        // 监听分享屏幕通知消息
        localStorageEmitter.on("full-screen-notice", (sender, args) => {
            let msg = Message.fromProtoMessage(args);
            let noticeMsgBody = JSON.parse(msg.content.content);
            console.log("----------分享屏幕-----", noticeMsgBody.status);
            this.shareScreenStatus = noticeMsgBody.status; // 1 有人正在共享    2 无人共享
            for (let i = 0; i < this.participantUserInfos.length; i++) {
                if (
                    noticeMsgBody.fromUserId ===
                    this.participantUserInfos[i].uid
                ) {
                    this.shareScreenUser = this.participantUserInfos[i];
                    this.changeScreenId =
                        this.shareScreenStatus === 1
                            ? this.participantUserInfos[i].uid
                            : "";
                }
            }
        });
        // 监听用户信息更新
        wfc.eventEmitter.on(EventType.UserInfosUpdate, this.onUserInfosUpdate);
    },
    mounted() {
        this.setupSessionCallback();
        // 申请入会消息处理
        localStorageEmitter.on("request-meeting-notice", (event, msg) => {
            if (msg.messageContent.content === this.myMeetingData.code) {
                this.isRequestMeeting = true;
            }
            setItem(
                `requestNotice_${msg.messageContent.content}`,
                msg.messageContent.content
            );
        });
        // 免费用户时间限制到期提醒
        localStorageEmitter.on("freeUser-time-notice", (event, msg) => {
            if (this.session.screenSharing) {
                dialog
                    .showMessageBox({
                        type: "info",
                        buttons: [
                            this.$t("voip.open"),
                            this.$t("common.cancel"),
                        ],
                        title: this.$t("voip.reminder"),
                        message: this.$t("voip.meeting_time_tip"),
                    })
                    .then((obj) => {
                        if (!obj.response) {
                            ipcRenderer.send("message-history-openUrl", {
                                urlAddress:
                                    "https://cloud.tongfudun.com/#/user/homeDetail?productId=38",
                            });
                        }
                    });
            } else {
                this.$alert({
                    title: this.$t("voip.reminder"),
                    content: this.$t("voip.meeting_time_tip"),
                    confirmText: this.$t("voip.open"),
                    cancelText: this.$t("common.cancel"),
                    clickToClose: false,
                    confirmCallback: () => {
                        ipcRenderer.send("message-history-openUrl", {
                            urlAddress:
                                "https://cloud.tongfudun.com/#/user/homeDetail?productId=38",
                        });
                    },
                });
            }
        });

        // 点击其他地方 设备弹窗消失
        let dom = document.querySelector(".conference-main-content-container");
        dom &&
            dom.addEventListener("mouseleave", (e) => {
                this.isShowAudio = false;
                this.isShowVideo = false;
                this.isShowManage = false;
            });

        let dateTimer = setTimeout(() => {
            if (this.userCreateDate) {
                let nowDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
                let hours = dayjs(nowDate).diff(
                    dayjs(this.userCreateDate),
                    "hours"
                );
                if (hours < 24) {
                    this.$alert({
                        title: this.$t("voip.warning"),
                        content: `<p style="text-align:left;">${this.$t(
                            "voip.new_share_tip"
                        )}</p>`,
                        cancelText: "",
                        width: 360,
                        height: 240,
                        confirmText: this.$t("voip.known"),
                        confirmCallback: () => {},
                    });
                }
            }
            dateTimer && clearTimeout(dateTimer);
        }, 3000);
        window.addEventListener("resize", () => {
            this.resetScreenArrangement(this.participantUserInfos);
        });
        window.addEventListener("online", this.handlerOnline);
        window.addEventListener("offline", this.handlerOffline);
        document.addEventListener("click", this.windowClick);

        // 设备呼起失败提示
        ipcRenderer.on("media-devices-permissions-error", (event, args) => {
            console.log(args, "到这里了吗=======");
            this.$Message.error(args);
        });

        /**
     * 会议中网络检测
      ipcRenderer.on('check-wifi-message', (event, data) => {
      if (data) {
        this.pingLock = false
        this.wifiInfo.loss = data.loss
        this.wifiInfo.delay =
          (data.delay && Math.round(Number(data.delay))) ||
          (typeof data.delay === 'undefined' ? '600' : data.delay)

        let lossNum = this.wifiInfo.loss.split('%')[0]
        if (this.wifiInfo.delay > 500 || Number(lossNum) > 10) {
          // 超过3次提示一下
          this.delayTimers++
        }
      }
    })
      this.pingBaiduWifi('baidu.com')
      this.pingChatTongfudun()
    */
    },
    methods: {
        // handlerWifi() {
        //   if (this.pingLock) {
        //     return
        //   }
        //   this.pingBaiduWifi('chat.tongfudun.com')
        // },
        // // 2分钟 ping tongfudun
        // pingChatTongfudun() {
        //   this.pingTimer = setInterval(() => {
        //     this.pingBaiduWifi('chat.tongfudun.com')
        //   }, 120 * 1000)
        // },
        // // 网络状态
        // pingBaiduWifi(host) {
        //   ipcRenderer.send('start-check-wifi', host)
        // },
        // killPing() {
        //   ipcRenderer.send('kill-ping-wifi')
        // },
        // ===================音视频设备相关事件逻辑 ========================= //
        // video audio 屏幕录制
        async checkMediaPermissions(type) {
            const nameObj = {
                camera: this.$t("mediaDevices.video"),
                microphone: this.$t("mediaDevices.audio"),
                screen: this.$t("mediaDevices.screen"),
            };
            const name = nameObj[type];
            this.$alert({
                content: this.$t("mediaDevices.mac-tip", [name]),
                title: `${this.$t("mediaDevices.title")}${name}`,
                cancelText: this.$t("mediaDevices.cancel"),
                confirmText: this.$t("mediaDevices.confirm"),
                width: 450,
                height: 200,
                confirmCallback: () => {
                    ipcRenderer.send(
                        "media-devices-permissions-callback",
                        type
                    );
                },
            });
        },
        // 点击显示设备或管理更多
        moreAction(num) {
            this.isShowAudio = false;
            this.isShowVideo = false;
            this.isShowManage = false;
            if (!num) {
                this.isShowAudio = true;
            } else if (num === 1) {
                this.isShowVideo = true;
            } else {
                this.isShowManage = true;
                // 保证每次是最新状态
                this.getThisMeetInfo();
            }
        },
        // 设置音视频信息
        handlerSetMedia(ele) {
            switch (ele.kind) {
                case "audiooutput":
                    // 音频输出
                    this.audioList[0].list.forEach((item) => {
                        this.$set(
                            item,
                            "_checked",
                            item.deviceId === ele.deviceId
                        );
                    });
                    this.setAudioOutputDeviceId(ele._deviceId, "audiooutput");
                    this.$Message.warning(
                        this.$t("voip.use_speaker", [ele.label])
                    );

                    break;
                case "audioinput":
                    // 音频输入
                    this.audioList[1].list.forEach((item) => {
                        this.$set(
                            item,
                            "_checked",
                            item.deviceId === ele.deviceId
                        );
                    });
                    this.session.setAudioInputDeviceId(ele._deviceId);
                    this.$Message.warning(
                        this.$t("voip.current_microphone", [ele.label])
                    );
                    break;
                case "videoinput":
                    // 摄像头
                    if (this.videoList.list.length === 1) return;
                    this.videoList.list.forEach((item) => {
                        this.$set(
                            item,
                            "_checked",
                            item.deviceId === ele.deviceId
                        );
                    });
                    this.session.setVideoInputDeviceId(ele.deviceId);
                    this.$Message.warning(
                        this.$t("voip.use_camera", [ele.label])
                    );
                    break;
            }
            let conferenceMedia = getItem("conferenceMedia");
            if (conferenceMedia && JSON.parse(conferenceMedia)) {
                let oldObj = JSON.parse(conferenceMedia);
                let json = { ...oldObj };
                json[ele.kind] = ele;
                setItem("conferenceMedia", JSON.stringify(json));
            }
        },
        // 设置当前使用的设备id
        setDeviceId() {
            // 优先设置储存的设备id
            let mediaInfo = getItem("conferenceMedia");
            if (mediaInfo) {
                let { audiooutput, audioinput, videoinput } =
                    JSON.parse(mediaInfo);
                if (this.audioList[0].list.length && audiooutput?.deviceId) {
                    this.audioList[0].list.forEach((item) => {
                        this.$set(
                            item,
                            "_checked",
                            item.deviceId === audiooutput.deviceId
                        );
                    });
                }
                if (this.audioList[1].list.length && audioinput?.deviceId) {
                    this.audioList[1].list.forEach((item) => {
                        this.$set(
                            item,
                            "_checked",
                            item.deviceId === audioinput.deviceId
                        );
                    });
                }
                if (this.videoList.list.length && videoinput?.deviceId) {
                    this.videoList.list.forEach((item) => {
                        this.$set(
                            item,
                            "_checked",
                            item.deviceId === videoinput.deviceId
                        );
                    });
                }
            }
            // 若匹配不到， 或者 没有记录则使用默认值 自动默认第一个 设置选中样式
            let index1 = this.audioList[0].list.findIndex(
                (item) => item._checked
            );
            if (index1 === -1 && this.audioList[0].list.length) {
                this.audioList[0].list.forEach((item) => {
                    this.$set(item, "_checked", item.deviceId === "default");
                });
            }
            // 输入音频
            // 若匹配不到， 或者 没有记录则使用默认值 自动默认第一个 设置选中样式
            let index2 = this.audioList[1].list.findIndex(
                (item) => item._checked
            );
            if (index2 === -1 && this.audioList[1].list.length) {
                this.audioList[1].list.forEach((item) => {
                    this.$set(item, "_checked", item.deviceId === "default");
                });
            }
            // 输入视频
            // 若匹配不到，自动默认第一个 设置选中样式
            let index3 = this.videoList.list.findIndex((item) => item._checked);
            if (index3 === -1 && this.videoList.list.length) {
                this.$set(this.videoList.list[0], "_checked", true);
            }

            this.$nextTick(() => {
                // 音频输出
                let audioOutDevice = this.audioList[0].list.filter(
                    (item) => item._checked
                )[0];
                // console.log(audioOutDevice, "====audioOutDevice", "音频输出");
                if (audioOutDevice && audioOutDevice._deviceId) {
                    this.setAudioOutputDeviceId(audioOutDevice._deviceId);
                }
                // 音频输入
                let audioInDevice = this.audioList[1].list.filter(
                    (item) => item._checked
                )[0];
                // console.log(audioInDevice, "====audioInDevice", "音频输入");
                if (audioInDevice && audioInDevice._deviceId && this.session) {
                    this.session.setAudioInputDeviceId(audioInDevice._deviceId);
                }
                //  视频输入
                let videoInDevice = this.videoList.list.filter(
                    (item) => item._checked
                )[0];
                // console.log(videoInDevice, "====videoInDevice", "视频输入");
                if (videoInDevice && videoInDevice.deviceId && this.session) {
                    this.session.setVideoInputDeviceId(videoInDevice.deviceId);
                }
            });
        },
        // 设置音频输出设备
        setAudioOutputDeviceId(deviceId) {
            let audioEls = this.$el.getElementsByTagName("audio");
            for (const audioEl of audioEls) {
                audioEl.setSinkId(deviceId);
                // audioEl.play()
            }
            let videoEls = this.$el.getElementsByTagName("video");
            for (const videoEl of videoEls) {
                videoEl.setSinkId(deviceId);
            }
        },
        // ==================== 设置会议回调信息 ==================//
        setupSessionCallback() {
            let sessionCallback = new CallSessionCallback();
            sessionCallback.didChangeState = (state) => {
                console.log("didChangeState=>>0000");
                this.status = state;
                if (state === CallState.STATUS_CONNECTED) {
                    // 比如没有摄像头，但发起视频通话时，会自动 muteVideo
                    this.selfUserInfo._isVideoMuted = this.session.videoMuted;
                    if (this.startTimestamp === 0) {
                        this.startTimestamp = new Date().getTime();
                        let isMins = 0;
                        this.timer = setInterval(() => {
                            this.currentTimestamp = new Date().getTime();
                            isMins++;
                            if (isMins === 60) {
                                isMins = 0;
                                let lossNum =
                                    (this.wifiInfo &&
                                        this.wifiInfo.loss &&
                                        this.wifiInfo.loss.split("%")[0]) ||
                                    0;
                                if (
                                    this.isOffline ||
                                    (this.wifiInfo.delay > 500 &&
                                        Number(lossNum) > 90)
                                ) {
                                    this.$alert({
                                        content: this.$t("voip.wifi_error_tip"),
                                        cancelText: "",
                                        confirmText: this.$t("voip.i_known"),
                                        isText: true,
                                        clickToClose: false,
                                    });
                                }
                            }
                        }, 1000);
                    }
                } else if (state === CallState.STATUS_IDLE) {
                    this.timer && clearInterval(this.timer);
                }
            };

            sessionCallback.onInitial = (session, selfUserInfo) => {
                console.log("onInitial ===>>1111<<<===");
                selfUserInfo._isHost = session.host === selfUserInfo.uid; // 是否是主持人
                selfUserInfo._isAudience = session.audience; // 当前是（true）听众模式还是（false）互动模式
                selfUserInfo._isVideoMuted = session.videoMuted;
                selfUserInfo._isAudioMuted = session.audioMuted;
                selfUserInfo._volume = 0;

                this.selfUserInfo = selfUserInfo;
                this.participantUserInfos = [selfUserInfo];

                // pls refer to: https://vuejs.org/v2/guide/reactivity.html
                this.$set(this.selfUserInfo, "_stream", null);
                this.$set(this.selfUserInfo, "_screenShareStream", null);
                this.$set(this.selfUserInfo, "_isScreenSharing", false);
                this.participantUserInfos.forEach((p) =>
                    this.$set(p, "_stream", null)
                );

                this.session = session;
                document.title = session.title;

                console.log("初始化会议参数>>>>>", this.session);
                console.log(session.audience, "true听众模式,false互动模式");
                // 快速会议 设置的是否开启音视频的信息
                let { isQuickMeeting } = session.extra;
                if (!isQuickMeeting) {
                    this.setShareScreenView(0);
                }
                this.initialConference();
            };

            sessionCallback.didCreateLocalVideoTrack = (
                stream,
                screenShare
            ) => {
                console.log("didCreateLocalVideoTrack ===>>2222<<<===");
                console.log(stream, screenShare, this.session.screenSharing);
                if (screenShare) {
                    this.selfUserInfo._screenShareStream = stream;
                } else {
                    this.selfUserInfo._stream = stream;
                    this.selfUserInfo._screenShareStream = null;
                    this.selfUserInfo._isVideoMuted = false;
                }
                this.selfUserInfo._isScreenSharing = screenShare;
            };

            sessionCallback.didRotateLocalVideoTrack = (stream) => {
                console.log(
                    "didRotateLocalVideoTrack ===>>4444<<===",
                    stream.getAudioTracks()
                );
                this.selfUserInfo._stream = stream;
                this.selfUserInfo._stream.timestamp = new Date().getTime();
                // 自己的
                for (let i = 0; i < this.participantUserInfos.length; i++) {
                    p = this.participantUserInfos[i];
                    if (p.uid === this.selfUserInfo.uid) {
                        p._stream = stream;
                        p._stream.timestamp = new Date().getTime();
                        break;
                    }
                }
            };

            sessionCallback.didScreenShareEnded = async () => {
                console.log(
                    "didScreenShareEnded ===>>5555<<===",
                    this.session.videoMuted,
                    this.session.audioMuted,
                    this.session.screenSharing
                );
                if (isElectron()) {
                    currentWindow.setIgnoreMouseEvents(false);
                }
                this.selfUserInfo._isScreenSharing = false;
                this.selfUserInfo._isVideoMuted = this.session.videoMuted;
                // 如果正在共享屏幕，关闭共享
                let result = await this.handleUpdateScreenShare(2);
                if (result) {
                    this.sendParticipantShareScreenNotice(2);
                }
                // 回到大窗口
                avenginekitproxy.emitToMain("stop-screen-share", {
                    type: "conference",
                });
                document.title = this.session.title;
                this.$nextTick(() => {
                    if (
                        !this.selfUserInfo._isHost &&
                        !this.session.audience &&
                        this.session.audioMuted &&
                        this.session.videoMuted
                    ) {
                        console.log(
                            "设置了 听众模式--1",
                            this.session.audience
                        );
                        this.session.switchAudience(true);
                    }
                });
            };

            sessionCallback.didCreateLocalVideoTrackError = () => {
                console.log("didCreateLocalVideoTrackError ===>>6666<<===");
                // TODO
                // 没有摄像头或者麦克风，加入会议时，会回调到此处，自己断会显示自己的头像，其他端会显示黑屏
                // 可以进行相关提示
            };

            sessionCallback.didReceiveRemoteVideoTrack = (
                userId,
                stream,
                screenSharing
            ) => {
                let p;
                console.log("didReceiveRemoteVideoTrack==>>7777<<==");
                console.log(userId, stream, screenSharing);
                for (let i = 0; i < this.participantUserInfos.length; i++) {
                    p = this.participantUserInfos[i];
                    if (
                        p.uid === userId &&
                        p._isScreenSharing === screenSharing
                    ) {
                        p._stream = stream;
                        p._stream.timestamp = new Date().getTime();
                        break;
                    }
                }
            };

            sessionCallback.didParticipantJoined = (userId, screenSharing) => {
                console.log("didParticipantJoined==>>8888<<==");
                console.log(userId, screenSharing);
                let userInfo = wfc.getUserInfo(userId);
                let subscriber = this.session.getSubscriber(
                    userId,
                    screenSharing
                );
                userInfo._stream = subscriber.stream;
                userInfo._isAudience = subscriber.audience;
                userInfo._isHost = this.session.host === userId;
                userInfo._isVideoMuted = subscriber.videoMuted;
                userInfo._isAudioMuted = subscriber.audioMuted;
                userInfo._volume = 0;
                userInfo._isScreenSharing = screenSharing;
                /**
                 * 解决重复出现用户的情况，成员离开了会议，但是未正常接收到通知，显示是未离开会议，下次再进入会议的时候会再次push进去，则出现多个用户在
                 */
                this.participantUserInfos = this.participantUserInfos.filter(
                    (item) => {
                        return item.uid !== userId;
                    }
                );
                this.participantUserInfos.push(
                    Object.assign(new UserInfo(), userInfo)
                );
                console.log(
                    "joined",
                    userInfo,
                    subscriber.audience,
                    this.participantUserInfos.length
                );
            };

            sessionCallback.didParticipantLeft = (
                userId,
                endReason,
                screenSharing
            ) => {
                console.log(
                    "didParticipantLeft ===>>9999<<===",
                    userId,
                    endReason,
                    screenSharing,
                    this.participantUserInfos.length
                );
                this.participantUserInfos = this.participantUserInfos.filter(
                    (p) => {
                        console.log(p.uid, userId, p._isScreenSharing);
                        //   return p.uid !== userId
                        return !(
                            p.uid === userId &&
                            p._isScreenSharing === screenSharing
                        );
                    }
                );
                // 当前共享的人员离开了
                if (this.shareScreenUser.uid === userId) {
                    this.changeScreenId = 0;
                }
            };

            sessionCallback.didCallEndWithReason = async (reason) => {
                console.log("callEndWithReason ===>>1010<<===", reason);
                // 清除本地会议状态
                removeItem("confer_code");
                avenginekitproxy.closeChatRoomWindow();
                // this.killPing()
                // 如果正在共享屏幕，关闭共享
                if (this.session.screenSharing) {
                    let result = await this.handleUpdateScreenShare(2);
                    if (result) {
                        this.sendParticipantShareScreenNotice(2);
                    }
                    this.session.stopScreenShare();
                }
                if (reason === CallEndReason.RoomNotExist) {
                    console.log("join conference failed", reason, this.session);
                    let obj = { reason: reason, session: this.session };
                    localStorageEmitter.send("join-conference-failed", obj);
                    this.handlerRecordMeetingError("加入会议失败"); //会议埋点
                }
                // 被离开会议添加提示
                if (
                    reason === CallEndReason.REASON_RemoteHangup ||
                    (reason === CallEndReason.REASON_Hangup && !this.isHangup)
                ) {
                    this.isHangup = false;
                    this.handlerLeftMeeting();
                    alert(this.$t("voip.you_leaved"));
                }
                //主持人退出了会议，
                if (reason === CallEndReason.RoomDestroyed && !this.isHangup) {
                    this.isHangup = false;
                    alert(this.$t("voip.host_end_meeting"));
                }

                if (reason === CallEndReason.REASON_MediaError) {
                    this.$alert({
                        content: this.$t("voip.wifi_error_tip"),
                        confirmText: this.$t("voip.leave_meeting"),
                        isText: true,
                        cancelText: "",
                        confirmCallback: () => {
                            this.quitChatroom(); // 退出聊天室
                            this.handlerRecordMeetingError(
                                this.$t("voip.wifi_error_tip")
                            ); //会议埋点
                            this.session.closeVoipWindow();
                            this.session = null;
                        },
                        clickToClose: false,
                    });
                    return;
                }
                this.quitChatroom(); // 退出聊天室
                this.session.closeVoipWindow();
                this.session = null;
            };

            sessionCallback.didChangeType = (
                userId,
                audience,
                screenSharing
            ) => {
                console.log(
                    "didChangeType ===>>1212<<===",
                    userId,
                    audience,
                    screenSharing
                );
                this.participantUserInfos.forEach((u) => {
                    if (
                        u.uid === userId &&
                        u._isScreenSharing === screenSharing
                    ) {
                        u._isAudience = audience;
                        if (audience) {
                            u._stream = null;
                        }
                    }
                });
            };
            //音量通知
            sessionCallback.didReportAudioVolume = (userId, volume) => {
                this.participantUserInfos.forEach((u) => {
                    if (u.uid === userId && u._isScreenSharing === false) {
                        u._volume = volume;
                    }
                    if (userId === this.selfUserInfo.uid) {
                        this.selfUserInfo._volume = volume;
                    }
                });
            };

            sessionCallback.didMuteStateChanged = (participants) => {
                participants.forEach((p) => {
                    // 自己
                    if (p === this.selfUserInfo.uid) {
                        console.log(
                            "didMuteStateChanged self",
                            this.session.videoMuted
                        );
                        this.selfUserInfo._isVideoMuted =
                            this.session.videoMuted;
                        return;
                    }
                    let s = this.session.getSubscriber(p);
                    if (!s) return;
                    console.log(
                        "didMuteStateChanged ===>>1313<<===",
                        p,
                        s.videoMuted,
                        s.audioMuted
                    );
                    this.participantUserInfos.forEach((u) => {
                        if (u.uid === p && u._isScreenSharing === false) {
                            let subscriber = this.session.getSubscriber(p);
                            this.$set(
                                u,
                                "_isVideoMuted",
                                subscriber.videoMuted
                            );
                            this.$set(
                                u,
                                "_isAudioMuted",
                                subscriber.audioMuted
                            );
                            console.log(
                                subscriber,
                                "didMuteStateChanged切换音视频",
                                u
                            );
                        }
                    });
                });
            };

            sessionCallback.didMediaLostPacket = (
                media,
                lostPacket,
                screenSharing
            ) => {
                this.viewLoading = false;
                if (lostPacket > 6) {
                    console.log("您的网络不好");
                    this.$Toast.show({
                        type: "",
                        text: this.$t("voip.network_unstable"),
                        time: 5000,
                    });
                } else if (lostPacket > 10) {
                    this.viewLoading = true;
                }
            };

            sessionCallback.didUserMediaLostPacket = (
                userId,
                media,
                lostPacket,
                uplink,
                screenSharing
            ) => {
                //如果uplink true对方网络不好，false您的网络不好
                //接收方丢包超过10为网络不好
                if (lostPacket > 10) {
                    if (uplink) {
                        let userInfos = this.participantUserInfos.filter(
                            (u) => u.uid === userId
                        );
                        if (userInfos && userInfos.length > 0) {
                            console.log(userInfos[0].displayName, "网络不好");
                            this.$Toast.show({
                                type: "",
                                text: `${this.mixinGetUserName(
                                    userInfos[0]
                                )} ${this.$t("voip.unstable")}`,
                                time: 5000,
                            });
                        }
                    } else {
                        console.log("您的网络不好");
                        this.$Toast.show({
                            type: "",
                            text: this.$t("voip.network_unstable"),
                            time: 5000,
                        });
                    }
                }
            };

            avenginekit.setup(sessionCallback);
        },
        // 会议初始化后进行信息处理
        async initialConference() {
            try {
                let { extra } = this.session;
                let { data, message, code } = await this.getMyMeetingInfo(
                    this.session.callId
                );
                if (code === "000000") {
                    this.myMeetingData = data;
                    setItem("confer_code", data.code);
                    // 加入聊天室
                    this.joinChatroom(data.code);
                    // 快速会议
                    if (extra && extra.isQuickMeeting) {
                        // 有指定成员添加邀请提示框
                        if (
                            extra.designatedMember &&
                            extra.designatedMember.length
                        ) {
                            this.handlerInviteDesignatedMemberConference({
                                message: this.getInviteConferenceMessage(data),
                                designatedMember: extra.designatedMember,
                            });
                        }
                    }
                    this.removeToJoinStorage();
                    let markCode = getItem(`requestNotice_${data.code}`);
                    if (markCode && markCode === data.code) {
                        this.isRequestMeeting = true;
                    }
                    //   this.sendQuickMeetingMessage(); // 关闭会议邀请响铃
                } else {
                    this.$Message.warning(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 监听好友信息变化
        onUserInfosUpdate(userInfos) {
            userInfos.forEach((u) => {
                this.participantUserInfos = this.participantUserInfos.map(
                    (item) => {
                        return item.uid === u.uid ? { ...item, ...u } : item;
                    }
                );
            });
        },
        // 更新会议中人员信息
        refreshUserInfos() {
            let toRefreshUsers = [];
            this.participantUserInfos.forEach((pu) => {
                if (!pu.updateDt) {
                    toRefreshUsers.push(pu.uid);
                }
            });
            if (toRefreshUsers.length > 0) {
                let userInfos = wfc.getUserInfos(toRefreshUsers, "");
                userInfos.forEach((u) => {
                    let index = this.participantUserInfos.findIndex(
                        (p) => p.uid === u.uid
                    );
                    if (u.updateDt && index > -1) {
                        let ou = this.participantUserInfos[index];
                        u._stream = ou._stream;
                        u._isAudience = ou._isAudience;
                        u._isHost = ou._isHost;
                        u._isVideoMuted = ou._isVideoMuted;
                        u._isAudioMuted = ou._isAudioMuted;
                        u._volume = ou._volume;
                        // FYI: https://v2.vuejs.org/v2/guide/reactivity#Change-Detection-Caveats
                        this.participantUserInfos.splice(index, 1, u);
                        // for (const key in ou) {
                        //   this.$set(this.participantUserInfos[index], key, u[key])
                        // }
                    }
                });
            }
        },
        // 重新设置屏幕排列
        resetScreenArrangement(infos) {
            let count = infos.length;
            let width = "100%";
            let height = "100%";
            let flexWrap = "wrap";
            let justifyContent = "center";
            let alignContent = "center";
            if (count <= 1) {
                width = "100%";
                height = "100%";
            } else if (count <= 4) {
                width = "calc(50% - 8px)";
                height = "calc(50% - 8px)";
            } else if (count >= 5) {
                width = "calc(33.3% - 8px)";
                height = "calc(33.3% - 8px)";
            }
            // 处理视频布局样式
            if (count > 6) {
                justifyContent = "left";
            }
            if (count > 9) {
                alignContent = "top";
            }
            if (this.$refs.contentContainer) {
                const obj1 = {
                    width,
                    height,
                    "flex-wrap": flexWrap,
                    "justify-content": justifyContent,
                    "align-content": alignContent,
                };
                for (const key in obj1) {
                    this.$refs.contentContainer.style.setProperty(
                        `--participant-video-item-${key}`,
                        obj1[key]
                    );
                }
            }
        },
        // 获取当前共享屏幕的状态
        async handlerScreenState() {
            try {
                let res = await getShareScreenState({
                    meetingId: this.session.callId,
                });
                return res.data;
            } catch (error) {
                return false;
            }
        },
        // 广播共享屏幕消息
        async sendShareScreenNotice(status, source) {
            try {
                const { code, data, message } = await this.handlerScreenState();
                if (
                    code == "000000" &&
                    (data == null ||
                        data.status != 1 ||
                        wfc.getUserId() === data.userId)
                ) {
                    // 更新共享状态
                    let result = await this.handleUpdateScreenShare(status);
                    if (result && source) {
                        // 如果是听众模式需要将听众模式改成互动模式，再打开共享
                        if (this.session.audience) {
                            // 当前是听众模式=>改成互动模式
                            await this.session.switchAudience(false);
                            this.selfUserInfo._isAudience = false;
                        }
                        // 如当前是全屏，先还原之后缩小
                        let win = remote.getCurrentWindow();
                        // console.log(win.isFullScreen(),win.isMaximized(),'111')
                        if (win.isFullScreen() || win.isMaximized()) {
                            win.setFullScreen(false);
                            win.unmaximize();
                        }
                        this.$nextTick(() => {
                            // 开始共享
                            this.session.startScreenShare({
                                sourceId: source.id,
                                minWidth: 1280,
                                maxWidth: 1280,
                                minHeight: 720,
                                maxHeight: 720,
                            });
                            avenginekitproxy.emitToMain("start-screen-share");
                            this.screenWindowLock = false;
                            // 发起共享通知
                            this.sendParticipantShareScreenNotice(1);
                            this.shareScreenUser = this.selfUserInfo;
                            // 记录当前共享人的 uid，全屏展示样式用
                            this.changeScreenId = this.selfUserInfo.uid;
                        });
                    }
                } else {
                    this.screenWindowLock = false;
                    this.$Message.warning(
                        code !== "000000"
                            ? message
                            : this.$t("voip.sharing_screen")
                    );
                }
            } catch (error) {
                console.log(error);
                this.screenWindowLock = false;
                this.$Message.warning(this.$t("common.error_later"));
            }
        },
        // 获取会议信息
        async getMyMeetingInfo(meetingId) {
            try {
                let res = await getMyMeeting({ meetingId });
                let { data, message, code } = res.data;
                this.currentMeetingInfo = data;
                return { data, message, code };
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
                return null;
            }
        },
        /**
         * 发送当前共享通知
         * @param {Number} shareStatus //  共享 ： 1 , 退出共享: 2
         * */
        sendParticipantShareScreenNotice(shareStatus) {
            for (let i = 0; i < this.participantUserInfos.length; i++) {
                let conv = new Conversation(
                    0,
                    this.participantUserInfos[i].uid,
                    0
                );
                let messageContent =
                    new ShareScreenNotificationMessageContent();
                messageContent.from = this.selfUserInfo.uid;
                messageContent.to = this.participantUserInfos[i].uid;
                messageContent.content = JSON.stringify({
                    status: shareStatus,
                    fromUserId: this.selfUserInfo.uid,
                });
                wfc.sendConversationMessage(conv, messageContent);
            }
            // 当前分享状态
            this.shareScreenStatus = shareStatus;
            if (shareStatus === 2) {
                this.changeScreenId = 0; // 退出全屏
                removeItem("confer_code");
            }
        },
        // 获取分享好友的 会议消息体
        getInviteConferenceMessage(params) {
            console.log(params, "getInviteConferenceMessage");
            let callSession = this.session;
            let inviteMessageContent = new ConferenceInviteMessageContent(
                callSession.callId,
                callSession.host,
                callSession.title,
                callSession.desc,
                new Date(params.startTime).getTime(),
                callSession.audioOnly,
                callSession.defaultAudience,
                callSession.advance,
                callSession.pin,
                new Date(params.endTime).getTime(),
                params.code,
                params.type,
                params.isPasswordNeed, // 是否密码
                params.password // 具体密码
            );
            let messageContent = Message.messageContentFromMessagePayload(
                inviteMessageContent.encode(),
                wfc.getUserId()
            );
            let message = new Message(null, messageContent);
            return message;
        },

        /** 会议中信息收集
         * errorLog : 会议code|action|
         * meetingId
         **/
        async handlerRecordMeetingError(info) {
            if (
                (this.myMeetingData && !this.myMeetingData.code) ||
                typeof this.myMeetingData.code === "undefined"
            ) {
                return;
            }
            try {
                let res = await recordMeetingError({
                    meetingId: this.myMeetingData.id,
                    errorLog: `${this.myMeetingData.code}|${info}`,
                });
                let { code, message, data } = res.data;
                console.log(code, message, data);
            } catch (error) {
                console.log(error);
            }
        },
        // 双击屏幕
        handleDblclick(uid) {
            if (!this.participantUserInfos.length) return;
            this.changeScreenId = this.changeScreenId === uid ? "" : uid;
        },
        /*用于dropdown的全局点击事件*/
        windowClick(e) {
            let currentDom = e.target;
            let actionAudio = this.$refs["actionAudio"];
            let actionVideo = this.$refs["actionVideo"];
            let actionManage = this.$refs["actionManage"];
            if (actionAudio) {
                if (!actionAudio.contains(currentDom)) {
                    this.isShowAudio = false;
                }
            }
            if (actionVideo) {
                if (!actionVideo.contains(currentDom)) {
                    this.isShowVideo = false;
                }
            }
            if (actionManage) {
                if (!actionManage.contains(currentDom)) {
                    this.isShowManage = false;
                }
            }
        },
        // 外链入会的会议号 进入会议后删除缓存的会议号
        removeToJoinStorage() {
            let tojoinId = getItem("to_join");
            if (tojoinId === this.myMeetingData.code) {
                removeItem("to_join");
            }
        },

        // 离开会议接口埋点
        async handlerLeftMeeting() {
            try {
                await leftMeeting({ id: this.myMeetingData.id });
            } catch (error) {}
        },
        // ================header action 顶部操作框按钮事件逻辑 ================//
        // 邀请会议 | 指定人员邀请 step-1
        async invite() {
            let { designatedParticipants, isDesignatedParticipant, ownerId } =
                this.myMeetingData;
            if (
                isDesignatedParticipant &&
                designatedParticipants &&
                designatedParticipants.length &&
                ownerId !== wfc.getUserId()
            ) {
                this.$Message.error(this.$t("voip.only_host_invite"));
                return;
            }
            let { isAppCharge, vipLevel } = this.permissionList;
            // 开启计费模式
            if (isAppCharge) {
                if (this.inviteLock) return;
                this.inviteLock = true;
                try {
                    // 判断是否有到人数限制了
                    let res = await inviteCheck({
                        meetingId: this.session.callId,
                    });
                    let { code } = res.data;
                    this.inviteLock = false;
                    // 还有人数名额
                    if (code === "000000") {
                        this.nextInvite();
                    } else {
                        let textTip = vipLevel
                            ? this.$t("voip.max_participants_tip1")
                            : this.$t("voip.max_participants_tip2");
                        this.$alert({
                            content: textTip,
                            confirmText: this.$t("voip.continue"),
                            cancelText: this.$t("common.cancel"),
                            isText: true,
                            cancelCallback: () => {},
                            confirmCallback: () => {
                                this.nextInvite();
                            },
                        });
                    }
                } catch (error) {
                    this.inviteLock = false;
                    console.log(error);
                    this.$Message.error(this.$t("common.error_later"));
                }
            } else {
                this.nextInvite();
            }
        },
        // 邀请会议 | 指定人员邀请   邀请其他成员进入会议 step-2
        async nextInvite() {
            try {
                let { data, message, code } = await this.getMyMeetingInfo(
                    this.session.callId
                );
                if (code === "000000") {
                    let { designatedParticipants, isDesignatedParticipant } =
                        data;
                    let inviteMessage = this.getInviteConferenceMessage(data);
                    if (
                        isDesignatedParticipant &&
                        designatedParticipants &&
                        designatedParticipants.length &&
                        data.ownerId === wfc.getUserId()
                    ) {
                        this.handlerInviteDesignatedMemberConference({
                            message: inviteMessage,
                            designatedMember: designatedParticipants.map(
                                (item) => item.userId
                            ),
                            isAddDesignatedMember: true,
                        });
                    } else {
                        this.$forwardMessage({
                            forwardType: ForwardType.NORMAL,
                            messages: [inviteMessage],
                            forwardFilterAnonymous: true,
                        });
                    }
                    this.showParticipantList = false;
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 邀请成员会议逻辑
        handlerInviteDesignatedMemberConference({
            message,
            designatedMember,
            isAddDesignatedMember,
        }) {
            //加人
            if (isAddDesignatedMember) {
                let conferenceJoinLimit =
                    this.permissionList.conferenceJoinLimit;
                let uncheckableUsers = wfc.getUserInfos(designatedMember, "");
                this.$modal.show(
                    PickDesignatedMember,
                    {
                        maxLength: conferenceJoinLimit,
                        conferenceItem: { imMeetingId: this.myMeetingData.id },
                        uncheckableUsers, // 已经选定的人员
                        confirmTitle: this.$t("common.confirm"),
                        isEdit: true,
                    },
                    null,
                    {
                        name: "pick-designated-member-modal",
                        width: 600,
                        height: 480,
                        clickToClose: false,
                    },
                    {
                        "before-close": (event) => {
                            if (!event.params) return;
                            let { confirm, pickedUsers } = event.params;
                            if (!confirm) return;
                            let ids = pickedUsers
                                .filter((item) => !item.groupId)
                                .map((item) => item.uid);
                            let conversations =
                                store.getDesignatedMemberConversations(ids);
                            let groupConversations = [];
                            let groupId = "";
                            let index = pickedUsers.findIndex(
                                (item) => item.groupId
                            );
                            if (index > -1) {
                                groupId = pickedUsers[index].uid;
                            }
                            if (groupId) {
                                groupConversations =
                                    store.getDesignatedGroupConversations(
                                        groupId
                                    );
                            }
                            this.sendInviteMessage({
                                messages: [message],
                                conversations,
                                groupConversations,
                            });
                        },
                    }
                );
            } else {
                let ids = designatedMember
                    .filter((item) => !item.groupId)
                    .map((item) => item.uid);
                let conversations = store.getDesignatedMemberConversations(ids);
                let groupConversations = [];
                let groupId = "";
                let index = designatedMember.findIndex((item) => item.groupId);
                if (index > -1) {
                    groupId = designatedMember[index].uid;
                }
                if (groupId) {
                    groupConversations =
                        store.getDesignatedGroupConversations(groupId);
                }
                this.sendInviteMessage({
                    messages: [message],
                    conversations,
                    groupConversations,
                });
            }
        },
        // 发送会议邀请消息弹窗
        sendInviteMessage(data) {
            let { messages, conversations, groupConversations } = data;
            this.$modal.show(
                ForwardDesignatedMemberView,
                {
                    forwardType: ForwardType.NORMAL,
                    designatedMember: [...conversations, ...groupConversations],
                    confirmTitle: this.$t("common.confirm"),
                    messages,
                },
                null,
                {
                    name: "forward-designated-member-modal",
                    width: 440,
                    height: 520,
                    clickToClose: false, // 点击模态框是否关闭
                },
                {
                    "before-close": (event) => {
                        this.sharedPickState.conversations.length = 0;
                        if (!event.params) return;
                        let { confirm, extraMessageText } = event.params;
                        if (confirm) {
                            if (groupConversations.length) {
                                store.forwardMessage(
                                    ForwardType.NORMAL,
                                    groupConversations,
                                    messages,
                                    `${this.$t(
                                        "conversation.atAll"
                                    )} ${extraMessageText}`,
                                    "isAtAll"
                                );
                            }
                            if (conversations.length) {
                                store.forwardMessage(
                                    ForwardType.NORMAL,
                                    conversations,
                                    messages,
                                    extraMessageText
                                );
                            }
                            this.$Message.success(
                                this.$t("friend_request.sent")
                            );
                        }
                    },
                }
            );
        },
        // 点击复制
        async copy() {
            try {
                let meetInfo = await this.getMyMeetingInfo(this.session.callId);
                if (!meetInfo) return;
                const { code, data } = meetInfo;
                if (code == "000000") {
                    let originalLink = `${
                        this.mixinHttps
                    }/launchMeet/index.html/?${window.btoa(
                        data.code.replace(/\s*/g, "")
                    )}`;
                    // 生成短连接
                    let {
                        code: shortCode,
                        data: shortData,
                        message: shortMsg,
                    } = await this.getShortUrl(originalLink);
                    if (shortCode === "000000") {
                        let pw =
                            data.isPasswordNeed && data.password
                                ? `<br/> ${this.$t("voip.meeting_pw")}：${
                                      data.password
                                  }`
                                : "";
                        const arr = data.startTime.split(" ");
                        const startDate = arr[0].replace(/\-/g, "/");
                        const start = arr[1];
                        const end = data.endTime.split(" ")[1];
                        // 快速会议需要添加结束时间 默认+30分钟
                        const addEnd = dayjs(data.endTime)
                            .add(30, "minute")
                            .format("YYYY-MM-DD HH:mm:ss")
                            .split(" ")[1];

                        let str = `${this.mixinGetUserName(
                            this.selfUserInfo
                        )}${this.$t("voip.invite_you")}<br/>${this.$t(
                            "voip.meeting_topic"
                        )}${this.session.title}<br/>${this.$t(
                            "voip.meeting_time"
                        )}${startDate}\n\n${start.substr(0, 5)}\n-\n${
                            data.startTime === data.endTime
                                ? addEnd.substr(0, 5)
                                : end.substr(0, 5)
                        }<br/> ${this.$t("voip.click_join")}<br/> ${
                            shortData.shortUrl || ""
                        } <br/> ${this.$t("voip.meeting_code_id")}${
                            data.code
                        }${pw}`;
                        //处理复制后粘贴没有样式问题
                        let aux = document.createElement("div");
                        aux.innerHTML = str;
                        document.body.appendChild(aux);
                        copyText(aux.innerText);
                        document.body.removeChild(aux);
                        this.$Message.success(this.$t("web3.copied"));
                    } else {
                        this.$Message.error(shortMsg);
                    }
                } else {
                    this.$Message.error(this.$t("voip.copy_failed"));
                }
            } catch (error) {}
        },
        // 生成短连接
        async getShortUrl(url) {
            try {
                const res = await getGenerateShortUrlV1({ longUrl: url });
                let { data, message, code } = res.data;
                return { data, message, code };
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
                return null;
            }
        },
        // ================footer action 底部操作框按钮事件逻辑 ================//
        // 切换音频
        async muteAudio(type) {
            if (!this.externalDevice.hasAudio && type === 0) {
                this.$Message.warning(this.$t("voip.no_device_tip"));
                return;
            }

            if (this.session.audience || this.session.audioMuted) {
                // 麦克风权限检查
                const reply = await ipcRenderer.invoke(
                    "media-devices-permissions",
                    "microphone"
                );
                if (!reply) {
                    this.checkMediaPermissions("microphone");
                    return;
                }
            }

            // 检测当前主播人数
            if (
                this.session.audioMuted &&
                this.session.audience &&
                this.checkAudienceNum()
            ) {
                // 主播人数过多
                this.$modal.show(
                    AudienceOverflowTip,
                    {},
                    null,
                    {
                        name: "AudienceOverflowTip-modal",
                        width: 320,
                        height: 180,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    { "before-close": (event) => {} }
                );
                return;
            }
            this.checkAudioIn = type;
            let enable = this.session.audioMuted ? true : false;
            let result = await this.session.setAudioEnabled(enable);
            //  console.log(enable, result, "=====>>>==音频=");
            if (!result) {
                return;
            }
            this.selfUserInfo._isAudioMuted = !enable;
            if (enable) {
                // 如果是听众模式需要将听众模式改成互动模式，再打开音频
                if (this.session.audience) {
                    // 当前是听众模式=>改成互动模式
                    console.log("当前是听众模式=>改成互动模式==muteAudio");
                    await this.session.switchAudience(false);
                    this.selfUserInfo._isAudience = false;
                }
            } else {
                // 当前不是主持人，且是互动模式且摄像头和音频都关闭了则更改为 听众模式
                if (
                    !this.selfUserInfo._isHost &&
                    !this.session.audience &&
                    this.session.videoMuted
                ) {
                    console.log("设置了 听众模式--1");
                    await this.session.switchAudience(true);
                    this.selfUserInfo._isAudience = true;
                    this.selfUserInfo._volume = 0;
                }
            }
        },
        // 切换视频
        async muteVideo(type) {
            if (!this.externalDevice.hasVideo && type === 0) {
                this.$Message.warning(this.$t("voip.no_device_tip"));
                return;
            }
            // 权限检查
            if (this.session.audience || this.session.videoMuted) {
                const reply = await ipcRenderer.invoke(
                    "media-devices-permissions",
                    "camera"
                );
                if (!reply) {
                    this.checkMediaPermissions("camera");
                    return;
                }
            }

            // 检测当前主播人数
            if (
                this.session.videoMuted &&
                this.session.audience &&
                this.checkAudienceNum()
            ) {
                // 主播人数过多
                this.$modal.show(
                    AudienceOverflowTip,
                    {},
                    null,
                    {
                        name: "AudienceOverflowTip-modal",
                        width: 320,
                        height: 180,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    { "before-close": (event) => {} }
                );
                return;
            }
            this.checkVideoIn = type;
            let enable = this.session.videoMuted ? true : false;
            let result = await this.session.setVideoEnabled(enable);
            if (!result) return;
            this.selfUserInfo._isVideoMuted = !enable;
            if (enable) {
                // 如果是听众模式需要将听众模式改成互动模式，再打开视频
                if (this.session.audience) {
                    // 当前是听众模式=>改成互动模式
                    console.log("当前是听众模式=>改成互动模式==muteVideo");
                    await this.session.switchAudience(false);
                    this.selfUserInfo._isAudience = false;
                }
            } else {
                //   当前不是主持人，且是互动模式且摄像头和音频都关闭了则更改为 听众模式
                if (
                    !this.selfUserInfo._isHost &&
                    !this.session.audience &&
                    this.session.audioMuted &&
                    this.session.videoMuted
                ) {
                    await this.session.switchAudience(true);
                    this.selfUserInfo._isAudience = true;
                    console.log("设置了 听众模式--2", this.session.audience);
                }
            }
        },
        // 开始共享
        async screenShare() {
            if (this.session.audioOnly) {
                return;
            }
            // 权限检查
            const reply = await ipcRenderer.invoke(
                "media-devices-permissions",
                "screen"
            );
            if (!reply) {
                this.checkMediaPermissions("screen");
                return;
            }
            this.isShowChatRoom = false;
            if (this.screenWindowLock) return;
            this.screenWindowLock = true;
            const disclaimer = getItem("show_disclaimer_info");
            if (!disclaimer) {
                this.$modal.show(
                    ScreenShareTip,
                    { title: this.$t("voip.warning") },
                    null,
                    {
                        name: "ScreenShareTip-modal",
                        width: 400,
                        height: 240,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    {
                        "before-close": (event) => {
                            if (event.params) {
                                this.handlerShareScreen();
                            } else {
                                this.screenWindowLock = false;
                            }
                        },
                    }
                );
            } else {
                this.handlerShareScreen();
            }
        },
        // 操作管理其他项
        handleClickManage(item) {
            switch (item.value) {
                case 0: // 成员
                    this.isShowAudio = false;
                    this.isShowVideo = false;
                    this.isShowChatRoom = false;
                    this.isRequestMeeting = false;
                    this.isShowManage = false;
                    this.showParticipantList = !this.showParticipantList;
                    removeItem(`requestNotice_${this.myMeetingData.code}`);
                    break;
                case 1: // 讨论群
                    this.isShowManage = false;
                    this.$modal.show(
                        ConferAction,
                        {
                            title: this.$t("voip.group_management"),
                            actionType: item.value,
                            meetingDetail: this.meetingDetail,
                        },
                        null,
                        {
                            name: "ConferAction-modal",
                            width: 320,
                            height: 160,
                            clickToClose: false, // 点击模态框是否关闭
                        },
                        {
                            "before-close": (event) => {},
                        }
                    );
                    break;
                case 2: // 文档
                    this.isShowManage = false;
                    this.$modal.show(
                        ConferAction,
                        {
                            title: this.$t("voip.document_manage"),
                            actionType: item.value,
                            meetingDetail: this.meetingDetail,
                        },
                        null,
                        {
                            name: "ConferAction-modal",
                            width: 320,
                            height: 300,
                            clickToClose: false, // 点击模态框是否关闭
                        },
                        {
                            "before-close": (event) => {},
                        }
                    );
                    break;
                case 3: // 上传文档
                    this.uploadFile();
                    break;
            }
        },
        // 点击上传文件
        async uploadFile() {
            try {
                // 获取链文档信息
                let res = await getCloudUsedSpace({});
                const { code, message, data } = res.data;
                if (code == "000000") {
                    let { usedSpace, totalSpace } = data;
                    if (totalSpace - usedSpace <= 0) {
                        this.$alert({
                            content:
                                this.permissionList.isAppCharge &&
                                this.permissionList.vipLevel === 4
                                    ? tipsContent[3]
                                    : tipsContent[4],
                            height: 150,
                            isMainWindow: false,
                            cancelText: "",
                        });
                        return;
                    }
                    this.$refs["cloudFileInput"].click();
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 唤起上传
        onPickFile(event) {
            this.$eventBus.$emit("historyUploadDoc", {
                fromPage: "conference",
                files: event.target.files,
                userId: wfc.getUserId(),
                cycleMeetingId: this.meetingDetail.imCycleMeetingId,
                meetingId: this.meetingDetail.imMeetingId,
                bindingGroupId: this.meetingDetail.imGroupId,
            });
            event.target.value = "";
        },
        // 获取当前会议绑定的相关文件群等显示信息
        async getThisMeetInfo() {
            try {
                let res = await meetingHistoryDetail({
                    imMeetingId: this.myMeetingData.id,
                    imCycleMeetingId: this.myMeetingData.imCycleMeetingId || "",
                });
                let { data, code, message } = res.data;
                if (code === "000000") {
                    this.meetingDetail = data;
                    this.manageList = this.manageList.map((item) => {
                        return {
                            ...item,
                            isShow:
                                item.value === 1
                                    ? !!data.imGroupId
                                    : item.isShow,
                        };
                    });
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 点击退出或者结束会议
        hangup() {
            if (this.session.host === this.selfUserInfo.uid) {
                // 未到预定时间不显示结束会议按钮
                let isExit =
                    +dayjs() < +dayjs(this.currentMeetingInfo.scheduleTime);

                this.$alert({
                    content: this.$t(
                        isExit
                            ? "voip.noStarted_exit_meeting"
                            : "voip.exit_meeting_text"
                    ),
                    confirmText: this.$t("voip.exit_meeting"),
                    cancelText: isExit ? "" : this.$t("voip.end_meeting"),
                    isText: true,
                    width: 335,
                    confirmCallback: async () => {
                        // 退出会议
                        this.isHangup = true;
                        if (this.session.screenSharing) {
                            //关闭共享
                            const res = await this.handleUpdateScreenShare(2);
                            if (res) {
                                this.session.stopScreenShare();
                                this.session.leaveConference(false);
                                this.quitChatroom(); // 退出聊天室
                                // 发起退出共享通知
                                this.sendParticipantShareScreenNotice(2);
                            } else {
                                this.handlerRecordMeetingError(
                                    "点击退出会议，并退出共享失败"
                                );
                            }
                        } else {
                            this.session.leaveConference(false);
                            this.quitChatroom(); // 退出聊天室
                            removeItem("confer_code");
                        }
                        this.handlerLeftMeeting();
                    },
                    cancelCallback: () => {
                        this.$modal.show(
                            CountDown,
                            { endMeetingFun: this.endMeetingFun },
                            null,
                            {
                                name: "countdown-endMeeting-modal",
                                width: 300,
                                height: 120,
                            },
                            { "before-close": () => {} }
                        );
                    },
                });
            } else {
                this.$alert({
                    content: this.$t("voip.exit_meeting_tip"),
                    isText: true,
                    confirmCallback: () => {
                        this.isHangup = true;
                        this.session.leaveConference(false);
                        this.quitChatroom(); // 退出聊天室
                        removeItem("confer_code");
                        this.handlerLeftMeeting();
                    },
                    confirmText: this.$t("voip.exit_meeting"),
                    cancelText: this.$t("common.cancel"),
                });
            }
        },
        // 结束会议
        async endMeetingFun() {
            try {
                this.isHangup = true;
                let res = await getUpdateMeeting({
                    meetingId: this.session.callId,
                    status: "2",
                });
                let { code, message } = res.data;
                if (code == "000000") {
                    this.session.leaveConference(true);
                    this.quitChatroom(); // 退出聊天室
                    removeItem("confer_code");
                } else {
                    this.handlerRecordMeetingError("结束会议失败");
                    this.$Message.warning(message);
                }

                this.handlerLeftMeeting();
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },

        /**
         * 更新共享状态接口
         * @param {Number} status //1 为开启共享，2 为关闭共享
         */
        async handleUpdateScreenShare(status) {
            try {
                const res = await getUpdateShareScreenState({
                    meetingId: this.session.callId,
                    code: this.myMeetingData.code, //会议号
                    status, // 1 为开启共享，2 为关闭共享
                });
                const { data, code, message } = res.data;
                if (code === "000000") {
                    return { data, code, message };
                } else {
                    this.$Message.error(message);
                    return false;
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
                return false;
            }
        },
        // 请求接口开始共享，查询当前是否有人在共享
        async handlerShareScreen() {
            if (this.startShareScreenLock) return;
            this.startShareScreenLock = true;
            // 检测当前主播人数
            if (this.session.audience && this.checkAudienceNum()) {
                this.screenWindowLock = false;
                this.startShareScreenLock = false;
                // 主播人数过多
                this.$modal.show(
                    AudienceOverflowTip,
                    {},
                    null,
                    {
                        name: "AudienceOverflowTip-modal",
                        width: 320,
                        height: 180,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    { "before-close": (event) => {} }
                );
                return;
            }
            try {
                const { code, data, message } = await this.handlerScreenState();
                this.startShareScreenLock = false;
                if (code == "000000") {
                    // 是否是组织人员 1|0
                    if (!data.isOrgVip) {
                        this.screenWindowLock = false;
                        this.$alert({
                            content: this.$t("voip.share_screen_org"),
                            height: 150,
                            cancelText: "",
                            confirmText: this.$t("voip.i_known"),
                        });
                        return;
                    }
                    if (
                        data == null ||
                        data.status !== 1 ||
                        wfc.getUserId() === data.userId
                    ) {
                        if (isElectron()) {
                            let beforeClose = (event) => {
                                if (event.params && event.params.source) {
                                    console.log(event.params.source);
                                    this.sendShareScreenNotice(
                                        1,
                                        event.params.source
                                    );
                                } else {
                                    this.screenWindowLock = false;
                                }
                            };
                            this.$modal.show(
                                markRaw(ScreenOrWindowPicker),
                                {},
                                null,
                                {
                                    width: 800,
                                    height: 600,
                                    name: "screen-window-picker-modal",
                                    clickToClose: false,
                                },
                                { "before-close": beforeClose }
                            );
                        } else {
                            this.session.startScreenShare();
                            this.screenWindowLock = false;
                            this.shareScreenStatus = 1;
                            this.shareScreenUser = this.selfUserInfo;
                            this.sendShareScreenNotice(1);
                        }
                    } else {
                        this.screenWindowLock = false;
                        this.$Message.warning(this.$t("voip.sharing_screen"));
                    }
                } else {
                    this.screenWindowLock = false;
                    this.$Message.error(message);
                }
            } catch (error) {
                this.screenWindowLock = false;
                this.startShareScreenLock = false;
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        //检测当前会议中有多少个主播（当前是主播模式的不用检测）
        checkAudienceNum() {
            let participantProfiles = this.participantUserInfos
                .filter((item) => item.uid !== this.selfUserInfo.uid)
                .map((item) => {
                    let profiles = this.session.getSubscriber(item.uid);
                    return profiles;
                }); //获取成员信息
            let audienceArr = participantProfiles.filter(
                (item) => !item.audience
            ); // 过滤成员中主播身份
            let isHost = audienceArr.filter(
                (item) => item.userId === this.session.host
            ).length; // 成员中是否包含主持人（主持人始终是主播模式）

            let num = 0;
            if (isHost) {
                num = audienceArr.length + 1; //需要加上自己的名额
            } else {
                num = audienceArr.length + 2; // 需要加上自己和主持人的名额
            }
            let { imCreateMeeting } = this.myMeetingData;
            return num > (imCreateMeeting.maxPublisher || 9);
        },
        // 获取共享信息以及设置共享大屏
        async setShareScreenView(type) {
            try {
                const { code, data, message } = await this.handlerScreenState();
                this.shareScreenStatus = 2;
                if (code == "000000") {
                    !type && (this.userCreateDate = data.createDate); // 记录该账号注册时间
                    if (data.status === 1) {
                        this.shareScreenStatus = 1;
                        !type && (this.changeScreenId = data.userId); // 共享人员的id
                        for (
                            let i = 0;
                            i < this.participantUserInfos.length;
                            i++
                        ) {
                            if (
                                data.userId === this.participantUserInfos[i].uid
                            ) {
                                this.shareScreenUser =
                                    this.participantUserInfos[i];
                                return;
                            }
                        }
                    }
                } else {
                    console.log(message, "获取更新状态失败");
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 隐藏成员弹窗
        hideParticipantList() {
            this.showParticipantList && (this.showParticipantList = false);
        },
        // 操作共享和全屏和红点儿
        actionPublicStatus(type, value) {
            this[type] = value;
        },
        // 网络连接恢复！
        handlerOnline() {
            console.log("网络连接恢复！");
            this.isOffline = false;
        },
        // 网络连接中断！
        handlerOffline() {
            console.log("网络连接中断！");
            this.isOffline = true;
        },
        // ===================聊天室相关事件逻辑 ========================= //
        //检测是否加入成功
        checkJoinChatRoom() {
            if (!this.currentConversationInfo) {
                this.joinChatCount = 0;
                this.joinChatroom(this.myMeetingData.code);
            }
        },
        //加入聊天室1
        joinChatroom(chatRoomId) {
            this.joinChatCount++;
            wfc.joinChatroom(
                chatRoomId,
                () => {
                    console.log("加入会议成功了！！", chatRoomId);
                    this.joinChatCount = 0;
                    let conversation = new Conversation(
                        ConversationType.ChatRoom,
                        chatRoomId,
                        0
                    );
                    this.currentConversationInfo =
                        wfc.getConversationInfo(conversation);
                    store.setCurrentConversation(conversation);
                },
                (error) => {
                    this.currentConversationInfo = null;
                    console.log(error, "进入聊天室失败了", this.joinChatCount);
                    if (this.joinChatCount === 1) {
                        this.joinChatroom(chatRoomId);
                        console.log(
                            error,
                            "再重新进入了一次聊天室",
                            this.joinChatCount
                        );
                    }
                }
            );
        },
        // 处理聊天室滚动样式
        scrollBottom() {
            const timer = setTimeout(() => {
                let largeDom = this.$refs["largeBarrageMessage"];
                largeDom && scrollTopFn(largeDom);
                let smallDom = this.$refs["smallBarrageMessage"];
                smallDom && scrollTopFn(smallDom);
                function scrollTopFn(dom) {
                    let messageListElement = dom.$refs["messageWrap"];
                    messageListElement &&
                        messageListElement.scroll({
                            top: messageListElement.scrollHeight,
                            left: 0,
                            behavior: "auto",
                        });
                }
                timer && clearTimeout(timer);
            }, 200);
        },
        // 退出聊天室
        quitChatroom() {
            wfc.quitChatroom(
                this.myMeetingData.code,
                () => {
                    console.log("离开会议室成功");
                },
                () => {
                    console.log("离开会议室失败");
                }
            );
        },
        // 点击关闭
        handlerClose() {
            this.isShowBarrage = false;
            this.showClose = false;
        },
        // 点击input 图标
        handlerInput() {
            this.isShowChatRoom = !this.isShowChatRoom;
            this.showParticipantList = false;
            if (this.isShowChatRoom) {
                this.scrollBottom();
                avenginekitproxy.closeChatRoomWindow();
            }
        },
        // 点击打开聊天室
        handlerShowBarrage() {
            this.checkJoinChatRoom();
            this.isShowBarrage = true;
            this.scrollBottom();
        },
        handlerChatRoom() {
            this.isShowChatRoom = false;
        },
        // 进入快速邀请的会议需要同步移动端关闭邀请的响铃弹窗
        sendQuickMeetingMessage() {
            let { title, code, imCreateMeeting, type } = this.myMeetingData;
            if (type) return; // 聊天中快速会议邀请
            let conversation = new Conversation(
                ConversationType.Single,
                wfc.getUserId(),
                0
            );
            let quickContent = new QuickMeetingContent(
                1,
                imCreateMeeting.roomId,
                imCreateMeeting.host,
                code,
                title
            );
            wfc.sendConversationMessage(conversation, quickContent);
        },
    },
    directives: {
        vOnClickOutside,
    },
    beforeUnmount() {
        // this.killPing()
        document.removeEventListener("click", this.windowClick);
        if (window) {
            window.removeEventListener("resize", this.resetScreenArrangement);
            window.removeEventListener("online", this.handlerOnline);
            window.removeEventListener("offline", this.handlerOffline);
        }
    },
    unmounted() {
        // this.killPing()
        // reset
        this.$set(this.selfUserInfo, "_stream", null);
        this.participantUserInfos.forEach((m) => this.$set(m, "_stream", null));
        clearInterval(this.refreshUserInfoInternal);
        clearInterval(this.pingTimer);
        store.setCurrentConversation(null);
    },
};
</script>

<style lang="less" scoped>
.voip-container {
    background-color: #292929;
    --participant-video-item-width: 100%;
    --participant-video-item-height: 100%;
    //   --conference-container-margin-top: 30px;
    //   background: #00000000 !important;
}

.error-wrap {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 9999;
    width: 100%;
    height: 30px;
    color: #f00;
    text-align: center;
    font-size: 12px;
    background: #fde4e4;
    line-height: 30px;
}

.conference-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    overflow: hidden;
}

.conference-main-content-container {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 999;
    /*flex: 1;*/
    /*flex-direction: column;*/
    /*justify-content: space-between;*/
    /*align-items: center;*/
    --participant-video-item-flex-wrap: wrap;
    --participant-video-item-justify-content: center;
    --participant-video-item-align-content: center;

    .chat-room-barrage {
        width: 17.5%;
        min-width: 300px;
        min-height: 200px;
        max-height: 400px;
        position: absolute;
        left: -1000px;
        bottom: 100px;
        z-index: 999;
        display: flex;
        flex-direction: column;
        transition: 0.5s all;

        &.visible {
            left: 0px;
        }

        .barrage-wrap {
            width: 100%;
            min-width: 300px;
            height: 180px;
            left: 0px;
            position: relative;

            .close {
                display: none;
            }

            &.show-close {
                background: rgba(255, 255, 255, 0.05);
                position: relative;

                .close {
                    display: block;
                    color: #fff;
                    position: absolute;
                    right: -10px;
                    top: -16px;
                    z-index: 2;
                    font-size: 20px;
                }
            }

            &::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                height: 20px;
                background: linear-gradient(
                    180deg,
                    #1b2940 19.64%,
                    rgba(27, 41, 64, 0) 108.93%
                );
            }
        }

        .input-wrap {
            width: 90%;
            display: flex;
            align-items: center;
            margin-top: 6px;
            padding-left: 12px;
            box-sizing: border-box;

            .input-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                position: relative;
                background: #334155;
                margin-left: 6px;

                &::after {
                    width: 16px;
                    height: 16px;
                    content: "";
                    background: url("../../assets/images/input-icon.png")
                        no-repeat center center;
                    background-size: cover;
                    position: absolute;
                    z-index: 1;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
            }

            .close-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                position: relative;
                background: #334155;
                margin-left: 6px;
                color: #fff;
                font-size: 16px;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }

    .show-chat-room-icon {
        width: 32px;
        height: 32px;
        border-radius: 0 50% 50% 0;
        position: absolute;
        left: 0;
        bottom: 118px;
        z-index: 999;
        background: #334155;
        &.hidden {
            display: none;
        }
        &::after {
            width: 16px;
            height: 16px;
            content: "";
            background: url("../../assets/images/input-show.png") no-repeat
                center center;
            background-size: cover;
            position: absolute;
            z-index: 1;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
    }
}

.content-container {
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: row;
    /* flex-wrap: wrap; */
    /* justify-content: center; */
    align-items: center;
    --participant-video-item-width: 100%;
    --participant-video-item-height: 100%;
    flex-wrap: var(--participant-video-item-flex-wrap);
    justify-content: var(--participant-video-item-justify-content);
    align-content: var(--participant-video-item-align-content);
    /* align-content: center; */
    background: linear-gradient(180deg, #182842 0%, #0b1a31 84.61%);

    &.video {
        background: linear-gradient(180deg, #182842 0%, #0b1a31 84.61%);
        object-fit: contain;
    }

    &.audio {
        background: white;
        height: calc(100% - 50px);
    }
}

.participant-video-item {
    display: flex;
    position: relative;
    width: var(--participant-video-item-width);
    height: var(--participant-video-item-height);
    border-radius: 20px;
    /*background-color: rebeccapurple;*/
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    // margin: 4px;
    border: 4px solid transparent;
    background-color: rgba(255, 255, 255, 0.07);
    box-sizing: border-box;

    .avatar-wrap {
        z-index: 5;
        position: relative;
    }

    .other-avatar-wrap {
        z-index: 4;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .bg {
        position: absolute;
        z-index: 3;
        width: 100%;
        height: 100%;
        opacity: 0.12;
    }

    &.video {
        display: flex;
        position: relative;
        width: 100%;
        height: 100%;
        z-index: 2;
        /*background-color: rebeccapurple;*/

        flex-direction: column;
        justify-content: center;
        align-items: center;
        // background: #2d3033;
    }

    &.myHighlight {
        border-color: #2c4cf1b2;
    }

    &.highlight {
        border-color: #1dbb88b2;
    }

    .video-stream-tip-container {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
    }

    .info-container {
        position: absolute;
        left: 12px;
        bottom: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: center;
        z-index: 9;

        .info-name {
            max-width: 200px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            height: 24px;
            line-height: 24px;
            text-align: center;
            color: #000;
            background: #fff;
            border-radius: 32px;
            margin-top: 4px;
            padding: 0 10px;
        }

        .my-name {
            color: #fff;
            background: #2c4cf1cc;
        }

        .host-wrap {
            height: 24px;
            line-height: 24px;
            text-align: center;
            color: #fff;
            background: #1dbb88;
            border-radius: 32px;
            padding: 0 10px;
        }
    }

    .video-audio-icon {
        position: absolute;
        right: 12px;
        bottom: 12px;
        z-index: 99;

        img {
            width: 28px;
            height: 28px;
        }
    }
}

.full-screen {
    width: 100%;
    height: 100%;
    margin: 0 !important;
}

.hidden-screen {
    display: none;
}

.participant-video-item:hover .video-stream-tip-container {
    display: inline-block;
}

.participant-video-item > video {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.hidden-video {
    height: 0;
}

.participant-video-item p {
    max-height: 20px;
    color: white;
}

.participant-audio-item {
    display: flex;
    flex-direction: column;
    padding: 20px 40px;
    justify-content: center;
    align-items: center;
}

.participant-audio-item p {
    padding-top: 8px;
}

.conference-main-content-container:hover footer {
    display: block;
    bottom: 12px;
    transition: 0.5s all;
}

.conference-main-content-container:hover nav {
    display: flex;
    top: 0;
    transition: 0.5s all;
}

.media-wrap,
.manage-wrap {
    position: absolute;
    padding: 16px;
    box-sizing: border-box;
    bottom: -278px;
    min-width: 250px;
    min-height: 206px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-sizing: border-box;
    box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.25),
        0px 32px 32px -24px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    border-radius: 16px;

    &.show {
        bottom: 88px;
    }

    li {
        font-size: 13px;
        color: #333333;

        .name,
        &.name {
            font-size: 12px;
            line-height: 100%;
            color: #606060;
            margin-bottom: 8px;
            display: inline-block;
        }

        .label,
        &.label {
            font-size: 13px;
            padding: 5px 5px 5px 14px;
            color: #333333;
            position: relative;

            &.active {
                font-weight: bold;
            }

            &:hover {
                cursor: pointer;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 8px;
            }

            i {
                color: #1dbb88;
                font-size: 14px;
                font-weight: bold;
                position: absolute;
                left: 5px;
                top: 50%;
                transform: translateY(-50%);
            }

            p {
                display: inline-block;
                padding-left: 12px;
            }

            img {
                width: 18px;
                height: 18px;
                object-fit: contain;
            }
        }

        &.label {
            display: flex;
            align-items: center;
            padding: 5px;
        }
    }
}

.manage-wrap {
    min-width: 150px;
    min-height: 140px;
}

footer {
    width: 75%;
    height: 76px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -200px;
    background: #3d4a5dcc;
    z-index: 1000;
    border-radius: 38px;
    box-shadow: 0px 2px 4px 0px #0000001a;
    padding: 0 20px;
    box-sizing: border-box;
    .duration-action-container {
        min-width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
        margin: 13px 0;

        .action-container {
            display: flex;
            flex: 1;
            align-items: center;
            justify-content: center;
        }

        p {
            color: white;
            text-align: center;
        }

        .action {
            flex: 1;
            display: flex;
            flex-direction: column;
            //   justify-content: flex-end;
            align-items: center;
            font-size: 12px;
            min-width: 28px;
            box-sizing: border-box;
            overflow: hidden;
            text-align: center;

            position: relative;
            color: #fff;

            .action-media,
            .action-manage {
                height: 50px;
                width: 18px;
                position: absolute;
                right: 0;
                top: 0;
                font-size: 18px;

                &:hover {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                }

                i {
                    line-height: 50px;
                    transform: rotate(180deg);
                }
            }

            .action-icon {
                min-width: 60px;
                position: relative;
                .red-request {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    overflow: hidden;
                    position: absolute;
                    right: 6px;
                    top: 0px;
                    background: #ff103b;
                }
            }
        }

        .quit-btn {
            text-align: center;
            padding-left: 28px;
            position: relative;

            &::before {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                content: "";
                width: 1px;
                height: 50px;
                background: rgba(255, 255, 255, 0.1);
            }
        }
    }
}

nav {
    width: 100%;
    height: 50px;
    position: absolute;
    left: 0;
    top: -200px;
    z-index: 1000;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #3d4a5dcc;

    //   background: linear-gradient(180deg, #182842 0%, #0b1a31 84.61%);
    .wifi-duration {
        flex: 1;
        font-size: 15px;
        color: #fff;
        line-height: 21px;
        text-align: right;
        display: flex;
        justify-content: flex-end;

        .wifi {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            position: relative;

            &:hover {
                .wifi-info {
                    display: block;
                }
            }

            img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            .wifi-info {
                width: 120px;
                height: 60px;
                top: 30px;
                right: -30px;
                padding: 12px;
                box-sizing: border-box;
                position: absolute;
                background: rgba(61, 74, 93, 0.8);
                box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(4px);
                border-radius: 14px;
                text-align: left;
                font-size: 12px;
                color: #c1c1c1;
                margin: 3px 0;
                display: none;

                span {
                    display: flex;
                    justify-content: space-between;

                    em {
                        font-style: normal;
                        color: #e8e8e8;
                        flex: 1;
                        text-align: right;
                    }
                }
            }
        }
    }

    .meeting-id,
    .meeting-title {
        flex: 1;
        font-size: 15px;
        color: #fff;
        line-height: 21px;
    }

    .meeting-id {
        text-align: left;
    }

    .meeting-title {
        text-align: center;
    }
}

.conference-main-content-container .copy-btn {
    margin-left: 12px;
    vertical-align: middle;
    width: 32px;
    height: 14px;
    border: 1px solid #1dbb88;
    color: #1dbb88;
    box-sizing: border-box;
    font-size: 12px;
    transform: scale(0.5, 0.5);
    border-radius: 5px;
    padding: 0 3px;
    cursor: pointer;
}

.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
}

.avatar.highlight {
    border: 2px solid #1fca6a;
}

.action-img {
    width: 28px;
    height: 28px;
    object-fit: contain;
}

.video.me {
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
}

.chat-room-wrap {
    width: 420px;
    height: 100%;
    backdrop-filter: blur(6px);
    border-left: 1px solid #e6e6e6;
    z-index: 999;
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .barrage-wrap {
        width: 100%;
        height: calc(100% - 160px);
        background: rgba(255, 255, 255, 0.05);
    }

    .input-wrap {
        height: 160px;
    }
}

.loading-wrap {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(0, 0, 0, 0.3);
    width: 100%;
    height: 100%;
    z-index: 999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
}
</style>
