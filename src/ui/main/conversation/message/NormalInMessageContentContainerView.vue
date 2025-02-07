<template>
    <section class="container">
        <div
            class="message-time-container"
            v-bind:class="{
                checked: sharedPickState.messages.indexOf(message) >= 0,
            }"
        >
            <p v-if="message._showTime" class="time">{{ message._timeStr }}</p>
            <div class="message-avatar-content-container">
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
                        <ChannelCardView
                            v-if="message.conversation.type === 3"
                            @close="closeUserCard"
                            :channel-id="message.conversation.target"
                        />
                        <UserCardView
                            v-else
                            :user-info="message._from"
                            @close="closeUserCard"
                        />
                    </template>
                </tippy>
                <div class="avatar-container">
                    <input
                        id="checkbox"
                        v-if="
                            sharedConversationState.enableMessageMultiSelection
                        "
                        type="checkbox"
                        :value="message"
                        v-model="sharedPickState.messages"
                    />
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
                        @contextmenu.prevent="
                            openMessageSenderContextMenu($event, message)
                        "
                        @error="mixinImgUrlAlt"
                    />
                </div>
                <!--消息内容 根据情况，if-else-->
                <div class="message-name-content-container">
                    <!-- 群展示名称，单人聊天不用展示名称 -->
                    <template v-if="isShowName">
                        <p
                            class="name"
                            v-if="
                                (message.content.extra &&
                                    JSON.parse(
                                        message.content.extra
                                    ).hasOwnProperty('anonymous_name')) ||
                                isAnonymousGroup
                            "
                        >
                            {{ anonymousNameOrPortrait("name") }}
                        </p>
                        <p class="name" v-else>{{ resetDisplayName }}</p>
                    </template>

                    <div class="flex-column flex-align-start">
                        <div class="flex-row">
                            <MessageContentContainerView
                                class="message-content-container"
                                :class="{ highlight: highLight }"
                                :message="message"
                                @contextmenu.prevent.native="
                                    openMessageContextMenu($event, message)
                                "
                            />
                        </div>
                        <QuoteMessageView
                            style="padding: 5px 0; max-width: 100%"
                            v-if="quotedMessage"
                            :message="message"
                            :quoted-message="quotedMessage"
                            :enable-message-preview="true"
                            :message-digest="
                                message.messageContent.quoteInfo.messageDigest
                            "
                            :show-close-button="false"
                        />
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import UserCardView from "@/ui/main/user/UserCardView";
import MessageContentContainerView from "@/ui/main/conversation/message/MessageContentContainerView";
import QuoteMessageView from "@/ui/main/conversation/message/QuoteMessageView";
import store from "@/store";
import Config from "@/config";
import wfc from "../../../../wfc/client/wfc";
import ConversationInfo from "@/wfc/model/conversationInfo";
import ConversationType from "@/wfc/model/conversationType";
import ChannelCardView from "../../contact/ChannelCardView";
export default {
    name: "NormalInMessageContentView",
    props: {
        message: null,
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
        ChannelCardView,
        MessageContentContainerView,
        UserCardView,
        QuoteMessageView,
    },
    computed: {
        // quotedMessage() {
        //   if (this.message.messageContent.quoteInfo) {
        //     let messageUid = this.message.messageContent.quoteInfo.messageUid
        //     return store.getMessageByUid(messageUid)
        //   } else {
        //     return null
        //   }
        // },
        IsEn() {
            return this.$store.state.currentLanguage === "en";
        },
        isDownloading() {
            return store.isDownloadingMessage(this.message.messageUid);
        },
        resetDisplayName() {
            if (Config.TEAM_IDS.includes(this.message._from.uid)) {
                return this.mixinOfficialName(this.message._from.name);
            }
            const name = this.message._from.displayName;
            if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
                return this.mixinResetPhoneNumber(name);
            }
            return name;
        },
        // 群展示名称，单人聊天不用展示名称
        isShowName() {
            let currentType =
                this.sharedConversationState.currentConversationInfo
                    .conversationType;
            return currentType === ConversationType.Group;
        },
        isAnonymousGroup() {
            return (
                ConversationInfo &&
                ConversationInfo.anonymous_memberList &&
                ConversationInfo.anonymous_memberList.length
            );
        },
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
        console.log(this.message, "IN");
        // 如果是匿名群
    },

    methods: {
        onClickUserPortrait(userId) {
            if (this.message.conversation.type === ConversationType.Channel) {
                wfc.getChannelInfo(this.message.conversation.target, true);
            } else {
                wfc.getUserInfo(userId, true);
            }
        },
        closeUserCard() {
            this.$refs["userCardTippy"]._tippy.hide();
        },
        openMessageContextMenu(event, message) {
            if (this.sharedConversationState.enableMessageMultiSelection)
                return;
            this.$emit("openMessageContextMenu", event, message);
            this.highLight = true;
        },
        openMessageSenderContextMenu(event, message) {
            this.$emit("openMessageSenderContextMenu", event, message);
        },

        onContextMenuClosed() {
            this.highLight = false;
        },
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

    beforeUnmount() {
        this.$eventBus.$off("contextMenuClosed", this.onContextMenuClosed);
    },
};
</script>

<style lang="css" scoped>
.container {
    display: flex;
    align-items: flex-start;
}

.message-time-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px 20px;
    align-items: flex-start;
}

.message-time-container .time {
    align-self: center;
    margin-bottom: 20px;
    color: #b4b4b4;
    height: 20px;
    font-size: 10px;
}

.message-time-container.checked {
    background-color: #e7e7e7;
}

.message-avatar-content-container {
    display: flex;
    /*max-width: calc(100% - 44px);*/
    max-width: 72%;
    align-items: flex-start;
    overflow: hidden;
    /*max-height: 800px;*/
    text-overflow: ellipsis;
}

.avatar-container .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.avatar-container {
    display: flex;
    padding-left: 2px;
    align-items: center;
}

.avatar-container input {
    margin-right: 20px;
    flex: 1;
}

.message-name-content-container {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
}

.message-name-content-container .name {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-left: 10px;
    color: #bdbdbd;
    font-size: 12px;
    margin-bottom: 2px;
}

.message-content-container.highlight {
    /* background-color: #dadada; */
    opacity: 0.5;
    /* --in-arrow-color: #dadada !important; */
}
</style>
