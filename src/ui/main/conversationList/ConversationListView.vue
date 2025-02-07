<template>
    <section class="conversation-list" ref="conversationList">
        <ul ref="conversationWrap">
            <li
                @click="showConversation(conversationInfo)"
                v-for="conversationInfo in conversationInfoList"
                :key="conversationInfoKey(conversationInfo)"
                :class="itemClassName(conversationInfo)"
                @contextmenu.prevent="
                    showConversationItemContextMenu($event, conversationInfo)
                "
            >
                <ConversationItemView
                    :conversation-info="conversationInfo"
                    :temporaryGroupIdList="temporaryGroupIdList"
                />
            </li>
        </ul>
        <vue-context
            ref="menu"
            v-slot="{ data: conversationInfo }"
            v-on:close="onConversationItemContextMenuClose"
        >
            <li>
                <a @click.prevent="setConversationTop(conversationInfo)">
                    {{
                        conversationInfo && conversationInfo.top
                            ? $t("conversation.cancel_sticky_top")
                            : $t("conversation.sticky_top")
                    }}
                </a>
            </li>
            <li>
                <a @click.prevent="setConversationSilent(conversationInfo)">{{
                    conversationInfo && conversationInfo.isSilent
                        ? $t("conversation.enable_notification")
                        : $t("conversation.disable_notification")
                }}</a>
            </li>
            <!-- 修改群聊名称 -->
            <li v-if="isShowEditGroup(conversationInfo)">
                <a @click.prevent="editGroupName(conversationInfo)">
                    {{ $t("conversation.edit_group_name") }}
                </a>
            </li>
            <!-- 删除 -->
            <li>
                <a @click.prevent="removeConversation(conversationInfo)">{{
                    removeText(conversationInfo)
                }}</a>
            </li>
            <!-- 删除我和对方 -->
            <li v-if="isShowDoubleDelete(conversationInfo)">
                <a @click.prevent="doubleRemoveConversation(conversationInfo)">
                    <em
                        v-if="
                            permissionList.isAppCharge &&
                            permissionList.chatDeleteBothVipLevel
                        "
                        :class="[
                            `vip-icon-${permissionList.chatDeleteBothVipLevel}`,
                            'vip-icon-em',
                        ]"
                    ></em>
                    <span class="single-line">
                        {{
                            $t("conversation.delete_for_me", [
                                mixinGetUserName(
                                    conversationInfo &&
                                        conversationInfo.conversation._target
                                ) || $t("contact.unknown_user"),
                            ])
                        }}
                    </span>
                </a>
            </li>
            <!-- 删除群组里面的消息   -->
            <li v-if="isShowDoubleDeleteGroupMessage(conversationInfo)">
                <a
                    @click.prevent="
                        doubleRemoveGroupConversation(conversationInfo)
                    "
                >
                    <em
                        v-if="
                            permissionList.isAppCharge &&
                            permissionList.chatDeleteBothVipLevel
                        "
                        :class="[
                            `vip-icon-${permissionList.chatDeleteBothVipLevel}`,
                            'vip-icon-em',
                        ]"
                    ></em>
                    {{ $t("conversation.delete_for_all") }}
                </a>
            </li>
        </vue-context>
    </section>
</template>

<script>
import ConversationItemView from "@/ui/main/conversationList/ConversationItemView";
import RemoveDoubleConversationContent from "@/wfc/messages/customMessages/removeDoubleConversationContent";
import RemoveDoubleGroupConversationContent from "@/wfc/messages/customMessages/removeDoubleGroupConversationContent";
import ChangeGroupNameNotification from "@/wfc/messages/notification/changeGroupNameNotification";
import TipNotificationMessageContent from "@/wfc/messages/notification/tipNotification";
import EditGroupNameView from "./EditGroupNameView";
import ConversationType from "@/wfc/model/conversationType";
import ConversationInfo from "@/wfc/model/conversationInfo";
import GroupMemberType from "@/wfc/model/groupMemberType";
import ModifyGroupInfoType from "@/wfc/model/modifyGroupInfoType";
import Message from "@/wfc/messages/message";

import wfc from "@/wfc/client/wfc";
import useSecretTokenStore from "@/store/secretStore";
import { storeToRefs } from "pinia";
import store from "@/store";
import {
    getGroupAnonymousWeb,
    getGroupAnonymousMembersInfo,
    getTemporaryGroupIdList,
} from "@/axios";
import { tipsContent } from "../../common/Tips";
import { toRaw } from "vue";
export default {
    name: "ConversationListView",
    data() {
        return {
            sharedConversationState: store.state.conversation,
            contextMenuConversationInfo: null,
            currentIndex: "",
            temporaryGroupIdList: [],
            lock: false, // 点击频繁锁
            nextLick: false, // 点击频繁锁
        };
    },
    created() {
        this.$eventBus.$on(
            "showConversationContextMenu",
            ([event, conversationInfo]) => {
                this.showConversationItemContextMenu(event, conversationInfo);
            }
        );
    },

    unmounted() {
        this.$eventBus.$off("showConversationContextMenu");
    },
    computed: {
        // 设置样式
        itemClassName() {
            return (conversationInfo) => {
                let currentConversationInfo =
                    this.sharedConversationState.currentConversationInfo;
                return {
                    active:
                        currentConversationInfo &&
                        currentConversationInfo.conversation.equal(
                            conversationInfo.conversation
                        ),
                    top: conversationInfo.top,
                    highlight:
                        this.contextMenuConversationInfo &&
                        this.contextMenuConversationInfo.conversation.equal(
                            conversationInfo.conversation
                        ),
                };
            };
        },
        conversationInfoList() {
            // 秘密令牌开启需要过滤隐藏的群和好友
            let { secretFriends, secretGroups, secretStatus, secretConfig } =
                storeToRefs(useSecretTokenStore());
            if (secretConfig.value && secretStatus.value) {
                let friends = secretFriends?.value.map((item) => item.userId);
                let groups = secretGroups?.value.map((item) => item.groupId);
                return this.sharedConversationState.conversationInfoList.filter(
                    (item) => {
                        return (
                            !groups?.includes(item.target) &&
                            !friends?.includes(item.target)
                        );
                    }
                );
            } else {
                return this.sharedConversationState.conversationInfoList;
            }
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
    },
    methods: {
        //点击左侧列表事件调用
        async showConversation(conversationInfo) {
            // 已经是当前会话就不需要执行了
            if (
                this.sharedConversationState.currentConversationInfo &&
                this.sharedConversationState.currentConversationInfo.conversation.equal(
                    conversationInfo.conversation
                )
            ) {
                return;
            }
            if (this.lock || this.nextLick) {
                this.$Message.warning(this.$t("voip.network_unstable"));
                return;
            }
            this.lock = true;
            // 是否是群
            const { conversation, target: groupId } = conversationInfo;
            if (conversation.type === ConversationType.Group) {
                try {
                    // 获取群信息
                    const response = await getGroupAnonymousWeb({
                        userId: wfc.getUserId(),
                        groupId,
                    });
                    this.lock = false;
                    const { code, message, data } = response.data;
                    if (code !== "000000") {
                        this.$Message.error(message);
                        return;
                    }
                    // data.anonymous == 1  是匿名群 ,data.anonymous: null 是普通群,  data:null 被解散的群
                    if (data && data.anonymous == 1) {
                        this.nextLick = true;
                        // 是匿名群则将获取匿名群人员信息
                        const res = await getGroupAnonymousMembersInfo({
                            userId: wfc.getUserId(),
                            groupId,
                        });

                        const {
                            code: aCode,
                            data: aData,
                            message: aMsg,
                        } = res.data;
                        this.nextLick = false;
                        if (aCode == "000000") {
                            ConversationInfo.anonymous_memberList =
                                aData.imGroupMembers;
                            store.setCurrentConversationInfo(conversationInfo);
                        } else {
                            this.$Message.error(aMsg);
                        }
                    } else {
                        ConversationInfo.anonymous_memberList = [];
                        store.setCurrentConversationInfo(conversationInfo);
                    }
                } catch (error) {
                    this.lock = false;
                    this.$Message.error(this.$t("common.error_later"));
                }
            } else {
                this.lock = false;
                ConversationInfo.anonymous_memberList = [];
                store.setCurrentConversationInfo(conversationInfo);
            }
            wfc.clearConversationUnreadStatus(conversation);
        },
        setConversationTop(conversationInfo) {
            store.setConversationTop(
                conversationInfo.conversation,
                conversationInfo.top > 0 ? 0 : 1
            );
        },

        setConversationSilent(conversationInfo) {
            store.setConversationSilent(
                conversationInfo.conversation,
                !conversationInfo.isSilent
            );
        },

        removeConversation(conversationInfo) {
            store.removeConversation(conversationInfo.conversation);
        },
        // 是否显示 双侧删除
        isShowDoubleDelete(conversationInfo) {
            return conversationInfo && conversationInfo.conversationType === 0;
        },
        isShowDoubleDeleteGroupMessage(conversationInfo) {
            return (
                conversationInfo &&
                conversationInfo.conversationType === ConversationType.Group &&
                conversationInfo.conversation._target.owner === wfc.getUserId()
            );
        },
        removeText(conversationInfo) {
            if (conversationInfo) {
                return conversationInfo.conversationType === 1
                    ? this.$t("common.delete")
                    : this.$t("conversation.just_delete");
            }
        },
        // 删除列表
        doubleRemoveConversation(conversationInfo) {
            if (
                !this.permissionList.chatDeleteBoth &&
                this.permissionList.isAppCharge
            ) {
                this.$alert({
                    content: tipsContent[5],
                    cancelText: "",
                });
                return;
            }
            if (conversationInfo) {
                this.$alert({
                    content: this.$t("conversation.delete_tips", [
                        this.mixinGetUserName(
                            conversationInfo.conversation._target
                        ),
                    ]),
                    height: 150,
                    isText: true,
                    confirmCallback: () => {
                        // 发消息给对方
                        wfc.sendMessage(
                            new Message(
                                conversationInfo.conversation,
                                new RemoveDoubleConversationContent(
                                    wfc.getUserId()
                                )
                            )
                        );
                        // 清除会话里面的内容,删除自己方列表的显式
                        wfc.clearRemoteConversationMessages(
                            conversationInfo.conversation,
                            () => {
                                this.removeConversation(conversationInfo);
                            }
                        );
                    },
                });
            }
        },
        // 删除群组里面的消息
        doubleRemoveGroupConversation(conversationInfo) {
            if (
                !this.permissionList.chatDeleteBoth &&
                this.permissionList.isAppCharge
            ) {
                this.$alert({
                    content: tipsContent[5],
                    cancelText: "",
                });
                return;
            }
            if (conversationInfo) {
                this.$alert({
                    content: this.$t("conversation.delete_group_tips"),
                    height: 150,
                    isText: true,
                    confirmCallback: () => {
                        // 发消息给对方
                        wfc.sendMessage(
                            new Message(
                                conversationInfo.conversation,
                                new RemoveDoubleGroupConversationContent(
                                    conversationInfo.target
                                )
                            )
                        );
                        // 清除会话里面的内容
                        wfc.clearRemoteConversationMessages(
                            conversationInfo.conversation,
                            () => {
                                let timer = setTimeout(() => {
                                    wfc.sendConversationMessage(
                                        conversationInfo.conversation,
                                        new TipNotificationMessageContent(
                                            this.$t(
                                                "conversation.delete_group_message"
                                            )
                                        ),
                                        [wfc.getUserId()]
                                    );
                                    clearTimeout(timer);
                                }, 500);
                            }
                        );
                    },
                });
            }
        },
        conversationInfoKey(conversationInfo) {
            let conv = conversationInfo.conversation;
            return conv?.target + "-" + conv?.type + "-" + conv?.line;
        },
        // 是否显示 编辑群名称
        isShowEditGroup(conversationInfo) {
            return (
                conversationInfo &&
                conversationInfo.conversationType === ConversationType.Group
            );
        },
        enableEditGroupName(conversationInfo) {
            let selfUid = wfc.getUserId();
            let groupMember = wfc.getGroupMember(
                conversationInfo.conversation.target,
                selfUid
            );
            return (
                [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(
                    groupMember.type
                ) >= 0
            );
        },
        // 编辑群聊名称
        editGroupName(conversationInfo) {
            let enableEditGroupName =
                this.enableEditGroupName(conversationInfo);
            this.$modal.show(
                EditGroupNameView,
                {
                    enableEditGroupName,
                    groupInfo: conversationInfo.conversation._target,
                },
                null,
                {
                    name: "edit-group-name-view",
                    width: 350,
                    height: enableEditGroupName ? 200 : 140,
                    clickToClose: false, // 点击模态框是否关闭
                },
                {
                    "before-close": (event) => {
                        if (!event.params) return;
                        let { confirm, groupName } = event.params;
                        if (confirm && enableEditGroupName) {
                            this.updateGroupName(conversationInfo, groupName);
                        }
                    },
                }
            );
        },
        // 更改群名称
        async updateGroupName(conversationInfo, groupName) {
            if (groupName === conversationInfo.conversation._target.name)
                return;
            let groupId = conversationInfo.conversation.target;
            let userId = wfc.getUserId();
            let notifyMessageContent = null;
            try {
                let res = await getGroupAnonymousWeb({ userId, groupId });
                let { data, code, message } = res.data;
                if (code === "000000") {
                    //  匿名群修改名称需要处理一下
                    if (data.anonymous === 1) {
                        notifyMessageContent = new ChangeGroupNameNotification(
                            wfc.getUserId(),
                            groupName
                        );
                        notifyMessageContent.extra = JSON.stringify({
                            is_anonymous: 1,
                        });
                    }
                    wfc.modifyGroupInfo(
                        groupId,
                        ModifyGroupInfoType.Modify_Group_Name,
                        groupName,
                        [0],
                        notifyMessageContent,
                        () => {
                            conversationInfo.conversation._target._displayName =
                                groupName;
                        },
                        (err) => {
                            // do nothing
                        }
                    );
                } else {
                    this.$Message.error({
                        content: message,
                    });
                }
            } catch (error) {
                this.$Message.error({
                    content: this.$t("common.error_later"),
                });
            }
        },
        scrollActiveElementCenter() {
            let el = this.$el.getElementsByClassName("active")[0];
            el && el.scrollIntoView({ behavior: "instant", block: "center" });
        },

        showConversationItemContextMenu(event, conversationInfo) {
            if (!this.$refs.menu) {
                return;
            }
            this.contextMenuConversationInfo = conversationInfo;
            this.$refs.menu.open(event, conversationInfo);
        },

        onConversationItemContextMenuClose() {
            this.contextMenuConversationInfo = null;
        },
        // 获取临时群信息
        async handlerGetTemporaryGroupIdList() {
            try {
                let res = await getTemporaryGroupIdList({
                    userId: wfc.getUserId(),
                });
                let { code, message, data } = res.data;
                if (code === "000000") {
                    if (data && data.length) {
                        this.temporaryGroupIdList = data.map((item) => {
                            return item.groupId;
                        });
                    }
                } else {
                    console.log(message);
                }
            } catch (error) {}
        },
        listenerKeydown(e) {
            const code = e.keyCode;
            let length =
                (this.sharedConversationState.conversationInfoList &&
                    this.sharedConversationState.conversationInfoList.length) ||
                0;
            // 按钮是上下的时候监听
            if ([38, 40].includes(code) && length) {
                let focusNode = window.getSelection().focusNode;
                let channelMenu;
                //
                if (focusNode && focusNode.querySelector) {
                    channelMenu = focusNode.querySelector("#channel-menu"); // 频道菜单
                }
                //在输入框内的有内容的上下按键不执行
                if (focusNode.data || (focusNode.innerHTML && !channelMenu)) {
                    return;
                }
                const list = this.sharedConversationState.conversationInfoList;
                let index = list.findIndex((item) => {
                    return (
                        this.sharedConversationState.currentConversationInfo &&
                        this.sharedConversationState.currentConversationInfo.conversation.equal(
                            item.conversation
                        )
                    );
                });
                if (index !== -1 && !this.lock) {
                    this.currentIndex = index;
                    let activeDom,
                        parentDomHeight,
                        activeDomOffsetTop,
                        activeDomHeight,
                        ulScrollTop;
                    // 最外层父级的高度
                    let conversationListElement =
                        this.$refs["conversationList"];
                    let conversationWrapElement =
                        this.$refs["conversationWrap"];
                    if (conversationListElement) {
                        parentDomHeight = conversationListElement.offsetHeight;
                    }
                    // 当前选中的dom
                    if (conversationWrapElement) {
                        activeDom =
                            conversationWrapElement.querySelector("li.active");
                        ulScrollTop = conversationWrapElement.scrollTop;
                        activeDomOffsetTop = activeDom && activeDom.offsetTop;
                        activeDomHeight = activeDom && activeDom.offsetHeight;
                    }

                    // 选中dom的2倍
                    let twoActiveHeight = activeDomHeight * 2;
                    // 选中元素的自身的高度+该元素到顶部的高度
                    let offsetTopNum = activeDomOffsetTop + activeDomHeight;
                    let isDefaultScroll =
                        offsetTopNum > parentDomHeight && !ulScrollTop;
                    //code: 40 进入滑动的条件
                    let isScroll =
                        isDefaultScroll ||
                        activeDomOffsetTop - ulScrollTop >
                            parentDomHeight - twoActiveHeight;
                    switch (code) {
                        case 38:
                            this.currentIndex -= 1;
                            this.currentIndex =
                                this.currentIndex <= 0 ? 0 : this.currentIndex;
                            /**
                             * 按上按钮
                             * 1、当前选中不在可视范围内将计算当前选中的dom是在哪个位置（
                             * （1）在可视范围的上方 选中dom到父级的高度(activeDomOffsetTop)- 父级的滚动高度(ulScrollTop) <  (选中dom的高度)activeDomHeight
                             * （2）在可视范围的下方 父级的滚动高度(ulScrollTop)  - 选中dom到父级的高度(activeDomOffsetTop) <  可视高度(parentDomHeight)-(选中dom的高度2倍)twoActiveHeight
                             */
                            let isDown =
                                isDefaultScroll ||
                                ulScrollTop - activeDomOffsetTop >
                                    parentDomHeight - twoActiveHeight;
                            // 进入滑动的条件
                            if (
                                activeDomOffsetTop - ulScrollTop <
                                    activeDomHeight ||
                                isDown
                            ) {
                                const timer = setTimeout(() => {
                                    conversationWrapElement.scroll({
                                        top: !this.currentIndex
                                            ? 0
                                            : isScroll
                                            ? activeDomOffsetTop -
                                              parentDomHeight
                                            : activeDomOffsetTop -
                                              activeDomHeight,
                                        left: 0,
                                        behavior: "auto",
                                    });
                                    timer && clearTimeout(timer);
                                }, 100);
                            }
                            break;
                        case 40:
                            this.currentIndex += 1;
                            this.currentIndex =
                                this.currentIndex > length - 1
                                    ? 0
                                    : this.currentIndex;
                            // 1、按下按钮 ~ 当前选中在可视范围内不执行此滑动，
                            let isUp =
                                ulScrollTop - activeDomOffsetTop >
                                activeDomHeight;

                            // 按下按钮需要移动的高度
                            let topNum =
                                activeDomOffsetTop -
                                parentDomHeight +
                                twoActiveHeight;

                            if (isScroll || isUp) {
                                const timer = setTimeout(() => {
                                    conversationWrapElement.scroll({
                                        top: !this.currentIndex
                                            ? 0
                                            : isUp
                                            ? activeDomOffsetTop +
                                              activeDomHeight
                                            : topNum,
                                        left: 0,
                                        behavior: "auto",
                                    });
                                    timer && clearTimeout(timer);
                                }, 100);
                            }

                            break;
                    }

                    const info =
                        this.sharedConversationState.conversationInfoList[
                            this.currentIndex
                        ];
                    this.showConversation(info, this.currentIndex);
                }
            }
        },
    },
    mounted() {
        window.addEventListener("keydown", this.listenerKeydown);
        this.handlerGetTemporaryGroupIdList();
    },
    activated() {
        this.scrollActiveElementCenter();
    },
    watch: {
        // 更新当前临时群标识
        "sharedConversationState.conversationInfoList.length"(n, o) {
            this.handlerGetTemporaryGroupIdList();
        },
    },
    components: {
        ConversationItemView,
    },
    beforeUnmount() {
        window.removeEventListener("keydown", this.listenerKeydown);
    },
};
</script>

<style lang="css" scoped>
.conversation-list {
    background-color: #fff;
    height: 100%;
}
.conversation-list ul {
    height: 100%;
    overflow-y: auto;
}
.conversation-list ul.v-context {
    height: auto;
    max-width: 260px;
}
.conversation-list ul:first-of-type li {
    background-color: #fff;
}

/*.conversation-list ul li:hover {*/
/*  background-color: #d6d6d6;*/
/*}*/

.conversation-list ul:first-of-type li.active {
    background-color: #eceef4;
}

.conversation-list ul:first-of-type li.top {
    background-color: #f5f6f9;
}

.conversation-list li.highlight {
    box-shadow: 0 0 0 2px #1dbb88 inset;
    z-index: 100;
}

.conversation-list ul:first-of-type li.active.top {
    background-color: #eceef4;
}
em.vip-icon-em {
    margin-left: -20px;
}
</style>
