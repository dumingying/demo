<template>
    <section>
        <div class="message-history-page">
            <div class="search-input-container">
                <div class="input-wrap">
                    <i class="search-icon"></i>
                    <input
                        id="searchInput"
                        ref="input"
                        autocomplete="off"
                        type="text"
                        v-model="query"
                        :placeholder="$t('common.search')"
                        @contextmenu.prevent="openMenu"
                    />
                    <svg
                        @click="clearQuery"
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
            <div v-if="!query" class="portal">
                <img
                    src="@/assets/images/default-bg.png"
                    alt=""
                    width="120"
                    draggable="false"
                />
            </div>
            <div
                v-else-if="conversationSearchResults.length > 0"
                class="search-result-container"
            >
                <div class="conversation-list">
                    <ul>
                        <li
                            v-for="result in conversationSearchResults"
                            @click="setCurrentConversationSearchResult(result)"
                            :key="
                                result.conversation.type +
                                result.conversation.target +
                                result.conversation.line
                            "
                        >
                            <div
                                class="conversation-item"
                                :class="{
                                    active: isConversationItemActive(result),
                                }"
                            >
                                <div class="header">
                                    <img
                                        class="avatar"
                                        draggable="false"
                                        :src="
                                            mixinDefaultPortrait(
                                                result._conversationInfo
                                                    .conversation._target
                                                    .portrait
                                            )
                                        "
                                    />
                                </div>
                                <div class="content-container">
                                    <p class="title single-line">
                                        {{ conversationTitle(result) }}
                                    </p>
                                    <p class="desc single-line">
                                        {{
                                            result.matchMessage
                                                ? result.matchMessage.messageContent.digest(
                                                      result.matchMessage
                                                  )
                                                : `${$t(
                                                      "conversation.message_records_count",
                                                      [result.matchCount]
                                                  )}`
                                        }}
                                    </p>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
                <div
                    class="conversation-message-list"
                    v-if="currentConversationSearchResult"
                >
                    <div class="desc-action-container" v-if="!currentMessage">
                        <p class="single-line desc" v-html="searchTitle"></p>
                        <div class="action" @click="openConversation">
                            {{ $t("conversation.enter_chat") }}
                            <Icon type="ios-arrow-forward" />
                        </div>
                    </div>
                    <div v-else class="desc-action-container">
                        <i
                            class="icon-ion-ios-arrow-back"
                            @click="currentMessage = null"
                            >&nbsp;{{ $t("common.back") }}</i
                        >
                    </div>
                    <div
                        class="message-list-container"
                        v-on:scroll="onScroll"
                        infinite-wrapper
                    >
                        <infinite-loading
                            v-if="currentMessage"
                            identifier="oldMessageLoader"
                            force-use-infinite-wrapper
                            direction="top"
                            @infinite="infiniteHandlerTop"
                        >
                            <template #no-more
                                >{{ $t("conversation.no_more_message") }}
                            </template>
                            <template #no-results>{{
                                $t("conversation.no_more_message")
                            }}</template>
                        </infinite-loading>
                        <ul>
                            <li
                                v-for="message in messages"
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
                                                :src="
                                                    setNameOrPortrait(message)
                                                "
                                            />
                                        </figure>
                                        <div class="name-content">
                                            <p class="name">
                                                {{
                                                    setNameOrPortrait(
                                                        message,
                                                        "name"
                                                    )
                                                }}
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
                                        <p class="time">
                                            {{ message._timeStr }}
                                        </p>
                                        <a
                                            v-if="!currentMessage"
                                            class="single-line action"
                                            @click="
                                                showContextMessages(message)
                                            "
                                            >{{
                                                $t("conversation.view_context")
                                            }}</a
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
            </div>
            <div v-else class="empty">
                <p>{{ $t("conversation.no_search_result") }}</p>
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
            :currentConversationInfo="currentConversationSearchResult"
        ></more-menu>
    </section>
</template>

<script>
import NotificationMessageContentView from "@/ui/main/conversation/message/NotificationMessageContentView";
import MessageContentContainerView from "./conversation/message/MessageContentContainerView";
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import ConversationType from "@/wfc/model/conversationType";
import RightClickMenu from "@/ui/common/rightClick/RightClickMenu";
import MoreMenu from "@/ui/common/MoreMenu";

import store from "../../store";
import InfiniteLoading from "@imndx/vue-infinite-loading";
import IpcSub from "../../ipc/ipcSub";
import { ipcRenderer } from "@/platform";
import Config from "@/config";
import { getGroupAnonymousWeb } from "@/axios";
export default {
    name: "MessageHistoryPage",
    data() {
        return {
            query: "",
            conversationSearchResults: [],
            currentConversationSearchResult: null,
            currentConversationMessages: [],
            currentMessage: null,
            contextMessages: [],
            isAnonymous: false,
        };
    },
    mounted() {
        document.title = this.$t("search.search_message_history");
        ipcRenderer.on("sendHistoryMessageWindowQuery", (e, args) => {
            this.query = args.query;
        });
    },
    methods: {
        async getAnonymous(result) {
            if (result && result.conversation.type == ConversationType.Group) {
                let res = await getGroupAnonymousWeb({
                    groupId: result.conversation.target,
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

        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
        resetInputText() {
            this.query = "";
        },
        openMessageContextMenu(event, msg) {
            this.$refs.moreMenuWrap.$refs.moreMenu.open(event, msg);
        },

        setCurrentConversationSearchResult(result) {
            this.currentConversationSearchResult = result;
            this.isAnonymous = false;
            this.getAnonymous(result);
            this.currentMessage = null;
        },

        isConversationItemActive(result) {
            return (
                this.currentConversationSearchResult &&
                this.currentConversationSearchResult.conversation.equal(
                    result.conversation
                )
            );
        },

        openConversation() {
            let conversation =
                this.currentConversationSearchResult.conversation;
            IpcSub.openConversation(conversation);
        },

        showContextMessages(message) {
            this.currentMessage = message;
            this.contextMessages = [message];
        },
        onScroll() {
            this.contextMenuClosed();
        },
        infiniteHandlerTop($state) {
            let firstMsg = this.contextMessages[0];
            let conversation =
                this.currentConversationSearchResult.conversation;
            store.getMessages(
                conversation,
                firstMsg.messageId,
                true,
                "",
                (msgs) => {
                    if (msgs.length > 0) {
                        this.contextMessages = msgs.concat(
                            this.contextMessages
                        );
                        $state.loaded();
                    } else {
                        $state.complete();
                    }
                }
            );
        },

        infiniteHandlerBottom($state) {
            let lastMsg = this.contextMessages[this.contextMessages.length - 1];
            let conversation =
                this.currentConversationSearchResult.conversation;
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
        contextMenuClosed() {
            this.$refs.moreMenuWrap.$refs.moreMenu &&
                this.$refs.moreMenuWrap.$refs.moreMenu.close();
        },
        removeMessage(message) {
            if (this.currentMessage) {
                this.contextMessages = this.contextMessages.filter((item) => {
                    return item.messageId !== message.messageId;
                });
            } else {
                this.currentConversationMessages =
                    this.currentConversationMessages.filter((item) => {
                        return item.messageId !== message.messageId;
                    });
            }
        },
        clearQuery() {
            this.query = "";
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
    watch: {
        query() {
            if (this.query) {
                this.conversationSearchResults = store.searchConversation(
                    this.query
                );
                this.currentConversationMessages = null;
                this.currentConversationSearchResult = null;
            } else {
                this.conversationSearchResults = [];
            }
        },
        currentConversationSearchResult() {
            if (this.currentConversationSearchResult) {
                this.currentConversationMessages = store.searchMessage(
                    this.currentConversationSearchResult.conversation,
                    this.query
                );
            } else {
                this.currentConversationMessages = null;
            }
        },
    },
    computed: {
        searchTitle() {
            return this.$t("conversation.search_result", [
                this.currentConversationSearchResult.matchCount,
                this.query,
            ]);
        },
        messages() {
            return this.currentMessage
                ? this.reduceList(this.contextMessages)
                : this.reduceList(this.currentConversationMessages);
        },
        conversationTitle() {
            return (result) => {
                let info = result._conversationInfo;
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
                    return name;
                } else {
                    return info.conversation._target.name;
                }
            };
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
    components: {
        NotificationMessageContentView,
        MessageContentContainerView,
        InfiniteLoading,
        MoreMenu,
        RightClickMenu,
    },
};
</script>

<style scoped>
.message-history-page {
    width: 100vw;
    height: 100vh;
    background: #f3f3f3;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.search-input-container {
    width: 100%;
    height: 100px;
    border-bottom: 1px solid #e4e4e4;
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
.portal {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f5f5f5;
}

.empty {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.search-result-container {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.conversation-list {
    width: 240px;
    height: 100%;
    overflow: scroll;
    border-right: 1px solid #e4e4e4;
    background: #fff;
}

.conversation-item {
    width: 100%;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
}

.conversation-item.active {
    background-color: #eceef4;
}

.header {
    height: 100%;
    padding: 10px;
    position: relative;
}

.header .avatar {
    position: relative;
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    background: #d6d6d6;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 50%;
}

.content-container {
    width: 100%;
    height: 50px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding-right: 12px;
}

.content-container .title {
    display: inline-block;
    font-size: 15px;
    color: #222222;
    font-style: normal;
    font-weight: normal;
    padding-right: 10px;
    flex: 1;
}

.content-container .desc {
    color: #666666;
    font-size: 12px;
}

.conversation-message-list {
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.conversation-message-list .desc-action-container {
    width: 100%;
    padding: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.desc-action-container .desc {
    color: #666666;
    font-size: 13px;
}
.desc-action-container .desc span {
    color: #1dbb88;
}

.desc-action-container .action {
    color: #262626;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
}

.message-list-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0 30px 20px;
    overflow-x: hidden;
    overflow-y: auto;
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
.message-list-container ul {
    width: 100%;
    flex: 1;
    list-style-position: inside;
}
.message-container {
    width: 100%;
    padding: 10px 0;
    display: flex;
    justify-content: space-between;
    position: relative;
}
.notification {
    width: 100%;
    text-align: center;
}
.message-container .info-container {
    display: flex;
    flex: 1;
}

.portrait-container {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    overflow: hidden;
    margin: 10px;
}
.portrait-container img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
}

.message-container .info-container .content {
    margin-left: -10px;
    margin-top: 10px;
}

.message-container .info-container p,
.time-action p {
    font-size: 12px;
    color: #bdbdbd;
}
.time-action {
    text-align: right;
}
.time-action .time {
    font-size: 11px;
    line-height: 20px;
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

:deep(.text-message-container.out) {
    background-color: #f3f3f3;
    padding-top: 0 !important;
    padding-left: 0 !important;
}
:deep(.audio-message-container.out) {
    align-items: flex-start;
}
:deep(.audio-message-container.out) .volume-wrap {
    justify-content: flex-start;
}
:deep(.audio-message-container.out) .volume-wrap i.normal {
    transform: rotate(180deg);
}
:deep(.text-message-container.out) .text {
    color: #050505;
}

:deep(.text-message-container) {
    background-color: #f3f3f3;
    padding-top: 0 !important;
    padding-left: 0 !important;
}

:deep(.rightarrow)::before {
    display: none;
}

:deep(.leftarrow)::before {
    display: none;
}
</style>
