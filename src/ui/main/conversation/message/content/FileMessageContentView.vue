<template>
    <div
        class="file-message-container"
        draggable="false"
        @click="clickFile"
        :class="{ out: message.direction === 0 }"
    >
        <div class="flex-row flex-align-center cloud-disk-wrap">
            <div class="flex-1" @dragstart="dragFile($event)">
                <p class="single-line title">
                    {{ message.messageContent.name }}
                </p>
                <p class="single-line size-info">
                    {{ mixinTransfromByte(message.messageContent.size) }}
                </p>
            </div>
            <img width="40" draggable="false" :src="fileIcon" />
        </div>
        <p class="type">{{ $t("message.share") }}</p>
        <div
            v-if="downloadStats"
            style="
                height: 5px;
                background: #1dbb88;
                position: absolute;
                left: 0;
                bottom: 0;
                border-radius: 50px;
            "
            v-bind:style="{
                width:
                    (downloadStats.progress / downloadStats.total) * 100 + '%',
            }"
        ></div>
        <div
            v-if="sendStats"
            style="
                height: 5px;
                background: #1dbb88;
                position: absolute;
                left: 0;
                bottom: 0;
                border-radius: 50px;
            "
            v-bind:style="{
                width: (sendStats.progress / sendStats.total) * 100 + '%',
            }"
        ></div>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import helper from "@/ui/util/helper";
import { downloadFile } from "@/platformHelper";
import { fs, isElectron, shell } from "@/platform";
import store from "@/store";

export default {
    name: "FileMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
        };
    },
    created() {
        console.log(this.message, "文件");
    },
    methods: {
        async clickFile() {
            if (isElectron()) {
                console.log(this.message.messageContent.remotePath, "====");
                let localPath = this.message.messageContent.localPath;
                if (localPath && fs.existsSync(localPath)) {
                    shell.openPath(localPath);
                } else {
                    if (!this.isDownloading()) {
                        let result = await this.mixinCheckImFile(
                            this.message.messageContent.remotePath
                        );
                        if (result) {
                            downloadFile(this.message, true);
                            store.addDownloadingMessage(
                                this.message.messageUid
                            );
                        }
                    } else {
                        this.$notify({
                            title: this.$t("setting.download"),
                            text: this.$t("setting.download_waiting"),
                            type: "warn",
                        });
                    }
                }
            } else {
                let result = await this.mixinCheckImFile(
                    this.message.messageContent.remotePath
                );
                if (result) {
                    downloadFile(this.message, true);
                }
            }
        },

        dragFile(event) {
            let file = this.message.messageContent;
            let fileObj = {
                url: file.remotePath,
                name: file.name,
                size: file.size,
            };
            event.dataTransfer.setData("text", JSON.stringify(fileObj));
        },
        isDownloading() {
            return store.isDownloadingMessage(this.message.messageUid);
        },
    },

    computed: {
        fileIcon() {
            let fileName = this.message.messageContent.name;
            let icon = helper.getFiletypeIcon(
                fileName.substring(fileName.lastIndexOf(".") + 1)
            );
            if (
                [
                    "audio.png",
                    "excel.png",
                    "pdf.png",
                    "ppt.png",
                    "txt.png",
                    "word.png",
                    "archive.png",
                ].includes(icon)
            ) {
                return require("@/assets/images/filetypes/" + icon);
            } else {
                return require("@/assets/images/filetypes/unknow.png");
            }
        },

        downloadStats() {
            let dm = store.getDownloadingMessageStatus(this.message.messageUid);
            return dm;
        },
        sendStats() {
            let sm = store.getSendingStatus(this.message.messageId);
            return sm;
        },
    },
};
</script>

<style lang="less" scoped>
.file-message-container {
    margin: 0 10px;
    /* padding: 5px; */
    background-color: #fff;
    width: 250px;
    max-width: 250px;
    position: relative;
    border-radius: 5px;
    overflow: hidden;

    .cloud-disk-wrap {
        background: linear-gradient(131deg, #1dbb88 0%, #12ab7d 100%);
        padding: 16px 8px 16px 16px;

        .title {
            color: #fff;
            font-size: 14px;
            font-family: PingFang SC;
            font-weight: 500;
        }

        .size-info {
            font-size: 12px;
            padding: 5px 0;
            color: #fff;
        }
    }

    .type {
        padding: 5px 10px;
        font-size: 11px;
        color: #999;
    }
}
</style>
