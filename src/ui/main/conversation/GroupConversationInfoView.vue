<template>
    <div class="conversation-info">
        <header>
            <label>
                {{ $t("conversation.group_name") }}
                <input
                    type="text"
                    ref="groupNameInput"
                    :disabled="!enableEditGroupNameOrAnnouncement"
                    v-model="newGroupName"
                    @blur="updateGroupName"
                    @focus="focus_name"
                    @keyup.enter="handlerEnter"
                    :maxlength="60"
                    :placeholder="
                        conversationInfo.conversation._target._displayName
                    "
                />
            </label>
            <label v-if="!isAnonymous">
                {{ $t("conversation.group_announcement") }}
                <input
                    type="text"
                    ref="groupAnnouncementInput"
                    :disabled="!enableEditGroupNameOrAnnouncement"
                    @blur="updateGroupAnnouncement"
                    @focus="focus_cement"
                    @keyup.enter="handlerEnter"
                    :maxlength="60"
                    v-model.trim="newGroupAnnouncement"
                    :placeholder="groupAnnouncement"
                />
            </label>
            <!-- <label>
        {{ $t('group.alias') }}
        <input type="text"
               @keyup.enter='updateGroupAlias'
               v-model.trim="newGroupAlias"
               :placeholder="groupAlias">
      </label> -->
            <!-- <label class="switch">
        保存到通讯录
        <input type="checkbox"
               :checked="conversationInfo.conversation._target._isFav"
               @change="setFavGroup(conversationInfo.conversation.target, $event.target.checked)">
        <span class="slider"></span>
      </label> -->
        </header>
        <div class="search-item">
            <input
                type="text"
                v-model="filterQuery"
                :placeholder="$t('common.search')"
            />
            <i class="icon-ion-ios-search"></i>
        </div>
        <div class="member-container">
            <div
                v-if="enableAddGroupMember && !filterQuery"
                @click="showCreateConversationModal"
                class="action-item"
            >
                <div class="icon">+</div>
                <p>{{ $t("conversation.add_member") }}</p>
            </div>
            <div
                v-if="enableRemoveGroupMember && !filterQuery"
                @click="showRemoveGroupMemberModal"
                class="action-item"
            >
                <div class="icon">-</div>
                <p>{{ $t("conversation.remove_member") }}</p>
            </div>
            <UserListVue
                :users="users"
                :show-category-label="false"
                :search="filterQuery"
                :padding-left="'20px'"
                :close-group-view-fun="hideConversationInfo"
            />
        </div>
        <div class="footer-bar">
            <span v-if="isGroupOwner" @click="doubleRemoveGroupConversation">
                {{ this.$t("conversation.delete_for_all") }}
            </span>
            <span @click="quitGroup" class="quit-group-item">
                {{
                    isGroupOwner
                        ? $t("conversation.delete_and_leave")
                        : $t("conversation.quit_group")
                }}
            </span>
        </div>
    </div>
</template>

<script>
import AddGroupMemberNotification from "@/wfc/messages/notification/addGroupMemberNotification";
import ChangeGroupNameNotification from "@/wfc/messages/notification/changeGroupNameNotification";
import TipNotificationMessageContent from "@/wfc/messages/notification/tipNotification";
import RemoveDoubleGroupConversationContent from "@/wfc/messages/customMessages/removeDoubleGroupConversationContent";

import Message from "@/wfc/messages/message";
import UserListVue from "@/ui/main/user/UserListVue";
import ConversationInfo from "@/wfc/model/conversationInfo";
import GroupMemberType from "@/wfc/model/groupMemberType";
import GroupType from "@/wfc/model/groupType";
import ConversationType from "@/wfc/model/conversationType";
import ModifyGroupInfoType from "@/wfc/model/modifyGroupInfoType";
import ApplyForGroup from "./ApplyForGroup";
import EventType from "@/wfc/client/wfcEvent";
import Config from "@/config";
import { tipsContent } from "@/ui/common/Tips";
import wfc from "@/wfc/client/wfc";
import store from "@/store";

import {
    getGroupAnnouncement,
    putGroupAnnouncement,
    getAddAnonymousMember,
    getGroupAnonymousMembers,
    getQueryGroupCheckSwitch,
    sendSaveGroupInvite,
    postDismissGroup,
} from "@/axios";

export default {
    name: "GroupConversationInfoView",
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
        },
        hideConversationInfo: {
            type: Function,
        },
    },
    data() {
        return {
            groupMemberUserInfos: store.getConversationMemberUsrInfos(
                this.conversationInfo.conversation
            ),
            filterQuery: "",
            sharedContactState: store.state.contact,
            groupAnnouncement: "",
            newGroupName: "",
            newGroupAnnouncement: "",
            newGroupAlias: "",
            groupAlias: "",
        };
    },
    created() {
        this.getGroupAnnouncementAction();
    },
    computed: {
        //是否是匿名群
        isAnonymous() {
            return (
                ConversationInfo &&
                ConversationInfo.anonymous_memberList &&
                ConversationInfo.anonymous_memberList.length
            );
        },
        enableAddGroupMember() {
            //并且是管理员
            if (
                ConversationInfo &&
                ConversationInfo.anonymous_memberList &&
                ConversationInfo.anonymous_memberList.length
            ) {
                let target = this.conversationInfo.conversation._target;
                let groupMember = wfc.getGroupMember(
                    target.target,
                    wfc.getUserId()
                );
                if (groupMember.type == 2) {
                    return true;
                } else {
                    return false;
                }
            } else {
                let selfUid = wfc.getUserId();
                let groupInfo = this.conversationInfo.conversation._target;
                //在group type为Restricted时，0 开放加入权限（群成员可以拉人，用户也可以主动加入）；1 只能群成员拉人入群；2 只能群管理拉人入群
                if (groupInfo.type === GroupType.Restricted) {
                    if (groupInfo.joinType === 0 || groupInfo.joinType === 1) {
                        return true;
                    } else if (groupInfo.joinType === 2) {
                        let groupMember = wfc.getGroupMember(
                            this.conversationInfo.conversation.target,
                            selfUid
                        );
                        return (
                            [
                                GroupMemberType.Manager,
                                GroupMemberType.Owner,
                            ].indexOf(groupMember.type) >= 0
                        );
                    }
                }
                return true;
            }
        },

        enableRemoveGroupMember() {
            let selfUid = wfc.getUserId();
            let groupMember = wfc.getGroupMember(
                this.conversationInfo.conversation.target,
                selfUid
            );
            if (groupMember) {
                return (
                    [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(
                        groupMember.type
                    ) >= 0
                );
            }
            return false;
        },

        enableEditGroupNameOrAnnouncement() {
            let selfUid = wfc.getUserId();
            let groupMember = wfc.getGroupMember(
                this.conversationInfo.conversation.target,
                selfUid
            );
            if (groupMember) {
                return (
                    [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(
                        groupMember.type
                    ) >= 0
                );
            }
            return false;
        },

        users() {
            if (
                ConversationInfo.anonymous_memberList &&
                ConversationInfo.anonymous_memberList.length
            ) {
                if (this.filterQuery) {
                    let anonymous_memberList =
                        ConversationInfo.anonymous_memberList;
                    return store.filterUsers(
                        anonymous_memberList,
                        this.filterQuery
                    );
                } else {
                    return ConversationInfo.anonymous_memberList;
                }
            } else {
                if (this.filterQuery) {
                    return store.filterUsers(
                        this.groupMemberUserInfos,
                        this.filterQuery
                    );
                } else {
                    return this.groupMemberUserInfos;
                }
            }
        },
        // 是否是管理员
        isGroupMember() {
            let target = this.conversationInfo.conversation._target;
            let groupMember = wfc.getGroupMember(
                target.target,
                wfc.getUserId()
            );
            return [GroupMemberType.Manager].indexOf(groupMember.type) >= 0;
        },
        // 是否是群主
        isGroupOwner() {
            let target = this.conversationInfo.conversation._target;
            let groupMember = wfc.getGroupMember(
                target.target,
                wfc.getUserId()
            );
            return [GroupMemberType.Owner].indexOf(groupMember.type) >= 0;
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
    },
    components: { UserListVue },
    mounted() {
        wfc.eventEmitter.on(EventType.UserInfosUpdate, this.onUserInfosUpdate);
        wfc.eventEmitter.on(
            EventType.GroupMembersUpdate,
            this.onUserInfosUpdate
        );
        this.updateGroupList();
        this.groupAlias = wfc.getUserInfo(
            wfc.getUserId(),
            false,
            this.conversationInfo.conversation.target
        ).groupAlias;
    },
    methods: {
        // 更新群好友
        updateGroupList() {
            wfc.getGroupMembers(
                this.conversationInfo.conversation.target,
                true
            );
        },
        // 添加匿名成员
        async addGroupAnonymousMembers(conversationInfo) {
            try {
                let response = await getAddAnonymousMember({
                    userId: wfc.getUserId(),
                    groupId:
                        (conversationInfo && conversationInfo.target) || "",
                });
                let { code, message } = response.data;
                if (code === "000000") {
                    this.getGroupAnonymousMembersAction(conversationInfo);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 获取匿名成员信息
        async getGroupAnonymousMembersAction(conversationInfo) {
            try {
                let response = await getGroupAnonymousMembers({
                    userId: wfc.getUserId(),
                    groupId:
                        (conversationInfo && conversationInfo.target) || "",
                });
                let { data, code, message } = response.data;
                if (code === "000000") {
                    if (data.imGroupMembers && data.imGroupMembers.length) {
                        for (let i = 0; i < data.imGroupMembers.length; i++) {
                            data.imGroupMembers[
                                i
                            ].portrait = `${Config.STATIC_SERVER}/im-fs${data.imGroupMembers[i].portrait}`;
                        }
                    }
                    ConversationInfo.anonymous_memberList = data.imGroupMembers;
                    this.updateGroupList();
                } else {
                    //   this.$Message.error(message)
                    console.log(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        onUserInfosUpdate(e) {
            // console.log(e, "onUserInfosUpdate", "GroupConversationInfoView");
            this.groupMemberUserInfos = store.getConversationMemberUsrInfos(
                this.conversationInfo.conversation
            );
        },
        focus_cement() {
            console.log(
                this.groupAnnouncement,
                this.$t("conversation.click_to_edit_group_announcement")
            );
            if (
                this.groupAnnouncement !=
                this.$t("conversation.click_to_edit_group_announcement")
            ) {
                this.newGroupAnnouncement = this.groupAnnouncement;
            }
        },
        focus_name() {
            this.newGroupName =
                this.conversationInfo.conversation._target._displayName;
        },
        async checkGroupSetInfo() {
            // 群主或者管理员
            if (this.isGroupMember || this.isGroupOwner) {
                return false;
            }
            try {
                let res = await getQueryGroupCheckSwitch({
                    groupId: this.conversationInfo.conversation.target,
                });
                let { code, data } = res.data;
                console.log(code, data);
                if (code === "000000" && data && Number(data.checkSwitch)) {
                    return true;
                }
                return false;
            } catch (error) {
                console.log(error);
                return false;
            }
        },
        // 添加成员
        async showCreateConversationModal() {
            const successCB = async (users) => {
                if (!users.length) return;
                // 添加之前进行群主是否将该群设置了入群申请判断
                let isGroupSet = await this.checkGroupSetInfo();
                if (isGroupSet) {
                    // 入群申请弹窗
                    this.$modal.show(
                        ApplyForGroup,
                        {},
                        null,
                        {
                            name: "applyForGroup-modal",
                            width: 300,
                            height: 200,
                        },
                        {
                            "before-close": (event) => {
                                console.log("Closing...", event, event.params);
                                if (event.params && event.params.confirm) {
                                    // 发送邀请申请
                                    sendSaveGroupInvite({
                                        groupId:
                                            this.conversationInfo.conversation
                                                .target,
                                        invitedUserIds: users
                                            .map((item) => item.uid)
                                            .join(","),
                                        reason: event.params.sendText,
                                        userId: wfc.getUserId(),
                                    }).then((res) => {
                                        let { data, code, message } = res.data;
                                        if (code === "000000") {
                                            console.log(data);
                                            this.$Message.success(
                                                this.$t("friend_request.sent")
                                            );
                                        } else {
                                            this.$Message.error(message);
                                        }
                                    });
                                }
                            },
                        }
                    );
                    return;
                }
                let ids = users.map((u) => u.uid);
                let groupId = this.conversationInfo.conversation.target;
                // 会员机制开启
                if (this.permissionList.isAppCharge) {
                    let groupMembers = wfc.getGroupMemberIds(groupId, true);
                    console.log(
                        "当前群已有人数：",
                        groupMembers.length,
                        "选中人数：",
                        ids.length,
                        "最大人数限制：",
                        this.permissionList.groupMemberLimit
                    );
                    let totalMembers = groupMembers.length + ids.length;
                    if (totalMembers > this.permissionList.groupMemberLimit) {
                        this.$alert({
                            content:
                                totalMembers > 800
                                    ? tipsContent[6]
                                    : this.isGroupOwner
                                    ? tipsContent[7]
                                    : tipsContent[8],
                            height: 150,
                            cancelText: "",
                        });
                    } else {
                        this.nextAddmembers(ids, groupId);
                    }
                } else {
                    this.nextAddmembers(ids, groupId);
                }
            };

            let groupMemberUserInfos = store.getGroupMemberUserInfos(
                this.conversationInfo.conversation.target,
                false
            );
            let users = this.sharedContactState.favContactList.concat(
                this.sharedContactState.friendList
            );

            this.$pickContact({
                users: users.filter((item) => item.uid !== "wfc_file_transfer"),
                initialCheckedUsers: groupMemberUserInfos,
                uncheckableUsers: groupMemberUserInfos,
                confirmTitle: this.$t("common.add"),
                successCB,
            });
        },
        // 下一步添加成员
        nextAddmembers(ids, groupId) {
            //判断是不是匿名群
            if (
                ConversationInfo.anonymous_memberList &&
                ConversationInfo.anonymous_memberList.length
            ) {
                // 匿名群
                let notifyMessageContent = new AddGroupMemberNotification(
                    wfc.getUserId(),
                    ids
                );
                notifyMessageContent.extra = JSON.stringify({
                    is_anonymous: 1,
                });
                wfc.addGroupMembers(
                    groupId,
                    ids,
                    null,
                    [0],
                    notifyMessageContent,
                    () => {
                        this.addGroupAnonymousMembers(this.conversationInfo);
                    }
                );
            } else {
                // 普通群
                wfc.addGroupMembers(groupId, ids, null, [0], null, () => {
                    let groupMembers = wfc.getGroupMemberIds(groupId, true);
                    store.updateGroupPortraitFromAjax(groupId, groupMembers);
                });
            }
        },
        //移除成员
        showRemoveGroupMemberModal() {
            let groupId = this.conversationInfo.conversation.target;
            let users = [...store.getGroupMemberUserInfos(groupId, false)];
            let memberOwners = [];
            if (
                ConversationInfo.anonymous_memberList &&
                ConversationInfo.anonymous_memberList.length
            ) {
                let length = ConversationInfo.anonymous_memberList.length;
                users.forEach((item) => {
                    for (let i = 0; i < length; i++) {
                        let keyItem = ConversationInfo.anonymous_memberList[i];
                        if (keyItem.memberId == item.uid) {
                            item.portrait1 = item.portrait;
                            item.portrait = keyItem.portrait;
                            item._displayName = keyItem.anonymousName;
                        }
                    }
                });
            } else {
                let groupMembers = wfc.getGroupMemberIds(groupId, true);
                for (let i = 0; i < groupMembers.length; i++) {
                    let groupMember = wfc.getGroupMember(
                        groupId,
                        groupMembers[i]
                    );
                    if (
                        [
                            GroupMemberType.Manager,
                            GroupMemberType.Owner,
                        ].indexOf(groupMember.type) >= 0
                    ) {
                        memberOwners.push(groupMembers[i]);
                    }
                }
                users.forEach((item) => {
                    if (item.portrait1) {
                        item.portrait = item.portrait1;
                    }
                    if (Config.OLD_HTTP_PORTRAIT.includes(item.portrait)) {
                        item.portrait = Config.DEFAULT_PORTRAIT_URL;
                    }
                    item._displayName = item.displayName;
                });
            }

            this.$pickContact({
                users: users,
                initialCheckedUsers: store.getUserInfos(memberOwners, groupId),
                uncheckableUsers: store.getUserInfos(memberOwners, groupId),
                confirmTitle: this.$t("common.remove"),
                showCategoryLabel: false,
                successCB: (users) => {
                    if (!users.length) return;
                    let newPickedUsers = users;
                    let ids = newPickedUsers.map((u) => u.uid);
                    wfc.kickoffGroupMembers(groupId, ids, [0], null, () => {
                        if (
                            this.conversationInfo.conversation.type ==
                                ConversationType.Group &&
                            ConversationInfo.anonymous_memberList &&
                            !ConversationInfo.anonymous_memberList.length
                        ) {
                            store.updateGroupPortraitFromAjax(
                                groupId,
                                wfc.getGroupMemberIds(groupId, true)
                            );
                        }
                        this.updateGroupList();
                    });
                },
            });
        },
        // 获取群公告
        async getGroupAnnouncementAction() {
            try {
                let res = await getGroupAnnouncement({
                    groupId: this.conversationInfo.conversation.target,
                });
                let { data, code, message } = res.data;
                if (code === "000000") {
                    this.groupAnnouncement = data.content;
                } else {
                    if (this.enableEditGroupNameOrAnnouncement) {
                        this.groupAnnouncement = this.$t(
                            "conversation.click_to_edit_group_announcement"
                        );
                    }
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        handlerEnter(e) {
            e.target.blur();
        },
        // 更改群名称
        updateGroupName() {
            let groupId = this.conversationInfo.conversation.target;
            if (
                !this.newGroupName ||
                this.newGroupName ===
                    this.conversationInfo.conversation._target._displayName
            ) {
                return;
            }
            if (
                this.conversationInfo.conversation.type ==
                ConversationType.Group
            ) {
                if (
                    ConversationInfo.anonymous_memberList &&
                    ConversationInfo.anonymous_memberList.length
                ) {
                    let notifyMessageContent = new ChangeGroupNameNotification(
                        wfc.getUserId(),
                        this.newGroupName
                    );
                    notifyMessageContent.extra = JSON.stringify({
                        is_anonymous: 1,
                    });
                    // notifyMessageContent.pushData =JSON.stringify( {'is_anonymous' : 1});
                    wfc.modifyGroupInfo(
                        groupId,
                        ModifyGroupInfoType.Modify_Group_Name,
                        this.newGroupName,
                        [0],
                        notifyMessageContent,
                        () => {
                            this.conversationInfo.conversation._target._displayName =
                                this.newGroupName;
                            this.$refs.groupNameInput &&
                                this.$refs.groupNameInput.blur();
                        },
                        (err) => {
                            // do nothing
                        }
                    );
                } else {
                    wfc.modifyGroupInfo(
                        groupId,
                        ModifyGroupInfoType.Modify_Group_Name,
                        this.newGroupName,
                        [0],
                        null,
                        () => {
                            this.conversationInfo.conversation._target._displayName =
                                this.newGroupName;
                            this.$refs.groupNameInput &&
                                this.$refs.groupNameInput.blur();
                        },
                        (err) => {
                            // do nothing
                        }
                    );
                }
            } else {
                wfc.modifyGroupInfo(
                    groupId,
                    ModifyGroupInfoType.Modify_Group_Name,
                    this.newGroupName,
                    [0],
                    null,
                    () => {
                        this.conversationInfo.conversation._target._displayName =
                            this.newGroupName;
                        this.$refs.groupNameInput &&
                            this.$refs.groupNameInput.blur();
                    },
                    (err) => {
                        // do nothing
                    }
                );
            }
        },
        // 更改群公告 (匿名群没有群公告功能)
        async updateGroupAnnouncement() {
            if (
                !this.newGroupAnnouncement ||
                this.newGroupAnnouncement === this.groupAnnouncement
            ) {
                return;
            }
            try {
                let res = await putGroupAnnouncement({
                    authorId: wfc.getUserId(),
                    groupId: this.conversationInfo.conversation.target,
                    content: this.newGroupAnnouncement,
                });
                let { message, code } = res.data;
                if (code === "000000") {
                    this.groupAnnouncement = this.newGroupAnnouncement;
                    this.$refs.groupAnnouncementInput &&
                        this.$refs.groupAnnouncementInput.blur();
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },

        updateGroupAlias() {
            if (this.newGroupAlias && this.newGroupAlias !== this.groupAlias) {
                wfc.modifyGroupAlias(
                    this.conversationInfo.conversation.target,
                    this.newGroupAlias,
                    [0],
                    null,
                    () => {
                        this.groupAlias = this.newGroupAlias;
                    },
                    null
                );
            }
        },

        async quitGroup() {
            // 判断是不是群主 GroupMemberType ==2
            let target = this.conversationInfo.conversation._target;
            let groupMember = wfc.getGroupMember(
                target.target,
                wfc.getUserId()
            );
            //   console.log('groupMember.type', groupMember.type)
            if (groupMember.type == 2) {
                // 解散群聊
                try {
                    let res = await postDismissGroup({
                        groupId: target.target,
                    });
                    if (res.data.code === "000000") {
                        store.dismissGroup(
                            this.conversationInfo.conversation.target
                        );
                    }
                } catch (error) {
                    console.log(error);
                }
            } else {
                store.quitGroup(this.conversationInfo.conversation.target);
            }
            this.$parent.toggleConversationInfo(); // 关闭左侧成员弹窗
            store.removeConversation(this.conversationInfo.conversation);
        },
        // 删除群组里面的消息
        doubleRemoveGroupConversation() {
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
            this.$alert({
                content: this.$t("conversation.delete_group_tips"),
                height: 150,
                isText: true,
                confirmCallback: () => {
                    // 发消息给对方
                    wfc.sendMessage(
                        new Message(
                            this.conversationInfo.conversation,
                            new RemoveDoubleGroupConversationContent(
                                this.conversationInfo.target
                            )
                        )
                    );
                    // 清除会话里面的内容
                    wfc.clearRemoteConversationMessages(
                        this.conversationInfo.conversation,
                        () => {
                            let timer = setTimeout(() => {
                                wfc.sendConversationMessage(
                                    this.conversationInfo.conversation,
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
        },
        // setFavGroup(groupId, fav) {
        //   wfc.setFavGroup(
        //     groupId,
        //     fav,
        //     () => {
        //       this.conversationInfo.conversation._target._isFav = fav
        //       store.reloadFavGroupList()
        //     },
        //     (err) => {
        //       console.log('setFavGroup error', err)
        //     }
        //   )
        // }
    },
    beforeUnmount() {
        wfc.eventEmitter.removeListener(
            EventType.UserInfosUpdate,
            this.onUserInfosUpdate
        );
        wfc.eventEmitter.removeListener(
            EventType.GroupMembersUpdate,
            this.onUserInfosUpdate
        );
    },
};
</script>

<style lang="css" scoped>
.conversation-info {
    display: flex;
    flex-direction: column;
    position: relative;
    justify-content: flex-start;
    height: 100%;
}

header {
    padding-left: 20px;
    padding-right: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

header label {
    width: 100%;
    display: flex;
    margin-top: 15px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    font-size: 14px;
    color: #999999;
}

header label:last-of-type {
    padding-bottom: 15px;
    border-bottom: 1px solid #ececec;
}

header label input {
    flex: 1;
    margin-top: 5px;
    border: none;
    outline: none;
    width: 100%;
    font-size: 13px;
    background-color: transparent;
}

.member-container {
    flex: 1;
    overflow: auto;
}

.search-item {
    position: relative;
    padding: 10px 20px;
}

.search-item input {
    width: 100%;
    padding: 0 10px 0 20px;
    height: 25px;
    border-radius: 3px;
    border: 1px solid #ededed;
    background-color: white;
    text-align: left;
    outline: none;
}

.search-item input:active {
    border: 1px solid #1dbb88;
}

.search-item input:focus {
    border: 1px solid #1dbb88;
}

.search-item i {
    position: absolute;
    left: 25px;
    top: 18px;
}

.action-item {
    height: 50px;
    display: flex;
    padding-left: 20px;
    align-items: center;
}

.action-item .icon {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    border: 1px dashed #d6d6d6;
}

.action-item img {
    width: 40px;
    height: 40px;
}

.action-item p {
    margin-left: 10px;
    font-size: 13px;
}

.action-item:active {
    background-color: #d6d6d6;
}
.switch {
    display: flex;
    flex-direction: row;
}

.switch input {
    margin-left: 20px;
}
.footer-bar {
    display: flex;
    flex-direction: column;
}
.footer-bar span {
    color: red;
    border-top: 1px solid #ececec;
    height: 42px;
    flex: 1;
    line-height: 42px;
    text-align: center;
}
.footer-bar .quit-group-item:active {
    background: #d6d6d6;
}
</style>
