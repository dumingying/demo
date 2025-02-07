<template>
    <div
        class="video-content-container"
        :class="`video-wrap-${message.messageId}`"
        @click="handleVideo"
    >
        <figure
            :class="[isShowControls ? 'mask' : '', isPlay ? 'pause' : 'play']"
        ></figure>
        <video
            v-if="videoSrc"
            controls
            preload="metadata"
            draggable="false"
            crossorigin="anonymous"
            controlsList="nodownload"
            disablePictureInPicture
            :poster="posterImg"
            :src="videoSrc"
            :class="`drag-video-${message.messageId}`"
            @dragstart="dragVideo($event)"
        />
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";

export default {
    name: "VideoMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            isPlay: false,
            isShowControls: true,
            loading: false,
            src: "",
        };
    },
    created() {
        // console.log(this.message, '视频')
    },
    computed: {
        posterImg() {
            return this.message.messageContent.thumbnail
                ? `data:video/jpeg;base64,${this.message.messageContent.thumbnail}`
                : "";
        },
        videoSrc() {
            return `${this.mixinCloudDiskRemotePath(
                this.message.messageContent.remotePath
            )}#t=${+new Date()}`;
        },
    },
    mounted() {
        let myDom = document.querySelector(
            `.drag-video-${this.message.messageId}`
        );
        let myWrapDom = document.querySelector(
            `.video-wrap-${this.message.messageId}`
        );
        if (myDom) {
            myDom.addEventListener("play", this.onPlayOrPause);
            myDom.addEventListener("pause", this.onPlayOrPause);
        }
        if (myWrapDom) {
            myWrapDom.addEventListener("mouseover", this.onMouseoverOrMouseout);
            myWrapDom.addEventListener("mouseout", this.onMouseoverOrMouseout);
        }
    },
    methods: {
        dragVideo(event) {
            let video = this.message.messageContent;
            event.dataTransfer.setData("URL", video.remotePath);
        },
        async handleVideo() {
            const { messageContent, messageId } = this.message;
            let myDom = document.querySelector(`.drag-video-${messageId}`);
            if (!this.isPlay) {
                let result = await this.mixinCheckImFile(
                    messageContent.remotePath
                );
                if (!result) return;
                try {
                    console.log("playing");
                    await myDom.play();
                    this.isPlay = true;
                } catch (error) {
                    console.log(error);
                    myDom.load();
                }
            } else {
                myDom.pause();
                this.isPlay = false;
            }
        },
        onPlayOrPause(event) {
            event.stopPropagation();
            this.isPlay = event.type === "play";
        },
        onMouseoverOrMouseout(event) {
            event.stopPropagation();
            this.isShowControls = event.type === "mouseover";
        },
    },
    unmounted() {
        let myDom = document.querySelector(
            `.drag-video-${this.message.messageId}`
        );
        let myWrapDom = document.querySelector(
            `.video-wrap-${this.message.messageId}`
        );
        if (myDom) {
            myDom.removeEventListener("play", this.onPlayOrPause);
            myDom.removeEventListener("pause", this.onPlayOrPause);
        }
        if (myWrapDom) {
            myWrapDom.removeEventListener(
                "mouseover",
                this.onMouseoverOrMouseout
            );
            myWrapDom.removeEventListener(
                "mouseout",
                this.onMouseoverOrMouseout
            );
        }
    },
};
</script>

<style lang="css" scoped>
.video-content-container {
    margin: 0 10px;
    position: relative;
    border: 1px solid #efefef;
    border-radius: 5px;
}

.mask {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    z-index: 999;
    cursor: pointer;
    border-radius: 50%;
    background-repeat: no-repeat;
    background-position: center center;
}

.mask.pause {
    background-image: url(../../../../../assets/images/video-pause.png);
    background-size: 26px auto;
}

.mask.play {
    background-image: url(../../../../../assets/images/video-play.png);
    background-size: 26px auto;
}

.video-content-container video {
    min-height: 200px;
    max-height: 300px;
    max-width: 300px;
    border-radius: 5px;
    overflow: hidden;
}

.right-arrow:before {
    border-left-color: white;
}

.left-arrow:before {
    border-left-color: white;
}
</style>
