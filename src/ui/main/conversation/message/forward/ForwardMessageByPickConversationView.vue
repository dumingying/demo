<template>
    <div class="pick-conversation-container">
        <section class="conversation-list-panel">
            <div class="input-container">
                <input
                    type="text"
                    :placeholder="$t('common.search')"
                    v-model="query"
                />
            </div>
            <section class="conversation-list-container">
                <div
                    class="create-group"
                    @click="showForwardByCreateConversationModal"
                >
                    <p>{{ $t("conversation.create_new_chat") }}</p>
                </div>
                <p>{{ $t("conversation.recent_conversation") }}</p>
                <ul class="conversation-list" v-if="conversationInfos.length">
                    <li
                        :key="index"
                        v-for="(conversationInfo, index) in conversationInfos"
                    >
                        <div
                            class="conversation-item"
                            @click.stop="
                                onConversationItemClick(
                                    conversationInfo.conversation
                                )
                            "
                        >
                            <label class="checkbox-wrap">
                                <input
                                    class="checkbox"
                                    v-bind:value="conversationInfo.conversation"
                                    type="checkbox"
                                    v-model="sharedPickState.conversations"
                                    placeholder=""
                                />
                                <span></span>
                            </label>
                            <div class="header">
                                <img
                                    class="avatar"
                                    @error="mixinImgUrlAlt"
                                    draggable="false"
                                    :src="
                                        mixinDefaultPortrait(
                                            conversationInfo.conversation
                                                ._target.portrait
                                        )
                                    "
                                />
                            </div>
                            <p class="title new-single-line">
                                {{
                                    conversationTitle(
                                        conversationInfo.conversation._target
                                    )
                                }}
                            </p>
                        </div>
                    </li>
                </ul>
            </section>
        </section>
        <section class="checked-conversation-list-container">
            <header>
                <h2>{{ $t("conversation.forward_title") }}</h2>
                <span v-if="sharedPickState.conversations.length === 0">{{
                    $t("conversation.not_select_conversation")
                }}</span>
                <span v-else>{{
                    $t("conversation.select_conversation_desc", [
                        this.sharedPickState.conversations.length,
                    ])
                }}</span>
            </header>
            <div class="content">
                <div
                    class="picked-user-container"
                    v-for="(
                        conversation, index
                    ) in sharedPickState.conversations"
                    :key="index"
                >
                    <div class="picked-user">
                        <img
                            class="avatar"
                            @error="mixinImgUrlAlt"
                            draggable="false"
                            :src="
                                mixinDefaultPortrait(
                                    conversation._target.portrait
                                )
                            "
                        />
                        <button
                            @click="unpConversation(conversation)"
                            class="unpick-button"
                        >
                            <Icon type="md-close" />
                        </button>
                    </div>
                    <span class="name new-single-line">{{
                        conversationTitle(conversation._target)
                    }}</span>
                </div>
            </div>
            <ForwardMessageView
                ref="forwardMessageView"
                v-if="sharedPickState.conversations.length > 0"
                :forward-type="forwardType"
                :forward-from="forwardFrom"
                :messages="messages"
            />
            <footer>
                <button @click="cancel" class="cancel">
                    {{ $t("common.cancel") }}
                </button>
                <button
                    @click="confirm"
                    :class="[
                        'confirm',
                        !sharedPickState.conversations.length ? 'disabled' : '',
                    ]"
                >
                    {{ $t("common.send") }}
                </button>
            </footer>
        </section>
    </div>
</template>

<script>
import ForwardMessageView from "@/ui/main/conversation/message/forward/ForwardMessageView";
import ConversationType from "@/wfc/model/conversationType";

import { getGroupAnonymousWeb, getGroupInfos } from "@/axios";

import wfc from "@/wfc/client/wfc";
import Config from "@/config";
import store from "@/store";

export default {
    name: "ForwardMessageByPickConversationView",
    props: {
        forwardType: {
            // 可参考ForwardType
            type: Number,
            required: false,
        },
        messages: {
            type: Array,
            required: true,
        },
        forwardFrom: {
            type: String,
            required: false,
        },
        forwardFilterAnonymous: {
            type: Boolean,
            required: false,
        },
    },
    data() {
        return {
            sharedConversation: store.state.conversation,
            sharedPickState: store.state.pick,
            query: "",
            sharedSearchState: store.state.search,
            conversationInfoList: [],
        };
    },
    created() {
        this.filterAnonymousGroup();
    },
    mounted() {
        // console.log(
        //   'sharedConversation.conversationInfoList',
        //   this.sharedConversation.conversationInfoList
        // )
    },
    methods: {
        async onConversationItemClick(conversation) {
            store.pickOrUnpickConversation(conversation, true);
            // 针对群组进行下一步判断
            if (
                conversation.conversationType === ConversationType.Group &&
                (this.messages[0].messageContent.type == 408 ||
                    this.forwardFilterAnonymous)
            ) {
                try {
                    let res = await getGroupAnonymousWeb({
                        userId: wfc.getUserId(),
                        groupId: conversation.target,
                    });
                    let { data } = res.data;
                    if (data.anonymous == 1) {
                        this.sharedPickState.conversations.map(
                            (item, index) => {
                                if (item.target == conversation.target) {
                                    this.sharedPickState.conversations.splice(
                                        index,
                                        1
                                    );
                                    this.$Message.warning(
                                        this.$t(
                                            "conversation.not_share_anonymous"
                                        )
                                    );
                                }
                            }
                        );
                    }
                } catch (error) {}
            }
        },
        unpConversation(conversation) {
            store.pickOrUnpickConversation(conversation, false);
        },

        showForwardByCreateConversationModal() {
            this.sharedPickState.conversations.length = 0;
            this.$modal.hide("forward-by-pick-conversation-modal", {
                toCreateConversation: true,
                forwardType: this.forwardType,
                messages: this.messages,
            });
        },

        cancel() {
            this.sharedPickState.conversations.length = 0;
            this.$modal.hide("forward-by-pick-conversation-modal", {
                confirm: false,
            });
        },

        confirm() {
            let pickedConversations = [...this.sharedPickState.conversations];
            if (!pickedConversations.length) return;
            //   console.log('pickedConversations', pickedConversations)
            let extraMessageText =
                (this.$refs["forwardMessageView"] &&
                    this.$refs["forwardMessageView"].extraMessageText) ||
                "";
            this.sharedPickState.conversations.length = 0;
            this.$modal.hide("forward-by-pick-conversation-modal", {
                confirm: true,
                conversations: pickedConversations,
                forwardType: this.forwardType,
                messages: this.messages,
                extraMessageText,
            });
        },
        // 过滤一掉匿名群，会议消息，聊天内转发暂不支持分享到匿名群
        async filterAnonymousGroup() {
            try {
                this.conversationInfoList =
                    this.sharedConversation.conversationInfoList;
                if (this.forwardFilterAnonymous) {
                    let groupIds = this.conversationInfoList
                        .filter((item) => {
                            return (
                                item.conversationType === ConversationType.Group
                            );
                        })
                        .map((item) => item.target);
                    let isAnonymousGroupIds = [];
                    if (!groupIds.length) return;
                    let res = await getGroupInfos({
                        userId: wfc.getUserId(),
                        groupIds: groupIds,
                    });
                    let { data, code } = res.data;
                    if (code === "000000") {
                        isAnonymousGroupIds = data.map((el) => el.groupId);
                    }
                    if (!isAnonymousGroupIds.length) return;
                    this.conversationInfoList =
                        this.sharedConversation.conversationInfoList.filter(
                            (item) => !isAnonymousGroupIds.includes(item.target)
                        );
                }
            } catch (error) {
                console.log(error);
            }
        },
    },

    computed: {
        currentLanguage() {
            return this.$store.state.currentLanguage;
        },
        conversationInfos() {
            if (this.query && this.query.trim()) {
                return store.filterConversation(this.query);
            } else {
                return this.conversationInfoList;
            }
        },
        conversationTitle() {
            return (target) => {
                let name = target._displayName;
                // 处理异常显示名称问题<88ee>
                const reg = /^<(?![^a-zA-Z]+$)(?!\D+$)/;
                if (name.length >= 34 && reg.test(name)) {
                    return this.mixinResetPhoneNumber(target.mobile);
                }
                //  _displayName 是手机号的处理为脱敏
                if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
                    return this.mixinResetPhoneNumber(name);
                }
                // 针对通付盾团队,针对会议助手 名称需要特殊处理一下
                if (Config.TEAM_IDS.includes(target.uid)) {
                    return this.mixinOfficialName(target.name);
                }
                return name;
            };
        },
    },

    components: { ForwardMessageView },
};
</script>

<style lang="less" scoped>
.pick-conversation-container {
    display: flex;
    height: 100%;
    width: 100%;
}

.conversation-list-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background-color: #f7f7f7;
    width: 200px;
}

.conversation-list-panel .input-container {
    display: flex;
    width: 100%;
}

.conversation-list-panel .input-container input {
    height: 25px;
    margin: 15px 20px 0 15px;
    flex: 1;
    border-radius: 3px;
    border: 1px solid #ededed;
    background-color: white;
    padding-left: 10px;
    text-align: left;
}

.conversation-list-panel .create-group {
    background-color: #f7f7f7;
    height: 40px;
    font-size: 13px;
    padding-left: 15px;
    display: flex;
    align-items: center;
}

.conversation-list-panel .create-group:active {
    background-color: #e5e5e5;
}

.conversation-list-container {
    overflow: auto;
}

.conversation-list-container > p {
    position: sticky;
    background-color: #f7f7f7;
    height: 30px;
    line-height: 30px;
    font-size: 12px;
    color: #888888;
    z-index: 1;
    top: 0;
    padding-left: 15px;
}

.conversation-item {
    width: 100%;
    height: 70px;
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid #eeeeee;
    align-items: center;
    justify-content: flex-start;
    padding-left: 15px;
}

.conversation-item:active {
    background-color: #d6d6d6;
}

.conversation-item .header {
    height: 100%;
    padding: 0 5px;
}

.conversation-item .header .avatar {
    position: relative;
    width: 40px;
    height: 40px;
    display: inline-block;
    top: 50%;
    background: #d6d6d6;
    transform: translateY(-50%);
    border-radius: 50%;
}

.conversation-item .title {
    flex: 1;
    font-size: 14px;
    color: #262626;
    font-style: normal;
    font-weight: normal;
    padding-right: 10px;
}

.checkbox-wrap {
    margin-left: 10px;
    width: 18px;
    height: 18px;
    position: relative;
    .checkbox {
        width: 18px;
        height: 18px;
        border: none;
        top: 0;
        opacity: 0;
        position: absolute;
        right: 0;
        z-index: 1;
    }
    .checkbox + span {
        position: absolute;
        width: 18px;
        height: 18px;
        z-index: 0;
        top: 0;
        right: 0;
        border: 1px solid #ccc;
        border-radius: 50%;
        overflow: hidden;
    }
    .checkbox:checked + span {
        border: 0;
        background: #1dbb88 url(../../../../../assets/images/ok-icon.png)
            no-repeat center center;
        background-size: 10px auto;
    }
}

.checked-conversation-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.checked-conversation-list-container header {
    height: 55px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.checked-conversation-list-container header h2 {
    font-size: 16px;
    font-weight: normal;
    margin-left: 30px;
}

.checked-conversation-list-container header span {
    font-size: 12px;
    margin-right: 20px;
}

.checked-conversation-list-container .content {
    height: 100%;
    flex: 1;
    display: flex;
    padding: 0 30px;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    align-content: flex-start;
    overflow: auto;
}

.checked-conversation-list-container .content .picked-user-container {
    width: 33%;
    display: flex;
    flex-direction: column;
    column-count: 1;
    justify-content: center;
    align-content: center;
    padding: 5px 10px;
}

.checked-conversation-list-container .content .picked-user-container .name {
    width: 100%;
    font-size: 12px;
}

.checked-conversation-list-container
    .content
    .picked-user-container
    .picked-user {
    position: relative;
    height: 65px;
    width: 65px;
}

.checked-conversation-list-container .content .avatar {
    width: 45px;
    height: 45px;
    margin: 10px 10px;
    display: inline-block;
    background: #d6d6d6;
    border-radius: 3px;
}

.checked-conversation-list-container .content .unpick-button {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    top: 0;
    right: 0;
}

.checked-conversation-list-container .content .unpick-button:active {
    background-color: #e5e5e5;
}

.checked-conversation-list-container footer {
    height: 55px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 10px;
}

.checked-conversation-list-container footer button {
    padding: 5px 30px;
    border-radius: 4px;
    border: 1px solid #cccccc;
}

.checked-conversation-list-container footer button.confirm {
    background-color: #20bf64;
    margin-left: 20px;
    margin-right: 20px;
    color: #fff;
    border-color: #20bf64;
    opacity: 1;
}
.checked-conversation-list-container footer button.confirm.disabled {
    opacity: 0.5;
}

.checked-conversation-list-container label {
    width: 100%;
    padding: 5px 10px;
    height: 30px;
}
</style>
