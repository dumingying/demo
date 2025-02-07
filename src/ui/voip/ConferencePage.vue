<template>
    <div class="conference-page">
        <!-- 左侧 -->
        <div class="conference-nav">
            <h4>{{ $t("home.chain_task") }}</h4>
            <ul class="nav-list">
                <li @click="addConfer">
                    <img
                        class="action-img"
                        draggable="false"
                        src="@/assets/images/conference-add.png"
                    />
                    <p>{{ $t("voip.join_meeting") }}</p>
                </li>
                <li @click="fastConfer">
                    <img
                        class="action-img"
                        draggable="false"
                        src="@/assets/images/conference-fast.png"
                    />
                    <p class="fast-text">{{ $t("voip.start_meeting") }}</p>
                </li>
                <li @click="reserveConfer">
                    <img
                        class="action-img"
                        draggable="false"
                        src="@/assets/images/conference-resver.png"
                    />
                    <p>{{ $t("voip.schedule") }}</p>
                </li>
                <li @click="goChat">
                    <img
                        class="action-img"
                        draggable="false"
                        src="@/assets/images/conference-share.png"
                    />
                    <p>{{ $t("voip.message") }}</p>
                    <em v-show="unread > 0" class="badge">
                        {{ unread > 99 ? "99+" : unread }}
                    </em>
                </li>
            </ul>
        </div>
        <!-- 右侧 -->
        <div class="conference-view">
            <h4>
                <div class="title-wrap">
                    <div class="title-btn">
                        <span class="title">{{ $t("voip.my_meeting") }}</span>
                        <span
                            :class="[
                                'calendar-view-btn',
                                { active: calendarView },
                            ]"
                            @click="handlerCalendar"
                        >
                            {{ $t("voip.calendar_view") }}
                        </span>
                    </div>
                    <span @click="goHistoryConference">
                        {{ $t("voip.historical_meeting") }}
                        <Icon type="ios-arrow-forward" />
                    </span>
                </div>
            </h4>
            <!--  日历视图 -->
            <div v-if="calendarView" class="calendar-view-wrap">
                <div class="calendar-view">
                    <v-calendar
                        ref="calendar"
                        class="custom-calendar"
                        transition="fade"
                        trim-weeks
                        expanded
                        :first-day-of-week="1"
                        :attributes="attributes"
                        :locale="calendarLanguage"
                        @did-move="handlerUpdateFrom"
                    >
                        <template v-slot:day-content="{ day, attributes }">
                            <div
                                :class="[
                                    'day-wrap',
                                    { active: currentDate === day.id },
                                ]"
                                @click="onDayClick(day)"
                            >
                                <div class="dot-day">
                                    <p class="day solar-day">{{ day.day }}</p>
                                    <div class="dot-wrap">
                                        <span
                                            v-for="(attr, index) in attributes"
                                            :key="attr.key"
                                            v-show="index < 3"
                                            class="dot"
                                        >
                                        </span>
                                    </div>
                                </div>

                                <p class="day lunar-day">
                                    {{ solarToLunar(day) }}
                                </p>
                                <!--显示 节假日 -->
                                <!-- <p
                                    :class="[
                                        'day',
                                        'lunar-day',
                                        'new-single-line',
                                        { festival: chineseFestival(day) },
                                    ]"
                                >
                                    {{ chineseFestival(day) }}
                                </p> -->
                            </div>
                        </template>
                    </v-calendar>
                </div>
                <template v-if="currentMeetingList.length">
                    <ul>
                        <conference-item
                            v-for="(item, index) in currentList"
                            :item="item"
                            :key="index"
                            type="all"
                            @historyDelete="historyDelete"
                            @toDetail="toDetail"
                            @deleteConfer="deleteConfer"
                        ></conference-item>
                    </ul>
                    <div class="show-more" v-if="currentMeetingList.length > 3">
                        <span @click="handleShowMore">
                            {{
                                isShowMore
                                    ? $t("voip.collapse_all")
                                    : $t("voip.expand_all")
                            }}
                            <i
                                :class="[
                                    isShowMore
                                        ? 'icon-ion-chevron-up'
                                        : 'icon-ion-chevron-down',
                                ]"
                                style="color: #999; margin-left: 5px"
                            ></i>
                        </span>
                    </div>
                </template>
                <EmptyList v-else>{{ $t("disk.no_data") }}</EmptyList>
            </div>
            <!--列表 -->
            <div class="list" v-else>
                <ul v-if="conferenceList.length">
                    <conference-item
                        v-for="(item, index) in conferenceList"
                        :item="item"
                        :key="index"
                        type="my"
                        @toDetail="toDetail"
                        @deleteConfer="deleteConfer"
                    ></conference-item>
                </ul>
                <EmptyList v-else style="margin-top: 120px">
                    {{ $t("disk.no_data") }}
                </EmptyList>
            </div>
        </div>
        <!-- 会议模块全局上传文档 -->
        <HistoryUploadDoc></HistoryUploadDoc>
    </div>
</template>

<script>
import ForwardDesignatedMemberView from "./conference/ForwardDesignatedMemberView";
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import ConferDialog from "./conference/ConferDialog";
import ConferDetail from "./conference/ConferDetail";
import HistoryUploadDoc from "./conference/history/HistoryUploadDoc";
import HistoryConferenceView from "./conference/history/HistoryConferenceView";
import { getInviteMessageContent } from "@/ui/voip/conferenceConfig";
import ConferenceItem from "./ConferenceItem";
import EmptyList from "../common/empty/EmptyList";

import wfc from "@/wfc/client/wfc";
import store from "@/store";
import dayjs from "dayjs";
const { Solar, HolidayUtil, Lunar } = require("lunar-javascript");
import {
    getMyMeetingList,
    getUpdateMeeting,
    removeSelfFromParticipant,
    meetingCalendar,
    delMeetingHistory,
} from "@/axios";

export default {
    data() {
        return {
            conferenceList: [],
            shareConversationState: store.state.conversation,
            calendarView: true,
            initDate: dayjs().startOf("month").format("YYYY-MM-DD"),
            currentDate: dayjs().format("YYYY-MM-DD"),
            attributes: [],
            currentMeetingList: [],
            threeMeetingList: [],
            lock: false,
            initLock: false,
            isShowMore: false,
        };
    },
    components: {
        HistoryUploadDoc,
        ConferenceItem,
        EmptyList,
    },
    activated() {
        try {
            if (this.calendarView) {
                this.currentDate = dayjs().format("YYYY-MM-DD");
                this.$refs.calendar.move(new Date());
                this.initLock = true;
                this.refreshList();
            }
        } catch (error) {
            console.log(error);
        }
        this.$eventBus.$on("updateMymeetingList", () => {
            this.refreshList();
        });
    },
    computed: {
        calendarLanguage() {
            return this.$store.state.currentLanguage === "en" ? "en" : "zh";
        },
        unread() {
            let count = 0;
            this.shareConversationState.conversationInfoList.forEach((info) => {
                if (info.isSilent) return;
                count += info.unreadCount.unread;
            });
            return count;
        },
        //当前会议列表
        currentList() {
            return this.isShowMore
                ? this.currentMeetingList
                : this.threeMeetingList;
        },
        solarToLunar() {
            return (day) => {
                if (this.calendarLanguage === "zh") {
                    let lunarCalendar = Solar.fromYmd(
                        day.year,
                        day.month,
                        day.day
                    ).getLunar();
                    if (lunarCalendar.getDay() === 1) {
                        return lunarCalendar.toString().slice(5);
                    } else {
                        return lunarCalendar.toString().slice(-2);
                    }
                }
                return "";
            };
        },
        // chineseFestival() {
        //     return (day) => {
        //         if (this.calendarLanguage === "zh") {
        //             let solarCalendar = Solar.fromYmd(
        //                 day.year,
        //                 day.month,
        //                 day.day
        //             );
        //             let lunarCalendar = Solar.fromYmd(
        //                 day.year,
        //                 day.month,
        //                 day.day
        //             ).getLunar();
        //             let festivals = [
        //                 ...lunarCalendar.getFestivals(),
        //                 ...solarCalendar.getFestivals(),
        //             ];
        //             for (var i = 0, j = festivals.length; i < j; i++) {
        //                 return festivals.join(",");
        //             }
        //         }
        //         return "";
        //     };
        // },
    },
    methods: {
        //加入会议 ======
        addConfer() {
            this.$modal.show(
                ConferDialog,
                {
                    title: this.$t("voip.join_meeting"),
                    hdesc: this.$t("voip.meeting_chain_id"),
                    status: 0,
                },
                null,
                {
                    name: "ConferDialog-modal",
                    width: 440,
                    height: 520,
                    clickToClose: true,
                },
                {
                    "before-close": (event) => {},
                }
            );
        },
        // 快速会议======
        fastConfer() {
            this.$modal.show(
                ConferDialog,
                {
                    title: this.$t("voip.start_meeting"),
                    hdesc: this.$t("voip.meeting_subject"),
                    status: 1,
                },
                null,
                {
                    name: "ConferDialog-modal",
                    width: 440,
                    height: 520,
                    clickToClose: true,
                },
                {
                    "before-close": (event) => {},
                }
            );
        },
        // 预定会议======
        reserveConfer() {
            this.$modal.show(
                ConferDialog,
                {
                    title: this.$t("voip.schedule"),
                    hdesc: this.$t("voip.meeting_subject"),
                    status: 2,
                },
                null,
                {
                    name: "ConferDialog-modal",
                    width: 440,
                    height: 560,
                    clickToClose: true,
                },
                {
                    "before-close": (event) => {
                        this.refreshList();
                        if (
                            event.params &&
                            event.params.designatedMember &&
                            event.params.designatedMember.length
                        ) {
                            let { designatedMember, meetingDetail } =
                                event.params;
                            let message =
                                getInviteMessageContent(meetingDetail);
                            let ids = designatedMember
                                .filter((item) => !item.groupId)
                                .map((item) => item.uid);
                            let conversations =
                                store.getDesignatedMemberConversations(ids);
                            let groupConversations = "";
                            let groupId = "";
                            let index = designatedMember.findIndex(
                                (item) => item.groupId
                            );
                            if (index > -1) {
                                groupId = designatedMember[index].uid;
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
                    },
                }
            );
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
                        if (!event.params) return;
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
        // 去消息页面 conversation
        goChat() {
            this.$router.replace("/home/conversation");
        },
        // 预定详情
        toDetail(item, type) {
            //imMeetingStatus 0-未开始，1-进行中，2-已结束，-1-已删除
            // 历史详情
            if (item.imMeetingStatus === 2 && type === "all") {
                this.$modal.show(
                    HistoryConferenceView,
                    { from: "calendar", historyItem: item },
                    null,
                    {
                        name: "HistoryConferenceView-modal",
                        width: 440,
                        height: 560,
                        clickToClose: true,
                    },
                    {
                        "before-close": (event) => {
                            if (event.params && event.params.isUpdate) {
                                this.refreshList();
                            }
                        },
                    }
                );
            } else {
                // 其他会议详情
                this.$modal.show(
                    ConferDetail,
                    { currentMeetingInfo: item },
                    null,
                    {
                        name: "ConferDetail-modal",
                        width: 440,
                        height: 560,
                        clickToClose: true,
                    },
                    {
                        "before-close": (event) => {
                            this.refreshList();
                        },
                    }
                );
            }
        },
        // 删除或者取消会议
        deleteConfer(item) {
            let isOwner = item.ownerId === wfc.getUserId();
            this.$alert({
                content: isOwner
                    ? this.$t("voip.cancel_meeting_tip")
                    : this.$t("voip.cancel_meeting_delete_tip"),
                isText: true,
                cancelText: isOwner
                    ? this.$t("common.cancel")
                    : this.$t("voip.not_now"),
                confirmText: isOwner
                    ? this.$t("common.confirm")
                    : this.$t("voip.cancel_owner_meeting"),
                confirmCallback: async () => {
                    try {
                        const res = isOwner
                            ? await getUpdateMeeting({
                                  // 删除会议
                                  meetingId: this.calendarView
                                      ? item.imMeetingCallId
                                      : item.meetingId,
                                  status: "-1",
                              })
                            : await removeSelfFromParticipant({
                                  // 取消参会
                                  conferenceId: item.id,
                                  designatedParticipantIds:
                                      item.designatedParticipants.map(
                                          (item) => item.userId
                                      ),
                              });

                        const { code, message } = res.data;
                        if (code == "000000") {
                            this.refreshList();
                            !isOwner &&
                                this.$Message.warning(
                                    this.$t("common.cancel_succeed")
                                );
                        } else {
                            this.$Message.warning(message);
                        }
                    } catch (error) {
                        console.log(error);
                        this.$Message.error(this.$t("common.error_later"));
                    }
                },
            });
        },
        //获取我的会议列表/日历视图 信息
        async getConferenceList(type) {
            try {
                const fromTime = dayjs(this.initDate).format(
                    "YYYY-MM-DD HH:mm:ss"
                );
                const res = this.calendarView
                    ? await meetingCalendar({ fromTime }) // 日历视图
                    : await getMyMeetingList({}); // 我的会议
                const { code, data, message } = res.data;
                this.lock = false;
                this.conferenceList = [];
                if (code == "000000") {
                    if (this.calendarView && data.length) {
                        //imMeetingStatus 0-未开始，1-进行中，2-已结束，-1-已删除
                        this.conferenceList = data.map((item) => {
                            const {
                                imMeetingId,
                                imMeetingTitle,
                                imMeetingCode,
                                imMeetingOwnerId,
                                imMeetingStatus,
                                scheduleStartTime,
                                imMeetingStartTime,
                                scheduleEndTime,
                                imMeetingEndTime,
                            } = item;
                            return {
                                ...item,
                                id: imMeetingId,
                                title: imMeetingTitle,
                                code: imMeetingCode,
                                ownerId: imMeetingOwnerId,
                                startTime: !imMeetingStatus
                                    ? scheduleStartTime
                                    : imMeetingStartTime,
                                endTime: !imMeetingStatus
                                    ? scheduleEndTime
                                    : imMeetingEndTime || scheduleEndTime,
                            };
                        });
                        this.attributes = this.conferenceList.map((item) => {
                            return { dates: item.startTime };
                        });
                        // 初始设置选中数据
                        if (type !== "changeMonth" || this.initLock) {
                            this.onDayClick({ id: this.currentDate });
                        }
                    } else {
                        if (
                            !data.length &&
                            this.calendarView &&
                            dayjs(fromTime).format("YYYY-MM-DD") ===
                                this.currentDate
                        ) {
                            this.currentMeetingList = [];
                            this.threeMeetingList = [];
                            this.attributes = [];
                        }
                        this.conferenceList = data;
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.lock = false;
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 去历史会议页面
        goHistoryConference() {
            store.setCurrentHistoryConference(null);
            this.$router.replace("/home/historyconference");
        },
        // 点击日历视图按钮
        handlerCalendar() {
            if (this.lock) return;
            this.lock = true;
            this.calendarView = !this.calendarView;
            if (this.calendarView) {
                this.initDate = dayjs().startOf("month").format("YYYY-MM-DD");
                this.currentDate = dayjs().format("YYYY-MM-DD");
            }
            this.conferenceList = [];
            this.currentMeetingList = [];
            this.getConferenceList();
        },
        // 点击具体日期
        onDayClick(day) {
            this.isShowMore = false;
            this.currentDate = day.id;
            this.currentMeetingList = this.conferenceList.filter(
                (item) => dayjs(item.startTime).format("YYYY-MM-DD") === day.id
            );
            this.threeMeetingList = this.currentMeetingList.slice(0, 3);
        },
        // 切换月份
        handlerUpdateFrom(day) {
            if (!day.length) return;
            this.initLock = false;
            if (this.lock) return;
            this.lock = true;
            this.initDate = `${day[0].year}-${day[0].month}-01 00:00:00`;
            this.getConferenceList("changeMonth");
        },
        refreshList() {
            if (this.calendarView) {
                this.initDate = dayjs(this.currentDate)
                    .startOf("month")
                    .format("YYYY-MM-DD");
                try {
                    this.$refs.calendar.move(this.initDate);
                } catch (error) {
                    console.log(error);
                }
            }
            this.getConferenceList(); //删除成功更新列表数据
        },
        // 历史会议 点击删除
        historyDelete(item) {
            this.$alert({
                title: this.$t("voip.delete_meeting"),
                content: this.$t("voip.delete_meeting_tip"),
                isText: true,
                confirmCallback: async () => {
                    try {
                        let res = await delMeetingHistory({
                            imCycleMeetingId: item.isCycle
                                ? item.imCycleMeetingId
                                : "",
                            imMeetingIds: [item.imMeetingId],
                        });
                        const { code, message } = res.data;
                        if (code === "000000") {
                            this.refreshList();
                        } else {
                            this.$Message.error(message);
                        }
                    } catch (error) {}
                },
            });
        },
        handleShowMore() {
            this.isShowMore = !this.isShowMore;
        },
    },
    deactivated() {
        this.$eventBus.$off("updateMymeetingList");
    },
    unmounted() {
        this.$modal.hide("ConferDialog-modal");
        this.$modal.hide("ConferDetail-modal");
        this.$modal.hide("HistoryConferenceView-modal");
        this.$modal.hide("pick-designated-member-modal");
    },
};
</script>
<style>
.calendar-view .vc-container {
    width: 100%;
    border-radius: 18px;
    border: 1px solid #e6e6e6;
    background: #fafafa;
    overflow: hidden;
}

.calendar-view .vc-day.is-not-in-month * {
    opacity: 0.5 !important;
}

.calendar-view .vc-weeks {
    margin-top: 12px;
    padding: 0;
}
.custom-calendar .vc-week .on-left,
.custom-calendar .vc-week .on-right {
    background-color: #f5f5f5;
}

.custom-calendar .vc-week {
    border-top: 1px solid #f0efef;
}
.custom-calendar .vc-week .vc-day {
    border-left: 1px solid #f0efef;
    box-sizing: border-box;
    padding: 6px;
    overflow: hidden;
}
.custom-calendar .vc-week .on-left {
    border-left: 0;
}
</style>
<style lang="less" scoped>
.conference-page {
    display: flex;
    flex: 1;
    width: 100%;
    height: 100%;
    background: #fff;

    .conference-nav {
        width: 240px;
        height: 100%;
        padding: 30px 24px;
        box-sizing: border-box;
        position: relative;

        &::after {
            position: absolute;
            right: 0;
            top: 60px;
            content: "";
            width: 1px;
            height: calc(100% - 120px);
            background: #e6e6e6;
        }

        h4 {
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 500;
            font-size: 18px;
            line-height: 20px;
            display: flex;
            align-items: center;
            letter-spacing: -0.23px;
            color: #000000;
        }

        .nav-list {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            row-gap: 32px;
            li {
                display: flex;
                flex-direction: column;
                justify-content: center;
                position: relative;

                img {
                    width: 55px;
                    height: 55px;
                    border-radius: 18px;
                    display: block;
                    margin: 0 auto;
                    margin-bottom: 10px;
                    box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.1);
                }

                p {
                    font-family: "PingFang SC";
                    font-style: normal;
                    font-weight: 500;
                    font-size: 12px;
                    line-height: 18px;
                    text-align: center;
                    color: #666666;
                }

                .badge {
                    position: absolute;
                    color: #fff;
                    font-size: 12px;
                    background-color: red;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    line-height: 18px;
                    font-style: normal;
                    text-align: center;
                    right: 22px;
                    top: -5px;
                }
            }
        }
    }

    .conference-view {
        flex: 1;
        height: calc(100% - 48px);
        margin-top: 48px;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        h4 {
            margin: 0 24px;
            padding: 0 10px;

            .title-wrap {
                margin: 12px auto;
                max-width: 1000px;
                display: flex;
                justify-content: space-between;
                font-style: normal;
            }

            span {
                font-weight: 500;
                font-size: 13px;
                line-height: 20px;
                display: flex;
                align-items: center;
                color: #1dbb88;
            }

            .title {
                font-size: 16px;
                font-weight: 600;
                line-height: 20px;
                color: #000000;
                display: inline-block;
            }

            .calendar-view-btn {
                border-radius: 10px;
                border: 0.6px solid #dadada;
                padding: 2px 10px 2px 20px;
                margin-left: 10px;
                display: inline-block;
                background: url(../../assets/images/calendar.png) no-repeat 7px
                    4px;
                background-size: 12px;
                color: #666;
                font-family: PingFang SC;
                font-size: 12px;
                font-style: normal;
                font-weight: 500;
                line-height: normal;

                &.active {
                    background: #1dbb88
                        url(../../assets/images/calendar-active.png) no-repeat
                        7px 4px;
                    background-size: 12px;
                    border: 1px solid #1dbb88;
                    color: #fff;
                }
            }
        }

        .list {
            flex: 1;
            overflow-y: auto;
            margin: 0 24px;
            padding: 0 10px;

            &::-webkit-scrollbar {
                width: 0 !important;
                height: 0;
            }
        }

        .calendar-view-wrap {
            margin: 10px 24px;
            padding: 0 10px;
            flex: 1;
            overflow-y: auto;

            &::-webkit-scrollbar {
                width: 0 !important;
                height: 0;
            }

            ul li:last-child {
                margin-bottom: 20px;
            }

            .calendar-view {
                max-width: 1000px;
                max-height: 1000px;
                margin: 0 auto;

                .day {
                    text-align: right;
                }

                .day-wrap {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-end;
                    .lunar-day {
                        height: 20px;
                        line-height: 20px;
                        width: 100%;
                        text-align: left;
                        font-size: 12px;
                    }
                    .solar-day {
                        width: 28px;
                        height: 28px;
                        line-height: 28px;
                        text-align: center;
                    }

                    .dot-wrap {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        .dot {
                            width: 4px;
                            height: 4px;
                            margin: 4px 1px;
                            overflow: hidden;
                            border-radius: 2px;
                            background: #1dbb88;
                        }
                    }
                    .festival {
                        max-width: 128px;
                        font-size: 12px;
                        height: 20px;
                        line-height: 20px;
                        background-color: #f88484;
                        border-radius: 24px;
                        padding-left: 5px;
                        color: #fff;
                    }
                    &.active {
                        .solar-day {
                            width: 28px;
                            height: 28px;
                            line-height: 28px;
                            text-align: center;
                            border-radius: 50%;
                            background: #1dbb88;
                            color: #fff;
                        }
                    }
                }
            }

            .empty-container {
                margin-top: 50px;
            }
        }

        .show-more {
            display: block;
            text-align: center;
            font-size: 14px;
        }
    }
}
</style>
