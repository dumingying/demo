<template>
    <section
        class="search-result-container"
        v-if="sharedSearchState.show"
        v-bind:class="{ active: sharedSearchState.show }"
        v-v-on-click-outside="hideSearchView"
        @click="hideSearchView"
    >
        <div class="search-result">
            <ul>
                <!-- 搜索用户（新用户）-->
                <li
                    class="category-item"
                    v-if="sharedSearchState.userSearchResult.length > 0"
                >
                    <label>{{ $t("search.new_user") }}</label>
                    <ul>
                        <li
                            v-for="(user, index) in toShowUserList"
                            :key="index"
                        >
                            <div class="search-result-item contact">
                                {{ user.portrait }}
                                <img
                                    @error="mixinImgUrlAlt"
                                    :src="mixinDefaultPortrait(user.portrait)"
                                    draggable="false"
                                />
                                <span>{{ mixinGetUserName(user) }}</span>
                                <!-- <button @click.stop="addFriend(user)">{{ $t('common.add') }}</button> -->
                            </div>
                        </li>
                    </ul>
                    <div
                        v-if="
                            !shouldShowAllUser &&
                            this.sharedSearchState.userSearchResult.length > 5
                        "
                        class="show-all"
                        @click.stop="showAllUser"
                    >
                        {{
                            $t("search.view_all") +
                            this.sharedSearchState.contactSearchResult.length
                        }}
                    </div>
                </li>
                <!-- 搜索联系人 -->
                <li
                    class="category-item"
                    v-if="sharedSearchState.contactSearchResult.length > 0"
                >
                    <label>{{ $t("common.contact") }}</label>
                    <ul>
                        <li
                            v-for="(contact, index) in toShowContactList"
                            :key="index"
                        >
                            <div
                                class="search-result-item contact"
                                @click.stop="chatToContact(contact)"
                            >
                                <img
                                    @error="mixinImgUrlAlt"
                                    :src="
                                        mixinDefaultPortrait(contact.portrait)
                                    "
                                    draggable="false"
                                />
                                <span>{{ mixinGetUserName(contact) }}</span>
                            </div>
                        </li>
                    </ul>
                    <div
                        v-if="
                            !shouldShowAllContact &&
                            this.sharedSearchState.contactSearchResult.length >
                                5
                        "
                        class="show-all"
                        @click.stop="showAllContact"
                    >
                        {{
                            $t("search.view_all") +
                            this.sharedSearchState.contactSearchResult.length
                        }}
                    </div>
                </li>
                <!-- 搜索群组 -->
                <li
                    class="category-item"
                    v-if="sharedSearchState.groupSearchResult.length > 0"
                >
                    <label>{{ $t("contact.group") }}</label>
                    <ul>
                        <li
                            v-for="(group, index) in toShowGroupList"
                            :key="index"
                        >
                            <div
                                class="search-result-item group"
                                @click="chatToGroup(group)"
                            >
                                <img
                                    @error="mixinImgUrlAlt"
                                    :src="mixinDefaultPortrait(group.portrait)"
                                    draggable="false"
                                />
                                <span>{{ group.name }}</span>
                            </div>
                        </li>
                    </ul>
                    <div
                        v-if="
                            !shouldShowAllGroup &&
                            this.sharedSearchState.groupSearchResult.length > 5
                        "
                        class="show-all"
                        @click.stop="showAllGroup"
                    >
                        {{
                            $t("search.view_all") +
                            this.sharedSearchState.groupSearchResult.length
                        }}
                    </div>
                </li>
                <!-- 搜索公众号 -->
                <!-- <li class="category-item"
            v-if="sharedSearchState.channelSearchResult.length > 0">
          <label>{{ $t('contact.channel') }}</label>
          <ul>
            <li v-for="(channel, index) in toShowChannelList"
                :key="index">
              <div class="search-result-item group"
                   @click="chatToChannel(channel)">
                <img @error="mixinImgUrlAlt"
                     :src="mixinDefaultPortrait(channel.portrait)"
                     draggable="false" />
                <span>{{ channel.name }}</span>
              </div>
            </li>
          </ul>
          <div v-if="!shouldShowAllChannel && this.sharedSearchState.channelSearchResult.length > 5"
               class="show-all"
               @click.stop="showAllChannel">
            {{ $t('search.view_all') + this.sharedSearchState.channelSearchResult.length }}
          </div>
        </li> -->
                <!-- 历史聊天记录 入口 -->
                <li class="category-item" v-if="sharedMiscState.isElectron">
                    <label>{{ $t("search.message_history") }}</label>
                    <div
                        class="search-result-item message"
                        @click="showMessageHistoryPage"
                    >
                        <p>{{ $t("search.search_message_history") }}...</p>
                    </div>
                </li>
            </ul>
        </div>
    </section>
</template>

<script>
import { vOnClickOutside } from "@vueuse/components";
import store from "@/store";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";
import FriendRequestView from "@/ui/main/contact/FriendRequestView";
import IpcEventType from "../../../ipcEventType";
import { ipcRenderer } from "../../../platform";
import { getGroupAnonymousWeb, getGroupAnonymousMembersInfo } from "@/axios";
import ConversationInfo from "@/wfc/model/conversationInfo";
import wfc from "@/wfc/client/wfc";
export default {
    name: "SearchResultView",
    props: ["query"],
    data() {
        return {
            sharedSearchState: store.state.search,
            sharedMiscState: store.state.misc,
            shouldShowAllUser: false,
            shouldShowAllContact: false,
            shouldShowAllGroup: false,
            shouldShowAllChannel: false,
            lock: false,
            isContact: false,
        };
    },
    created() {
        this.isContact = this.$route.path === "/home/contact";
    },
    mounted() {
        this.$nextTick(function () {
            let searchResultItems =
                document.getElementsByClassName("search-result-item");
            if (searchResultItems && searchResultItems.length > 0) {
                searchResultItems[0].style.backgroundColor = "#eceef4";
            }
        });
        // do nothing
    },

    beforeUnmount() {
        store.setSearchQuery("");
    },

    watch: {
        $route(n, o) {
            // 当前是通讯录页面
            this.isContact = n.path === "/home/contact";
        },
        query() {
            console.log("searchView query changed:", this.query);
            store.setSearchQuery(this.query, this.isContact ? 1 : 0);
        },
    },

    methods: {
        isFriend(userId) {
            return wfc.isMyFriend(userId);
        },
        addFriend(user) {
            this.$modal.show(
                FriendRequestView,
                {
                    userInfo: user,
                },
                null,
                {
                    name: "friend-request-modal",
                    width: 600,
                    height: 250,
                    clickToClose: false,
                },
                {}
            );
        },
        showAllUser() {
            this.shouldShowAllUser = true;
        },
        showAllContact() {
            this.shouldShowAllContact = true;
        },

        showAllGroup() {
            this.shouldShowAllGroup = true;
        },
        showAllChannel() {
            this.shouldShowAllChannel = true;
        },

        hideSearchView(e) {
            console.log(e.target.id);
            if (e.target.id !== "searchInput") {
                store.toggleSearchView(false);
            }
        },

        chatToContact(contact) {
            if (this.$router.currentRoute.value.path !== "/home/conversation") {
                this.$router.replace("/home/conversation");
            }
            let conversation = new Conversation(
                ConversationType.Single,
                contact.uid,
                0
            );
            store.setCurrentConversation(conversation);
            store.toggleSearchView(false);
        },
        //   进群
        async chatToGroup(group) {
            if (this.lock) return;
            this.lock = true;
            let userId = wfc.getUserId();
            let groupId = group.target;
            try {
                let response = await getGroupAnonymousWeb({ userId, groupId });
                this.lock = false;
                const { code, message, data } = response.data;
                if (code === "000000") {
                    if (
                        this.$router.currentRoute.value.path !==
                        "/home/conversation"
                    ) {
                        this.$router.replace("/home/conversation");
                    }
                    let conversation = new Conversation(
                        ConversationType.Group,
                        group.target,
                        0
                    );
                    // data.anonymous == 1  是匿名群 ,data.anonymous: null 是普通群,  data:null 被解散的群
                    if (data && data.anonymous == 1) {
                        await getGroupAnonymousMembersInfo({ userId, groupId })
                            .then((res) => {
                                const { code, data, message } = res.data;
                                if (code == "000000") {
                                    ConversationInfo.anonymous_memberList =
                                        data.imGroupMembers;
                                    store.setCurrentConversation(conversation);
                                    store.setShouldAutoScrollToBottom(true); //自动滚动到最后
                                    store.toggleSearchView(false);
                                } else {
                                    this.$Message.error(message);
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                            });
                    } else {
                        ConversationInfo.anonymous_memberList = [];
                        store.setCurrentConversation(conversation);
                        store.setShouldAutoScrollToBottom(true); //自动滚动到最后
                        store.toggleSearchView(false);
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.lock = false;
                this.$Message.error(this.$t("common.error_later"));
                console.log(error);
            }
        },
        // 进公众号
        chatToChannel(channel) {
            let isSubscribed = wfc.isListenedChannel(channel.channelId);
            if (isSubscribed) {
                if (
                    this.$router.currentRoute.value.path !==
                    "/home/conversation"
                ) {
                    this.$router.replace("/home/conversation");
                }
                let conversation = new Conversation(
                    ConversationType.Channel,
                    channel.channelId,
                    0
                );
                store.setCurrentConversation(conversation);
                store.setShouldAutoScrollToBottom(true); //自动滚动到最后
                store.toggleSearchView(false);
            } else {
                store.setCurrentChannel(channel);
            }
        },
        showMessageHistoryPage() {
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(hash, "#/history/message");
            } else {
                url += "/history/message";
            }
            ipcRenderer.send(IpcEventType.showMessageHistoryPage, {
                url: url,
                query: this.query,
            });
            console.log(IpcEventType.showMessageHistoryPage, url);
        },
    },

    computed: {
        toShowUserList: function () {
            return !this.shouldShowAllUser &&
                this.sharedSearchState.userSearchResult.length > 5
                ? this.sharedSearchState.userSearchResult.slice(0, 4)
                : this.sharedSearchState.userSearchResult;
        },
        toShowContactList: function () {
            return !this.shouldShowAllContact &&
                this.sharedSearchState.contactSearchResult.length > 5
                ? this.sharedSearchState.contactSearchResult.slice(0, 4)
                : this.sharedSearchState.contactSearchResult;
        },
        toShowGroupList: function () {
            return !this.shouldShowAllGroup &&
                this.sharedSearchState.groupSearchResult.length > 5
                ? this.sharedSearchState.groupSearchResult.slice(0, 4)
                : this.sharedSearchState.groupSearchResult;
        },
        toShowChannelList: function () {
            return !this.shouldShowAllChannel &&
                this.sharedSearchState.channelSearchResult.length > 5
                ? this.sharedSearchState.channelSearchResult.slice(0, 4)
                : this.sharedSearchState.channelSearchResult;
        },
    },

    directives: {
        vOnClickOutside,
    },
};
</script>

<style lang="css" scoped>
.search-result-container {
    display: none;
}

.search-result-container.active {
    display: block;
    z-index: 100;
    overflow: auto;
    /*background-color: red;*/
    background-color: #f3f3f3e5;
}

.search-result-container ul {
    list-style: none;
    background-color: white;
}

.category-item label {
    color: #b2b2b2;
    display: block;
    padding-top: 10px;
    padding-bottom: 2px;
    margin-left: 12px;
    border-bottom: 1px solid #eeeeee;
}

.search-result-item {
    background-color: #fff;
    padding: 10px 12px;
}

.search-result-item:active {
    background-color: #eceef4;
}

.search-result-item.contact {
    width: 100%;
    display: flex;
    align-items: center;
}

.search-result-item.contact img,
.search-result-item.group img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.search-result-item.contact span {
    font-size: 14px;
    padding-left: 10px;
}

.search-result-item.contact button {
    margin-left: auto;
    padding: 3px 10px;
    border-radius: 3px;
    border: 1px solid #cccccc;
    outline: none;
}

.search-result-item.contact button:active {
    background: #cccccc;
}

.search-result-item.group {
    width: 100%;
    display: flex;
    align-items: center;
}

.search-result-item.group span {
    font-size: 14px;
    padding-left: 10px;
}

.search-result-item.message {
    height: 54px;
    display: flex;
    align-items: center;
}

.show-all {
    padding: 10px 12px;
    color: #66789d;
    font-size: 12px;
}
</style>
