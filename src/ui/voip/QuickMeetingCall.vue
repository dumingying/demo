<template>
    <div class="quick-meeting-call-container">
        <div class="meeting-info">
            <div class="content">
                <figure>
                    <img :src="getMessageInfo('img')" alt="" />
                    <figcaption>
                        {{ getMessageInfo("name") }}
                        {{ $t("voip.invite_you") }}
                    </figcaption>
                </figure>
                <p>
                    {{ $t("voip.meeting_subject") }}:
                    {{ getMessageInfo("title") }}
                </p>
                <p>
                    {{ $t("voip.history_meeting_id") }}:
                    {{ getMessageInfo("code") }}
                </p>
            </div>
            <div class="footer">
                <span class="reject-btn" @click="handlerBtn(0)">{{
                    $t("voip.reject")
                }}</span>
                <span class="join-btn" @click="handlerBtn(1)">{{
                    $t("voip.join")
                }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import QuickMeetingContent from "@/wfc/av/messages/customMessages/quickMeetingContent";

import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";
import { ipcRenderer } from "@/platform";
import IpcEventType from "../../ipcEventType";
import wfc from "@/wfc/client/wfc";

let timer = null;
export default {
    data() {
        return {
            message: null,
            ringAudio: null,
        };
    },
    computed: {
        getMessageInfo() {
            return (type) => {
                if (!this.message) return;
                let { title, meetingCode, host } = this.message.messageContent;
                if (type === "title") {
                    return title;
                }
                if (type === "code") {
                    return meetingCode;
                }
                if (type === "name" || type === "img") {
                    let userInfo = wfc.getUserInfo(host);
                    return type === "name"
                        ? this.mixinGetUserName(userInfo)
                        : this.mixinDefaultPortrait(userInfo.portrait);
                }
            };
        },
    },
    created() {
        document.title = this.$t("message.meeting_invitation");
        // 监听快速会议响铃
        ipcRenderer.on(
            IpcEventType.Quick_Meeting_Ring_Response,
            (event, args) => {
                this.message = args;
                this.ringAudio = new Audio(
                    require("@/assets/audios/incoming_call_ring.mp3")
                );
                this.ringAudio.loop = true;
                this.ringAudio.play();
            }
        );
    },
    mounted() {
        // 1分钟之内没其他弹窗自动关闭呼叫窗口
        timer = setTimeout(() => {
            ipcRenderer.send(IpcEventType.Close_Meeting_Ring);
            timer && clearTimeout(timer);
        }, 60 * 1000);

        // 监听加入会议后
        ipcRenderer.on("join-conference-result", () => {
            this.sendQuickMeetingMessage();
        });
    },
    methods: {
        // 进入快速邀请的会议需要同步移动端关闭邀请的响铃弹窗
        sendQuickMeetingMessage() {
            let { title, meetingCode, callId, host } =
                this.message.messageContent;
            let conversation = new Conversation(
                ConversationType.Single,
                wfc.getUserId(),
                0
            );
            let quickContent = new QuickMeetingContent(
                1,
                callId,
                host,
                meetingCode,
                title
            );
            wfc.sendConversationMessage(conversation, quickContent);
            ipcRenderer.send(IpcEventType.Close_Meeting_Ring); // 关闭窗口
        },
        // 1:加入 0：拒绝  主窗口监听，子窗口与主窗口的交互
        async handlerBtn(type) {
            if (this.ringAudio) {
                this.ringAudio.pause();
                this.ringAudio = null;
            }
            timer && clearTimeout(timer);
            if (type) {
                let { meetingCode, callId, host } = this.message.messageContent;
                ipcRenderer.send(IpcEventType.Send_Join_Conference, {
                    isPasswordNeed: "",
                    password: "",
                    code: meetingCode,
                    meetingId: callId,
                    imCreateMeeting: { host },
                });
            } else {
                this.sendQuickMeetingMessage();
            }
        },
    },
};
</script>
<style lang="less" scoped>
.quick-meeting-call-container {
    width: 100vw;
    height: 100vh;
    .meeting-info {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 20px;
        box-sizing: border-box;
        content: "";
        background: url("../../assets/images/phone-bg.png") no-repeat center
                center,
            #04152e;
        background-size: 248px auto, 100%;
        color: #fff;
        .content {
            flex: 1;
            margin-top: 80px;
            figure {
                text-align: center;
                img {
                    width: 80px;
                    height: 80px;
                    overflow: hidden;
                    border-radius: 50%;
                    display: inline-block;
                }
                figcaption {
                    margin: 40px 0;
                    font-family: PingFang SC;
                    font-size: 32px;
                    font-weight: 400;
                    line-height: 34px;
                    text-align: center;
                }
            }
            p {
                margin-top: 10px;
                font-family: PingFang SC;
                font-size: 17px;
                font-weight: 400;
                line-height: 22px;
                letter-spacing: 0px;
                text-align: center;
            }
        }
        .footer {
            display: flex;
            justify-content: space-between;
            span {
                font-family: PingFang SC;
                font-size: 14px;
                font-weight: 400;
                line-height: 20px;
                letter-spacing: 0px;
                text-align: center;
                &::before {
                    display: block;
                    content: "";
                    width: 60px;
                    height: 60px;
                    margin-bottom: 10px;
                }
                &.reject-btn {
                    &::before {
                        background: url("../../assets/images/av_hang_up.png")
                            no-repeat center center;
                        background-size: 100%;
                    }
                }
                &.join-btn {
                    &::before {
                        background: url("../../assets/images/av_audio_answer.png")
                            no-repeat center center;
                        background-size: 100%;
                    }
                }
            }
        }
    }
}
</style>
