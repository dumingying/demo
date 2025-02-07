<template>
    <div class="screen-share-action-wrap">
        <div class="screen-share-action-container">
            <video
                v-if="session"
                class="video"
                ref="screenShareVideo"
                style="
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: 0;
                    display: none;
                "
                :srcObject.prop="session.screenShareStream"
                playsInline
                muted
                autoPlay
            />
            <div :class="['action', 'audio-action', { show: toggleAudio }]">
                <figure class="action-icon" @click="audioMute">
                    <img
                        v-if="session && !session.audioMuted"
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
                            session && session.audioMuted
                                ? $t("voip.unmute")
                                : $t("voip.mute")
                        }}
                    </p>
                </figure>
                <div
                    class="action-media"
                    ref="actionAudio"
                    @click="handlerMedia"
                >
                    <Icon type="md-arrow-dropdown" />
                </div>
            </div>
            <!-- <div class="action">
            <img @click="videoMute" class="action-img" src='@/assets/images/av_video_answer.png'/>
            <p>开启视频</p>
        </div> -->
            <div :class="['action', { 'members-btn': toggleMembers }]">
                <div class="action-icon" @click.stop="members">
                    <em class="red-request" v-if="isRequestMeeting"></em>
                    <img
                        class="action-img"
                        draggable="false"
                        src="@/assets/images/av_conference_members.png"
                    />
                    <p class="new-single-line">
                        {{ $t("voip.member") }}({{
                            participantUserInfos.length
                        }})
                    </p>
                </div>
            </div>
            <div class="action">
                <div class="action-icon" @click.stop="chatRoom">
                    <img
                        class="action-img"
                        draggable="false"
                        src="@/assets/images/av-chat-room.png"
                    />
                    <p class="new-single-line">
                        {{ $t("common.conversation") }}
                    </p>
                </div>
            </div>
            <div
                :class="['action', 'manage', { show: toggleManage }]"
                @click.stop="moreAction"
            >
                <div class="action-icon">
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
            <div class="action">
                <figure class="action-icon" @click.stop="stopScreenShare">
                    <img
                        class="action-img"
                        draggable="false"
                        src="@/assets/images/av_conference_screen_sharing_mute.png"
                    />
                    <p>{{ $t("voip.stop_screen") }}</p>
                </figure>
            </div>
        </div>
        <!--音频选择-->
        <ul class="media-wrap" v-show="toggleAudio">
            <li
                v-for="(item, index) in audioList"
                class="media-li"
                :key="index"
            >
                <template v-if="item.list && item.list.length">
                    <span class="name">{{ item.name }}</span>
                    <div
                        v-for="ele in item.list"
                        :class="['label', ele._checked ? 'active' : '']"
                        @click="handlerSetMedia(ele)"
                        :key="ele.deviceId"
                    >
                        <Icon type="md-checkmark" v-if="ele._checked" />
                        <p>{{ ele.label }}</p>
                    </div>
                </template>
            </li>
        </ul>
        <!-- 成员显示 -->
        <screen-participant-list
            v-if="toggleMembers"
            :session="session"
            :selfUserInfo="selfUserInfo"
            :participantUserInfos="participantUserInfos"
            :myMeetingData="myMeetingData"
            @invite="invite"
        ></screen-participant-list>
        <!-- 管理弹窗 -->
        <ul class="manage-wrap" v-if="toggleManage">
            <li class="name">
                <input
                    @change="onPickFile($event)"
                    ref="fileInput"
                    class="icon-ion-android-attach"
                    type="file"
                    style="display: none"
                />
            </li>
            <template v-for="item in manageList">
                <li
                    v-if="item.isShow"
                    :key="item.value"
                    @click.stop="handleClickManage(item)"
                >
                    {{ item.name }}
                </li>
            </template>
        </ul>
    </div>
</template>

<script>
import ShareScreenNotificationMessageContent from "@/wfc/av/messages/customMessages/notification/shareScreenNotificationMessageContent";
import avenginekit from "../../wfc/av/internal/engine.min";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";

import Conversation from "@/wfc/model/conversation";
import ConferAction from "./conference/ConferAction";
import ScreenParticipantList from "./ScreenParticipantList";

import { getItem, removeItem } from "@/ui/util/storageHelper";
import { remote } from "@/platform";

import wfc from "@/wfc/client/wfc";
import store from "@/store";

import { meetingHistoryDetail, getCloudUsedSpace } from "@/axios";
import { tipsContent } from "@/ui/common/Tips";
export default {
    name: "ScreenShareControlView",
    props: {
        type: {
            required: false,
            type: String,
            default: null,
        },
        myMeetingData: {
            type: Object,
        },
        isRequestMeeting: {
            type: Boolean,
            default: false,
        },
        isShowChatRoom: {
            type: Boolean,
            default: false,
        },
        // 所有人
        participantUserInfos: {
            type: Array,
            required: true,
        },
        //音频设备
        audioList: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            session: null,
            //   screenShareCheckIntervalId: 0,
            sharedConversationState: store.state.conversation,
            screenShareActiveTime: -1,
            isScreenSharePaused: false,
            toggleMembers: false,
            toggleAudio: false, // 显示音频设备
            toggleManage: false,
            meetingDetail: null,
            manageList: [
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
        };
    },
    computed: {
        permissionList() {
            return this.$store.state.permissionList;
        },
        membersList() {
            if (this.filterQuery) {
                return store.filterConferenceMember(
                    this.participantUserInfos,
                    this.filterQuery
                );
            } else {
                return this.participantUserInfos;
            }
        },
        audioList1() {
            return this.audioList[1];
        },
    },
    watch: {
        "audioList1.list"(n, o) {
            // 关闭麦克风
            if (!n.length && this.session && !this.session.audioMuted) {
                this.session.audioMuted = true;
                this.session.muteAudio(true);
            }
        },
    },
    created() {
        // 设置title
        const shareScreenInfo = getItem("shareScreenInfo");
        if (shareScreenInfo) {
            const { name } = JSON.parse(shareScreenInfo);
            document.title = name
                ? `${this.$t("voip.current_share")}${name}`
                : this.$t("login.chainpal");
        }
    },
    mounted() {
        this.session = avenginekit.getCurrentSession();
        if (this.session) {
            this.selfUserInfo = this.session.selfUserInfo;
        }
        if (this.isShowChatRoom) {
            this.chatRoom();
        }
        // this.screenShareCheckIntervalId = setInterval(() => {
        //   if (this.screenShareActiveTime !== -1) {
        //     if (
        //       this.screenShareActiveTime === this.$refs.screenShareVideo.currentTime
        //     ) {
        //       if (!this.isScreenSharePaused) {
        //         this.isScreenSharePaused = true
        //         console.log('屏幕共享暂停')
        //       }
        //     } else {
        //       if (this.isScreenSharePaused) {
        //         this.isScreenSharePaused = false
        //         console.log('屏幕共享恢复')
        //       }
        //     }
        //   }
        //   this.screenShareActiveTime = this.$refs.screenShareVideo.currentTime
        // }, 1000)
    },
    components: {
        ScreenParticipantList,
    },
    methods: {
        // 操作静音
        audioMute() {
            if (!this.audioList[1].list.length) {
                this.$Message.warning(this.$t("voip.no_device_tip"));
                return;
            }
            this.session.muteAudio(!this.session.audioMuted);
        },
        // 操作视频
        // videoMute() {
        //   this.stopScreenShare()
        //   this.session.muteVideo(false)
        //   this.$parent.$forceUpdate()
        // },
        // 停止共享
        async stopScreenShare() {
            let result = await this.$parent.handleUpdateScreenShare(2);
            if (result) {
                this.session.stopScreenShare();
                document.title = this.$t("login.chainpal"); // 关闭还原title
                for (let i = 0; i < this.participantUserInfos.length; i++) {
                    let conv = new Conversation(
                        0,
                        this.participantUserInfos[i].uid,
                        0
                    );
                    let shareScreenNotificationMessageContent =
                        new ShareScreenNotificationMessageContent();
                    shareScreenNotificationMessageContent.from =
                        this.selfUserInfo.uid;
                    shareScreenNotificationMessageContent.to =
                        this.participantUserInfos[i].uid;

                    shareScreenNotificationMessageContent.content =
                        JSON.stringify({
                            status: 2,
                            fromUserId: this.selfUserInfo.uid,
                        });
                    wfc.sendConversationMessage(
                        conv,
                        shareScreenNotificationMessageContent
                    );
                }
                this.$emit("actionPublicStatus", "shareScreenStatus", 2); // 退出共享
                this.$emit("actionPublicStatus", "changeScreenId", 0); // 退出全屏
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
                avenginekitproxy.emitToMain("stop-screen-share", {
                    type: "conference",
                });
                // 关闭聊天室窗口
                avenginekitproxy.closeChatRoomWindow();
                // 不太明白session明显变动了，但父组件没有去刷新，所以强制刷新下
                // 奇怪：直接用音视频SDK源码调试的时候，会正常刷新，但有编译出的SDK时，就不会刷新
                this.$parent.$forceUpdate();
                this.$parent.scrollBottom();
            } else {
                this.$parent.handlerRecordMeetingError("退出共享接口失败");
            }
        },
        // 点击聊天
        chatRoom() {
            avenginekitproxy.joinVoipChatRoom(
                this.myMeetingData.code,
                this.sharedConversationState.currentConversationMessageList
            );
        },
        // 点击成员
        members() {
            this.toggleMembers = !this.toggleMembers;
            this.toggleAudio = false;
            this.toggleManage = false;
            if (this.toggleMembers) {
                this.$emit("actionPublicStatus", "isRequestMeeting", false); //红点儿隐藏
                removeItem(`requestNotice_${this.myMeetingData.code}`);
            }
            let height = this.toggleMembers ? 620 : 120;
            remote.getCurrentWindow().setMinimumSize(600, height);
            remote.getCurrentWindow().setSize(600, height);
        },
        // 点击音频
        handlerMedia() {
            this.toggleMembers = false;
            this.toggleManage = false;
            this.toggleAudio = !this.toggleAudio;
            let height = this.toggleAudio ? 420 : 120;
            remote.getCurrentWindow().setMinimumSize(600, height);
            remote.getCurrentWindow().setSize(600, height);
        },
        handlerSetMedia(ele) {
            this.$parent.handlerSetMedia(ele);
        },
        // 邀请
        invite() {
            this.$parent.invite();
        },

        // 点击管理
        moreAction() {
            this.toggleMembers = false;
            this.toggleAudio = false;
            this.toggleManage = !this.toggleManage;
            let height = this.toggleManage ? 360 : 120;
            remote.getCurrentWindow().setMinimumSize(600, height);
            remote.getCurrentWindow().setSize(600, height);
            if (this.toggleManage) {
                this.getThisMeetInfo();
            }
        },
        // 操作管理其他项
        handleClickManage(item) {
            switch (item.value) {
                case 1: // 讨论群
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
                            "before-close": (event) => {
                                if (event.params && event.params.toGroup) {
                                    this.moreAction();
                                }
                            },
                        }
                    );
                    break;
                case 2: // 文档
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
                // 获取链上存储文档存储信息
                let res = await getCloudUsedSpace({ userId: wfc.getUserId() });
                const { code, message, data } = res.data;
                if (code == "000000") {
                    let { usedSpace, totalSpace } = data;
                    if (totalSpace - usedSpace <= 0) {
                        this.$alert({
                            content:
                                this.permissionList.isAppCharge &&
                                this.permissionList.vipLevel === 4
                                    ? [3]
                                    : tipsContent[4],
                            height: 150,
                            isMainWindow: false,
                            cancelText: "",
                        });
                        return;
                    }
                    this.$refs["fileInput"].click();
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
                fromPage: "screenShare",
                files: event.target.files,
                userId: wfc.getUserId(),
                cycleMeetingId: this.meetingDetail.imCycleMeetingId,
                meetingId: this.meetingDetail.imMeetingId,
                bindingGroupId: this.meetingDetail.imGroupId,
            });
            event.target.value = "";
            this.moreAction();
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
    },
    beforeUnmount() {
        // clearInterval(this.screenShareCheckIntervalId)
    },
};
</script>

<style scoped lang="less">
.screen-share-action-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #292929;
    .screen-share-action-container {
        width: 100%;
        max-height: 100%;
        display: flex;
        justify-content: space-around;
        z-index: 100;
        padding: 20px 0;
        background: #3d4a5dcc;
        box-sizing: border-box;
        .action {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 14px;
            color: #fff;
            &.audio-action {
                position: relative;
                .action-media {
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
                    }
                }
                &.show {
                    position: relative;
                    &::before {
                        content: "";
                        position: absolute;
                        left: 50%;
                        transform: translate(-50%, 0);
                        bottom: -40px;
                        width: 10px;
                        height: 10px;
                        border: 10px solid transparent;
                        border-top: 10px solid rgba(61, 74, 93, 0.8);
                    }
                }
            }
            &.manage {
                position: relative;
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
                    }
                }
                &.show {
                    &::before {
                        content: "";
                        position: absolute;
                        left: 50%;
                        transform: translate(-50%, 0);
                        bottom: -40px;
                        width: 10px;
                        height: 10px;
                        border: 10px solid transparent;
                        border-top: 10px solid rgba(61, 74, 93, 0.8);
                    }
                }
            }
            .action-icon {
                text-align: center;
                position: relative;
                .red-request {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    overflow: hidden;
                    position: absolute;
                    right: -2px;
                    top: 0px;
                    background: #ff103b;
                }
            }
            p {
                font-size: 12px;
            }
            .action-img {
                width: 28px;
                height: 28px;
            }
        }
        .members-btn {
            position: relative;
            &::before {
                content: "";
                position: absolute;
                left: 50%;
                transform: translate(-50%, 0);
                bottom: -40px;
                width: 10px;
                height: 10px;
                border: 10px solid transparent;
                border-top: 10px solid rgba(61, 74, 93, 0.8);
            }
        }
    }

    .media-wrap,
    .manage-wrap {
        width: 95%;
        height: calc(100% - 128px);
        overflow: auto;
        margin: 0 auto;
        border-radius: 10px;
        margin-top: 15px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        background-color: rgba(61, 74, 93, 0.8) !important;
        position: relative;
        li {
            font-size: 14px;
            margin-top: 8px;
            .name {
                font-size: 12px;
                line-height: 100%;
                color: #b7b7b7;
                margin-bottom: 8px;
                display: inline-block;
            }
            .label {
                font-size: 14px;
                padding: 5px 5px 5px 14px;
                color: #fff;
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
            }
        }
    }
    .manage-wrap li {
        color: #fff;
        width: 100%;
        line-height: 42px;
        padding: 0 10px;
        margin-top: 0;
        &:hover {
            cursor: pointer;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 8px;
        }
    }
}
</style>
