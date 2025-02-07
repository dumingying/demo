<template>
    <div class="conference-members-page">
        <div class="search-input-container">
            <i class="search-icon"></i>
            <input
                id="searchInput"
                ref="input"
                autocomplete="off"
                v-model="filterQuery"
                @keydown.esc="cancel"
                type="text"
                :placeholder="$t('common.search')"
            />
        </div>
        <div class="list-wrap">
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
                            <span class="agree" @click="handleAction(item, 0)">
                                {{ $t("common.agree") }}
                            </span>
                            <span class="reject" @click="handleAction(item, 1)">
                                {{ $t("common.decline") }}
                            </span>
                        </div>
                    </li>
                </ul>
            </template>
            <h4>{{ $t("voip.attendees_member") }}</h4>
            <ul class="member-list" ref="member-list">
                <template v-if="membersList && membersList.length">
                    <li
                        v-for="(item, index) in membersList"
                        :key="index"
                        :class="{ hover: hoverUid === item.uid }"
                        @mouseenter.self="changeShowRemove(item)"
                        @mouseleave.self="changeShowRemove(0)"
                    >
                        <figure class="portrait">
                            <img
                                @error="mixinImgUrlAlt"
                                draggable="false"
                                :src="mixinDefaultPortrait(item.portrait)"
                            />
                        </figure>
                        <span class="name">{{ mixinGetUserName(item) }}</span>
                        <span class="host" v-if="item._isHost">{{
                            $t("voip.host")
                        }}</span>
                        <span
                            class="remove"
                            @click.stop="kickoff(item)"
                            v-if="
                                hoverUid === item.uid &&
                                selfUserInfo._isHost &&
                                !item._isHost
                            "
                        >
                            {{ $t("voip.remove_member") }}
                        </span>
                        <template v-if="hoverUid !== item.uid">
                            <!-- 自己的状态 -->
                            <template v-if="item.uid === selfUserInfo.uid">
                                <figure v-if="!session.audioMuted">
                                    <img
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_audio.png"
                                    />
                                </figure>
                                <figure v-if="!session.videoMuted">
                                    <img
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_video.png"
                                    />
                                </figure>
                            </template>
                            <!-- 其他成员的状态 -->
                            <template v-else>
                                <figure
                                    v-if="
                                        !item._isAudioMuted && !item._isAudience
                                    "
                                >
                                    <img
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_audio.png"
                                    />
                                </figure>
                                <figure
                                    v-if="
                                        !item._isVideoMuted && !item._isAudience
                                    "
                                >
                                    <img
                                        class="action-img"
                                        draggable="false"
                                        src="@/assets/images/av_conference_video.png"
                                    />
                                </figure>
                            </template>
                        </template>
                    </li>
                </template>
            </ul>
        </div>
        <div class="footer-wrap">
            <span class="btn" @click.stop="invite">{{
                $t("voip.invite")
            }}</span>
            <template v-if="selfUserInfo._isHost">
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
                    @on-click="handleBindingGroup"
                    trigger="click"
                    transfer-class-name="hover-item"
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
                <!-- <div class="export-btn btn"
             @click="exportExcel">
          <em v-if="permissionList.isAppCharge"
              :class="`vip-icon-${permissionList.privilegeExportConferenceVipLevel}`"></em>
          参会信息导出
        </div> -->
            </template>
        </div>
    </div>
</template>

<script>
import ConferenceKickoffMemberMessageContent from "../../wfc/av/messages/conferenceKickoffMemberMessageContent";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import ConversationType from "@/wfc/model/conversationType";
import AddOrInviteFriend from "./conference/AddOrInviteFriend";
import SetGroupName from "./conference/SetGroupName";
import Conversation from "@/wfc/model/conversation";
import wfc from "@/wfc/client/wfc";
import store from "@/store";

import { tipsContent } from "../common/Tips";

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

export default {
    props: {
        session: {
            type: Object,
        },
        myMeetingData: {
            type: Object,
            required: true,
        },
        selfUserInfo: {
            type: Object,
        },
        participantUserInfos: {
            type: Array,
        },
    },
    data() {
        return {
            filterQuery: "",
            hoverUid: "",
            requestList: [],
            userId: "",
            meetingGroupId: "",
        };
    },
    computed: {
        membersList() {
            if (this.filterQuery) {
                return store.filterConferenceMember(
                    this.participantUserInfos,
                    this.filterQuery
                );
            } else {
                return this.participantUserInfos;
            }
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
    },
    created() {
        this.getRequestList();
        this.getInviteBtn();
    },
    methods: {
        // 移除参与者
        kickoff(user) {
            this.$alert({
                content: this.$t("voip.remove_participants", [
                    this.mixinGetUserName(user),
                ]),
                isText: true,
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
                // console.log(originalLink);
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
                                    ? $t("voip.invite_members")
                                    : $t("voip.add_friends"),
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
                let { code, message } = res.data;
                if (code === "000000") {
                    this.meetingGroupId = groupId;
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
                    title: $t("voip.edit_name"),
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
                                groupName: event.params.groupName,
                            }).then((res) => {
                                let { message, code, data } = res.data;
                                if (code === "000000") {
                                    this.meetingGroupId = data.groupId;
                                } else {
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
        cancel() {
            this.filterQuery = "";
        },
        invite() {
            this.$emit("invite");
        },
    },
};
</script>
<style lang="less" scoped>
.conference-members-page {
    width: 95%;
    height: calc(100% - 128px);
    margin: 0 auto;
    border-radius: 10px;
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    background-color: rgba(61, 74, 93, 0.8) !important;
    position: relative;

    .search-input-container {
        width: 100%;
        padding: 10px 22px 0;
        position: relative;
        box-sizing: border-box;
        input {
            width: 100%;
            height: 36px;
            padding: 0 8px 0 26px;
            text-align: left;
            flex: 1;
            border: 1px solid #e5e5e5;
            border-radius: 3px;
            outline: none;
            background-color: #eeeeee;
            &:active,
            &:focus {
                border: 1px solid #1dbb88;
            }
        }
        .search-icon {
            position: absolute;
            top: 20px;
            left: 30px;
            width: 16px;
            height: 16px;
            z-index: 9;
            font-size: 14px;
            &::before {
                position: absolute;
                content: "";
                width: 16px;
                height: 16px;
                display: block;
                background: url(../../assets/images/search-icon.png);
                background-size: 100% auto;
            }
        }
    }
    .list-wrap {
        width: 100%;
        height: calc(100% - 52px);
        padding: 10px 22px 0;
        overflow: auto;
        h4 {
            color: #d2d2d2;
            font-size: 14px;
            margin: 10px 0;
        }
    }
    .member-list {
        width: 100%;
        margin: 10px 0;
        li {
            margin-top: 8px;
            padding: 0 5px;
            box-sizing: border-box;
            height: 48px;
            display: flex;
            align-items: center;
            box-sizing: border-box;
            .portrait {
                width: 32px;
                height: 32px;
                vertical-align: middle;
                border-radius: 50%;
                overflow: hidden;
                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }
            .name {
                font-style: normal;
                font-weight: 500;
                font-size: 16px;
                line-height: 20px;
                color: #ffffff;
                margin: 0 8px 0 12px;
                vertical-align: middle;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                word-break: break-all;
                flex: 1;
            }
            .host {
                border: 1px solid #1dbb88;
                box-sizing: border-box;
                border-radius: 12px;
                height: 24px;
                line-height: 20px;
                padding: 0 8px;
                color: #1dbb88;
                vertical-align: middle;
            }
            figure {
                width: 24px;
                height: 24px;
                margin: 0 6px;
                img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
            }
            &.hover {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                cursor: pointer;
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
    .request-list {
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
                width: 32px;
                height: 32px;
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
                color: #fff;
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
    .footer-wrap {
        width: calc(100% - 20px);
        margin: 0 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
        border-top: 1px solid #696969;
        .btn {
            display: inline-block;
            text-align: center;
            letter-spacing: 1px;
            margin: 0 10px;
            min-width: 90px;
            height: 32px;
            line-height: 32px;
            padding: 0 10px;
            border: 1px solid #fff;
            border-radius: 4px;
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 500;
            font-size: 12px;
            color: #fff;
            &:hover {
                border: 1px solid #1dbb88;
                color: #1dbb88;
            }
        }

        .group-btn {
            margin-left: 14px;
            .hover-item {
                .ivu-dropdown-item:hover {
                    background: #1dbb88;
                    color: #fff;
                }
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
                height: 32px;
                text-align: center;
                line-height: 32px;
                background: #fff;
                font-size: 12px;
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
        .export-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            em {
                width: 20px;
                height: 20px;
                margin-right: 8px;
                &.vip-icon-0 {
                    background: url("../../assets/images/vip-0.png") no-repeat
                        center center;
                    background-size: 100%;
                }
                &.vip-icon-1 {
                    background: url("../../assets/images/vip-1.png") no-repeat
                        center center;
                    background-size: 100%;
                }
                &.vip-icon-2 {
                    background: url("../../assets/images/vip-2.png") no-repeat
                        center center;
                    background-size: 100%;
                }
                &.vip-icon-3 {
                    background: url("../../assets/images/vip-3.png") no-repeat
                        center center;
                    background-size: 100%;
                }
                &.vip-icon-4 {
                    background: url("../../assets/images/vip-4.png") no-repeat
                        center center;
                    background-size: 100%;
                }
            }
        }
    }
}
</style>
