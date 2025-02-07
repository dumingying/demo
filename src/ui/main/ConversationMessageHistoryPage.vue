<template>
    <section>
        <div v-if="conversationInfo" class="conversation-message-history-page">
            <div class="search-input-container">
                <div class="input-wrap">
                    <i class="search-icon"></i>
                    <input
                        id="searchInput"
                        ref="input"
                        autocomplete="off"
                        type="text"
                        v-model="query"
                        @keydown.esc="resetInputText"
                        :placeholder="$t('common.search')"
                        @contextmenu.prevent="openMenu"
                    />
                    <svg
                        @click="resetInputText"
                        v-if="query"
                        t="1692249936579"
                        class="icon clear-icon"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="5023"
                        width="20"
                        height="20"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                    >
                        <path
                            d="M85.333333 512C85.333333 276.053333 276.053333 85.333333 512 85.333333s426.666667 190.72 426.666667 426.666667-190.72 426.666667-426.666667 426.666667S85.333333 747.946667 85.333333 512z m254.72 126.72l45.226667 45.226667L512 557.226667l126.72 126.72 45.226667-45.226667L557.226667 512l126.72-126.72-45.226667-45.226667L512 466.773333 385.28 340.053333 340.053333 385.28 466.773333 512l-126.72 126.72z"
                            fill="#b5b9c3"
                            p-id="5024"
                        ></path>
                    </svg>
                </div>
            </div>
            <div class="category-container">
                <div
                    class="category-item"
                    v-bind:class="{ active: category === 'all' }"
                    @click="setCurrentCategory('all')"
                >
                    {{ $t("common.all") }}
                </div>
                <div
                    class="category-item"
                    v-bind:class="{ active: category === 'file' }"
                    @click="setCurrentCategory('file')"
                >
                    {{ $t("fav.file") }}
                </div>
                <div
                    class="category-item"
                    v-bind:class="{ active: category === 'media' }"
                    @click="setCurrentCategory('media')"
                >
                    {{ $t("conversation.pictures_videos") }}
                </div>
                <div
                    class="category-item"
                    v-bind:class="{ active: category === 'link' }"
                    @click="setCurrentCategory('link')"
                >
                    {{ $t("common.link") }}
                </div>
            </div>
            <div v-if="currentMessage" class="desc-action-container">
                <i
                    class="icon-ion-ios-arrow-back"
                    @click="currentMessage = null"
                    >&nbsp;{{ $t("common.back") }}</i
                >
            </div>
            <div
                ref="conversationMessageList"
                class="message-list-container"
                :scroll="onScroll"
                infinite-wrapper
            >
                <infinite-loading
                    ref="infiniteLoader"
                    :identifier="'historyMessageLoader-' + category"
                    force-use-infinite-wrapper
                    direction="top"
                    @infinite="infiniteHandler"
                >
                    <template #no-more>{{
                        $t("conversation.no_more_message")
                    }}</template>
                    <template #no-results>{{
                        $t("conversation.no_more_message")
                    }}</template>
                </infinite-loading>
                <ul>
                    <li
                        v-for="message in filteredMessages"
                        :key="message.uid"
                        class="message-container"
                    >
                        <template v-if="isNotificationMessage(message)">
                            <div class="notification">
                                <NotificationMessageContentView
                                    :message="message"
                                />
                            </div>
                        </template>
                        <template v-else>
                            <div class="info-container">
                                <figure class="portrait-container">
                                    <img
                                        draggable="false"
                                        :src="setNameOrPortrait(message)"
                                    />
                                </figure>
                                <div class="name-content-container">
                                    <p class="name">
                                        {{ setNameOrPortrait(message, "name") }}
                                    </p>
                                    <div class="content">
                                        <MessageContentContainerView
                                            :message="message"
                                            @contextmenu.prevent.native="
                                                openMessageContextMenu(
                                                    $event,
                                                    message
                                                )
                                            "
                                        />
                                    </div>
                                </div>
                            </div>
                            <div class="time-action">
                                <p class="time">{{ message._timeStr }}</p>
                                <a
                                    v-if="!currentMessage"
                                    class="single-line action"
                                    @click="showContextMessages(message)"
                                    >{{ $t("conversation.view_context") }}</a
                                >
                            </div>
                        </template>
                    </li>
                </ul>
                <infinite-loading
                    v-if="currentMessage"
                    identifier="newMessageLoader"
                    force-use-infinite-wrapper
                    direction="bottom"
                    @infinite="infiniteHandlerBottom"
                >
                    <template #no-more>{{
                        $t("conversation.no_more_message")
                    }}</template>
                    <template #no-results>{{
                        $t("conversation.no_more_message")
                    }}</template>
                </infinite-loading>
            </div>
        </div>
        <!-- 搜索框 右击更多~ -->
        <right-click-menu
            ref="menuComponent"
            :inputText="query"
            @resetInputText="resetInputText"
        ></right-click-menu>
        <more-menu
            ref="moreMenuWrap"
            @removeMessage="removeMessage"
            @contextMenuClosed="contextMenuClosed"
            :currentConversationInfo="conversationInfo"
        ></more-menu>
        <div class="drag-area" />
    </section>
</template>

<script>
import NotificationMessageContentView from "@/ui/main/conversation/message/NotificationMessageContentView";
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import MessageContentContainerView from "./conversation/message/MessageContentContainerView";
import MessageContentType from "@/wfc/messages/messageContentType";
import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";

import RightClickMenu from "@/ui/common/rightClick/RightClickMenu";
import MoreMenu from "@/ui/common/MoreMenu";

import InfiniteLoading from "@imndx/vue-infinite-loading";
import { getGroupAnonymousWeb } from "@/axios";
import store from "../../store";
import Config from "@/config";

export default {
    name: "ConversationMessageHistoryPage",

    data() {
        return {
            query: "",
            messages: [],
            filesMessages: [],
            mediaMessages: [],
            linkMessages: [],
            searchResults: [],
            conversationInfo: null,
            autoScrollToBottom: true,
            category: "all",
            currentMessage: null,
            contextMessages: [],
            isAnonymous: false,
        };
    },

    mounted() {
        let params = new URLSearchParams(window.location.hash.split("?")[1]);
        let type = Number(params.get("type"));
        let target = params.get("target");
        let line = Number(params.get("line"));
        this.conversationInfo = store.getConversationInfo(
            new Conversation(type, target, line)
        );
        this.conversationTitle();
        this.getAnonymous();
    },

    updated() {
        if (this.autoScrollToBottom) {
            this.autoScrollToBottom = false;
            let messageListElement = this.$refs["conversationMessageList"];
            messageListElement &&
                messageListElement.scroll({
                    top: messageListElement.scrollHeight,
                    left: 0,
                    behavior: "auto",
                });
        }
    },

    methods: {
        conversationTitle() {
            let info = this.conversationInfo;
            if (info) {
                if (info.conversationType === ConversationType.Single) {
                    let name = this.mixinGetUserName(info.conversation._target);
                    // 针对通付盾团队 名称需要特殊处理一下
                    if (
                        Config.TEAM_IDS.includes(info.conversation._target.uid)
                    ) {
                        return this.mixinOfficialName(
                            info.conversation._target.name
                        );
                    }
                    document.title = `${this.$t(
                        "conversation.user_message_records",
                        [name]
                    )}`;
                } else {
                    document.title = `${this.$t(
                        "conversation.user_message_records",
                        [info.conversation._target.name]
                    )}(${info.conversation._target.memberCount})`;
                }
            }
        },
        async getAnonymous() {
            let { conversation } = this.conversationInfo;
            if (conversation.type == ConversationType.Group) {
                let res = await getGroupAnonymousWeb({
                    groupId: conversation.target,
                });
                let { data } = res.data;
                if (data && data.anonymous == 1) {
                    this.isAnonymous = true;
                }
            }
        },
        isNotificationMessage(message) {
            return (
                message &&
                message.messageContent instanceof NotificationMessageContent
            );
        },
        infiniteHandler($state) {
            if (this.currentMessage) {
                let firstMsg = this.contextMessages[0];
                let conversation = this.conversationInfo.conversation;
                store.getMessages(
                    conversation,
                    firstMsg.messageId,
                    true,
                    "",
                    (msgs) => {
                        console.log(msgs, "infiniteHandler");
                        if (msgs && msgs.length > 0) {
                            this.contextMessages = msgs.concat(
                                this.contextMessages
                            );
                            $state.loaded();
                        } else {
                            $state.complete();
                        }
                    }
                );
                return;
            }
            if (this.query) {
                let contentTypes = this.categoryContentTypes();
                let tmp = store.searchMessageInTypes(
                    this.conversationInfo.conversation,
                    contentTypes,
                    this.query,
                    this.searchResults.length
                );
                console.log(
                    "to search",
                    this.category,
                    this.query,
                    this.searchResults.length,
                    tmp.length
                );
                if (tmp.length === 0) {
                    $state.complete();
                } else {
                    this.searchResults.push(...tmp);
                    $state.loaded();
                }
            } else {
                console.log("to load conversation message", this.category);
                let timestamp;
                let targetMsgs;
                let contentTypes = [];
                switch (this.category) {
                    case "all":
                        targetMsgs = this.messages;
                        break;
                    case "file":
                        targetMsgs = this.filesMessages;
                        contentTypes = [MessageContentType.File];
                        break;
                    case "media":
                        targetMsgs = this.mediaMessages;
                        contentTypes = [
                            MessageContentType.Image,
                            MessageContentType.Video,
                        ];
                        break;
                    case "link":
                        targetMsgs = this.linkMessages;
                        contentTypes = [
                            MessageContentType.Link,
                            MessageContentType.URL_Message_Content,
                        ];
                        break;
                    default:
                        break;
                }
                timestamp = targetMsgs.length > 0 ? targetMsgs[0].timestamp : 0;
                store.getMessageInTypes(
                    this.conversationInfo.conversation,
                    contentTypes,
                    timestamp,
                    true,
                    "",
                    (msgs) => {
                        if (msgs && msgs.length > 0) {
                            targetMsgs.unshift(...msgs);
                            $state.loaded();
                        } else {
                            $state.complete();
                        }
                    }
                );
            }
        },
        infiniteHandlerBottom($state) {
            let lastMsg = this.contextMessages[this.contextMessages.length - 1];
            let conversation = this.conversationInfo.conversation;
            store.getMessages(
                conversation,
                lastMsg.messageId,
                false,
                "",
                (msgs) => {
                    if (msgs.length > 0) {
                        this.contextMessages =
                            this.contextMessages.concat(msgs);
                        $state.loaded();
                    } else {
                        $state.complete();
                    }
                }
            );
        },
        setCurrentCategory(category) {
            this.category = category;
            this.autoScrollToBottom = true;
            this.currentMessage = null;
            this.contextMessages = [];
        },
        resetInputText() {
            this.query = "";
        },
        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
        openMessageContextMenu(event, msg) {
            this.$refs.moreMenuWrap.$refs.moreMenu.open(event, msg);
        },

        categoryContentTypes() {
            let contentTypes = [];
            switch (this.category) {
                case "file":
                    contentTypes = [MessageContentType.File];
                    break;
                case "media":
                    contentTypes = [
                        MessageContentType.Video,
                        MessageContentType.Image,
                    ];
                    break;
                case "link":
                    contentTypes = [
                        MessageContentType.Link,
                        MessageContentType.URL_Message_Content,
                    ];
                    break;
                default:
                    break;
            }
            return contentTypes;
        },

        showContextMessages(message) {
            this.currentMessage = message;
            this.contextMessages = [message];
            this.autoScrollToBottom = false;
        },
        onScroll() {
            this.contextMenuClosed();
        },
        contextMenuClosed() {
            this.$refs.moreMenuWrap.$refs.moreMenu &&
                this.$refs.moreMenuWrap.$refs.moreMenu.close();
        },
        removeMessage(message) {
            if (this.currentMessage) {
                this.contextMessages = this.contextMessages.filter((item) => {
                    return item.messageId !== message.messageId;
                });
                return;
            }

            if (this.query && this.searchResults) {
                this.searchResults = this.searchResults.filter((item) => {
                    return item.messageId !== message.messageId;
                });
                return;
            }
            switch (this.category) {
                case "file":
                    this.filesMessages = this.filesMessages.filter((item) => {
                        return item.messageId !== message.messageId;
                    });
                    break;
                case "media":
                    this.mediaMessages = this.mediaMessages.filter((item) => {
                        return item.messageId !== message.messageId;
                    });
                    break;
                case "link":
                    this.linkMessages = this.linkMessages.filter((item) => {
                        return item.messageId !== message.messageId;
                    });
                    break;
                default:
                    this.messages = this.messages.filter((item) => {
                        return item.messageId !== message.messageId;
                    });
                    break;
            }
        },
        //去重
        reduceList(list) {
            let obj = {};
            return list.reduce((current, next) => {
                obj[next.messageId]
                    ? ""
                    : (obj[next.messageId] = true && current.push(next));
                return current;
            }, []);
        },
    },

    computed: {
        currentLanguage() {
            return this.$store.state.currentLanguage;
        },
        filteredMessages() {
            if (this.currentMessage) {
                return this.reduceList(this.contextMessages);
            }
            if (this.query && this.searchResults) {
                return this.reduceList(this.searchResults);
            }
            let msgs;
            switch (this.category) {
                case "file":
                    msgs = this.filesMessages;
                    break;
                case "media":
                    msgs = this.mediaMessages;
                    break;
                case "link":
                    msgs = this.linkMessages;
                    break;
                default:
                    msgs = this.messages;
                    break;
            }
            return this.reduceList(msgs);
        },
        setNameOrPortrait() {
            return (message, type) => {
                if (this.isAnonymous) {
                    if (message.content.extra) {
                        let extra = JSON.parse(message.content.extra);
                        if (
                            extra.hasOwnProperty("anonymous_name") &&
                            extra.hasOwnProperty("portrait")
                        ) {
                            if (type === "name") {
                                return extra.anonymous_name;
                            }
                            if (extra.portrait) {
                                if (extra.portrait.startsWith("http")) {
                                    return extra.portrait;
                                } else {
                                    return `${Config.STATIC_SERVER}/im-fs${extra.portrait}`;
                                }
                            } else {
                                return Config.DEFAULT_PORTRAIT_URL;
                            }
                        }
                    }
                } else {
                    if (type === "name") {
                        return this.mixinGetUserName(message._from);
                    } else {
                        return this.mixinDefaultPortrait(
                            message._from.portrait
                        );
                    }
                }
            };
        },
    },

    watch: {
        query() {
            if (this.query) {
                this.$refs.infiniteLoader.stateChanger.reset();
                let contentTypes = this.categoryContentTypes();
                this.searchResults = store.searchMessageInTypes(
                    this.conversationInfo.conversation,
                    contentTypes,
                    this.query,
                    0
                );
            } else {
                this.searchResults = [];
            }
        },
        category() {
            if (this.query) {
                let contentTypes = this.categoryContentTypes();
                this.searchResults = store.searchMessageInTypes(
                    this.conversationInfo.conversation,
                    contentTypes,
                    this.query,
                    0
                );
            }
        },
    },

    components: {
        NotificationMessageContentView,
        MessageContentContainerView,
        InfiniteLoading,
        MoreMenu,
        RightClickMenu,
    },
};
</script>

<style scoped lang="css">
.conversation-message-history-page {
    width: 100vw;
    height: 100vh;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.title-container {
    width: 100%;
    padding: 10px 40px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.title-container p {
    margin: 0 auto;
    line-height: 24px;
    font-size: 12px;
}
.drag-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    z-index: -1;
    -webkit-app-region: drag;
}

.title-container .portrait-container {
    width: 60px;
    height: 60px;
    margin-right: 20px;
    border-radius: 50%;
    background: #e0e0e0;
}

.search-input-container {
    width: 100%;
    height: 100px;
    background: #fff;
}
.search-input-container .input-wrap {
    margin: 40px 60px 26px;
    position: relative;
    height: 32px;
}
.search-input-container input {
    width: 100%;
    box-sizing: border-box;
    height: 30px;
    border-radius: 5px;
    padding: 0 24px;
    border: none;
    outline: none;
    background: #f5f6f9;
    font-family: "PingFang SC";
    font-size: 12px;
    line-height: 24px;
    color: #000;
    border: 1px solid #f5f6f9;
}

.search-input-container input:active {
    border: 1px solid #1dbb88;
}

.search-input-container input:focus {
    border: 1px solid #1dbb88;
}

.search-input-container .search-icon {
    position: absolute;
    left: 5px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    background: url(../../assets/images/search-icon.png) no-repeat center;
    background-size: 100%;
}
.search-input-container .clear-icon {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
}

.category-container {
    display: flex;
    padding: 15px 0;
    border-bottom: 1px solid #e0e0e0;
    flex-direction: row;
    justify-content: space-around;
}
.category-item {
    font-weight: bold;
}
.category-item.active {
    color: #1dbb88;
}

.message-list-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0 40px 20px 40px;
    overflow-x: hidden;
    overflow-y: auto;
    background: #f3f3f3;
}

.message-list-container ul {
    width: 100%;
    flex: 1;
    /*list-style-position: inside;*/
}

.message-list-container ul .message-container {
    width: 100%;
    display: flex;
    position: relative;
    padding: 10px 0;
}

.desc-action-container {
    width: 100%;
    padding: 20px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    line-height: 24px;
}

.message-list-container ul li:not(:last-child)::after {
    content: "";
    width: calc(100% - 55px);
    position: absolute;
    bottom: 0;
    margin-left: 55px;
    padding: 5px 0;
    border-bottom: 1px solid #ecebeb;
}
.notification {
    width: 100%;
    text-align: center;
}
.message-container .info-container {
    display: flex;
    flex: 1;
}

.name-content-container p,
.time-action p {
    font-size: 12px;
    color: #bdbdbd;
}

.name-content-container .content {
    margin-left: -10px;
    margin-top: 10px;
}
.time-action {
    text-align: right;
}
.time-action .action {
    display: none;
    font-size: 12px;
    color: #1753cc;
    line-height: 24px;
}

.message-container:hover .action {
    display: inline-block;
}

.portrait-container {
    width: 40px;
    height: 40px;
    min-width: 40px;
    overflow: hidden;
    margin: 10px;
    border-radius: 50%;
}

.portrait-container img {
    width: 100%;
    height: 100%;
    border-radius: 3px;
}

:deep(.text-message-container.out) {
    background-color: #f3f3f3;
    padding-top: 0 !important;
}
:deep(.text-message-container.out) .text {
    color: #050505;
}

:deep(.text-message-container) {
    background-color: #f3f3f3;
    padding-top: 0 !important;
}

:deep(.rightarrow)::before {
    display: none;
}

:deep(.leftarrow)::before {
    display: none;
}
</style>
