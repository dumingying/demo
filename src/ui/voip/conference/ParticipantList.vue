<template>
    <!-- 点击成员侧边弹窗 -->
    <div
        class="participant-list-container"
        :class="{ active: showParticipantList }"
        v-v-on-click-outside="hideParticipantList"
    >
        <div @click="invite" class="action-item">
            <div class="icon">+</div>
            <p>{{ $t("voip.invite_new") }}</p>
        </div>
        <template v-if="requestList.length && selfUserInfo._isHost">
            <h4>{{ $t("voip.application_participation") }}</h4>
            <ul class="request-list">
                <li
                    v-for="(item, index) in requestList"
                    :key="index"
                    class="request-item"
                >
                    <figure>
                        <img
                            :src="mixinDefaultPortrait(item.avatarUrl)"
                            draggable="false"
                        />
                    </figure>
                    <span class="single-line name">{{
                        mixinResetPhoneNumber(item.nickname)
                    }}</span>
                    <div class="btn">
                        <span class="agree" @click="handleAction(item, 0)">{{
                            $t("common.decline")
                        }}</span>
                        <span class="reject" @click="handleAction(item, 1)">{{
                            $t("common.agree")
                        }}</span>
                    </div>
                </li>
            </ul>
        </template>
        <h4>{{ $t("voip.attendees_member") }}</h4>
        <ul class="participants-list">
            <li
                v-for="user in participantUserInfos"
                @mouseenter.self="changeShowRemove(user)"
                @mouseleave.self="changeShowRemove(0)"
                :key="user.uid"
            >
                <div
                    class="participant-user"
                    :ref="'userCardTippy-' + user.uid"
                    :id="'user-' + user.uid"
                >
                    <figure
                        class="avatar-container"
                        @click="updateParticipants(user)"
                    >
                        <img
                            class="avatar"
                            @error="mixinImgUrlAlt"
                            draggable="false"
                            :src="mixinDefaultPortrait(user.portrait)"
                        />
                    </figure>
                    <div class="name-info" @click="updateParticipants(user)">
                        <span class="new-single-line name">
                            {{ mixinGetUserName(user) }}</span
                        >
                        <span
                            class="mine-host"
                            v-if="user._isHost || user.uid === selfUserInfo.uid"
                        >
                            {{ roleName(user) }}
                        </span>
                    </div>
                    <div
                        v-show="
                            hoverUid === user.uid &&
                            selfUserInfo._isHost &&
                            !user._isHost
                        "
                        @click.stop="kickoff(user)"
                        class="remove"
                    >
                        {{ $t("voip.remove_member") }}
                    </div>
                    <template v-if="hoverUid !== user.uid">
                        <!-- 自己的状态 -->
                        <template v-if="user.uid === selfUserInfo.uid">
                            <figure>
                                <img
                                    class="action-img"
                                    draggable="false"
                                    :src="videoSrc()"
                                />
                            </figure>
                            <figure>
                                <img
                                    class="action-img"
                                    draggable="false"
                                    :src="audioSrc()"
                                />
                            </figure>
                        </template>
                        <!-- 其他成员的状态 -->
                        <template v-else>
                            <figure>
                                <img
                                    class="action-img"
                                    draggable="false"
                                    :src="videoSrc(user)"
                                />
                            </figure>
                            <figure>
                                <img
                                    class="action-img"
                                    draggable="false"
                                    :src="audioSrc(user)"
                                />
                            </figure>
                        </template>
                    </template>
                </div>
                <tippy
                    :to="'#user-' + user.uid"
                    interactive
                    theme="light"
                    :animate-fill="false"
                    placement="bottom"
                    distant="7"
                    animation="fade"
                    trigger="click"
                >
                    <template #content>
                        <UserCardView
                            :user-info="user"
                            from="conference"
                            @close="closeUserCard"
                        />
                    </template>
                </tippy>
            </li>
        </ul>
        <div class="other-btn" v-if="selfUserInfo._isHost">
            <span class="friend-btn btn" @click="handleAdd(0)">
                {{ $t("voip.add_friends") }}
            </span>
            <span
                class="group-btn btn"
                v-if="meetingGroupId"
                @click="handleAdd(1)"
            >
                {{ $t("voip.invite_members") }}
            </span>
            <Dropdown
                v-else
                class="group-btn btn"
                trigger="click"
                transfer-class-name="hover-item"
                @on-click="handleBindingGroup"
            >
                <span>{{ $t("voip.bind_group_btn") }}</span>
                <template #list>
                    <DropdownMenu>
                        <DropdownItem name="create">{{
                            $t("voip.creat_group")
                        }}</DropdownItem>
                        <DropdownItem name="bind">{{
                            $t("voip.bind_group")
                        }}</DropdownItem>
                    </DropdownMenu>
                </template>
            </Dropdown>
        </div>
    </div>
</template>

<script>
import {
    joinMeetingList,
    acceptJoin,
    refuseJoin,
    getGenerateShortUrlV1,
    friendsCheckBatch,
    filterGroupMembers,
    bindConferenceAndGroup,
    getUserVipInfo,
    createConferenceGroup,
} from "@/axios";
import { tipsContent } from "../../common/Tips";
// import { ipcRenderer } from "../../../platform";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";
import ConferenceKickoffMemberMessageContent from "@/wfc/av/messages/conferenceKickoffMemberMessageContent";
import AddOrInviteFriend from "./AddOrInviteFriend";
import SetGroupName from "./SetGroupName";
import UserCardView from "../../main/user/UserCardView";
import { vOnClickOutside } from "@vueuse/components";

import wfc from "@/wfc/client/wfc";
import store from "@/store";
export default {
    props: {
        showParticipantList: {
            type: Boolean,
            required: true,
        },
        participantUserInfos: {
            type: Array,
            required: true,
        },
        permissionList: {
            type: Object,
            required: true,
        },
        myMeetingData: {
            type: Object,
            required: true,
        },
        selfUserInfo: {
            type: Object,
            required: true,
        },
        session: {
            type: Object,
            required: true,
        },
    },
    directives: {
        vOnClickOutside,
    },
    components: {
        UserCardView,
    },
    data() {
        return {
            hoverUid: "",
            requestList: [],
            meetingGroupId: "",
        };
    },
    created() {
        this.getRequestList();
        this.getInviteBtn();
    },
    computed: {
        videoSrc() {
            return (user) => {
                if (user) {
                    return require(`@/assets/images/conference-video-${
                        !user._isVideoMuted && !user._isAudience
                            ? "open"
                            : "close"
                    }.png`);
                } else {
                    return require(`@/assets/images/conference-video-${
                        this.session.videoMuted ? "close" : "open"
                    }.png`);
                }
            };
        },
        audioSrc() {
            return (user) => {
                if (user) {
                    return require(`@/assets/images/conference-audio-${
                        !user._isAudioMuted && !user._isAudience
                            ? "open"
                            : "close"
                    }.png`);
                } else {
                    return require(`@/assets/images/conference-audio-${
                        this.session.audioMuted ? "close" : "open"
                    }.png`);
                }
            };
        },
        roleName() {
            return (user) => {
                return user._isHost && user.uid === this.selfUserInfo.uid
                    ? `(${this.$t("voip.host")}、${this.$t("voip.me")})`
                    : user._isHost
                    ? `( ${this.$t("voip.host")} )`
                    : user.uid === this.selfUserInfo.uid
                    ? `( ${this.$t("voip.me")} )`
                    : "";
            };
        },
    },
    methods: {
        // 隐藏成员弹窗
        hideParticipantList() {
            this.$emit("hideParticipantList");
        },
        invite() {
            this.$emit("invite");
        },
        // 鼠标滑入滑出样式
        changeShowRemove(item) {
            this.hoverUid = item && !item._isHost ? item.uid : "";
        },
        // 获取是否有申请入会成员
        async getRequestList() {
            try {
                let res = await joinMeetingList({
                    code: this.myMeetingData.code,
                });
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.requestList = data;
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {}
        },
        closeUserCard(user) {
            this.$refs["userCardTippy-" + user.uid][0]._tippy.hide();
        },
        // 操作同意或拒绝 type:1 拒绝
        async handleAction(item, type) {
            try {
                let methodsName = {
                    0: acceptJoin,
                    1: refuseJoin,
                };
                let submit = {
                    applyUserId: item.uid,
                    code: this.myMeetingData.code,
                    shortUrl: "",
                };
                let originalLink = `${
                    this.mixinHttps
                }/launchMeet/index.html/?${window.btoa(
                    this.myMeetingData.code.replace(/\s*/g, "")
                )}`;
                console.log(originalLink);
                // 生成短连接
                let {
                    code: shortCode,
                    data: shortData,
                    message: shortMsg,
                } = await this.getShortUrl(originalLink);
                if (shortCode === "000000") {
                    submit.shortUrl = shortData.shortUrl;
                } else {
                    this.$Message.error(shortMsg);
                    return;
                }
                let res = await methodsName[type](submit);
                let { code, message } = res.data;
                if (code === "000000") {
                    this.getRequestList();
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        //获取最新用户信息
        updateParticipants(user) {
            let userInfo = wfc.getUserInfo(user.uid, true);
            console.log(userInfo);
        },
        // 生成短连接
        async getShortUrl(url) {
            try {
                const res = await getGenerateShortUrlV1({
                    userId: wfc.getUserId(),
                    longUrl: url,
                });
                let { data, message, code } = res.data;
                return { data, message, code };
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
                return null;
            }
        },
        // 移除好友
        kickoff(user) {
            this.$alert({
                content: this.$t("voip.remove_participants", [
                    this.mixinGetUserName(user),
                ]),
                isText: true,
                cancelCallback: () => {},
                confirmCallback: () => {
                    let conv = new Conversation(0, user.uid, 0);
                    let msg = new ConferenceKickoffMemberMessageContent();
                    msg.callId = this.session.callId;
                    msg.from = this.selfUserInfo.uid;
                    msg.to = user.uid;
                    msg.content = JSON.stringify({
                        callId: this.session.callId,
                    });
                    wfc.sendConversationMessage(conv, msg);
                },
            });
        },
        // 点击添加按钮 type:0 添加好友 type:1 创建群组
        async handleAdd(type) {
            let ids = this.participantUserInfos.map((item) => item.uid);
            let participantIds = ids.filter(
                (item) => item !== this.selfUserInfo.uid
            );
            if (!participantIds.length) {
                this.$Message.warning(
                    !type
                        ? this.$t("voip.no_new_friends")
                        : this.$t("voip.no_new_members")
                );
                return;
            }
            let users = this.participantUserInfos.filter((item) => {
                return participantIds.includes(item.uid);
            });
            // 没有创建过群组
            if (!this.meetingGroupId && type) {
                this.handleCreateGroup(users);
                return;
            }
            try {
                //请求接口
                let { code, data, message } = type
                    ? await this.getFilterGroupMembers({
                          groupId: this.meetingGroupId,
                          userIds: JSON.stringify(participantIds),
                      })
                    : await this.getFriendsCheckBatch({
                          friendUserIdBatch: JSON.stringify(participantIds),
                      });

                if (code === "000000") {
                    // 有新增的成员或者好友
                    if (
                        (data && data.userIds && data.userIds.length && type) ||
                        (data.length && !type)
                    ) {
                        let usersList = this.participantUserInfos.filter(
                            (item) => {
                                return !type
                                    ? data.includes(item.uid)
                                    : data.userIds.includes(item.uid);
                            }
                        );

                        this.$modal.show(
                            AddOrInviteFriend,
                            {
                                title: type
                                    ? this.$t("voip.invite_members")
                                    : this.$t("voip.add_friends"),
                                type,
                                users: usersList,
                            },
                            null,
                            {
                                name: "AddOrInviteFriend-modal",
                                width: 360,
                                height: 400,
                                clickToClose: false, // 点击模态框是否关闭
                            },
                            {
                                "before-close": (event) => {
                                    // 发送邀请或者请求
                                    if (event.params) {
                                        this.sendAddOrInvite(usersList, type);
                                    }
                                },
                            }
                        );
                    } else {
                        this.$Message.warning(
                            !type
                                ? this.$t("voip.no_new_friends")
                                : this.$t("voip.no_new_members")
                        );
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 点击绑定
        handleBindingGroup(name) {
            this.hideParticipantList();
            if (name === "create") {
                this.handleAdd(1);
            } else {
                // 点击绑定群组，展示本地群组列表
                this.$pickGroups({
                    localGroup: true,
                    singleChoice: true,
                    successCB: (groups) => {
                        this.handleBindConferenceAndGroup(groups[0].groupId);
                    },
                });
            }
        },
        // 检测当前是否创建过群
        async getInviteBtn() {
            try {
                let { code, message, data } = await this.getFilterGroupMembers(
                    {}
                );
                if (code === "000000") {
                    this.meetingGroupId = data.groupId;
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 过滤需要进群的用户
        async getFilterGroupMembers({
            groupId,
            userIds = "[]",
            imCycleMeetingId,
        }) {
            try {
                let res = await filterGroupMembers({
                    groupId,
                    imCycleMeetingId,
                    imMeetingId: this.myMeetingData.id,
                    userIds,
                });
                const { code, data, message } = res.data;
                return { code, data, message };
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
                console.log(error);
            }
        },
        // 判断是否是好友关系
        async getFriendsCheckBatch({ friendUserIdBatch }) {
            try {
                let res = await friendsCheckBatch({
                    friendUserIdBatch,
                    userId: wfc.getUserId(),
                });
                const { code, data, message } = res.data;
                return { code, data, message };
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
                console.log(error);
            }
        },
        // 绑定当前会议内创建的群
        handleBindConferenceAndGroup(groupId) {
            bindConferenceAndGroup({
                imGroupId: groupId,
                imMeetingId: this.myMeetingData.id,
                imCycleMeetingId: "",
            }).then((res) => {
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.meetingGroupId = data;
                    //   this.$Message.success('绑定成功')
                } else {
                    this.$Message.error(message);
                }
            });
        },
        // users 不包含自己（主持人）
        async handleCreateGroup(users) {
            const { isAppCharge, groupMemberLimit, groupCreateLimit } =
                this.permissionList;
            if (isAppCharge) {
                if (users.length + 1 > groupMemberLimit) {
                    this.$alert({
                        content: tipsContent[9],
                        height: 150,
                        cancelText: "",
                    });
                    return;
                }
                try {
                    let res = await getUserVipInfo({ userId: wfc.getUserId() });
                    const { code, message, data } = res.data;
                    if (code === "000000") {
                        if (data.groupCountCreatedBy < groupCreateLimit) {
                            //进行下一步创建群组
                            this.nextCreateConversation(users);
                        } else {
                            this.$alert({
                                content: tipsContent[10],
                                height: 150,
                                cancelText: "",
                            });
                        }
                    } else {
                        this.$Message.error(message);
                    }
                } catch (error) {
                    console.log(error);
                    this.$Message.error(this.$t("common.error_later"));
                }
            } else {
                this.nextCreateConversation(users);
            }
        },
        // 下一步 弹窗展示修改群名称
        nextCreateConversation(users) {
            this.$modal.show(
                SetGroupName,
                {
                    title: this.$t("voip.edit_name"),
                    defaultGroupName: this.myMeetingData.title,
                },
                null,
                {
                    name: "SetGroupName-modal",
                    width: 300,
                    height: 180,
                    clickToClose: false, // 点击模态框是否关闭
                },
                {
                    "before-close": (event) => {
                        if (event.params) {
                            createConferenceGroup({
                                imMeetingId: this.myMeetingData.id,
                                userId: wfc.getUserId(),
                                memberIds: users.map((item) => item.uid),
                                groupName: event.params.groupName || "",
                            }).then((res) => {
                                let { message, code } = res.data;
                                if (code !== "000000") {
                                    this.$Message.error(message);
                                }
                            });
                        }
                    },
                }
            );
        },
        // 下一步 发送添加好友请求，或者发送邀请进群的请求
        sendAddOrInvite(users, type) {
            if (type) {
                // 把该好友拉进群组 ,需要群限制判断
                let ids = users.map((u) => u.uid);
                const { isAppCharge, groupMemberLimit } = this.permissionList;
                // 会员机制开启
                if (isAppCharge) {
                    let groupMembers = wfc.getGroupMemberIds(
                        this.meetingGroupId,
                        true
                    );
                    let totalMembers = groupMembers.length + ids.length;
                    if (totalMembers > groupMemberLimit) {
                        this.$alert({
                            content:
                                totalMembers > 800
                                    ? tipsContent[6]
                                    : tipsContent[7],
                            height: 150,
                            cancelText: "",
                        });
                    } else {
                        this.nextAddMembers(ids, this.meetingGroupId);
                    }
                } else {
                    this.nextAddMembers(ids, this.meetingGroupId);
                }
            } else {
                // 发送好友请求
                for (let i = 0; i < users.length; i++) {
                    let conversation = new Conversation(
                        ConversationType.Single,
                        users[i].uid,
                        0
                    );
                    wfc.sendFriendRequest(
                        conversation.target,
                        "",
                        null,
                        () => {
                            let requestText = this.$t(
                                "friend_request.request_add_friends",
                                [this.mixinGetUserName(this.selfUserInfo)]
                            );

                            let textMessageContent = new TextMessageContent();
                            textMessageContent.content = requestText;
                            //   console.log("发送成功回调", textMessageContent);
                            wfc.sendConversationMessage(
                                conversation,
                                textMessageContent
                            );
                        },
                        (err) => {
                            console.log("发送失败回调", err);
                        }
                    );
                }
            }
        },
        // 下一步 执行拉成员进群方法
        nextAddMembers(ids, groupId) {
            wfc.addGroupMembers(groupId, ids, null, [0], null, () => {
                let groupMembers = wfc.getGroupMemberIds(groupId, true);
                store.updateGroupPortraitFromAjax(groupId, groupMembers);
            });
        },
    },
};
</script>
<style lang="less" scoped>
.participant-list-container {
    width: 420px;
    height: 100%;
    background: #fff;
    z-index: 999;
    &.active {
        display: flex;
        flex-direction: column;
    }
    h4 {
        font-family: "PingFang SC";
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        padding: 8px;
        color: #999999;
    }
    .request-list {
        background: #fff7ed;
        li {
            display: flex;
            padding: 8px 8px 8px 18px;
            display: flex;
            align-items: center;
            position: relative;
            &::before {
                position: absolute;
                content: "";
                width: 6px;
                height: 6px;
                left: 6px;
                background: #ff103b;
                transform: translateY(50%);
                border-radius: 50%;
            }
            figure {
                width: 40px;
                height: 40px;
                overflow: hidden;
                border-radius: 50%;
                margin-right: 10px;
                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }
            .name {
                flex: 1;
            }

            .btn {
                display: flex;
                margin-left: 10px;
                span {
                    width: 64px;
                    height: 28px;
                    left: 217px;
                    top: 98px;
                    border-radius: 5px;
                    text-align: center;
                    line-height: 28px;
                    font-style: normal;
                    font-weight: 500;
                    font-size: 14px;
                }
                .agree {
                    color: #fff;
                    background: #1dbb88;
                }
                .reject {
                    background: #e0e0e0;
                    margin-left: 12px;
                    color: #333333;
                }
            }
        }
    }

    .participants-list {
        overflow-y: auto;
        flex: 1;
        .action-img {
            width: 28px;
            height: 28px;
            object-fit: contain;
            display: block;
        }
        li {
            padding: 10px 8px;
        }
        li:hover {
            background: #eceef4;
        }
        //成员列表样式
        .participant-user {
            display: flex;
            align-items: center;

            .name-info {
                flex: 1;
                .name {
                    font-family: "PingFang SC";
                    font-style: normal;
                    font-weight: 400;
                    font-size: 14px;
                    line-height: 22px;
                    color: #333333;
                }
                .mine-host {
                    font-size: 12px;
                    line-height: 20px;
                    vertical-align: middle;
                    color: #999;
                }
            }
            .avatar-container {
                width: 40px;
                height: 40px;
                display: blocks;
                margin-right: 10px;
                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }
            }
            .remove {
                height: 24px;
                padding: 0 7px;
                border: 1px solid #ff5758;
                box-sizing: border-box;
                border-radius: 12px;
                font-style: normal;
                font-weight: 500;
                font-size: 12px;
                line-height: 22px;
                color: #ff5758;
                &:hover {
                    background: #ff5758;
                    color: #fff;
                }
            }
        }
    }

    .action-item {
        margin-bottom: 10px;
        height: 50px;
        display: flex;
        padding: 5px 0 0 10px;
        align-items: center;

        .icon {
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 3px;
            border: 1px dashed #d6d6d6;
            margin-right: 10px;
        }
    }
    .other-btn {
        display: flex;
        margin: 40px 10px 20px;
        position: relative;
        .btn {
            display: flex;
            align-items: center;
            text-align: center;
            flex: 1;
            height: 40px;
            line-height: 26px;
            border: 2px solid #1dbb88;
            border-radius: 4px;
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 500;
            font-size: 13px;
            color: #1dbb88;
            padding-left: 10px;
            justify-content: center;

            &::before {
                content: "";
                width: 20px;
                height: 20px;
                margin-right: 3px;
                background: url(../../../assets/images/add-friend-meet.svg)
                    no-repeat center;
                background-size: 100%;
            }
        }
        .group-btn {
            margin-left: 10px;
            .hover-item {
                .ivu-dropdown-item:hover {
                    background: #1dbb88;
                    color: #fff;
                }
            }
            &::before {
                background: url(../../../assets/images/add-group-meet.svg)
                    no-repeat center;
                background-size: 100%;
            }
        }

        .select-group {
            width: 240px;
            padding: 20px;
            border-radius: 5px;
            position: absolute;
            right: 0px;
            z-index: 7;
            background: #fff;
            bottom: 44px;
            display: flex;
            flex-direction: column;
            box-shadow: 0px 0px 5px 2px rgba(148, 148, 148, 0.3);
            button {
                border: none;
                height: 42px;
                text-align: center;
                line-height: 42px;
                background: #fff;
                font-size: 13px;
                &:hover {
                    color: #1dbb88;
                }
                &.bind-btn {
                    border-top: 1px solid #f7f7f7;
                }
            }
            i {
                position: absolute;
                top: 0;
                right: 0;
                z-index: 8;
            }
        }
    }
    .export-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 16px 20px 20px;
        height: 40px;
        line-height: 26px;
        border-radius: 4px;
        background: #1dbb88;
        font-size: 13px;
        color: #fff;
        font-weight: 500;
        em {
            width: 24px;
            height: 24px;
            margin-right: 8px;
            &.vip-icon-0 {
                background: url("../../../assets/images/vip-0.png") no-repeat
                    center center;
                background-size: 100%;
            }
            &.vip-icon-1 {
                background: url("../../../assets/images/vip-1.png") no-repeat
                    center center;
                background-size: 100%;
            }
            &.vip-icon-2 {
                background: url("../../../assets/images/vip-2.png") no-repeat
                    center center;
                background-size: 100%;
            }
            &.vip-icon-3 {
                background: url("../../../assets/images/vip-3.png") no-repeat
                    center center;
                background-size: 100%;
            }
            &.vip-icon-4 {
                background: url("../../../assets/images/vip-4.png") no-repeat
                    center center;
                background-size: 100%;
            }
        }
    }
}
</style>
