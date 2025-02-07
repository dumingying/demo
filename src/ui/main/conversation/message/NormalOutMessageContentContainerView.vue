<template>
    <section>
        <div
            class="message-time-container"
            v-bind:class="{
                checked: sharedPickState.messages.indexOf(message) >= 0,
            }"
        >
            <p v-if="message._showTime" class="time">{{ message._timeStr }}</p>
            <div
                class="message-content-container"
                v-bind:class="{
                    checked: sharedPickState.messages.indexOf(message) >= 0,
                }"
            >
                <input
                    id="checkbox"
                    v-if="sharedConversationState.enableMessageMultiSelection"
                    type="checkbox"
                    class="checkbox"
                    placeholder=""
                    :value="message"
                    v-model="sharedPickState.messages"
                />

                <div class="message-avatar-content-container">
                    <!-- 文件的进度条有点特殊，有进度的消息的进度条有点特殊 -->
                    <LoadingView
                        v-if="
                            message.status === 0 &&
                            message.messageContent.type !== 5
                        "
                    />
                    <i
                        v-if="message.status === 2"
                        class="icon-ion-close-circled"
                        style="color: red"
                        @click="resend"
                    />
                    <div class="flex-column flex-align-end">
                        <!-- 匿名群需要展示名称 -->
                        <p
                            class="name"
                            v-if="
                                isShowName &&
                                message.content.extra &&
                                JSON.parse(
                                    message.content.extra
                                ).hasOwnProperty('anonymous_name')
                            "
                        >
                            {{ anonymousNameOrPortrait("name") }}
                        </p>
                        <div class="flex-column flex-align-end">
                            <MessageContentContainerView
                                :message="message"
                                :class="[
                                    'message-content-container-view',
                                    { highlight: highLight },
                                ]"
                                @contextmenu.prevent.native="
                                    openMessageContextMenu($event, message)
                                "
                            />
                            <QuoteMessageView
                                v-if="quotedMessage"
                                style="padding: 5px 0; max-width: 100%"
                                :message="message"
                                :quoted-message="quotedMessage"
                                :enable-message-preview="true"
                                :message-digest="
                                    message.messageContent.quoteInfo
                                        .messageDigest
                                "
                                :show-close-button="false"
                            />
                        </div>
                    </div>
                    <tippy
                        v-if="!isAnonymousGroup"
                        :to="'#infoTrigger' + message.messageId"
                        :animate-fill="false"
                        interactive
                        placement="left"
                        distant="7"
                        theme="light"
                        animation="fade"
                        trigger="click"
                    >
                        <template #content>
                            <UserCardView
                                @close="closeUserCard"
                                :user-info="message._from"
                            />
                        </template>
                    </tippy>

                    <img
                        ref="userCardTippy"
                        class="avatar"
                        draggable="false"
                        :id="'infoTrigger' + message.messageId"
                        :src="
                            isAnonymousGroup
                                ? anonymousNameOrPortrait('portrait')
                                : mixinDefaultPortrait(message._from.portrait)
                        "
                        @click="onClickUserPortrait(message.from)"
                        @error="mixinImgUrlAlt"
                    />
                </div>
            </div>
            <p
                v-if="shouldShowMessageReceipt"
                class="receipt"
                @click="showMessageReceiptDetail"
            >
                {{ messageReceipt }}
            </p>
        </div>
    </section>
</template>

<script>
import UserCardView from "@/ui/main/user/UserCardView";
import Message from "@/wfc/messages/message";
import MessageContentContainerView from "@/ui/main/conversation/message/MessageContentContainerView";
import store from "@/store";
import LoadingView from "@/ui/common/LoadingView";
import wfc from "@/wfc/client/wfc";
import ConversationType from "@/wfc/model/conversationType";
import { gte } from "@/wfc/util/longUtil";
import MessageReceiptDetailView from "@/ui/main/conversation/message/MessageReceiptDetailView";
import QuoteMessageView from "@/ui/main/conversation/message/QuoteMessageView";
import Config from "@/config";
import ConversationInfo from "@/wfc/model/conversationInfo";
export default {
    name: "NormalOutMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
            sharedPickState: store.state.pick,
            highLight: false,
            quotedMessage: null,
        };
    },
    components: {
        QuoteMessageView,
        LoadingView,
        MessageContentContainerView,
        UserCardView,
        // TextMessageContentView,
    },
    computed: {
        IsEn() {
            return this.$store.state.currentLanguage === "en";
        },
        messageReceipt() {
            let conversation = this.message.conversation;
            let timestamp = this.message.timestamp;
            let receiptDesc = "";
            let deliveries =
                this.sharedConversationState.currentConversationDeliveries;
            let readEntries =
                this.sharedConversationState.currentConversationRead;

            if (conversation.type === ConversationType.Single) {
                let readDt = readEntries
                    ? readEntries.get(conversation.target)
                    : 0;
                readDt = readDt ? readDt : 0;
                let recvDt = deliveries
                    ? deliveries.get(conversation.target)
                    : 0;
                recvDt = recvDt ? recvDt : 0;

                if (gte(readDt, timestamp)) {
                    receiptDesc = this.$t("message.read");
                } else if (gte(recvDt, timestamp)) {
                    receiptDesc = this.$t("message.arrived");
                } else {
                    receiptDesc = this.$t("message.not_delivered");
                }
            } else {
                let groupMembers = wfc.getGroupMemberIds(
                    conversation.target,
                    false
                );
                if (!groupMembers || groupMembers.length === 0) {
                    receiptDesc = "";
                } else {
                    let memberCount = groupMembers.length;
                    let recvCount = 0;
                    let readCount = 0;

                    let receivedUserIds = [];
                    let readUserIds = [];
                    let unReceiveUserIds = [];
                    groupMembers.forEach((memberId) => {
                        let recvDt = deliveries ? deliveries.get(memberId) : 0;
                        let readDt = readEntries
                            ? readEntries.get(memberId)
                            : 0;
                        if (readDt && gte(readDt, timestamp)) {
                            readCount++;
                            readUserIds.push(memberId);
                            recvCount++;
                        } else if (recvDt && gte(recvDt, timestamp)) {
                            recvCount++;
                            receivedUserIds.push(memberId);
                        } else {
                            unReceiveUserIds.push(memberId);
                        }
                    });
                    receiptDesc = `${this.$t(
                        "message.arrived"
                    )} ${recvCount}/${memberCount}，${this.$t(
                        "message.read"
                    )} ${readCount}/${memberCount}`;
                }
            }
            return receiptDesc;
        },

        isDownloading() {
            return store.isDownloadingMessage(this.message.messageUid);
        },

        shouldShowMessageReceipt() {
            return (
                this.sharedConversationState.isMessageReceiptEnable &&
                ["FireRobot", ...Config.HELPER_IDS].indexOf(
                    this.message.conversation.target
                ) < 0
            );
        },
        // 群展示名称，单人聊天不用展示名称
        isShowName() {
            let currentType =
                this.sharedConversationState.currentConversationInfo
                    .conversationType;
            return currentType !== ConversationType.Single;
        },
        isAnonymousGroup() {
            return (
                ConversationInfo &&
                ConversationInfo.anonymous_memberList &&
                ConversationInfo.anonymous_memberList.length
            );
        },
        // 名称和头像
        anonymousNameOrPortrait() {
            return (type) => {
                if (this.isAnonymousGroup && this.message.content.extra) {
                    let extra = JSON.parse(this.message.content.extra);
                    if (
                        extra.hasOwnProperty("anonymous_name") &&
                        extra.hasOwnProperty("portrait")
                    ) {
                        if (type == "name") {
                            return this.IsEn
                                ? extra.anonymous_en_name
                                : extra.anonymous_name;
                        } else {
                            return extra.portrait.startsWith("http")
                                ? extra.portrait
                                : `${Config.STATIC_SERVER}/im-fs${extra.portrait}`;
                        }
                    }
                }
                return type == "name" ? "" : Config.DEFAULT_PORTRAIT_URL;
            };
        },
    },
    created() {
        console.log(this.message, "OUT");
    },
    mounted() {
        this.$eventBus.$on("contextMenuClosed", this.onContextMenuClosed);

        if (this.message.messageContent.quoteInfo) {
            let messageUid = this.message.messageContent.quoteInfo.messageUid;
            let msg = store.getMessageByUid(messageUid);
            if (!msg) {
                wfc.loadRemoteMessage(
                    messageUid,
                    (ms) => {
                        msg = store._patchMessage(ms);
                        this.quotedMessage = msg;
                    },
                    (err) => {
                        console.log(
                            "load remote message error",
                            messageUid,
                            err
                        );
                    }
                );
            } else {
                this.quotedMessage = msg;
            }
        }
    },
    methods: {
        onContextMenuClosed() {
            this.highLight = false;
        },
        onClickUserPortrait(userId) {
            wfc.getUserInfo(userId, true);
        },
        closeUserCard() {
            console.log("closeUserCard", this.$refs["userCardTippy"]);
            this.$refs["userCardTippy"]._tippy.hide();
        },
        resend() {
            wfc.deleteMessage(this.message.messageId);
            wfc.sendMessage(this.message);
        },
        openMessageContextMenu(event, message) {
            if (this.sharedConversationState.enableMessageMultiSelection)
                return;
            this.$emit("openMessageContextMenu", event, message);
            this.highLight = true;
        },

        showMessageReceiptDetail() {
            let conversation = this.message.conversation;
            if (conversation.type === ConversationType.Single) {
                return;
            }

            let timestamp = this.message.timestamp;
            let deliveries =
                this.sharedConversationState.currentConversationDeliveries;
            let readEntries =
                this.sharedConversationState.currentConversationRead;

            if (conversation.type === ConversationType.Group) {
                let groupMembers = wfc.getGroupMemberIds(
                    conversation.target,
                    false
                );
                if (!groupMembers || groupMembers.length === 0) {
                    // do nothing
                } else {
                    let receivedUserIds = [];
                    let readUserIds = [];
                    let unReceiveUserIds = [];
                    groupMembers.forEach((memberId) => {
                        let recvDt = deliveries ? deliveries.get(memberId) : 0;
                        let readDt = readEntries
                            ? readEntries.get(memberId)
                            : 0;
                        if (readDt && gte(readDt, timestamp)) {
                            readUserIds.push(memberId);
                        } else if (recvDt && gte(recvDt, timestamp)) {
                            receivedUserIds.push(memberId);
                        } else {
                            unReceiveUserIds.push(memberId);
                        }
                    });
                    let readUsers = store.getUserInfos(
                        readUserIds,
                        conversation.target
                    );
                    let receivedUsers = store.getUserInfos(
                        receivedUserIds,
                        conversation.target
                    );
                    let unreceiveUsers = store.getUserInfos(
                        unReceiveUserIds,
                        conversation.target
                    );

                    this.$modal.show(
                        MessageReceiptDetailView,
                        {
                            readUsers: readUsers,
                            receivedUsers: receivedUsers,
                            unreceiveUsers: unreceiveUsers,
                        },
                        null,
                        {
                            name: "message-receipt-detail-modal",
                            width: 480,
                            height: 300,
                            clickToClose: true,
                        },
                        {}
                    );
                }
            }
        },
    },
    beforeUnmount() {
        this.$eventBus.$off("contextMenuClosed", this.onContextMenuClosed);
    },
};
</script>

<style lang="css" scoped>
.message-time-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.message-time-container.checked {
    background-color: #e7e7e7;
}

.message-time-container .time {
    width: 100%;
    margin-bottom: 20px;
    text-align: center;
    color: #b4b4b4;
    font-size: 10px;
    background-color: #f3f3f3;
}

.message-time-container .receipt {
    margin-right: 70px;
    font-size: 12px;
    color: #b4b4b4;
}

.message-content-container {
    width: 100%;
    display: flex;
    padding: 10px 20px;
    box-sizing: border-box;
    justify-content: flex-end;
    align-items: center;
    position: relative;
}

.message-avatar-content-container {
    display: flex;
    /*max-width: calc(100% - 44px);*/
    max-width: 72%;
    overflow: hidden;
    /*max-height: 800px;*/
    margin-left: auto;
    text-overflow: ellipsis;
    align-items: flex-start;
}

.message-avatar-content-container .name {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #bdbdbd;
    font-size: 12px;
    margin-right: 10px;
    margin-bottom: 2px;
}

.message-avatar-content-container .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.message-content-container-view.highlight {
    /* background-color: #dadada; */
    opacity: 0.5;
    /* --out-arrow-color: #dadada !important; */
}
</style>
