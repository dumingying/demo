<!-- 当前页面 历史会议详情页面 -->
<!-- 1、用户历史列表中对应详情页面展示 -->
<!-- 2、用户日历列表中历史会议详情弹窗展示 添加 props  from='calendar' -->
<template>
    <div
        :class="['conference-view', from === 'calendar' ? 'calendar-wrap' : '']"
    >
        <div class="history-conference-detail-view" v-if="currentDetail">
            <div class="header">
                <h3>
                    <p>{{ $t("voip.meeting_details") }}</p>
                    <span
                        class="close-btn"
                        v-if="from === 'calendar'"
                        @click="handlerClose"
                    >
                        <Icon type="ios-close" style="font-size: 40px" />
                    </span>
                </h3>
            </div>
            <div class="meeting-info-wrap">
                <div class="meeting-info">
                    <p class="title">{{ meetingDetail.imMeetingTitle }}</p>
                    <span class="delete-btn" @click="handleDelete"></span>
                    <div
                        class="more-meeting-wrap"
                        v-if="
                            meetingDetail.isCycle &&
                            meetingDetail.imCycleMeetingDetailDtoList &&
                            meetingDetail.imCycleMeetingDetailDtoList.length
                        "
                    >
                        <p class="item">
                            {{
                                formatDateOrTime(
                                    imCycleMeetingInfo.startTime,
                                    "time"
                                )
                            }}-
                            {{
                                formatDateOrTime(
                                    imCycleMeetingInfo.endTime,
                                    "time"
                                )
                            }}
                        </p>
                        <div class="item more-meeting">
                            {{ $t("voip.more_schedule") }}：
                            <Select
                                v-model="imCycleMeetingId"
                                class="more-select"
                                style="width: 120px"
                                @on-change="updateDetailInfo"
                                placement="bottom"
                            >
                                <Option
                                    v-for="item in meetingDetail.imCycleMeetingDetailDtoList"
                                    :value="item.imCycleMeetingId"
                                    :key="item.imCycleMeetingId"
                                >
                                    {{
                                        formatDateOrTime(item.startTime, "date")
                                    }}
                                </Option>
                            </Select>
                        </div>
                    </div>
                    <p v-else class="item">
                        {{ resetMeetingTime(meetingDetail) }}
                    </p>
                    <p class="item">
                        {{ $t("voip.history_meeting_id") }}：
                        <span>{{ meetingDetail.imMeetingCode }}</span>
                        <em class="cycle-icon" v-if="meetingDetail.isCycle">
                            {{ $t("voip.periodic") }}
                        </em>
                    </p>
                    <template
                        v-if="
                            meetingDetail.imMeetingOwnerId === userId &&
                            meetingDetail.type
                        "
                    >
                        <div class="item">
                            {{ $t("voip.periodic_meeting") }}：
                            <em
                                v-if="
                                    permissionList.isAppCharge &&
                                    permissionList.privilegeCreateCycleConferenceVipLevel
                                "
                                :class="[
                                    `vip-icon-${permissionList.privilegeCreateCycleConferenceVipLevel}`,
                                    'vip-icon-em',
                                ]"
                                style="margin-left: 5px"
                            ></em>
                            <em
                                :class="[
                                    'public-checked-btn',
                                    {
                                        active: checkCycle,
                                        disabled: meetingDetail.cycleType,
                                    },
                                ]"
                                style="margin: 0 5px"
                                @click="changeSetCycle"
                            ></em>
                        </div>
                        <div class="item" v-if="checkCycle">
                            {{ $t("voip.frequency") }}：
                            <span>{{ frequencyStr(meetingDetail) }}</span>
                        </div>
                    </template>

                    <p class="host item">
                        {{ $t("voip.host") }}：
                        <img
                            draggable="false"
                            class="avatar"
                            :src="
                                mixinDefaultPortrait(
                                    meetingDetail.imMeetingOwnerPortrait
                                )
                            "
                        />
                        <span>
                            {{
                                mixinResetPhoneNumber(
                                    meetingDetail.imMeetingOwnerDisplayname
                                )
                            }}
                        </span>
                    </p>
                    <div class="item participant">
                        <div
                            class="participant-num"
                            @click="handlerShowParticipant"
                        >
                            {{ $t("voip.participant") }}：
                            <div
                                v-if="participantPortraitList"
                                class="avatar-wrap"
                                :style="setAvatarWrapWidth"
                            >
                                <figure
                                    v-for="(item, index) in showParticipantLIst"
                                    :key="item.imMeetingParticipantUserId"
                                    :class="['avatar', `participant-${index}`]"
                                >
                                    <img
                                        draggable="false"
                                        :src="
                                            mixinDefaultPortrait(
                                                item.imMeetingParticipantPortrait
                                            )
                                        "
                                    />
                                </figure>
                                <figure
                                    v-if="participantPortraitList > 4"
                                    :class="[
                                        'avatar',
                                        `participant-${showParticipantLIst.length}`,
                                    ]"
                                >
                                    <img
                                        src="../../../../assets/images/more-avatar.png"
                                        draggable="false"
                                    />
                                </figure>
                            </div>
                            <span v-if="meetingDetail.imMeetingParticipantsNum">
                                {{ meetingDetail.imMeetingParticipantsNum }}
                                {{ $t("voip.participant_s") }}
                            </span>
                            <span v-else>{{ $t("common.none") }}</span>
                        </div>
                    </div>
                    <p
                        v-show="meetingDetail.imMeetingDescription"
                        class="item desc"
                    >
                        {{ $t("voip.conference_overview") }}：
                        <span>{{ meetingDetail.imMeetingDescription }}</span>
                    </p>
                    <div class="item group-wrap">
                        {{ $t("voip.discuss_group") }}：
                        <Dropdown
                            v-if="!meetingDetail.imGroupId"
                            @on-click="handleBindGroup"
                            class="group-btn"
                            trigger="click"
                            transfer-class-name="hover-item"
                        >
                            <p class="empty-group">
                                {{ $t("voip.no_discussion") }}
                            </p>
                            <template #list>
                                <DropdownMenu>
                                    <DropdownItem name="create">
                                        {{ $t("voip.creat_group") }}
                                    </DropdownItem>
                                    <DropdownItem name="bind">
                                        {{ $t("voip.bind_group") }}
                                    </DropdownItem>
                                </DropdownMenu>
                            </template>
                        </Dropdown>
                        <div
                            v-else
                            class="group-content"
                            @click="goGroupConversation"
                        >
                            <figure>
                                <img
                                    @error="mixinImgUrlAlt"
                                    :src="meetingDetail.imGroupPortrait"
                                    draggable="false"
                                />
                            </figure>
                            <p>
                                {{ meetingDetail.imGroupName }}
                                <span>
                                    ({{ meetingDetail.imGroupMemberCount }})
                                </span>
                            </p>
                            <Icon
                                type="ios-arrow-forward"
                                class="more"
                                style="font-size: 20px; color: #999"
                            />
                        </div>
                    </div>
                </div>
                <!-- 会议群组 -->
                <div class="doc-header">
                    <p>
                        {{ $t("voip.files") }}
                        <span v-if="docList">({{ docList }})</span>
                    </p>
                    <div class="upload-wrap" @click="uploadFile">
                        <span>{{ $t("common.upload_document") }}</span>
                    </div>
                    <input
                        ref="cloudFileInput"
                        @change="onPickFile($event)"
                        class="icon-ion-android-attach"
                        type="file"
                        style="display: none"
                    />
                </div>
                <!-- 文档 -->
                <div class="doc-content">
                    <template
                        v-for="detail in meetingDetail.imMeetingAttachDtoList"
                        :key="detail.id"
                    >
                        <doc-item
                            :docItemInfo="detail"
                            :contextMenuDocInfo="contextMenuDocInfo"
                            @show-docItem-contextMenu="showDocItemContextMenu"
                        ></doc-item>
                    </template>

                    <div v-if="!docList" class="empty-doc">
                        {{ $t("voip.empty") }}
                    </div>
                </div>
            </div>
            <!-- 右击更多操作 -->
            <right-click-actions
                ref="menuComponents"
                :imMeetingOwnerId="meetingDetail.imMeetingOwnerId"
                @del-doc="delDoc"
                @save-cloudDisk-action="saveCloudDiskAction"
                @on-docItem-contextMenu-close="onDocItemContextMenuClose"
            ></right-click-actions>
        </div>
        <figure v-else class="empty-container">
            <img
                src="../../../../assets/images/default-bg.png"
                width="120"
                draggable="false"
            />
        </figure>
    </div>
</template>
<script>
import {
    meetingHistoryDetail,
    getCloudUsedSpace,
    delMeetingHistory,
    deleteMeetingFile,
    meetingFileToDisk,
    bindConferenceAndGroup,
    createConferenceGroup,
    changeMeeting2Cycle,
} from "@/axios";

import { tipsContent } from "@/ui/common/Tips";
import dayjs from "dayjs";
import store from "@/store";
import wfc from "@/wfc/client/wfc";

import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";

import SetGroupName from "../SetGroupName";
import SelectCycleType from "../SelectCycleType";
import DocItem from "../doc/DocItem";
import RightClickActions from "../doc/RightClickActions";

import HistoryParticipantList from "./HistoryParticipantList";
import PickHistoryConferenceParticipant from "./PickHistoryConferenceParticipant";

export default {
    components: {
        DocItem,
        RightClickActions,
    },
    data() {
        return {
            meetingDetail: "",
            imCycleMeetingId: "", // 当前周期会议
            imCycleMeetingInfo: {},
            conferenceState: store.state.conference,
            contextMenuDocInfo: null,
            checkCycle: false,
            frequency: 1,
            frequencyList: [
                { key: this.$t("voip.daily"), value: 1 },
                { key: this.$t("voip.weekly"), value: 3 },
                { key: this.$t("voip.monthly"), value: 4 },
                { key: this.$t("voip.weekday"), value: 2 },
            ],
            initLock: false,
            userId: wfc.getUserId(),
        };
    },
    props: {
        from: {
            type: String,
        },
        historyItem: {
            type: Object,
        },
    },
    computed: {
        currentDetail() {
            if (this.from === "calendar") {
                return this.historyItem;
            }
            return this.conferenceState.currentHistoryConference;
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
        frequencyStr() {
            return (item) => {
                // cycleType 0,1每天,2工作日,3每周,4每月,
                let strObj = {
                    1: this.$t("voip.daily"),
                    2: this.$t("voip.weekday"),
                    3: this.$t("voip.weekly"),
                    4: this.$t("voip.monthly"),
                };
                return strObj[item.cycleType];
            };
        },
        resetMeetingTime() {
            return (item) => {
                if (item.imMeetingStartTime && item.imMeetingEndTime) {
                    let start = item.imMeetingStartTime.substr(0, 16);
                    let end = item.imMeetingEndTime.substr(0, 16);
                    let startDate = dayjs(start).format("YYYY-MM-DD");
                    let startTime = dayjs(start).format("HH:mm");
                    let endDate = dayjs(end).format("YYYY-MM-DD");
                    let endTime = dayjs(end).format("HH:mm");
                    //   console.log(startDate, endDate)
                    if (startDate === endDate) {
                        return `${startDate} ${startTime} - ${endTime}`;
                    } else {
                        return `${startDate} ${startTime} - ${endDate} ${endTime}`;
                    }
                } else {
                    return null;
                }
            };
        },
        docList() {
            return (
                this.meetingDetail.imMeetingAttachDtoList &&
                this.meetingDetail.imMeetingAttachDtoList.length
            );
        },
        participantPortraitList() {
            return (
                this.meetingDetail.imMeetingHistoryParticipantsDtoList &&
                this.meetingDetail.imMeetingHistoryParticipantsDtoList.length
            );
        },
        showParticipantLIst() {
            return this.meetingDetail.imMeetingHistoryParticipantsDtoList.filter(
                (item, index) => index < 4
            );
        },
        setAvatarWrapWidth() {
            let length = this.showParticipantLIst.length;
            return {
                width: `${
                    (this.participantPortraitList > 4
                        ? this.showParticipantLIst.length + 1
                        : length) * 16
                }px`,
            };
        },
        formatDateOrTime() {
            return (date, type) => {
                return type === "date"
                    ? dayjs(date).format("YYYY-MM-DD")
                    : dayjs(date).format("HH:mm");
            };
        },
    },
    watch: {
        currentDetail(n, o) {
            if (n) {
                this.getDetail(n);
            }
        },
    },
    created() {
        if (this.from === "calendar") {
            this.initLock = true;
            this.getDetail(this.currentDetail);
        }
    },
    mounted() {
        // 日历视图 上传云盘成功，
        if (this.from === "calendar") {
            this.$eventBus.$on("historyMeetingUploadSuccess", () => {
                let timer = setTimeout(() => {
                    this.updateDetailInfo();
                    timer && clearTimeout(timer);
                }, 500);
            });
        }
    },
    activated() {
        // 上传云盘成功，列表进入
        this.$eventBus.$on("historyMeetingUploadSuccess", () => {
            let timer = setTimeout(() => {
                this.updateDetailInfo();
                timer && clearTimeout(timer);
            }, 500);
        });
    },
    methods: {
        showDocItemContextMenu(event, doc) {
            if (!this.$refs.menuComponents) {
                return;
            }
            this.contextMenuDocInfo = doc;
            this.$refs.menuComponents.$refs.menu.open(event, doc);
        },
        onDocItemContextMenuClose() {
            this.contextMenuDocInfo = null;
        },
        async getDetail(detail) {
            try {
                let params = {
                    userId: wfc.getUserId(),
                    imMeetingId: detail.imMeetingId,
                    imCycleMeetingId: detail.imCycleMeetingId || "",
                };
                let res = await meetingHistoryDetail(params);
                const { code, message, data } = res.data;
                if (code === "000000") {
                    this.checkCycle = data.isCycle;
                    this.frequency = data.cycleType;
                    this.imCycleMeetingId = data.imCycleMeetingId;
                    this.meetingDetail = data;
                    if (data.isCycle) {
                        this.imCycleMeetingInfo =
                            data.imCycleMeetingDetailDtoList.filter(
                                (item) =>
                                    item.imCycleMeetingId ===
                                    data.imCycleMeetingId
                            )[0];
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 点击上传文件
        async uploadFile() {
            try {
                // 获取链上文档信息
                let res = await getCloudUsedSpace({ userId: wfc.getUserId() });
                const { code, message, data } = res.data;
                if (code == "000000") {
                    let { usedSpace, totalSpace } = data;
                    if (totalSpace - usedSpace <= 0) {
                        this.$alert({
                            content:
                                this.permissionList.isAppCharge &&
                                this.permissionList.vipLevel === 4
                                    ? tipsContent[3]
                                    : tipsContent[4],
                            height: 150,
                            cancelText: "",
                        });
                        return;
                    }
                    this.$refs["cloudFileInput"].click();
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 唤起上传
        onPickFile(event) {
            this.$eventBus.$emit("historyUploadDoc", {
                files: event.target.files,
                userId: wfc.getUserId(),
                cycleMeetingId: this.imCycleMeetingId,
                meetingId: this.meetingDetail.imMeetingId,
                bindingGroupId: this.meetingDetail.imGroupId,
                callback:
                    this.from === "calendar"
                        ? () => {
                              this.handlerClose();
                          }
                        : "",
            });
            event.target.value = "";
        },
        // 点击查看参会成员
        handlerShowParticipant() {
            if (!this.participantPortraitList) return;
            this.$modal.show(
                HistoryParticipantList,
                {
                    title: this.$t("voip.participant_list"),
                    participants:
                        this.meetingDetail.imMeetingHistoryParticipantsDtoList,
                },
                null,
                {
                    name: "HistoryParticipantList-modal",
                    width: 320,
                    height: 450,
                },
                {
                    "before-close": (event) => {},
                }
            );
        },
        // 点击删除
        handleDelete() {
            this.$alert({
                title: this.$t("voip.delete_meeting"),
                content: this.$t("voip.delete_meeting_tip"),
                confirmText: this.$t("common.delete"),
                isText: true,
                confirmCallback: async () => {
                    let param = {
                        imMeetingIds: "",
                        imCycleMeetingId: "",
                    };
                    if (this.meetingDetail.isCycle) {
                        param.imCycleMeetingId = this.imCycleMeetingId;
                    }
                    param.imMeetingIds = [this.meetingDetail.imMeetingId];
                    try {
                        let res = await delMeetingHistory(param);
                        const { code, message } = res.data;
                        if (code === "000000") {
                            if (this.from === "calendar") {
                                // 关闭弹窗更新日历视图数据
                                this.handlerClose(true);
                            } else {
                                store.setCurrentHistoryConference(null);
                                this.$eventBus.$emit(
                                    "uploadHistoryConference",
                                    this.meetingDetail
                                );
                            }
                        } else {
                            this.$Message.error(message);
                        }
                    } catch (error) {}
                },
            });
        },
        // 更新数据
        updateDetailInfo() {
            this.getDetail({
                imMeetingId: this.meetingDetail.imMeetingId,
                imCycleMeetingId: this.imCycleMeetingId,
            });
        },
        // 保存当前文件到链上文档
        async saveCloudDiskAction(docInfo) {
            try {
                const res = await meetingFileToDisk({
                    cid: docInfo.attachCid,
                    cycleMeetingId: this.imCycleMeetingId,
                    fileName: docInfo.attachName,
                    meetingId: this.meetingDetail.imMeetingId,
                });
                let { code, message } = res.data;
                if (code === "000000") {
                    this.$Message.success(this.$t("common.save_success"));
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 删除当前文件
        delDoc(docInfo) {
            this.$alert({
                title: this.$t("voip.delete_document"),
                content: this.$t("voip.delete_document_tip"),
                isText: true,
                height: 160,
                cancelCallback: () => {},
                confirmCallback: async () => {
                    try {
                        const res = await deleteMeetingFile({
                            fileId: docInfo.id,
                            imMeetingId: this.meetingDetail.imMeetingId,
                        });
                        const { message, code } = res.data;
                        if (code === "000000") {
                            this.updateDetailInfo();
                        } else {
                            this.$Message.error(message);
                        }
                    } catch (error) {
                        this.$Message.error(this.$t("common.error_later"));
                    }
                },
            });
        },
        handleBindGroup(name) {
            if (this.meetingDetail.imMeetingOwnerId !== wfc.getUserId()) {
                this.$Message.warning(this.$t("voip.host_permission"));
                return;
            }
            if (name == "create") {
                this.handleCreateGroup();
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
        // 点击创建群组按钮
        handleCreateGroup() {
            let { imMeetingHistoryParticipantsDtoList } = this.meetingDetail;
            let ids = imMeetingHistoryParticipantsDtoList.map(
                (item) => item.imMeetingParticipantUserId
            );
            let participantIds = ids.filter((item) => item !== wfc.getUserId());
            if (!participantIds.length) {
                this.$Message.warning(this.$t("voip.no_new_members"));
                return;
            }
            let users = imMeetingHistoryParticipantsDtoList.filter((item) => {
                return participantIds.includes(item.imMeetingParticipantUserId);
            });
            this.nextCreateConversation(users);
            // 去创建群
        },
        // 下一步 弹窗展示修改群名称
        nextCreateConversation(users) {
            this.$modal.show(
                SetGroupName,
                {
                    title: this.$t("voip.edit_name"),
                    defaultGroupName: this.meetingDetail.imMeetingTitle,
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
                            this.showPickParticipantsModal(
                                users,
                                event.params.groupName
                            );
                        }
                    },
                }
            );
        },
        // 展示参会成员选择框
        showPickParticipantsModal(users, groupName) {
            let ids = users.map((item) => item.imMeetingParticipantUserId);
            let newUsers = store.getUserInfos(ids, "");
            this.$modal.show(
                PickHistoryConferenceParticipant,
                {
                    users: newUsers,
                    initialCheckedUsers: newUsers,
                    confirmTitle: this.$t("common.confirm"),
                },
                null,
                {
                    name: "PickHistoryConferenceParticipant-modal",
                    width: 600,
                    height: 480,
                    clickToClose: false,
                },
                {
                    "before-close": (event) => {
                        if (event.params) {
                            createConferenceGroup({
                                imMeetingId: this.meetingDetail.imMeetingId,
                                userId: wfc.getUserId(),
                                memberIds: event.params.users.map(
                                    (item) => item.uid
                                ),
                                groupName,
                            }).then((res) => {
                                let { code, message } = res.data;
                                //   6000023 群已被绑定， 更新一下
                                if (["000000", "6000023"].includes(code)) {
                                    this.$nextTick(() => {
                                        this.updateDetailInfo();
                                    });
                                } else {
                                    code === "6000023"
                                        ? this.$Message.warning(message)
                                        : this.$Message.error(message);
                                }
                            });
                        }
                    },
                }
            );
        },
        // 绑定当前会议内创建的群
        handleBindConferenceAndGroup(groupId) {
            bindConferenceAndGroup({
                imGroupId: groupId,
                imMeetingId: this.meetingDetail.imMeetingId,
                imCycleMeetingId: this.imCycleMeetingId,
            }).then((res) => {
                let { code, message } = res.data;
                //   6000023 群已被绑定， 更新一下
                if (["000000", "6000023"].includes(code)) {
                    this.$nextTick(() => {
                        this.updateDetailInfo();
                    });
                } else {
                    code === "6000023"
                        ? this.$Message.warning(message)
                        : this.$Message.error(message);
                }
            });
        },
        // 点击进入群组聊天
        goGroupConversation() {
            if (!this.meetingDetail.isInGroup) {
                this.$Message.warning(this.$t("voip.join_from_type"));
                return;
            }
            let conversation = new Conversation(
                ConversationType.Group,
                this.meetingDetail.imGroupId,
                0
            );
            let timer = setTimeout(() => {
                // 日历视图关闭弹窗
                if (this.from === "calendar") {
                    this.handlerClose();
                }
                store.setCurrentConversation(conversation);
                this.$router.replace("/home/conversation");
                timer && clearTimeout(timer);
            }, 500);
        },
        // 点击关闭弹窗
        handlerClose(type) {
            this.$modal.hide("HistoryConferenceView-modal", { isUpdate: type });
        },
        // 切换周期选择
        changeSetCycle() {
            let { isAppCharge, privilegeCreateCycleConference } =
                this.permissionList;
            if (isAppCharge && !privilegeCreateCycleConference) {
                this.$alert({
                    content: tipsContent[13],
                    cancelText: "",
                    height: 250,
                    width: 320,
                });
                return;
            }
            if (!this.meetingDetail.type) {
                this.$Message.error(this.$t("voip.change_not_tip"));
                return;
            }
            if (this.meetingDetail.cycleType) return;
            this.$modal.show(
                SelectCycleType,
                {
                    title: this.$t("voip.frequency"),
                    meetingDetail: this.meetingDetail,
                },
                null,
                {
                    name: "SelectCycleType-modal",
                    width: 380,
                    height: 280,
                    clickToClose: false, // 点击模态框是否关闭
                },
                {
                    "before-close": (event) => {
                        if (event.params && event.params.type === "confirm") {
                            this.$alert({
                                title: this.$t("common.tip"),
                                content: `<div style="max-height:100px;overflow:auto;">
                    ${this.$t("voip.change_periodic_meeting_tip")}</div>`,
                                confirmText: this.$t("common.confirm"),
                                cancelText: this.$t("common.cancel"),
                                confirmCallback: () => {
                                    // 普通会议转周期会议
                                    changeMeeting2Cycle({
                                        cycleType: event.params.cycleType,
                                        id: this.meetingDetail.imMeetingId,
                                    })
                                        .then((res) => {
                                            let { code, message, data } =
                                                res.data;
                                            if (code === "000000") {
                                                this.checkCycle = true;
                                                this.getDetail({
                                                    imMeetingId: data.id,
                                                });
                                            } else {
                                                this.$Message.error(message);
                                            }
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        });
                                },
                            });
                        }
                    },
                }
            );
        },
    },
    unmounted() {
        this.$eventBus.$off("historyMeetingUploadSuccess");
    },
    deactivated() {
        this.$eventBus.$off("historyMeetingUploadSuccess");
    },
};
</script>
<style>
.more-select.ivu-select-disabled .ivu-select-selection {
    background-color: #fff;
    color: #515a6e;
}
.more-select.ivu-select-visible .ivu-select-selection,
.more-select.ivu-select-foucsed .ivu-select-selection:hover {
    border-color: #1dbb88;
}
.more-select .ivu-select-selection .ivu-select-selected-value {
    font-weight: 500;
    color: #333333;
    background: #f3f3f3;
    border-radius: 8px;
}
.more-select .ivu-select-selection {
    border: none;
}
.conference-view .group-btn {
    flex: 1;
    width: 100%;
    position: relative;
}
</style>
<style lang="less" scoped>
.conference-view {
    flex: 1;
    background: #fff;
    .history-conference-detail-view {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    &.calendar-wrap .history-conference-detail-view {
        height: 560px;
    }

    .header {
        width: 100%;
        height: 60px;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.04);
        border-radius: 0px 10px 0px 0px;
        position: relative;
        z-index: 1;
        h3 {
            margin-top: 20px;
            font-style: normal;
            font-weight: 700;
            font-size: 18px;
            text-align: center;
            display: flex;
            align-content: center;
            justify-content: center;
        }
        .close-btn {
            position: absolute;
            width: 70px;
            font-size: 14px;
            top: 10px;
            right: 10px;
        }
    }
    .meeting-info-wrap {
        height: calc(100% - 60px);
        overflow-y: auto;
    }
    .meeting-info {
        width: 100%;
        box-sizing: border-box;
        max-width: 1000px;
        margin: 0 auto;
        padding: 10px 24px 20px;
        position: relative;
        &::after {
            content: "";
            width: calc(100% - 48px);
            height: 0.5px;
            background: #ddd;
            position: absolute;
            left: 24px;
            bottom: 0;
        }
        .title {
            font-style: normal;
            font-weight: 500;
            font-size: 16px;
            line-height: 22px;
            color: #000000;
            padding: 10px 50px 0 0;
        }
        .item {
            width: 100%;
            min-height: 30px;
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            color: #666666;
            display: flex;
            align-items: center;
            margin-top: 8px;
            span {
                font-weight: 500;
                color: #333333;
                margin-left: 6px;
            }
            .disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }
        .more-meeting {
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #666666;
        }
        .more-meeting-select {
            width: 120px;
        }
        .desc {
            align-items: flex-start;
        }
        .desc span {
            display: inline-block;
            max-width: 80%;
        }
        .delete-btn {
            width: 22px;
            height: 22px;
            position: absolute;
            top: 20px;
            right: 20px;
            background: url(../../../../assets/images/delete-all-selected.png)
                no-repeat center;
            background-size: 100%;
        }
        .default-avatar,
        .avatar {
            width: 20px;
            height: 20px;
            background: #d9d9d9;
            border-radius: 10px;
            vertical-align: middle;
            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        .participant {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            line-height: 20px;
            color: #666666;
            font-family: "PingFang SC";
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #666666;
            span {
                margin-left: 6px;
                font-style: normal;
                font-weight: 500;
                font-size: 14px;
                line-height: 20px;
                color: #333333;
            }
            .participant-num {
                display: flex;
                align-items: center;
                .avatar-wrap {
                    position: relative;
                    min-width: 20px;
                    max-width: 76px;
                    height: 20px;
                    .avatar {
                        width: 20px;
                        height: 20px;
                        overflow: hidden;
                        position: absolute;
                        border-radius: 50%;
                        border: 1px solid #fff;
                        margin-right: 0;
                        box-sizing: border-box;
                        top: 0;
                        &::after {
                            width: 100%;
                            content: "";
                        }
                        img {
                            width: 100%;
                            height: 100%;
                        }
                        &.participant-0 {
                            position: absolute;
                            left: 0;
                            z-index: 5;
                        }
                        &.participant-1 {
                            position: absolute;
                            left: 14px;
                            z-index: 4;
                        }
                        &.participant-2 {
                            left: 28px;
                            z-index: 3;
                        }
                        &.participant-3 {
                            left: 42px;
                            z-index: 2;
                        }
                        &.participant-4 {
                            left: 56px;
                            z-index: 1;
                        }
                    }
                }
            }
        }
        .export-btn {
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 500;
            font-size: 14px;
            line-height: 18px;
            color: #000000;
            em {
                width: 18px;
                height: 18px;
                display: inline-block;
                vertical-align: middle;
                margin-right: 6px;
                &.vip-icon-0 {
                    background: url("../../../../assets/images/vip-0.png")
                        no-repeat center center;
                    background-size: 100%;
                }
                &.vip-icon-1 {
                    background: url("../../../../assets/images/vip-1.png")
                        no-repeat center center;
                    background-size: 100%;
                }
                &.vip-icon-2 {
                    background: url("../../../../assets/images/vip-2.png")
                        no-repeat center center;
                    background-size: 100%;
                }
                &.vip-icon-3 {
                    background: url("../../../../assets/images/vip-3.png")
                        no-repeat center center;
                    background-size: 100%;
                }
                &.vip-icon-4 {
                    background: url("../../../../assets/images/vip-4.png")
                        no-repeat center center;
                    background-size: 100%;
                }
            }
        }
        .cycle-icon {
            margin-left: 8px;
            height: 20px;
            padding: 0 5px;
            background: rgba(29, 187, 136, 0.05);
            border: 1px solid #1dbb88;
            border-radius: 6px;
            font-family: "PingFang SC";
            text-align: center;
            font-style: normal;
            font-weight: 500;
            font-size: 12px;
            line-height: 18px;
            color: #1dbb88;
        }
    }
    .group-wrap {
        align-items: flex-start;
        .empty-group {
            flex: 1;
            line-height: 40px;
            height: 40px;
            border-radius: 8px;
            background: #f3f3f3;
            font-family: "PingFang SC";
            color: #999;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            text-align: center;
        }
        .group-content {
            flex: 1;
            line-height: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            background: #f3f3f3;
            padding: 4px 8px;
            box-sizing: border-box;
            position: relative;
            .more {
                position: absolute;
                right: 0;
            }
            figure {
                width: 32px;
                height: 32px;
                background: #f5f5f5;
                overflow: hidden;
                border-radius: 50%;
                img {
                    width: 100%;
                    height: 100%;
                }
            }
            p {
                margin-left: 4px;
                font-family: "PingFang SC";
                font-style: normal;
                font-weight: 400;
                font-size: 14px;
                line-height: 20px;
                color: rgba(51, 51, 51, 1);
            }
        }
    }
    .doc-header {
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 60px;
        font-family: "PingFang SC";
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        color: #4f4f4f;
        position: relative;
        padding: 0 24px;
        &::before {
            content: "";
            width: calc(100% - 48px);
            height: 0.5px;
            background: #ddd;
            position: absolute;
            left: 24px;
            top: 0;
        }
    }
    .upload-wrap {
        height: 28px;
        color: #1dbb88;
        mix-blend-mode: normal;
        border-radius: 20px;
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        display: flex;
        align-items: center;
        &::before {
            margin-left: 10px;
            margin-right: 5px;
            display: inline-block;
            width: 18px;
            height: 18px;
            content: "";
            background: url(../../../../assets/images/cloud-upload-icon.png)
                no-repeat center center;
            background-size: 18px;
        }
    }
    .doc-content {
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 24px;
        flex: 1;
        overflow-y: auto;
    }
    .empty-doc {
        height: 120px;
        line-height: 120px;
        font-family: "PingFang SC";
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        text-align: center;
        color: #cccccc;
    }
    .empty-container {
        flex: 1;
        width: 100%;
        height: 100%;
        background-color: #f5f6f9;
        display: flex;
        justify-content: center;
        align-items: center;
        border-top-right-radius: var(--main-border-radius);
        border-bottom-right-radius: var(--main-border-radius);
    }
}
</style>
