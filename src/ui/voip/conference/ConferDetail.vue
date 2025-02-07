<template>
    <div class="confer-detail">
        <div class="connfer_detail_nav">
            <span class="invit" @click="invite">{{ $t("voip.invite") }}</span>
            <h3>{{ $t("voip.meeting_details") }}</h3>
            <span @click="toDone" class="close-btn">
                <Icon type="ios-close" style="font-size: 40px" />
            </span>
        </div>
        <div class="connfer_detail_code">
            <ul class="detail">
                <li class="action-item title m-top" @click="handleEdit(0)">
                    {{ meetingDetail.imMeetingTitle }}
                </li>
                <li class="action-item m-top more-btn">
                    <span class="name">{{ $t("voip.start_time") }}</span>
                    <div
                        class="content"
                        v-if="
                            meetingDetail.imMeetingOwnerId === userId &&
                            meetingDetail.type
                        "
                    >
                        <DatePicker
                            confirm
                            type="datetime"
                            placement="left-start"
                            format="yyyy-MM-dd HH:mm"
                            :open="openStart"
                            :placeholder="$t('voip.select_start_date_time')"
                            :value="selectedStartTime"
                            :options="options3"
                            :time-picker-options="{ steps: [0, 15, 30, 45] }"
                            @on-change="handleChangeStart"
                            @on-clear="handleClear('start', 1)"
                            @on-ok="handleOk('start')"
                        >
                            <span @click="handleClick('start')">
                                {{
                                    selectedStartTime ||
                                    meetingDetail.imMeetingStartTime
                                }}
                            </span>
                        </DatePicker>
                        <Icon type="ios-arrow-forward" class="more-icon-btn" />
                    </div>
                    <span v-else>{{ meetingDetail.imMeetingStartTime }}</span>
                </li>
                <li class="action-item b-top more-btn">
                    <span class="name">{{ $t("voip.end_time") }}</span>
                    <div
                        class="content"
                        v-if="
                            meetingDetail.imMeetingOwnerId === userId &&
                            meetingDetail.type
                        "
                    >
                        <DatePicker
                            confirm
                            type="datetime"
                            placement="left-start"
                            format="yyyy-MM-dd HH:mm"
                            :open="openEnd"
                            :placeholder="$t('voip.select_end_date_time')"
                            :value="selectedEndTime"
                            :options="options4"
                            :time-picker-options="{ steps: [0, 15, 30, 45] }"
                            @on-change="handleChangeEnd"
                            @on-clear="handleClear('end', 1)"
                            @on-ok="handleOk('end')"
                        >
                            <span @click="handleClick('end')">
                                {{
                                    selectedEndTime ||
                                    meetingDetail.imMeetingEndTime
                                }}
                            </span>
                        </DatePicker>
                        <Icon type="ios-arrow-forward" class="more-icon-btn" />
                    </div>
                    <span v-else>{{ meetingDetail.imMeetingEndTime }}</span>
                </li>
                <li class="action-item duration b-top">
                    <span class="name">{{ $t("voip.meeting_duration") }}</span>
                    <span class="time"> {{ timeCompu }}</span>
                </li>
                <li class="action-item code m-top">
                    <span class="name">{{ $t("voip.meeting_id") }}</span>
                    <span class="value">{{ meetingDetail.imMeetingCode }}</span>
                </li>
                <li class="action-item desc b-top">
                    <span class="name">
                        {{ $t("voip.conference_overview") }}
                    </span>
                    <p class="desc-wrap" @click="handleEdit(1)">
                        <span
                            :class="{
                                'normal-text':
                                    !meetingDetail.imMeetingDescription,
                            }"
                        >
                            {{
                                meetingDetail.imMeetingDescription ||
                                $t("voip.no_description")
                            }}
                        </span>
                    </p>
                </li>
                <li
                    class="action-item b-top"
                    v-if="
                        meetingDetail.isPasswordNeed && meetingDetail.password
                    "
                >
                    <span class="name">{{ $t("voip.meeting_pw") }}</span>
                    <span class="value">
                        {{ meetingDetail.password }}
                        <Icon
                            class="copy-pass-word-btn"
                            @click="handleCopyPassWord"
                            type="md-copy"
                        />
                    </span>
                </li>
                <li
                    class="action-item b-top"
                    v-if="
                        meetingDetail.imMeetingOwnerDisplayname &&
                        meetingDetail.imMeetingOwnerId !== userId
                    "
                >
                    <span class="name">{{ $t("voip.host") }}</span>
                    <span class="value new-single-line">
                        {{
                            mixinHtmlEncode(
                                mixinResetPhoneNumber(
                                    meetingDetail.imMeetingOwnerDisplayname
                                )
                            )
                        }}
                    </span>
                </li>
                <!-- 指定参会成员 -->
                <li
                    class="more-btn action-item m-top"
                    @click="handlerDesignatedMember"
                >
                    <span class="name">{{ $t("voip.private_meeting") }}</span>
                    <span class="content">
                        <em
                            v-if="
                                permissionList.isAppCharge &&
                                permissionList.privilegeDesignateParticipantVipLevel
                            "
                            :class="[
                                `vip-icon-${permissionList.privilegeDesignateParticipantVipLevel}`,
                                'vip-icon-em',
                            ]"
                        ></em>
                        {{ designatedParticipantsStr }}
                        <Icon type="ios-arrow-forward" class="more-icon-btn" />
                    </span>
                </li>
                <template
                    v-if="
                        meetingDetail.imMeetingOwnerId === userId &&
                        meetingDetail.type
                    "
                >
                    <li class="action-item b-top">
                        <span class="name">
                            {{ $t("voip.periodic_meeting") }}
                        </span>
                        <span class="content">
                            <em
                                v-if="
                                    permissionList.isAppCharge &&
                                    permissionList.privilegeCreateCycleConferenceVipLevel
                                "
                                :class="[
                                    `vip-icon-${permissionList.privilegeCreateCycleConferenceVipLevel}`,
                                    'vip-icon-em',
                                ]"
                            ></em>
                            <em
                                style="margin: 0"
                                :class="[
                                    'public-checked-btn',
                                    {
                                        active: checkCycle,
                                        disabled: meetingDetail.cycleType,
                                    },
                                ]"
                                @click="changeSetCycle"
                            ></em>
                        </span>
                    </li>
                    <li
                        class="more-btn action-item b-top"
                        v-if="checkCycle"
                        @click="changeSetFrequency"
                    >
                        <span class="name">{{ $t("voip.frequency") }}</span>
                        <div class="frequency-select-wrap">
                            <span>{{ frequencyStr(meetingDetail) }}</span>
                            <Icon
                                type="ios-arrow-forward"
                                class="more-icon-btn"
                            />
                        </div>
                    </li>
                </template>
                <!-- 文档 -->
                <li class="doc-group action-item m-top more-btn">
                    <div class="doc-header">
                        <span class="name">
                            {{ $t("voip.files") }}
                            <em v-if="docListLength">({{ docListLength }})</em>
                        </span>
                        <span @click="handleDoc" class="content">
                            {{
                                !docListLength
                                    ? $t("common.upload_document")
                                    : $t("search.view_all")
                            }}
                            <Icon
                                type="ios-arrow-forward"
                                class="more-icon-btn"
                            />
                        </span>
                    </div>
                    <div class="doc-wrap" v-if="docListLength">
                        <template v-for="detail in subDocList" :key="detail.id">
                            <doc-item
                                :docItemInfo="detail"
                                :contextMenuDocInfo="contextMenuDocInfo"
                                @show-docItem-contextMenu="
                                    showDocItemContextMenu
                                "
                            ></doc-item>
                        </template>
                        <div class="upload-wrap" @click="uploadFile">
                            <span>{{ $t("common.upload_document") }}</span>
                        </div>
                    </div>
                    <input
                        @change="onPickFile($event)"
                        ref="fileInput"
                        type="file"
                        style="display: none"
                        class="icon-ion-android-attach"
                    />
                </li>
                <!-- 讨论群 -->
                <li class="group-wrap action-item m-top more-btn">
                    <span class="name">{{ $t("voip.discuss_group") }}</span>
                    <div
                        v-if="meetingDetail.imGroupId"
                        class="group-info"
                        @click="goGroupConversation"
                    >
                        <img
                            @error="mixinImgUrlAlt"
                            :src="meetingDetail.imGroupPortrait"
                            draggable="false"
                        />
                        <p class="new-single-line">
                            {{ meetingDetail.imGroupName }}
                        </p>
                        <span class="content" style="margin-left: 3px">
                            ({{ meetingDetail.imGroupMemberCount }})
                            <Icon
                                type="ios-arrow-forward"
                                class="more-icon-btn"
                            />
                        </span>
                    </div>
                    <Dropdown
                        class="group-btn"
                        v-else
                        @on-click="handleBindingGroup"
                        placement="left-end"
                        trigger="click"
                        transfer-class-name="click-item"
                    >
                        <span class="content">
                            {{ $t("voip.no") }}
                            <Icon
                                type="ios-arrow-forward"
                                class="more-icon-btn"
                            />
                        </span>
                        <template #list>
                            <DropdownMenu>
                                <DropdownItem
                                    v-for="item in bindingGroupList"
                                    :key="item.value"
                                    :name="item.name"
                                    :selected="bindType === item.value"
                                >
                                    {{ item.key }}
                                </DropdownItem>
                            </DropdownMenu>
                        </template>
                    </Dropdown>
                </li>
            </ul>
            <div class="add-confer">
                <button class="add-btn" @click="addConfer">
                    {{ $t("voip.join_meeting") }}
                </button>
                <button class="copy-btn" @click="copy">
                    {{ $t("voip.copy_meeting_info") }}
                </button>
                <button class="delete-btn" @click="deleteConfer">
                    {{ $t("voip.cancel_owner_meeting") }}
                </button>
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
</template>

<script>
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";

import EnterPassWord from "./EnterPassWord";
import RequestMeeting from "./RequestMeeting";
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import ForwardDesignatedMemberView from "./ForwardDesignatedMemberView";
import PickDesignatedMember from "./PickDesignatedMember";
import DocItem from "./doc/DocItem";
import RightClickActions from "./doc/RightClickActions";
import SetGroupName from "./SetGroupName";
import SelectCycleType from "./SelectCycleType";
import ConferAction from "./ConferAction";
import SavePathType from "@/savePathType";

import { getInviteMessageContent } from "@/ui/voip/conferenceConfig";
import { tipsContent } from "@/ui/common/Tips";
import { setItem } from "@/ui/util/storageHelper";
import { downloadOtherFile } from "@/platformHelper";
import { copyText } from "@/ui/util/clipboard";
import dayjs from "dayjs";
import wfc from "@/wfc/client/wfc";
import store from "@/store";
import {
    meetingHistoryDetail,
    getCloudUsedSpace,
    deleteMeetingFile,
    getUserVipInfo,
    createConferenceGroup,
    bindConferenceAndGroup,
    meetingFileToDisk,
    getJoinMeeting,
    getUpdateMeeting,
    getGenerateShortUrlV1,
    inviteCheck,
    removeSelfFromParticipant,
    modifyMeetingInfo,
    changeMeeting2Cycle,
    changeMeetingCycleType,
    changeMeetingScheduleTime,
    getAiSummary,
} from "@/axios";

export default {
    components: {
        DocItem,
        RightClickActions,
    },
    name: "ConferDetail",
    data() {
        return {
            userId: wfc.getUserId(),
            conversation: store.state.conversation,
            sharedContactState: store.state.contact,
            userInfo: store.state.contact.selfUserInfo,
            participateList: [],
            sharedPickState: store.state.pick,
            meetingDetail: "",
            imCycleMeetingId: "",
            bindingGroupList: [
                {
                    key: this.$t("voip.no_bind"),
                    value: 0,
                    name: "none",
                },
                {
                    key: this.$t("voip.creat_group"),
                    value: 1,
                    name: "create",
                },
                {
                    key: this.$t("voip.bind_group"),
                    value: 2,
                    name: "bind",
                },
            ],
            bindType: "", // 1 创建方式，2 绑定已有方式
            checkCycle: false,
            frequency: 1,
            frequencyList: [
                { key: this.$t("voip.daily"), value: 1 },
                { key: this.$t("voip.weekly"), value: 3 },
                { key: this.$t("voip.monthly"), value: 4 },
                { key: this.$t("voip.weekday"), value: 2 },
            ],
            openStart: false,
            openEnd: false,
            selectedStartTime: "",
            selectedEndTime: "",
            contextMenuDocInfo: null,
            options3: {
                disabledDate(date) {
                    let time = new Date(date);
                    let current = new Date(Date.now());
                    let currentTime = `${current.getFullYear()}-${
                        current.getMonth() + 1
                    }-${current.getDate()}`;
                    let time1 = new Date(currentTime);
                    return time.getTime() < time1.getTime();
                },
            },
            options4: {
                disabledDate(date) {
                    let time = new Date(date);
                    let current = new Date(Date.now());
                    let currentTime = `${current.getFullYear()}-${
                        current.getMonth() + 1
                    }-${current.getDate()}`;
                    let time1 = new Date(currentTime);
                    return time.getTime() < time1.getTime();
                },
            },
            aiLock: false,
        };
    },
    props: {
        currentMeetingInfo: {
            type: Object,
            default: () => {
                return {};
            },
        },
    },
    created() {
        // 获取数据
        this.getDetail();
    },
    computed: {
        permissionList() {
            return this.$store.state.permissionList;
        },
        // 媒体设备信息
        externalDevice() {
            return this.$store.state.deviceObj;
        },
        startTime() {
            let timeArr = this.meetingDetail.imMeetingStartTime
                .split(" ")[1]
                .split(":");
            timeArr.pop();
            return timeArr.join(":");
        },
        endTime() {
            let timeArr = this.meetingDetail.imMeetingEndTime
                .split(" ")[1]
                .split(":");
            timeArr.pop();
            return timeArr.join(":");
        },
        timeCompu() {
            var dt1 = this.meetingDetail.imMeetingStartTime; //开始时间
            var dt2 = this.meetingDetail.imMeetingEndTime; //结束时间
            if (dt1 === dt2) {
                return `0 ${this.$t("common.hour")} 0 ${this.$t(
                    "common.minute"
                )}`;
            }
            var re = this.getHoursDiff(dt1, dt2);
            var h = parseInt(re);
            var m = parseInt((re - h) * 60);
            return h && m
                ? `${h} ${this.$t("common.hour")} ${m} ${this.$t(
                      "common.minute"
                  )}`
                : h
                ? `${h} ${this.$t("common.hour")}`
                : m
                ? `${m} ${this.$t("common.minute")}`
                : "";
        },
        // cycleType 0,1每天,2工作日,3每周,4每月,
        frequencyStr() {
            return (item) => {
                let strObj = {
                    1: this.$t("voip.daily"),
                    2: this.$t("voip.weekday"),
                    3: this.$t("voip.weekly"),
                    4: this.$t("voip.monthly"),
                };
                return strObj[item.cycleType];
            };
        },
        fromatDate() {
            return (date) => dayjs(date).format("YYYY-MM-DD HH:mm");
        },
        // 文档list
        docListLength() {
            return (
                this.meetingDetail.imMeetingAttachDtoList &&
                this.meetingDetail.imMeetingAttachDtoList.length
            );
        },
        subDocList() {
            return this.docListLength
                ? this.meetingDetail.imMeetingAttachDtoList.slice(0, 2)
                : [];
        },
        activeDoc() {
            return (doc) => {
                if (!this.contextMenuDocInfo) return false;
                return doc.id === this.contextMenuDocInfo.id;
            };
        },
        currentLanguage() {
            return this.$store.state.currentLanguage;
        },
        // 选择的人数文案显示
        designatedParticipantsStr() {
            let data = this.meetingDetail.designatedParticipants;
            if (data && data.length) {
                return this.currentLanguage !== "en"
                    ? `已选${data.length}人`
                    : data.length;
            } else {
                return this.$t("voip.unlimited");
            }
        },
        // 图片
        aiIconSrc() {
            return (detail) => {
                let lang = this.currentLanguage === "en" ? "en" : "zh";
                let src1 = require(`../../../assets/images/ai-start-${lang}.png`);
                let src2 = require(`../../../assets/images/ai-refresh-${lang}.png`);
                return detail.refresh ? src2 : src1;
            };
        },
    },
    mounted() {
        // 上传云盘成功，
        this.$eventBus.$on("historyMeetingUploadSuccess", () => {
            let timer = setTimeout(() => {
                this.getDetail();
                timer && clearTimeout(timer);
            }, 500);
        });
    },
    methods: {
        setDefaultDateTime() {
            this.selectedStartTime = this.meetingDetail.imMeetingStartTime;
            this.selectedEndTime = this.meetingDetail.imMeetingEndTime;
        },
        handleClick(type) {
            this.openStart = false;
            this.openEnd = false;
            let Obj = {
                start: "openStart",
                end: "openEnd",
            };
            this[Obj[type]] = !this[Obj[type]];
        },
        handleChangeStart(date) {
            if (!date) return;
            let nowDate = dayjs().format("YYYY-MM-DD HH:mm");
            if (
                date < nowDate &&
                date !== this.meetingDetail.imMeetingStartTime
            ) {
                this.$Message.error(this.$t("voip.meeting_info_check4"));
                return;
            }
            if (dayjs(date).diff(nowDate, "day") > 30) {
                this.$Message.warning(this.$t("voip.meeting_info_check6"));
                return;
            }
            this.selectedStartTime = date;
            this.selectedEndTime = this.fromatDate(
                dayjs(date).add(30, "minutes")
            );
        },
        handleChangeEnd(date) {
            if (!date) return;
            let start =
                this.selectedStartTime || this.meetingDetail.imMeetingStartTime;
            if (date < dayjs().format("YYYY-MM-DD HH:mm")) {
                this.$Message.error(this.$t("voip.meeting_info_check3"));
                return;
            }
            if (date < this.selectedStartTime) {
                this.$Message.error(this.$t("voip.meeting_info_check5"));
                return;
            }
            if (dayjs(date).diff(dayjs(start), "minutes") < 15) {
                this.$Message.warning(this.$t("voip.meeting_info_check2"));
                return;
            }
            if (dayjs(date).diff(dayjs(start), "hours") > 24) {
                this.$Message.warning(this.$t("voip.meeting_info_check1"));
                return;
            }
            this.selectedEndTime = date;
        },
        handleClear(type, num) {
            let Obj = {
                start: "openStart",
                end: "openEnd",
            };
            this[Obj[type]] = false;
            num && this.setDefaultDateTime();
        },
        async handleOk(type) {
            if (
                (type === "start" &&
                    this.selectedStartTime ===
                        this.meetingDetail.imMeetingStartTime) ||
                (type === "end" &&
                    this.selectedEndTime ===
                        this.meetingDetail.imMeetingEndTime)
            ) {
                this.handleClear(type);
                return;
            }

            if (this.selectedStartTime && this.selectedEndTime) {
                let nowDate = dayjs().format("YYYY-MM-DD HH:mm");
                let start = this.selectedStartTime;
                let end = this.selectedEndTime;
                if (this.selectedEndTime < this.selectedStartTime) {
                    this.$Message.error(this.$t("voip.meeting_info_check5"));
                    return;
                }
                if (start < nowDate) {
                    this.$Message.error(this.$t("voip.meeting_info_check4"));
                    return;
                }
                if (end < nowDate) {
                    this.$Message.error(this.$t("voip.meeting_info_check3"));
                    return;
                }
                if (dayjs(end).diff(dayjs(start), "minutes") < 15) {
                    this.$Message.warning(this.$t("voip.meeting_info_check2"));
                    return;
                }
                if (dayjs(end).diff(dayjs(start), "hours") > 24) {
                    this.$Message.warning(this.$t("voip.meeting_info_check1"));
                    return;
                }

                try {
                    let res = await changeMeetingScheduleTime({
                        id: this.meetingDetail.imMeetingId,
                        scheduleStartTime: this.selectedStartTime,
                        scheduleEndTime: this.selectedEndTime,
                    });
                    let { code, message } = res.data;
                    if (code === "000000") {
                        this.getDetail();
                    } else {
                        this.selectedStartTime =
                            this.meetingDetail.imMeetingStartTime;
                        this.selectedEndTime =
                            this.meetingDetail.imMeetingEndTime;
                        this.$Message.error(message);
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            this.handleClear(type);
        },
        showDocItemContextMenu(event, doc) {
            if (!this.$refs.menuComponents) return;
            this.contextMenuDocInfo = doc;
            this.$refs.menuComponents.$refs.menu.open(event, doc);
        },

        // 获取会议详情
        async getDetail() {
            let { imCycleMeetingId, id } = this.currentMeetingInfo;
            try {
                let res = await meetingHistoryDetail({
                    imMeetingId: id, // 会议主键id
                    imCycleMeetingId: imCycleMeetingId || "",
                });
                const { code, message, data } = res.data;
                if (code === "000000") {
                    this.checkCycle = data.isCycle;
                    this.frequency = data.cycleType;
                    this.meetingDetail = {
                        ...data,
                        imMeetingStartTime: this.fromatDate(
                            data.imMeetingStartTime
                        ),
                        imMeetingEndTime: this.fromatDate(
                            data.imMeetingEndTime
                        ),
                    };
                    this.selectedStartTime =
                        this.meetingDetail.imMeetingStartTime;
                    this.selectedEndTime = this.meetingDetail.imMeetingEndTime;
                    if (
                        !data.imCycleMeetingId &&
                        data.imCycleMeetingDetailDtoLis &&
                        data.imCycleMeetingDetailDtoList.length
                    ) {
                        this.imCycleMeetingId =
                            data.imCycleMeetingDetailDtoList[0].imCycleMeetingId;
                    } else {
                        this.imCycleMeetingId = data.imCycleMeetingId;
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        //返回页面
        toDone() {
            this.$modal.hide("ConferDetail-modal");
        },
        //日期处理
        getHoursDiff(dt1, dt2) {
            if (typeof dt1 == "string") {
                dt1 = new Date(dt1.replace(/-/, "/"));
                dt2 = new Date(dt2.replace(/-/, "/"));
            }
            var res = dt2 - dt1;
            if (isNaN(res)) throw Error("invalid dates arguments");
            return res / (1000 * 60 * 60);
        },
        // 点击删除会议
        deleteConfer() {
            let {
                imMeetingOwnerId,
                imMeetingCallId,
                designatedParticipants,
                imMeetingId,
            } = this.meetingDetail;
            let isOwner = imMeetingOwnerId === wfc.getUserId();
            this.$alert({
                width: 350,
                content: isOwner
                    ? this.$t("voip.cancel_meeting_tip")
                    : this.$t("voip.cancel_meeting_delete_tip"),
                cancelText: isOwner
                    ? this.$t("voip.not_now")
                    : this.$t("common.cancel"),
                confirmText: isOwner
                    ? this.$t("voip.cancel_owner_meeting")
                    : this.$t("common.confirm"),
                isText: true,
                confirmCallback: async () => {
                    // isOwner ? 删除会议 : 取消参会
                    try {
                        let res = isOwner
                            ? await getUpdateMeeting({
                                  meetingId: imMeetingCallId,
                                  status: "-1",
                              })
                            : await removeSelfFromParticipant({
                                  conferenceId: imMeetingId,
                                  designatedParticipantIds:
                                      designatedParticipants.map(
                                          (item) => item.userId
                                      ),
                              });
                        const { code, message } = res.data;
                        if (code === "000000") {
                            this.$modal.hide("ConferDetail-modal");
                        } else {
                            this.$Message.error(message);
                        }
                    } catch (error) {
                        console.log(error);
                        this.$Message.error(this.$t("common.error_later"));
                    }
                },
            });
        },
        // 加入会议 step-1
        addConfer() {
            const { imCreateMeeting, isPasswordNeed } = this.meetingDetail;
            // 不是主持人需要输入密码
            if (
                isPasswordNeed === 1 &&
                imCreateMeeting.host !== wfc.getUserId()
            ) {
                this.$modal.show(
                    EnterPassWord,
                    { title: this.$t("voip.meeting_pw") },
                    null,
                    {
                        name: "EnterPassWord-modal",
                        width: 300,
                        height: 160,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    {
                        "before-close": (event) => {
                            if (event.params) {
                                // 点击加入会议
                                const { params, meetingPassWord } =
                                    event.params;
                                if (params && meetingPassWord) {
                                    this.meetingDetail._meetingPassWord =
                                        meetingPassWord;
                                    this.nextJoinMeeting();
                                }
                            }
                        },
                    }
                );
                return;
            }
            this.nextJoinMeeting();
        },
        // 加入会议 step-2
        nextJoinMeeting() {
            const {
                password,
                isPasswordNeed,
                imCreateMeeting,
                imMeetingCode,
                _meetingPassWord: meetingPassWord,
                imMeetingId,
            } = this.meetingDetail;
            if (meetingPassWord && password && meetingPassWord !== password) {
                this.$Message.warning(this.$t("voip.password_wrong"));
                return;
            }
            let isAudience =
                imCreateMeeting.host === wfc.getUserId() ? false : true;
            getJoinMeeting({
                isAudience: Number(isAudience), // 是否互动模式 1  观众模式入会 0  主播模式入会
                id: imMeetingId, // 会议主键id
                code: imMeetingCode, //会议号
                status: 0,
                isPasswordNeed: isPasswordNeed,
                password: meetingPassWord || password,
            }).then((res) => {
                const { code, data, message } = res.data;
                if (code == "000000") {
                    let cmc = data.imCreateMeeting;
                    avenginekitproxy.joinConference(
                        cmc.roomId,
                        false,
                        cmc.pin,
                        cmc.host,
                        data.title,
                        cmc.description,
                        isAudience, // Boolean(cmc.isAudience), // 是否是以观众角色入会
                        "", // 是否是高级会议
                        true,
                        true,
                        {
                            video: true,
                            audio: true,
                        }
                    );
                    setItem("confer_code", imMeetingCode);
                    this.$modal.hide("ConferDetail-modal");
                } else if (code === "5000021") {
                    // 非指定会议弹窗申请
                    this.$modal.show(
                        RequestMeeting,
                        {
                            title: this.$t("voip.private_meeting_title"),
                            meetingInfo: data,
                        },
                        null,
                        {
                            name: "RequestMeeting-modal",
                            width: 340,
                            height: 266,
                            clickToClose: false, // 点击模态框是否关闭
                        },
                        {
                            "before-close": (event) => {},
                        }
                    );
                } else {
                    this.$Message.warning(message);
                }
            });
        },
        // 指定成员的弹窗区分一下
        async invite() {
            let { imMeetingCallId } = this.meetingDetail;
            let { isAppCharge, vipLevel } = this.permissionList;
            if (isAppCharge) {
                if (this.inviteLock) return;
                this.inviteLock = true;
                try {
                    let res = await inviteCheck({ meetingId: imMeetingCallId });
                    this.inviteLock = false;
                    let { code } = res.data;
                    if (code === "000000") {
                        this.showInviteModal();
                    } else {
                        let textTip = vipLevel
                            ? this.$t("voip.max_participants_tip1")
                            : this.$t("voip.max_participants_tip2");
                        this.$alert({
                            content: textTip,
                            confirmText: this.$t("voip.continue"),
                            cancelText: this.$t("common.cancel"),
                            isText: true,
                            confirmCallback: () => {
                                this.showInviteModal();
                            },
                        });
                    }
                } catch (error) {
                    this.inviteLock = false;
                    this.$Message.error(this.$t("common.error_later"));
                }
            } else {
                this.showInviteModal();
            }
        },
        /**
         * 显示邀请弹窗
         * @params{meetingId} 会议id
         * @params{title} 会议主题：
         * @params{imCreateMeeting} 会议具体信息
         * @params{data} 接口返回的会议信息
         *  */
        showInviteModal() {
            let message = getInviteMessageContent(this.meetingDetail);
            // 唤起邀请弹窗
            this.sharedPickState.conversations.length = 0;
            this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
                forwardFilterAnonymous: true,
            });
        },
        // 点击复制
        async copy() {
            try {
                let {
                    imMeetingCode,
                    isPasswordNeed,
                    password,
                    imMeetingStartTime,
                    imMeetingEndTime,
                    imMeetingTitle,
                } = this.meetingDetail;
                // 生成短连接
                let shortRes = await this.getShortUrl(
                    `${this.mixinHttps}/launchMeet/index.html/?${window.btoa(
                        imMeetingCode.replace(/\s*/g, "")
                    )}`
                );
                if (!shortRes) {
                    this.$Message.error(this.$t("voip.copy_failed"));
                    return;
                }
                const { code, message } = shortRes;
                if (code === "000000") {
                    let pw =
                        isPasswordNeed && password
                            ? `<br/>${this.$t("voip.meeting_pw")}：${password}`
                            : "";
                    const arr = imMeetingStartTime.split(" ");
                    const startDate = arr[0].replace(/\-/g, "/");
                    const end = imMeetingEndTime.split(" ")[1];
                    // 快速会议需要添加结束时间 默认+30分钟
                    const addEnd = dayjs(imMeetingEndTime)
                        .add(30, "minute")
                        .format("YYYY-MM-DD HH:mm:ss")
                        .split(" ")[1];

                    let str = `${this.mixinGetUserName(this.userInfo)}
                     ${this.$t("voip.invite_you")}<br/>
                     ${this.$t("voip.meeting_topic")}${imMeetingTitle}<br/>
                     ${this.$t("voip.meeting_time")}
                     ${startDate}\n\n${arr[1].substr(0, 5)}\n-\n
                     ${
                         imMeetingStartTime === imMeetingEndTime
                             ? addEnd.substr(0, 5)
                             : end.substr(0, 5)
                     }<br/>
                    ${this.$t("voip.click_join")}<br/>
                    ${shortRes.data.shortUrl || ""}<br/>
                    ${this.$t("voip.meeting_code_id")}
                    ${imMeetingCode}${pw}`;
                    //处理复制后粘贴没有样式问题
                    let aux = document.createElement("div");
                    aux.innerHTML = str;
                    document.body.appendChild(aux);
                    copyText(aux.innerText);
                    document.body.removeChild(aux);
                    this.$Message.success(this.$t("web3.copied"));
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 生成短连接
        async getShortUrl(url) {
            try {
                const res = await getGenerateShortUrlV1({
                    longUrl: url,
                });
                let { data, message, code } = res.data;
                return { data, message, code };
            } catch (error) {
                console.log(error);
                return "";
            }
        },
        // 点击指定人数
        handlerDesignatedMember() {
            let {
                isAppCharge,
                privilegeDesignateParticipant,
                conferenceJoinLimit,
            } = this.permissionList;
            if (isAppCharge && !privilegeDesignateParticipant) {
                this.$alert({
                    content: tipsContent[12],
                    cancelText: "",
                    height: 150,
                });
                return;
            }
            let { imMeetingOwnerId, designatedParticipants } =
                this.meetingDetail;
            if (imMeetingOwnerId === wfc.getUserId()) {
                let userList = wfc.getUserInfos(
                    designatedParticipants.map((item) => item.userId),
                    ""
                );
                this.$modal.show(
                    PickDesignatedMember,
                    {
                        maxLength: conferenceJoinLimit,
                        conferenceItem: this.meetingDetail,
                        initialCheckedUsers: userList, // 已经选定的人员
                        confirmTitle: this.$t("common.confirm"),
                        isEdit: true,
                    },
                    null,
                    {
                        name: "pick-designated-member-modal",
                        width: 600,
                        height: 480,
                        clickToClose: false,
                    },
                    {
                        "before-close": (event) => {
                            if (!event.params) return;
                            let { confirm, pickedUsers } = event.params;
                            if (!confirm) return;
                            if (pickedUsers.length) {
                                let message = getInviteMessageContent(
                                    this.meetingDetail
                                );
                                let ids = pickedUsers
                                    .filter((item) => !item.groupId)
                                    .map((item) => item.uid);
                                let conversations =
                                    store.getDesignatedMemberConversations(ids);
                                let groupConversations = [];
                                let groupId = "";
                                let index = pickedUsers.findIndex(
                                    (item) => item.groupId
                                );
                                if (index > -1) {
                                    groupId = pickedUsers[index].uid;
                                }
                                if (groupId) {
                                    groupConversations =
                                        store.getDesignatedGroupConversations(
                                            groupId
                                        );
                                }
                                this.sendInviteMessage({
                                    messages: [message],
                                    conversations,
                                    groupConversations,
                                });
                            }
                            // 更新数据
                            this.getDetail();
                        },
                    }
                );
            } else {
                this.$modal.show(
                    ForwardDesignatedMemberView,
                    {
                        designatedMember:
                            this.meetingDetail.designatedParticipants,
                        confirmTitle: this.$t("common.confirm"),
                        messages: [],
                        othersMeeting: true, // 参会
                    },
                    null,
                    {
                        name: "forward-designated-member-modal",
                        width: 440,
                        height: 560,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    {
                        "before-close": (event) => {},
                    }
                );
            }
        },
        // 发送会议邀请消息
        sendInviteMessage(data) {
            let { messages, conversations, groupConversations } = data;
            this.$modal.show(
                ForwardDesignatedMemberView,
                {
                    forwardType: ForwardType.NORMAL,
                    designatedMember: [...conversations, ...groupConversations],
                    confirmTitle: this.$t("common.confirm"),
                    messages,
                },
                null,
                {
                    name: "forward-designated-member-modal",
                    width: 440,
                    height: 520,
                    clickToClose: false, // 点击模态框是否关闭
                },
                {
                    "before-close": (event) => {
                        this.sharedPickState.conversations.length = 0;
                        let { confirm, extraMessageText } = event.params;
                        if (confirm) {
                            if (groupConversations.length) {
                                store.forwardMessage(
                                    ForwardType.NORMAL,
                                    groupConversations,
                                    messages,
                                    `${this.$t(
                                        "conversation.atAll"
                                    )} ${extraMessageText}`,
                                    "isAtAll"
                                );
                            }
                            if (conversations.length) {
                                store.forwardMessage(
                                    ForwardType.NORMAL,
                                    conversations,
                                    messages,
                                    extraMessageText
                                );
                            }
                            this.$Message.success(
                                this.$t("friend_request.sent")
                            );
                        }
                    },
                }
            );
        },
        /**
         * 点击会议主题和会议概述，进行编辑
         * proms {
         *  type 0 修改会议主题 1 修改会议概述
         * }
         **/
        handleEdit(type) {
            let editObj = {
                0: {
                    title: this.$t("voip.edit_title"),
                    placeholder: this.$t("voip.meeting_subject"),
                    warning: this.$t("voip.enter_title"),
                    maxlength: 30,
                    defaultText: this.meetingDetail.imMeetingTitle,
                },
                1: {
                    title: this.$t("voip.edit_overview"),
                    placeholder: this.$t("voip.placeholder_meeting_subject"),
                    warning: this.$t("voip.enter_overview"),
                    maxlength: 100,
                    defaultText: this.meetingDetail.imMeetingDescription,
                },
            };

            this.$modal.show(
                SetGroupName,
                {
                    isRequired: true,
                    title: editObj[type].title,
                    defaultGroupName: editObj[type].defaultText,
                    maxlength: editObj[type].maxlength,
                    placeholder: editObj[type].placeholder,
                    warningText: editObj[type].warning,
                },
                null,
                {
                    name: "SetGroupName-modal",
                    width: 400,
                    height: 180,
                    clickToClose: false, // 点击模态框是否关闭
                },
                {
                    "before-close": (event) => {
                        if (event.params) {
                            this.nextModifyMeetingInfo(
                                event.params.groupName,
                                type
                            );
                        }
                    },
                }
            );
        },
        //  修改会议主题和概述，接口
        async nextModifyMeetingInfo(text, type) {
            try {
                let res = null;
                let { imMeetingId, imMeetingTitle, imMeetingDescription } =
                    this.meetingDetail;
                if (type === 1 && text !== imMeetingDescription) {
                    res = await modifyMeetingInfo({
                        id: imMeetingId,
                        description: text,
                        title: imMeetingTitle,
                    });
                }
                if (!type && text !== imMeetingTitle) {
                    res = await modifyMeetingInfo({
                        id: imMeetingId,
                        description: imMeetingDescription,
                        title: text,
                    });
                }
                if (!res) return;
                let { code, message } = res.data;
                if (code === "000000") {
                    this.getDetail();
                    this.$Message.success(message);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {}
        },
        // 点击复制密码
        handleCopyPassWord() {
            copyText(this.meetingDetail.password);
            this.$Message.success(this.$t("web3.copied"));
        },
        // 点击上传文件
        async uploadFile() {
            try {
                // 获取链上文档信息
                let res = await getCloudUsedSpace({});
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
                        });
                        return;
                    }
                    this.$refs["fileInput"].click();
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
            });
            event.target.value = "";
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
        delDoc(docInfo, from) {
            this.$alert({
                title: this.$t("voip.delete_document"),
                content: this.$t("voip.delete_document_tip"),
                isText: true,
                height: 160,
                confirmCallback: async () => {
                    try {
                        const res = await deleteMeetingFile({
                            fileId: docInfo.id,
                            imMeetingId: this.meetingDetail.imMeetingId,
                        });
                        const { message, code } = res.data;
                        if (code === "000000") {
                            // 更新数据
                            this.getDetail();
                            from && this.$modal.hide("ConferAction-modal");
                        } else {
                            this.$Message.error(message);
                        }
                    } catch (error) {
                        this.$Message.error(this.$t("common.error_later"));
                    }
                },
            });
        },
        // 获取用户vip相关信息
        getVipInfo() {
            return new Promise((resolve, reject) => {
                getUserVipInfo({})
                    .then((res) => {
                        let { code, data } = res.data;
                        if (code === "000000") {
                            this.vipInfo = data;
                            resolve(data);
                        } else {
                            reject(null);
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        reject(null);
                    });
            });
        },
        // 操作绑定方式选择
        handleBindingGroup(name) {
            if (this.meetingDetail.imMeetingOwnerId !== wfc.getUserId()) {
                this.$Message.warning(this.$t("voip.host_permission"));
                return;
            }
            switch (name) {
                case "create":
                    if (!this.meetingDetail.designatedParticipants.length) {
                        this.bindType = 0;
                        this.$alert({
                            content: this.$t("voip.discussion_tip"),
                            isText: true,
                            height: 170,
                            cancelText: "",
                        });
                        return;
                    }
                    this.handleCreate();
                    break;
                case "bind":
                    // 点击绑定群组，展示本地群组列表
                    this.$pickGroups({
                        localGroup: true,
                        singleChoice: true,
                        successCB: (groups) => {
                            // 绑定当前会议内创建的群
                            bindConferenceAndGroup({
                                imGroupId: groups[0].groupId,
                                imMeetingId: this.meetingDetail.imMeetingId,
                                imCycleMeetingId: this.imCycleMeetingId,
                            }).then((res) => {
                                let { code, message } = res.data;
                                //   6000023 群已被绑定， 更新一下
                                if (["000000", "6000023"].includes(code)) {
                                    this.$nextTick(() => {
                                        // 更新数据
                                        this.getDetail();
                                    });
                                } else {
                                    this.$Message.error(message);
                                }
                            });
                        },
                    });
                    break;
            }
        },
        // 创建群组
        async handleCreate() {
            // 创建群组
            const { isAppCharge, groupMemberLimit, groupCreateLimit } =
                this.permissionList;
            const { designatedParticipants, imMeetingId, imMeetingTitle } =
                this.meetingDetail;
            if (isAppCharge) {
                if (designatedParticipants.length + 1 > groupMemberLimit) {
                    this.$alert({
                        content: tipsContent[9],
                        height: 150,
                        cancelText: "",
                    });
                    return;
                }
                try {
                    let result = await this.getVipInfo();
                    if (!result) return;
                    if (result.groupCountCreatedBy < groupCreateLimit) {
                        this.$modal.show(
                            SetGroupName,
                            {
                                title: this.$t("voip.edit_name"),
                                defaultGroupName: imMeetingTitle,
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
                                            imMeetingId,
                                            groupName: event.params.groupName,
                                            memberIds:
                                                designatedParticipants.map(
                                                    (item) => item.userId
                                                ),
                                        }).then((res) => {
                                            //6000023 群已被创建并绑定， 更新一下
                                            let { message, code } = res.data;
                                            if (
                                                ["000000", "6000023"].includes(
                                                    code
                                                )
                                            ) {
                                                this.$nextTick(() => {
                                                    this.getDetail();
                                                });
                                            } else {
                                                this.$Message.error(message);
                                            }
                                        });
                                    }
                                },
                            }
                        );
                    } else {
                        this.$alert({
                            content: tipsContent[10],
                            height: 150,
                            cancelText: "",
                        });
                    }
                } catch (error) {
                    console.log(error);
                    this.$Message.error(this.$t("common.error_later"));
                }
            }
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
            this.$modal.hide("ConferDetail-modal");
            let timer = setTimeout(() => {
                store.setCurrentConversation(conversation);
                this.$router.replace("/home/conversation");
                timer && clearTimeout(timer);
            }, 500);
        },
        // 文档查看全部
        showAllDocList() {
            this.$modal.show(
                ConferAction,
                {
                    title: this.$t("voip.document_manage"),
                    actionType: 3,
                    meetingDetail: this.meetingDetail,
                    openDoc: this.openDoc,
                    delDoc: this.delDoc,
                    saveCloudDiskAction: this.saveCloudDiskAction,
                    onDocItemContextMenuClose: this.onDocItemContextMenuClose,
                    updateMeetingDetail: this.updateMeetingDetail,
                },
                null,
                {
                    name: "ConferAction-modal",
                    width: 440,
                    height: 560,
                    clickToClose: true, // 点击模态框是否关闭
                },
                {}
            );
        },
        updateMeetingDetail() {
            return this.meetingDetail.imMeetingAttachDtoList;
        },
        // 切换周期选择
        changeSetCycle() {
            let { isAppCharge, privilegeCreateCycleConference } =
                this.permissionList;
            if (isAppCharge && !privilegeCreateCycleConference) {
                this.$alert({
                    content: tipsContent[13],
                    cancelText: "",
                    height: 150,
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
                                content: `<div style="max-height:100px;overflow:auto;">${this.$t(
                                    "voip.change_periodic_meeting_tip"
                                )}</div>`,
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
                                                this.currentMeetingInfo.imCycleMeetingId =
                                                    data.imCycleMeetingId;
                                                this.getDetail();
                                            } else {
                                                this.$Message.error(message);
                                            }
                                        })
                                        .catch((error) => {});
                                },
                            });
                        }
                    },
                }
            );
        },
        //切换周期频率    非会员/普通（0,1）不可以设置周期会议、高/超/专业（2,3,4）可以
        changeSetFrequency() {
            let { isAppCharge, privilegeCreateCycleConference } =
                this.permissionList;
            if (isAppCharge && !privilegeCreateCycleConference) {
                this.$alert({
                    content: tipsContent[13],
                    cancelText: "",
                    height: 150,
                });
                return;
            }
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
                                content: `<div style="max-height:100px;overflow:auto;">${this.$t(
                                    "voip.safety_warning"
                                )}</div>`,
                                confirmText: this.$t("common.confirm"),
                                cancelText: this.$t("common.cancel"),
                                confirmCallback: () => {
                                    changeMeetingCycleType({
                                        cycleType: event.params.cycleType,
                                        id: this.meetingDetail.imMeetingId,
                                    }).then((res) => {
                                        let { code, message } = res.data;
                                        if (code === "000000") {
                                            this.getDetail();
                                            this.$Message.success(
                                                this.$t("voip.edit_success")
                                            );
                                        } else {
                                            this.$Message.error(message);
                                        }
                                    });
                                },
                            });
                        }
                    },
                }
            );
        },
        // 点击文档
        handleDoc() {
            return !this.docListLength
                ? this.uploadFile()
                : this.showAllDocList();
        },
        // 点击文档摘要或刷新
        async handlerAi(doc) {
            if (this.aiLock) return;
            this.aiLock = true;
            this.meetingDetail.imMeetingAttachDtoList =
                this.meetingDetail.imMeetingAttachDtoList.map((item) => {
                    return {
                        ...item,
                        loading: item.id === doc.id ? true : item.loading,
                    };
                });
            try {
                let res = await getAiSummary({
                    cid: doc.attachCid,
                    fileName: doc.attachName,
                });
                this.aiLock = false;
                const { code, message, data } = res.data;
                if (code === "000000") {
                    this.meetingDetail.imMeetingAttachDtoList =
                        this.meetingDetail.imMeetingAttachDtoList.map(
                            (item) => {
                                return {
                                    ...item,
                                    summary:
                                        item.id === doc.id
                                            ? data
                                            : item.summary,
                                    refresh:
                                        item.id === doc.id ? 1 : item.refresh,
                                    loading:
                                        item.id === doc.id
                                            ? false
                                            : item.loading,
                                };
                            }
                        );
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.aiLock = false;
                console.log(error);
            }
        },
        handleShowAll(doc) {
            this.meetingDetail.imMeetingAttachDtoList =
                this.meetingDetail.imMeetingAttachDtoList.map((item) => {
                    return {
                        ...item,
                        showAll:
                            item.id === doc.id ? !item.showAll : item.showAll,
                    };
                });
        },
        // 打开文件
        openDoc(item) {
            try {
                let { attachCid, attachName } = item;
                downloadOtherFile(
                    {
                        fileName: attachName,
                        url: `${
                            this.mixinHttps
                        }/disk/downloadMeetingFile?userId=${wfc.getUserId()}&cid=${attachCid}&fileName=${attachName}`,
                    },
                    true, // 仅打开
                    SavePathType.Meeting // 保存路径
                );
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("voip.open_failed"));
            }
        },
        onDocItemContextMenuClose() {
            this.contextMenuDocInfo = null;
        },
    },
    beforeUnmount() {
        this.$eventBus.$off("historyMeetingUploadSuccess");
    },
};
</script>
<style>
.confer-detail .group-wrap .group-btn {
    flex: 1;
}
.confer-detail .group-wrap .group-btn .content {
    padding-left: 40px;
}
.confer-detail .group-wrap .group-btn .ivu-dropdown-rel {
    float: right;
}
.more-btn .ivu-select-visible .ivu-select-selection,
.more-btn .ivu-select-foucsed .ivu-select-selection:hover {
    border: none;
    box-shadow: none;
}
.more-btn .ivu-select-selection .ivu-select-selected-value {
    min-width: 60px;
    font-weight: 500;
    color: #333333;
    border-radius: 8px;
    text-align: right;
}
.more-btn .ivu-select-selection {
    border: none;
}
</style>
<style lang="less">
.invit {
    width: 60px;
    height: 28px;
    line-height: 28px;
    margin-left: 10px;
    border: 1px solid #1dbb88;
    border-radius: 5px;
    text-align: center;
    color: #1dbb88;
    font-size: 12px;
}
.close-btn {
    width: 70px;
    font-size: 14px;
    text-align: right;
    display: inline-block;
}
.confer-detail {
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background: #f2f2f3;
    .connfer_detail_nav {
        padding: 10px;
        min-height: 40px;
        box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.06);
        background: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
        z-index: 2;
    }
}

.connfer_detail_nav div:nth-child(3) {
    display: flex;
    justify-content: flex-end;
}
.connfer_detail_nav div > img {
    margin: 5px;
}
.connfer_detail_nav h3 {
    font-size: 18px;
    text-align: center;
}
.connfer_detail_code {
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
}

.connfer_detail_code .detail .action-item {
    padding: 0 24px;
    background: #fff;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    min-height: 52px;
    line-height: 42px;
    font-size: 14px;
    &:last-child {
        margin-bottom: 12px;
    }
    .content {
        display: flex;
        align-items: center;
        .vip-icon-em {
            margin-right: 5px;
        }
    }
    .public-checked-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .name {
        color: #333;
    }
    .value {
        display: inline;
        vertical-align: middle;
        max-width: 50%;
        text-align: right;
        color: #1dbb88;
        display: flex;
        align-items: center;
        font-size: 14px;
    }
    .frequency-select .ivu-select-arrow {
        display: none;
    }
    .copy-pass-word-btn {
        display: inline;
        font-size: 18px;
        line-height: 18px;
        vertical-align: middle;
        color: #999;
        cursor: pointer;
        margin-left: 5px;
    }
    label {
        height: 32px;
        line-height: 32px;
        margin-left: 0;
        display: inline-block;
        span {
            display: inline-block;
            vertical-align: middle;
            font-size: 12px;
        }
        input {
            vertical-align: middle;
        }

        &.pass-word-label {
            width: 285px;
            &:focus {
                border-color: none;
            }
            input {
                border: none;
                outline: none;
                border: 1px solid #e5e5e5;
                border-radius: 3px;
                height: 32px;
                line-height: 26px;
                padding: 0 5px;
                width: 100%;
                font-size: 12px;
                &:focus,
                &:active {
                    border: 1px solid #1dbb88;
                }
            }
        }
    }
    .frequency-select-wrap {
        display: flex;
        align-items: center;
        .frequency-select .ivu-select-selected-value {
            color: #333;
            font-size: 14px;
            padding-right: 4px;
        }
    }

    &.title {
        padding: 16px 24px;
        line-height: 24px;
        color: #333;
    }
    &.m-top {
        margin-top: 12px;
    }
    &.b-top {
        margin-top: 1px;
    }
    &.duration {
        .time {
            color: #999;
        }
    }
    &.desc {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        .desc-wrap {
            flex: 1;
            padding-bottom: 16px;
            display: flex;
            align-items: center;
            font-size: 14px;
            line-height: 24px;
            color: #666;
        }

        .normal-text {
            color: #777;
        }
    }
    &.more-btn {
        .more-icon-btn {
            display: inline;
            font-size: 20px;
            vertical-align: middle;
            color: #d7d7d7;
            margin-right: -6px;
        }
    }
    &.doc-group {
        height: auto;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        .doc-header {
            width: 100%;
            height: 52px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            em {
                font-style: normal;
            }
        }
        .doc-wrap {
            width: 100%;
            .item-wrap:nth-of-type(2) {
                border-top: 0.3px solid #f1f1f1;
            }
            .upload-wrap {
                display: flex;
                span {
                    margin: 10px auto;
                    padding: 0 8px;
                    height: 30px;
                    border-radius: 20px;
                    line-height: 20px;
                    text-align: center;
                    font-style: normal;
                    font-weight: 500;
                    font-size: 14px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: #1dbb88;
                    color: #ffffff;
                }
                span::before {
                    margin-right: 5px;
                    display: inline-block;
                    width: 18px;
                    height: 18px;
                    content: "";
                    background: url(../../../assets/images/cloud-upload-icon-white.png)
                        no-repeat center center;
                    background-size: 18px;
                }
            }
        }
    }
    &.group-wrap .group-info {
        display: flex;
        align-items: center;
        img {
            width: 30px;
            height: 30px;
            overflow: hidden;
            border-radius: 50%;
            border: 1px solid #f5f5f5;
        }
        .new-single-line {
            display: -webkit-box;
            height: 42px;
            max-width: 120px;
            margin-left: 5px;
        }
    }
}

.add-confer {
    padding: 10px 24px;
    box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.1);
    z-index: 2;
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    button {
        width: 100%;
        margin-top: 10px;
        background: transparent;
        height: 38px;
        color: #fff;
        border: none;
        font-size: 16px;
        font-weight: 500;
        border-radius: 5px;
        &.copy-btn {
            border: #333 1px solid;
            color: #333;
        }
        &.add-btn {
            border: #1dbb88 1px solid;
            background: #1dbb88;
            color: #fff;
        }
        &.delete-btn {
            // border: 1px solid #ff5758;
            color: #ff5758;
        }
    }
}
</style>
