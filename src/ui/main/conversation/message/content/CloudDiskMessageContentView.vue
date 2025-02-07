<template>
    <div>
        <div
            class="cloud-disk-message-container"
            @click="openFile"
            v-bind:class="{ out: message.direction === 0 }"
        >
            <div class="flex-row flex-align-center cloud-disk-wrap">
                <div class="flex-1">
                    <p class="single-line title">
                        {{ message.messageContent.fileName }}
                    </p>
                    <p class="single-line size-info">
                        {{
                            mixinTransfromByte(message.messageContent.fileSize)
                        }}
                    </p>
                </div>
                <img width="40" draggable="false" :src="fileIcon" />
            </div>
            <p class="type">{{ $t("message.share") }}</p>
        </div>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import { downloadFile } from "@/platformHelper";
import helper from "@/ui/util/helper";
import { fs, isElectron, shell } from "@/platform";
import store from "@/store";

export default {
    name: "CloudDiskMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
            modal2: true,
        },
    },
    created() {
        // console.log(this.message, "云盘文件");
    },
    computed: {
        fileIcon() {
            let fileName =
                this.message.messageContent.fileName ||
                this.message.messageContent.imFileName;
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
    },
    methods: {
        openFile() {
            const { messageContent } = this.message;
            if (isElectron()) {
                let localPath = messageContent.localPath;
                if (localPath && fs.existsSync(localPath)) {
                    shell.openPath(localPath);
                } else {
                    if (!this.isDownloading()) {
                        downloadFile(this.message, true);
                        store.addDownloadingMessage(this.message.messageUid);
                    } else {
                        // TODO toast 下载中
                        console.log("file isDownloading");
                    }
                }
            } else {
                downloadFile(this.message, true);
            }
        },
        isDownloading() {
            return store.isDownloadingMessage(this.message.messageUid);
        },
    },
};
</script>

<style lang="less" scoped>
.cloud-disk-message-container {
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
