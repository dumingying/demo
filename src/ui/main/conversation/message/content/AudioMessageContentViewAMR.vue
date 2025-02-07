<template>
    <div
        ref="container"
        :class="['audio-message-container', !message.direction ? 'out' : '']"
    >
        <div class="volume">
            <div class="volume-wrap" @click="playVoice">
                <span class="duration" v-if="message.direction === 0"
                    >{{ duration }}"</span
                >
                <i v-show="!message._isPlaying" class="normal"></i>
                <i v-show="message._isPlaying" class="loop"></i>
                <span class="duration" v-if="message.direction === 1"
                    >{{ duration }}"</span
                >
            </div>
            <!-- 未读红点 暂只支持本地 -->
            <!-- <span class="unplay"
            v-if="ishowUnplay"></span> -->
        </div>
        <p
            class="volume-text"
            v-if="loading || message.messageContent.speechText"
        >
            <span class="loading" v-show="loading"></span>
            {{ message.messageContent.speechText }}
        </p>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import { getAudiosChangeText } from "@/axios";

import store from "@/store";
import wfc from "@/wfc/client/wfc";

export default {
    name: "AudioMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            lock: false,
            loading: false,
        };
    },
    computed: {
        duration() {
            let voice = this.message.messageContent;
            let times = voice.duration * 1000;
            let seconds = 0;

            if (times <= 60 * 1000) {
                seconds = Math.ceil(times / 1000);
            } else {
                seconds = 60;
            }
            return seconds;
        },
        // ishowUnplay() {
        //   return (
        //     this.message.direction === 1 &&
        //     [MessageStatus.Unread, MessageStatus.Readed].includes(
        //       this.message.status
        //     )
        //   )
        // }
    },
    mounted() {
        if (this.duration) {
            let width = Math.ceil((this.duration / 60) * 300);
            width = width < 70 ? 70 : width;
            this.$refs.container.style.setProperty(
                "--voice-width",
                width + "px"
            );
        }

        this.$eventBus.$on("audiosChangeText", (message) => {
            this.changeText(message);
        });
    },
    methods: {
        async playVoice() {
            if (this.message._isPlaying) {
                this.$set(this.message, "_isPlaying", false);
                this.$store.dispatch(
                    "UpdateArmPlaying",
                    this.message._isPlaying
                );
                store.playVoice(this.message);
            } else {
                if (this.lock) return;
                this.lock = true;
                let result = await this.mixinCheckImFile(
                    this.message.messageContent.remotePath
                );
                this.lock = false;
                if (result) {
                    this.$set(this.message, "_isPlaying", true);
                    this.$store.dispatch(
                        "UpdateArmPlaying",
                        this.message._isPlaying
                    );
                    store.playVoice(this.message);
                }
            }
        },
        async changeText(msg) {
            if (msg.messageId !== this.message.messageId) return;
            this.loading = true;
            let speechUrl = msg.messageContent.remotePath;
            if (speechUrl) {
                try {
                    let res = await getAudiosChangeText({
                        userId: wfc.getUserId(),
                        speechUrl: msg.messageContent.remotePath,
                    });
                    let { code, data, message } = res.data;
                    this.loading = false;
                    if (code === "000000") {
                        // 暂不支持多端同步已播放状态 先注释掉 todo
                        // if (
                        //   [MessageStatus.Unread, MessageStatus.Readed].includes(msg.status)
                        // ) {
                        //   wfc.setMediaMessagePlayed(msg.messageId)
                        //   wfc.updateMessageStatus(msg.messageId, MessageStatus.Played)
                        // }
                        this.$set(
                            msg.messageContent,
                            "speechText",
                            data.speechText
                        );
                    } else {
                        this.$Toast.show({
                            type: "warn",
                            text: message,
                            time: 3000,
                        });
                    }
                } catch (error) {
                    this.loading = false;
                    console.log(error);
                    this.$Message.error(this.$t("common.error_later"));
                }
            }
        },
    },
};
</script>

<style lang="css" scoped>
.audio-message-container {
    margin: 0 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    --voice-width: 200px;
    justify-content: flex-end;
}
.audio-message-container.out {
    align-items: flex-end;
}
.audio-message-container audio {
    outline: none;
    filter: sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(12%);
}
.volume {
    display: flex;
    align-items: center;
}
.volume-wrap {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: var(--voice-width);
    min-height: 44px;
    border-radius: 5px;
    padding: 8px 10px;
    box-sizing: border-box;
    background: #fff;
    box-shadow: 0px 6px 12px #eff0f3;
}
.audio-message-container.out .volume-wrap {
    justify-content: flex-end;
}
.volume-wrap i {
    width: 26px;
    height: 26px;
}
.volume-wrap i.normal {
    background: url(../../../../../assets/images/audio-icon-in2.png) no-repeat
        center center;
    background-size: 26px auto;
}
.audio-message-container.out .volume-wrap i.normal {
    background: url(../../../../../assets/images/audio-icon-out2.png) no-repeat
        center center;
    background-size: 26px auto;
}
.audio-message-container .volume-wrap i.loop {
    animation: inLoop 1s infinite;
}
.audio-message-container.out .volume-wrap i.loop {
    animation: outLoop 1s infinite;
}
@keyframes inLoop {
    0% {
        background: url(../../../../../assets/images/audio-icon-in0.png)
            no-repeat center center;
        background-size: 26px auto;
    }

    50% {
        background: url(../../../../../assets/images/audio-icon-in1.png)
            no-repeat center center;
        background-size: 26px auto;
    }

    100% {
        background: url(../../../../../assets/images/audio-icon-in2.png)
            no-repeat center center;
        background-size: 26px auto;
    }
}
@keyframes outLoop {
    0% {
        background: url(../../../../../assets/images/audio-icon-out0.png)
            no-repeat center center;
        background-size: 26px auto;
    }

    50% {
        background: url(../../../../../assets/images/audio-icon-out1.png)
            no-repeat center center;
        background-size: 26px auto;
    }

    100% {
        background: url(../../../../../assets/images/audio-icon-out2.png)
            no-repeat center center;
        background-size: 26px auto;
    }
}
.volume-text {
    font-family: "PingFang SC";
    font-style: normal;
    margin-top: 4px;
    min-width: 80px;
    min-height: 44px;
    border-radius: 5px;
    padding: 10px;
    font-weight: 400;
    font-size: 14px;
    line-height: 24px;
    color: #666;
    text-align: left;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
}
.audio-message-container.out .volume-wrap,
.audio-message-container.out .volume-text {
    background: #1dbb88;
}
.duration {
    color: #666;
    font-size: 12px;
}
.audio-message-container.out .volume-wrap .duration,
.audio-message-container.out .volume-text {
    color: #fff;
}
.loading {
    width: 20px;
    height: 20px;
    display: inline-block;
    animation: inLoading 0.6s infinite;
    background: url(../../../../../assets/images/loading-in.png) no-repeat
        center center;
    background-size: 20px auto;
}
.audio-message-container.out .loading {
    animation: outLoading 0.6s infinite;
    background: url(../../../../../assets/images/loading-out.png) no-repeat
        center center;
    background-size: 20px auto;
}
.unplay {
    width: 8px;
    height: 8px;
    background: #f40;
    border-radius: 50%;
    margin-left: 10px;
}

@keyframes inLoading {
    0% {
        transform: rotate(0deg);
    }

    25% {
        transform: rotate(90deg);
    }
    50% {
        transform: rotate(180deg);
    }
    75% {
        transform: rotate(270deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
@keyframes outLoading {
    0% {
        transform: rotate(0deg);
    }

    25% {
        transform: rotate(90deg);
    }
    50% {
        transform: rotate(180deg);
    }
    75% {
        transform: rotate(270deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
