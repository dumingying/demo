<template>
    <div
        class="call-start-message-container"
        v-bind:class="{ out: message.direction === 0 }"
    >
        <p class="text" v-html="textContent"></p>
        <i
            class="icon"
            :style="`background:url(${voipIcon}) no-repeat center center;background-size:100% auto;`"
        ></i>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import wfc from "@/wfc/client/wfc";
import store from "../../../../../store";

import { numberValue } from "../../../../../wfc/util/longUtil";
export default {
    name: "CallStartMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            sharedMiscState: store.state.misc,
            sharedContactState: store.state.contact,
        };
    },
    mounted() {},

    methods: {
        startCall() {
            let callStartMsgContent = this.message.messageContent;
            let audioOnly = callStartMsgContent.audioOnly;
            this.$startVoipCall({
                audioOnly: audioOnly,
                conversation: this.message.conversation,
            });
        },
    },

    computed: {
        textContent() {
            let voip = this.message.messageContent;
            let desc = this.$t("voip.desc"); // 默认= 音视频通话
            let userId = wfc.getUserId();
            let { from } = this.message;
            let textObj = {
                // 0: this.$t("message.unknown"),
                0: this.$t("voip.desc"),
                1: this.$t("message.busy"),
                2: this.$t("message.signal_error"),
                3:
                    from === userId
                        ? this.$t("message.call_cancel")
                        : this.$t("message.call_hangup"),
                4: this.$t("message.signal_error"),
                5:
                    from === userId
                        ? this.$t("message.remote_hangup")
                        : this.$t("message.remote_cancel"),
                6: this.$t("message.signal_error"),
                7: this.$t("message.timeout"),
                8: this.$t("message.accept_other_client"),
                9: this.$t("message.exist"),
                10: this.$t("message.remote_busy"),
                11: this.$t("message.timeout"),
                12: this.$t("message.signal_error"),
                13: this.$t("message.destroyed"),
                14: this.$t("message.destroyed"),
                15: this.$t("message.room_participants_full"),
            };
            if (typeof voip.status === "undefined") {
                desc = this.$t("voip.desc");
            } else {
                desc = textObj[voip.status];
            }
            if (
                ![0, 1].includes(voip.status) &&
                voip.endTime > 0 &&
                voip.connectTime > 0
            ) {
                let duration = this.mixinTimestampFormat(
                    numberValue(voip.endTime) - numberValue(voip.connectTime)
                );
                desc = this.$t("message.encrypted_call") + ` : ${duration}`;
            }
            return desc;
        },
        voipIcon() {
            let voip = this.message.messageContent;
            let callOut = require("@/assets/images/ios-call-out.png");
            let callIn = require("@/assets/images/ios-call-in.png");
            let videocamOut = require("@/assets/images/ios-videocam-out.png");
            let videocamIn = require("@/assets/images/ios-videocam-in.png");
            return voip.audioOnly
                ? !this.message.direction
                    ? callOut
                    : callIn
                : !this.message.direction
                ? videocamOut
                : videocamIn;
        },
    },
};
</script>

<style lang="css" scoped>
.call-start-message-container {
    margin: 0 10px;
    padding: 10px;
    background-color: white;
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: center;
}

.call-start-message-container p {
    padding-left: 5px;
    white-space: pre-line;
}
.call-start-message-container .icon {
    width: 28px;
    height: 28px;
    display: flex;
    font-size: 22px;
    color: #050505;
    background-size: 100%;
    margin-left: 5px;
}

.call-start-message-container.out {
    background-color: #1dbb88;
}

.call-start-message-container .text {
    color: #050505;
    font-size: 16px;
}
.call-start-message-container.out .text,
.call-start-message-container.out i {
    color: #fff;
}
</style>
