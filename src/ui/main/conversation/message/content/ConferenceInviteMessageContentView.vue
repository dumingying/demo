<template>
    <div>
        <div
            class="conference-invite-message-container"
            @click="joinConference"
            v-bind:class="{ out: message.direction === 0 }"
        >
            <div
                class="flex-row flex-align-center conference-invite-message-wrap"
            >
                <div class="flex-1">
                    <p class="single-line title">
                        {{ $t("message.meeting_invitation") }}：{{
                            message.messageContent.title
                        }}
                    </p>
                    <p
                        class="second-line desc"
                        v-if="message.messageContent.meetingType === 1"
                    >
                        {{ $t("message.meeting_time") }}：{{ meetingTimeStr }}
                    </p>
                    <p class="second-line desc" v-else>
                        {{ $t("message.meeting_soon") }}
                    </p>
                    <p class="single-line conferPhone">
                        {{ $t("voip.meeting_id") }}：{{
                            message.messageContent.meetingCode
                        }}
                    </p>
                </div>
                <img
                    draggable="false"
                    alt=""
                    style="width: 40px; height: auto"
                    src="../../../../../assets/images/invite-meet-icon.png"
                />
            </div>
            <p class="type">{{ $t("message.meeting_chain") }}</p>
        </div>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";
import ConversationType from "@/wfc/model/conversationType";
import EnterPassWord from "@/ui/voip/conference/EnterPassWord";
import RequestMeeting from "@/ui/voip/conference/RequestMeeting";

import { setItem } from "@/ui/util/storageHelper";
import { getJoinMeeting } from "@/axios";

import wfc from "@/wfc/client/wfc";
import dayjs from "dayjs";
import store from "@/store";

export default {
    name: "ConferenceInviteMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
            modal2: true,
        },
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
            lock: false,
        };
    },
    mounted() {
        // console.log(this.message)
    },

    methods: {
        add0(m) {
            return m < 10 ? "0" + m : m;
        },
        format(timestamp) {
            //timestamp是整数，否则要parseInt转换
            let time = new Date(timestamp);
            let y = time.getFullYear();
            let m = time.getMonth() + 1;
            let d = time.getDate();
            let h = time.getHours();
            let mm = time.getMinutes();
            //   let s = time.getSeconds()
            //+':'+this.add0(s)
            return (
                y +
                "-" +
                this.add0(m) +
                "-" +
                this.add0(d) +
                " " +
                this.add0(h) +
                ":" +
                this.add0(mm)
            );
        },
        joinConference() {
            const userId = wfc.getUserId();
            const { messageContent } = this.message;
            if (
                userId !== messageContent.host &&
                messageContent.isPasswordNeed === 1
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
                            if (event.params) {
                                const { params, meetingPassWord } =
                                    event.params;
                                // 点击加入会议
                                if (params && meetingPassWord) {
                                    this.joinMeeting(meetingPassWord);
                                }
                            }
                        },
                    }
                );
                return;
            }
            this.joinMeeting();
        },
        // 加入会议
        async joinMeeting(meetingPassWord) {
            const userId = wfc.getUserId();
            const { password, host, meetingCode, isPasswordNeed } =
                this.message.messageContent;
            if (meetingPassWord && password && meetingPassWord !== password) {
                this.$Message.warning(this.$t("voip.password_wrong"));
                return;
            }
            if (this.lock) return;
            this.lock = true;
            try {
                let isAudience = host === userId ? false : true;
                let res = await getJoinMeeting({
                    isAudience: Number(isAudience), // 是否互动模式 1  观众模式入会 0  主播模式入会
                    code: meetingCode, //会议号
                    status: "",
                    isPasswordNeed: isPasswordNeed,
                    password: meetingPassWord || password,
                });
                this.lock = false;
                const { code, data, message } = res.data;
                if (code == "000000") {
                    let cmc = data.imCreateMeeting;
                    /**
                     * 加入会议
                     * @param {string} callId 会议id
                     * @param {string} audioOnly 是否只开启音频
                     * @param {string} pin 会议pin码
                     * @param {string} host 会议主持人
                     * @param {string} title 会议标题
                     * @param {string} desc 会议描述
                     * @param {string} audience 是否是以观众角色入会
                     * @param {string} advance 是否是高级会议
                     * @param {boolean} muteAudio 是否是静音加入会议
                     * @param {boolean} muteVideo 是否是关闭摄像头加入会议
                     * @param {Object} extra 一些额外信息，主要用于将信息传到音视频通话窗口
                     */

                    avenginekitproxy.joinConference(
                        cmc.roomId, //callId 会议id
                        false, //audioOnly 是否只开启音频
                        cmc.pin, // pin 会议pin码
                        cmc.host, // host 会议主持人
                        data.title, //title 会议标题
                        cmc.description, //desc 会议描述
                        isAudience, // userId !== cmc.host, // Boolean(cmc.isAudience), // true 听众, false互动
                        "",
                        true,
                        true,
                        {
                            video: true,
                            audio: true,
                        }
                    );
                    setItem("confer_code", data.code);
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
                            "before-close": (event) => {
                                console.log("Closing...", event, event.params);
                            },
                        }
                    );
                } else {
                    this.$Message.warning(message);
                }
            } catch (error) {
                console.log(error);
                this.lock = false;
            }
        },
    },
    computed: {
        portrait() {
            let content = this.message.messageContent;
            let groupId =
                this.message.conversation.type === ConversationType.Group
                    ? this.message.conversation.target
                    : "";
            let userInfos = store.getUserInfos([content.host], groupId);
            return userInfos[0].portrait;
        },
        meetingTimeStr() {
            let { startTime, endTime } = this.message.messageContent;
            let formatStartDate = dayjs(startTime).format("MM/DD HH:mm");
            let formatEndDate = dayjs(endTime).format("MM/DD HH:mm");
            let isDay =
                dayjs(startTime).format("YYYY-MM-DD") ===
                dayjs(endTime).format("YYYY-MM-DD");
            const arrStart = formatStartDate.split(" ");
            const arrEnd = formatEndDate.split(" ");
            if (isDay) {
                return `${arrStart[0]} ${arrStart[1]} - ${arrEnd[1]}`;
            } else {
                return `${formatStartDate}-${formatEndDate}`;
            }
        },
    },
};
</script>

<style lang="css" scoped>
.conference-invite-message-container {
    margin: 0 10px;
    /* padding: 5px; */
    background-color: white;
    width: 250px;
    max-width: 250px;
    position: relative;
    border-radius: 5px;
}
.conference-invite-message-wrap {
    padding: 16px 8px 16px 16px;
    background: #1dbb88;
    border-radius: 5px 5px 0px 0px;
}

.type {
    padding: 5px 10px;
    font-size: 11px;
    color: #999;
}

.title {
    color: #fff;
    font-size: 14px;
    font-family: PingFang SC;
    font-weight: 500;
}
.second-line {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    -webkit-line-clamp: 2;
    word-break: break-word;
}
.desc {
    line-height: 18px;
    font-size: 12px;
    color: #fff;
}
.conferPhone {
    font-size: 12px;
    color: #fff;
}
</style>
