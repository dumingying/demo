<template>
    <div
        :class="[
            'conversation-item-container',
            { drag: dragAndDropEnterCount > 0 },
        ]"
        @dragover="dragEvent($event, 'dragover')"
        @dragleave="dragEvent($event, 'dragleave')"
        @dragenter="dragEvent($event, 'dragenter')"
        @drop="dragEvent($event, 'drop')"
        @contextmenu.prevent="showConversationInfoContextMenu"
    >
        <div class="conversation-item">
            <figure class="header">
                <img
                    class="avatar"
                    alt=""
                    draggable="false"
                    :src="
                        mixinDefaultPortrait(
                            conversationInfo.conversation._target.portrait
                        )
                    "
                    @error="mixinImgUrlAlt"
                />
                <em
                    v-if="unread > 0"
                    class="badge"
                    v-bind:class="{ silent: conversationInfo.isSilent }"
                    >{{ unread > 99 ? "99+" : unread }}</em
                >
            </figure>
            <div class="content-container">
                <div class="title-time-container">
                    <h2 class="title single-line">
                        {{ conversationTitle || $t("contact.unknown_user") }}
                    </h2>
                    <p class="time">{{ conversationInfo._timeStr }}</p>
                </div>
                <div class="content">
                    <!-- 草稿信息 -->
                    <p
                        class="draft single-line"
                        v-if="shouldShowDraft"
                        v-html="draft"
                    ></p>
                    <p
                        class="draft single-line"
                        v-else-if="shouldShowVoipStatus"
                        v-html="voipOngoingDesc"
                    ></p>
                    <!-- 最后信息展示 -->
                    <div class="last-message-desc single-line" v-else>
                        <!--  -->
                        <i v-if="unreadMention > 0"
                            >[{{ $t("message.atMe") }}]</i
                        >
                        <div
                            class="last-message-desc-wrap single-line"
                            v-html="lastMessageContent"
                        ></div>
                    </div>
                    <i
                        v-if="conversationInfo.isSilent"
                        class="icon-ion-android-notifications-off"
                    ></i>
                    <!-- 临时群标记 -->
                    <span
                        v-if="
                            temporaryGroupIdList.includes(
                                conversationInfo.target
                            )
                        "
                        class="temporary-group"
                    >
                        {{ $t("message.temporary") }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import RecallMessageNotification from "@/wfc/messages/notification/recallMessageNotification";
import FileMessageContent from "@/wfc/messages/fileMessageContent";
import ConversationInfo from "@/wfc/model/conversationInfo";
import ConversationType from "@/wfc/model/conversationType";
import Message from "@/wfc/messages/message";
import uEmojiParser from "universal-emoji-parser";

import { getConversationPortrait } from "../../util/imageUtil";

import Draft from "@/ui/util/draft";
import wfc from "@/wfc/client/wfc";
import Config from "@/config";
import store from "@/store";

export default {
    name: "ConversationItemView",
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
        },
        temporaryGroupIdList: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            dragAndDropEnterCount: 0,
            shareConversationState: store.state.conversation,
        };
    },
    mounted() {
        let info = this.conversationInfo;
        if (
            !info.conversation._target.portrait ||
            info.conversation._target.portrait === Config.DEFAULT_PORTRAIT_URL
        ) {
            getConversationPortrait(info.conversation).then((portrait) => {
                info.conversation._target.portrait = portrait;
            });
        }
    },
    methods: {
        dragEvent(e, v) {
            let obj = null;
            if (
                this.conversationInfo.conversation.type ==
                ConversationType.Group
            ) {
                if (ConversationInfo.anonymous_memberList.length) {
                    ConversationInfo.anonymous_memberList.map((item) => {
                        if (item.memberId === wfc.getUserId()) {
                            obj = {
                                anonymous_name: item.anonymousName,
                                portrait: item.portrait,
                                anonymous_en_name: item.anonymousEnName,
                            };
                        }
                    });
                }
            }
            if (v === "dragenter") {
                this.dragAndDropEnterCount++;
            } else if (v === "dragleave") {
                this.dragAndDropEnterCount--;
            } else if (v === "drop") {
                this.dragAndDropEnterCount--;
                let length = e.dataTransfer.files.length;
                if (length > 0 && length <= 5) {
                    for (let i = 0; i < length; i++) {
                        this.$eventBus.$emit(
                            "uploadFile",
                            e.dataTransfer.files[i]
                        );
                        store.sendFile(
                            this.conversationInfo.conversation,
                            e.dataTransfer.files[i],
                            obj
                        );
                    }
                } else {
                    // TODO
                    let url = e.dataTransfer.getData("URL");
                    if (url) {
                        store.sendFile(
                            this.conversationInfo.conversation,
                            url,
                            obj
                        );
                    } else {
                        let text = e.dataTransfer.getData("text");
                        if (text.startsWith("{")) {
                            let obj = JSON.parse(text);
                            let file = new FileMessageContent(
                                null,
                                obj.url,
                                obj.name,
                                obj.size
                            );
                            let message = new Message(
                                this.conversationInfo.conversation,
                                file
                            );
                            wfc.sendMessage(message);
                        }
                    }
                }
                // 发送文件，会话消息列表需要滚动到最后
                store.setShouldAutoScrollToBottom(true);
            } else if (v === "dragover") {
                // If not st as 'copy', electron will open the drop file
                e.dataTransfer.dropEffect = "copy";
            }
        },
        // 处理最后消息中表情显示问题
        lastEmojis(decodeText) {
            let emoji = uEmojiParser.parse(decodeText);
            emoji = emoji.replace(
                / src="https:\/\/twemoji\.maxcdn\.com\/v\/[0-9.]+\//g,
                'src="' + Config.TWEMOJI_URL
            );
            return emoji;
        },
        showConversationInfoContextMenu(event) {
            this.$eventBus.$emit("showConversationContextMenu", [
                event,
                this.conversationInfo,
            ]);
        },
    },
    computed: {
        conversationTitle() {
            let info = this.conversationInfo;
            if (info.conversationType === ConversationType.Single) {
                // 针对通付盾团队 名称需要特殊处理一下
                if (Config.TEAM_IDS.includes(info.conversation._target.uid)) {
                    return this.mixinOfficialName(
                        info.conversation._target.name
                    );
                }
                return this.mixinGetUserName(info.conversation._target);
            } else {
                return info.conversation._target.name;
            }
        },
        shouldShowDraft() {
            if (
                this.shareConversationState.currentConversationInfo &&
                this.shareConversationState.currentConversationInfo.conversation.equal(
                    this.conversationInfo.conversation
                )
            ) {
                return false;
            }
            if (
                this.conversationInfo.unreadCount.unreadMention +
                    this.conversationInfo.unreadCount.unreadMentionAll >
                0
            ) {
                return false;
            }
            let draft = Draft.getConversationDraftEx(this.conversationInfo);
            return draft.text.trim() !== "" || draft.quotedMessage !== null;
        },

        shouldShowVoipStatus() {
            return this.conversationInfo._isVoipOngoing;
        },

        draft() {
            let draft = Draft.getConversationDraftEx(this.conversationInfo);
            let draftText =
                `<em>[${this.$t("common.draft")}]</em>` + draft.text;
            draftText = draftText.replace(
                /<img [:a-zA-Z0-9_+; ,\-=\/."]+>/g,
                `[${this.$t("disk.photos")}]`
            );
            draftText = draftText.replace(/&nbsp;/g, " ");
            draftText = draftText.replace(/<br>/g, "");
            if (draft.quotedMessage) {
                draftText += "...";
            }
            return draftText;
        },

        voipOngoingDesc() {
            let voipStatus = `<em>[${this.$t(
                "message.call_in_progress"
            )}]</em>`;
            return voipStatus;
        },

        lastMessageContent() {
            let conversationInfo = this.conversationInfo;
            if (conversationInfo?.lastMessage?.messageContent) {
                let senderName = "";
                // 是否有额外信息
                let extra = conversationInfo.lastMessage.messageContent.extra;
                let lastMessage =
                    conversationInfo.lastMessage.messageContent.digest(
                        conversationInfo.lastMessage
                    );
                if (extra && typeof extra === "string") {
                    try {
                        //  不支持该消息类型 extra:{chatMode:1}
                        if (
                            conversationInfo?.lastMessage
                                .messageContent instanceof
                            RecallMessageNotification
                        ) {
                            extra = extra
                                .replace(/\n/g, "\\n")
                                .replace(/\r/g, "\\r")
                                .replace(/\t/g, "\\t");
                        }

                        let extraObj = JSON.parse(extra);
                        if (extraObj && Number(extraObj.chatMode) === 1) {
                            return this.$t("message.unsupport_message_desc");
                        }

                        if (extraObj.anonymous_name && extraObj.portrait) {
                            return this.lastEmojis(lastMessage);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
                if (
                    conversationInfo.conversation.type === 1 &&
                    conversationInfo.lastMessage.direction === 1 &&
                    !(
                        conversationInfo.lastMessage.messageContent instanceof
                        NotificationMessageContent
                    )
                ) {
                    let name = this.mixinGetUserName(
                        conversationInfo.lastMessage._from
                    );
                    senderName = name + ": ";
                }
                return senderName + this.lastEmojis(lastMessage);
            } else {
                return "";
            }
        },

        unread() {
            let conversationInfo = this.conversationInfo;
            let unreadCount = conversationInfo.unreadCount;
            return unreadCount
                ? unreadCount.unread +
                      unreadCount.unreadMention +
                      unreadCount.unreadMentionAll
                : 0;
        },
        unreadMention() {
            let conversationInfo = this.conversationInfo;
            let unreadCount = conversationInfo.unreadCount;
            return unreadCount
                ? unreadCount.unreadMention + unreadCount.unreadMentionAll
                : 0;
        },
    },
};
</script>

<style scoped>
.conversation-item-container {
    padding: 0 12px;
    position: relative;
    box-sizing: border-box;
    border: 1px solid transparent;
}

.conversation-item-container.drag {
    border: 1px solid #d6d6d6;
}

.conversation-item {
    width: 100%;
    height: 70px;
    padding: 12px 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header {
    width: 40px;
    height: 40px;
    position: relative;
    margin-right: 8px;
}

.header .avatar {
    position: relative;
    width: 40px;
    height: 40px;
    overflow: hidden;
    background: #d6d6d6;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 50%;
}

.header .badge {
    position: absolute;
    color: white;
    font-size: 10px;
    background-color: red;
    border-radius: 8px;
    width: 16px;
    height: 16px;
    line-height: 16px;
    font-style: normal;
    text-align: center;
    right: -4px;
    top: -4px;
}

.header .badge.silent {
    width: 8px;
    height: 8px;
    font-size: 0;
}

.content-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
}

.content-container .title-time-container {
    display: flex;
    width: 100%;
    justify-content: space-between;
}

.content-container .title-time-container .title {
    flex: 1;
    font-style: normal;
    font-weight: 400;
    font-size: 15px;
    line-height: 20px;
    color: #222222;
}

.content-container .title-time-container .time {
    font-style: normal;
    font-weight: 400;
    font-size: 11px;
    line-height: 16px;
    text-align: right;
    color: #888888;
}

.content-container .content {
    margin-top: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 18px;
    color: #666666;
}

.content-container .content .temporary-group {
    font-size: 10px;
    padding-left: 3px;
}

.content .draft {
    font-size: 12px;
    height: 20px;
}

/*refer to: https://blog.csdn.net/weixin_42412046/article/details/80804285*/
:deep(.content) .draft em {
    color: red;
    font-style: normal;
    padding-right: 5px;
}

.content .last-message-desc {
    color: #b8b8b8;
    font-size: 13px;
    height: 20px;
    flex: 1;
}

.content .last-message-desc i {
    font-style: normal;
    color: red;
}

/* .content .last-message-desc .last-message-desc-wrap {
  display: flex;
  flex: 1;
} */
.content .last-message-desc .last-message-desc-wrap {
    font-size: 12px !important;
    color: #666666;
}

.content .last-message-desc .last-message-desc-wrap :deep(img) {
    width: 18px !important;
    height: auto !important;
    vertical-align: middle;
}

.content i {
    color: #b8b8b8;
}
</style>
