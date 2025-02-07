<template>
    <div class="quoted-message-container">
        <div class="quoted-message">
            <div
                class="media-content"
                v-if="[3, 6, 7].indexOf(quotedMessage.messageContent.type) >= 0"
            >
                <p>{{ mixinGetUserName(quotedMessage._from) + ":" }}</p>
                <img
                    :src="mediaSrc"
                    draggable="false"
                    @click="onMessageClick"
                />
            </div>
            <div
                v-else-if="
                    enableMessagePreview &&
                    quotedMessage.messageContent.type === 1
                "
                class="other-content"
            >
                <tippy
                    :to="
                        '#messagePreview' +
                        message.messageId +
                        quotedMessage.messageId +
                        enableMessagePreview
                    "
                    :animate-fill="false"
                    interactive
                    placement="top"
                    distant="7"
                    theme="light"
                    animation="fade"
                    trigger="click"
                >
                    <template #content>
                        <PreviewQuotedMessageView :message="quotedMessage" />
                    </template>
                </tippy>
                <p
                    :id="
                        'messagePreview' +
                        message.messageId +
                        quotedMessage.messageId +
                        enableMessagePreview
                    "
                    v-html="quotedMessageStr"
                ></p>
            </div>
            <p v-else @click="onMessageClick" v-html="quotedMessageStr"></p>
        </div>
        <i
            v-if="showCloseButton"
            @click="cancelQuoteMessage"
            class="icon-ion-close"
        ></i>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import MessageContentType from "@/wfc/messages/messageContentType";
import PreviewQuotedMessageView from "@/ui/main/conversation/message/PreviewQuotedMessageView";
import { downloadFile, previewImagesOrVideo } from "@/platformHelper";
import { fs, shell } from "@/platform";
import store from "@/store";

export default {
    name: "QuoteMessageView",
    props: {
        showCloseButton: {
            type: Boolean,
            required: false,
            default: false,
        },
        // 原始消息
        message: {
            type: Message,
            required: false,
        },
        // 被引用的消息
        quotedMessage: {
            type: Message,
            required: true,
        },
        quotedMessageDigest: {
            type: String,
            required: false,
            default: "",
        },
        enableMessagePreview: {
            type: Boolean,
            required: false,
            default: false,
        },
    },

    data() {
        return {
            shareConversation: store.state.conversation,
        };
    },
    methods: {
        cancelQuoteMessage() {
            this.$emit("cancelQuoteMessage");
        },
        onMessageClick() {
            if (!this.enableMessagePreview && !this.quotedMessage) return;
            switch (this.quotedMessage.messageContent.type) {
                case MessageContentType.Video:
                    const { remotePath, fileName, thumbnail } =
                        this.quotedMessage.messageContent;
                    previewImagesOrVideo(
                        {
                            src: remotePath,
                            name: fileName,
                            thumbnail,
                        },
                        1
                    );
                    break;
                case MessageContentType.Image:
                    store.previewMessage(this.quotedMessage, false);
                    const { previewMediaItems, previewMediaIndex } =
                        this.shareConversation;
                    this.$nextTick(() => {
                        previewImagesOrVideo(
                            {
                                images: previewMediaItems,
                                index: previewMediaIndex,
                            },
                            0
                        );
                    });
                    break;
                case MessageContentType.File:
                case MessageContentType.Cloud_Disk_Message_Content:
                    this.downloadQuotedFile(this.quotedMessage);
                    break;
                case MessageContentType.Text:
                    // do nothing
                    break;
                default:
                    // TODO
                    console.log("TODO: preview quotedMessage");
                    break;
            }
        },
        async downloadQuotedFile(message) {
            const { localPath, type, remotePath } = message.messageContent;
            if (localPath && fs.existsSync(localPath)) {
                shell.openPath(localPath);
            } else {
                if (!store.isDownloadingMessage(message.messageUid)) {
                    if (
                        (type === MessageContentType.File &&
                            (await this.mixinCheckImFile(remotePath))) ||
                        type === MessageContentType.Cloud_Disk_Message_Content
                    ) {
                        downloadFile(message, true);
                        store.addDownloadingMessage(message.messageUid);
                    }
                } else {
                    this.$notify({
                        title: this.$t("setting.download"),
                        text: this.$t("setting.download_waiting"),
                        type: "warn",
                    });
                }
            }
        },
    },
    computed: {
        quotedMessageStr() {
            let str = "";

            if (this.quotedMessage) {
                const { type, fileName, name, imFileName } =
                    this.quotedMessage.messageContent;
                str = this.mixinGetUserName(this.quotedMessage._from) + ":";
                if (
                    [
                        MessageContentType.Cloud_Disk_Message_Content,
                        MessageContentType.File,
                    ].includes(type)
                ) {
                    //
                    str += ` [${this.$t(
                        MessageContentType.File === type
                            ? "fav.file"
                            : "message.share"
                    )}] ${fileName || name || imFileName}`;
                } else if (
                    [
                        MessageContentType.Image,
                        MessageContentType.Video,
                        MessageContentType.Sticker,
                    ].indexOf(type) < 0
                ) {
                    str += this.quotedMessage.messageContent.digest(
                        this.quotedMessage
                    );
                }
                if (MessageContentType.RecallMessage_Notification === type) {
                    str = this.$t("message.citation");
                }
            } else {
                str = this.quotedMessageDigest;
            }
            return str;
        },
        mediaSrc() {
            let src;
            let msgCnt = this.quotedMessage.messageContent;
            src = msgCnt.thumbnail
                ? "data:video/jpeg;base64," + msgCnt.thumbnail
                : msgCnt.remotePath;
            return src;
        },
    },
    components: {
        PreviewQuotedMessageView,
    },
};
</script>

<style lang="css" scoped>
.quoted-message-container {
    display: flex;
    align-items: center;
}

.quoted-message {
    display: flex;
    background-color: #e9e9e9;
    border-radius: 5px;
    padding: 5px 10px;
    margin: 0 10px;
}

.quoted-message > p {
    max-width: 320px;
    max-height: 50px;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    outline: none;
}

.other-content p {
    max-width: 320px;
    max-height: 50px;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    outline: none;
}

.media-content {
    display: flex;
    flex-direction: row;
}

.media-content p {
    max-width: 240px;
    max-height: 50px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}

.quoted-message img {
    margin-left: 10px;
    border-radius: 3px;
    max-width: 80px;
    max-height: 80px;
}
</style>
