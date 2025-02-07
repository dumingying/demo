<template>
    <div class="confer-dialog-wrap">
        <!-- 标题 -->
        <h5 class="confer-nav">
            {{ title }}
            <span @click="done">
                <Icon type="ios-close" style="font-size: 40px" />
            </span>
        </h5>
        <!-- 内容 -->
        <div class="dialog-content">
            <!-- 加入会议 -->
            <h6 class="title">{{ hdesc }}</h6>
            <input
                type="text"
                id="nbsp"
                class="text-input"
                v-if="status == 0"
                v-model="joinCode"
                :maxlength="11"
                :placeholder="$t('voip.enter_id')"
                @input="checkStrLong"
            />
            <!-- 快速会议 | 预约会议-->
            <input
                v-if="[1, 2].includes(status)"
                v-model="meetingTitle"
                :maxlength="30"
                class="text-input"
                type="text"
                :placeholder="setPlaceholder"
            />
            <!-- 快速会议 | 预约会议-->
            <template v-if="[1, 2].includes(status)">
                <h6 class="title">{{ $t("voip.conference_overview") }}</h6>
                <!-- placeholder="一句描述您的会议主题内容" -->
                <input
                    v-model="meetingDesc"
                    :maxlength="100"
                    class="text-input"
                    type="text"
                    :placeholder="$t('voip.no_description')"
                />
            </template>
            <!--  加入会议 | 快速会议-->
            <div class="confer-dialog" v-if="[0, 1].includes(status)">
                <p>{{ $t("voip.join_option") }}</p>
                <label v-if="status == 0">
                    <input
                        v-model="audiomike"
                        :disabled="!externalDevice.hasAudio"
                        type="checkbox"
                    />
                    <p
                        :style="{
                            opacity: !externalDevice.hasAudio ? '0.6' : '1',
                        }"
                    >
                        {{ $t("voip.turn_mic") }}
                    </p>
                </label>
                <label>
                    <input
                        v-model="openVideo"
                        :disabled="!externalDevice.hasVideo"
                        type="checkbox"
                    />
                    <p
                        :style="{
                            opacity: !externalDevice.hasVideo ? '0.6' : '1',
                        }"
                    >
                        {{ $t("voip.turn_video") }}
                    </p>
                </label>
            </div>
            <!-- 预定会议 -->
            <div class="confer-time" v-else>
                <ul>
                    <li>
                        <p>{{ $t("voip.start_time") }}</p>
                        <Date-picker
                            type="date"
                            :options="options3"
                            @on-change="handleChange_start"
                            v-model="startTime_value"
                            format="yyyy-MM-dd"
                            :placeholder="$t('voip.select_date')"
                            style="width: 120px"
                        ></Date-picker>
                        <Time-picker
                            format="HH:mm"
                            :placeholder="$t('voip.select_time')"
                            style="width: 112px; margin-left: 40px"
                            v-model="hour_startTime"
                            hide-disabled-options
                            :disabled-minutes="dateArr"
                        >
                        </Time-picker>
                    </li>
                    <li>
                        <p>{{ $t("voip.end_time") }}</p>
                        <Date-picker
                            type="date"
                            placement="bottom-start"
                            format="yyyy-MM-dd"
                            style="width: 120px"
                            confirm
                            @on-ok="handleOk"
                            :options="options4"
                            :placeholder="$t('voip.select_date')"
                            v-model="endTime_value"
                        ></Date-picker>
                        <Time-picker
                            hide-disabled-options
                            confirm
                            format="HH:mm"
                            style="width: 112px; margin-left: 40px"
                            :placeholder="$t('voip.select_time')"
                            :disabled-minutes="dateArr"
                            v-model="hour_endTime"
                        >
                        </Time-picker>
                    </li>
                </ul>
                <!-- 会议密码 -->
                <div class="set-meeting-pw">
                    <p>{{ $t("voip.meeting_pw") }}</p>
                    <div class="pass-word-wrap">
                        <label>
                            <input
                                type="checkbox"
                                v-model="openMeetingPassWord"
                            />
                            <span>{{ $t("voip.open_password") }}</span>
                        </label>
                        <label class="pass-word-label">
                            <input
                                type="text"
                                v-show="openMeetingPassWord"
                                v-model="meetingPassWord"
                                :maxlength="6"
                                :minlength="4"
                                @input="setMeetingPassWord"
                                :placeholder="$t('voip.enter_tip')"
                        /></label>
                    </div>
                </div>
            </div>
            <!-- 指定参会人员（快速会议 | 预定会议） -->
            <div class="operate-wrap" v-if="[1, 2].includes(status)">
                <p style="margin-top: 0">
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
                    {{ $t("voip.private_meeting") }}
                </p>
                <p class="participate" @click="getParticipate">
                    {{ checkedUsers }}
                </p>
            </div>
            <!-- 周期频率 （预定会议）-->
            <div class="operate-wrap" v-if="[2].includes(status)">
                <p>
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
                    {{ $t("voip.frequency") }}
                </p>
                <div @click="handlerFrequency">
                    <Select
                        v-model="frequency"
                        class="frequency-select"
                        placement="top"
                        :disabled="
                            permissionList.isAppCharge &&
                            !permissionList.privilegeCreateCycleConference
                        "
                    >
                        <Option
                            v-for="item in frequencyList"
                            :value="item.value"
                            :key="item.value"
                        >
                            {{ item.key }}
                        </Option>
                    </Select>
                </div>
            </div>
            <!-- 讨论群 -->
            <div class="operate-wrap" v-if="[2].includes(status)">
                <p>{{ $t("voip.discuss_group") }}</p>
                <Dropdown
                    class="group-btn"
                    @on-click="handleBindingGroup"
                    trigger="click"
                    placement="top"
                    transfer-class-name="click-item"
                >
                    <span class="bind-type">{{ bindTypeName }}</span>
                    <template #list>
                        <DropdownMenu>
                            <DropdownItem
                                v-for="item in bindingGroupList"
                                :key="item.value"
                                :name="item.name"
                                :selected="bindType === item.value"
                                >{{ item.key }}</DropdownItem
                            >
                        </DropdownMenu>
                    </template>
                </Dropdown>
            </div>
            <div class="operate-wrap" v-if="[1, 2].includes(bindType)">
                <p>{{ $t("voip.bind_group_name") }}</p>
                <input
                    type="text"
                    v-if="bindType === 1"
                    class="group-name"
                    :maxlength="60"
                    v-model="discussionGroup.groupName"
                />
                <p v-else class="group-name" @click="handleBind">
                    {{ discussionGroup.groupName }}
                </p>
            </div>
            <div class="con-desc" v-if="[2].includes(status)">
                {{ $t("voip.scheduled_tip") }}
            </div>
            <!-- 加入会议 -->
            <div v-if="status == 0" class="btn-wrap">
                <button
                    :disabled="isJoinDisabled"
                    :style="{ opacity: isJoinDisabled ? '0.6' : '1' }"
                    @click="handlerCreateConference"
                >
                    {{ title }}
                </button>
            </div>
            <!-- 快速会议 -->
            <div
                v-else-if="status == 1"
                :class="[!meetingTitle ? 'disabled' : '', 'btn-wrap']"
            >
                <button
                    :disabled="!meetingTitle"
                    @click="handlerCreateConference"
                >
                    {{ $t("voip.start_meeting_btn") }}
                </button>
            </div>
            <!-- 预约会议 -->
            <div v-else class="btn-wrap">
                <button class="con-time-btn" @click="handlerCreateConference">
                    {{ $t("voip.done") }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import store from "@/store";
import dayjs from "dayjs";
import wfc from "@/wfc/client/wfc";
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";
import { ipcRenderer } from "@/platform";
import EnterPassWord from "./EnterPassWord";
import RequestMeeting from "./RequestMeeting";
import PickDesignatedMember from "./PickDesignatedMember";
import AudienceOverflowTip from "./AudienceOverflowTip";
import { tipsContent } from "../../common/Tips";
import { setItem } from "@/ui/util/storageHelper";
import {
    getSaveMeeting,
    getJoinMeeting,
    getMyMeeting,
    getUserVipInfo,
} from "@/axios";

export default {
    name: "ConferDialog",
    props: {
        title: {
            type: String,
            default: "",
        },
        hdesc: {
            type: String,
            default: "",
        },
        status: {
            type: Number,
            default: 0,
        },
        isSetGroup: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            dateArr: [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19,
                20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 36,
                37, 38, 39, 40, 41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53,
                54, 55, 56, 57, 58, 59,
            ],
            audiomike: false, //开启麦克风
            openVideo: false, //开启视频
            code_phone: "", // 输入的会议号
            joinCode: "",
            meetingTitle: "", //会议主题
            meetingDesc: "", //会议描述
            startTime_value: dayjs().format("YYYY-MM-DD"),
            endTime_value: dayjs().format("YYYY-MM-DD"),
            hour_startTime: "",
            hour_endTime: "",
            userInfo: store.state.contact.selfUserInfo,
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
            openMeetingPassWord: false, // 开启会议密码
            meetingPassWord: "",
            lock: false, // 预约会议锁
            designatedMember: [], // 参会人员
            oldDesignatedMember: [],
            sharedSearchState: store.state.search,
            sharedContactState: store.state.contact,
            sharedConversation: store.state.conversation,
            sharedPickState: store.state.pick,
            frequency: 0,
            frequencyList: [
                { key: this.$t("voip.no"), value: 0 },
                { key: this.$t("voip.daily"), value: 1 },
                { key: this.$t("voip.weekly"), value: 3 },
                { key: this.$t("voip.monthly"), value: 4 },
                { key: this.$t("voip.weekday"), value: 2 },
            ],
            vipInfo: {}, //当前会员信息
            currentJoinMeetingInfo: "", // 记录当前进入会议的会议密码
            discussionGroup: "", // 绑定的讨论群
            bindingGroupList: [
                { key: this.$t("voip.no_bind"), value: 0, name: "none" },
                { key: this.$t("voip.creat_group"), value: 1, name: "create" },
                { key: this.$t("voip.bind_group"), value: 2, name: "bind" },
            ],
            bindType: "", // 1 创建方式，2 绑定已有方式
            markTokenDate: "",
        };
    },
    computed: {
        isEn() {
            return this.$store.state.currentLanguage === "en";
        },
        bindTypeName() {
            return !this.bindType
                ? this.$t("voip.no")
                : this.bindType === 1
                ? this.$t("voip.creat_group")
                : this.$t("voip.bind_group");
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
        checkedUsers() {
            return this.designatedMember.length
                ? this.designatedMember
                      .map((item) => this.mixinGetUserName(item))
                      .join(",")
                : this.$t("voip.unlimited");
        },
        setPlaceholder() {
            let name = this.userInfo._displayName;
            name = this.mixinGetUserName(this.userInfo);
            return this.status === 1
                ? this.$t("voip.encrypted_meeting", [name])
                : this.$t("voip.schedule_meeting", [name]);
        },
        vipText() {
            return this.permissionList.vipLevel
                ? this.isEn
                    ? `${this.$t("voip.expiration")}:${dayjs(
                          this.vipInfo.vipEndTime
                      ).format("YYYY-MM-DD")}`
                    : `${dayjs(this.vipInfo.vipEndTime).format(
                          "YYYY-MM-DD"
                      )}${this.$t("voip.expiration")}`
                : this.$t("voip.free_tip");
        },
        vipBg() {
            let bgObj = {
                0: "background: linear-gradient(90deg, #F8D069 0%, #FFBC53 100%)",
                1: "background: linear-gradient(90deg, #F8D069 0%, #FFBC53 100%)",
                2: "background: linear-gradient(90deg, #FFA04E 0%, #F58A5E 25.26%, #F46324 100%)",
                3: "background: linear-gradient(90deg, #EB2171 0%, #B311B1 52.86%, #1F3ECA 100%)",
                4: "background: linear-gradient(90deg, #1DBB88 0%, #090F45 100%);",
            };
            return bgObj[this.permissionList.vipLevel];
        },
        vipIcon() {
            return `background: require(../../../assets/images/vip-${this.permissionList.vipLevel}.png) no-repeat center center`;
        },
        isJoinDisabled() {
            return this.code_phone.toString().length < 11;
        },
        // 媒体设备信息
        externalDevice() {
            return this.$store.state.deviceObj;
        },
    },
    created() {
        this.meetingTitle = this.setPlaceholder;
        this.hour_startTime = this.get_hms();
        this.hour_endTime = this.get_end_hms();
        if ([1, 2].includes(this.status)) {
            this.getVipInfo();
            // 快速和预约会议需要生成时间戳
            this.markTokenDate = +new Date();
            if (this.isSetGroup) {
                let { groupId, groupName } = JSON.parse(this.isSetGroup);
                this.bindType = 2;
                this.discussionGroup = {
                    groupId: groupId,
                    groupName: groupName,
                };
            }
        }
        this.changeFrequencyList();
    },
    methods: {
        // video audio 屏幕录制
        async checkMediaPermissions(type) {
            const nameObj = {
                camera: this.$t("mediaDevices.video"),
                microphone: this.$t("mediaDevices.audio"),
            };
            const name = nameObj[type];
            this.$alert({
                content: this.$t("mediaDevices.mac-tip", [name]),
                title: `${this.$t("mediaDevices.title")}${name}`,
                cancelText: this.$t("mediaDevices.cancel"),
                confirmText: this.$t("mediaDevices.confirm"),
                width: 450,
                height: 200,
                confirmCallback: () => {
                    ipcRenderer.send(
                        "media-devices-permissions-callback",
                        type
                    );
                },
            });
        },
        //实现四位一个空格符
        checkStrLong(e) {
            let reg = /\s{1,}/g;
            let str = ""; //定义页面展示效果的值
            this.joinCode = e.target.value.replace(reg, "");
            for (let i = 0; i < this.joinCode.length; i++) {
                if (i % 3 === 0 && i > 0) {
                    str = str + " " + this.joinCode.charAt(i);
                } else {
                    str = str + this.joinCode.charAt(i);
                }
            }
            this.joinCode = str.replace(/[^\d\s]/gi, "");
            this.code_phone = this.joinCode;
        },
        //获取当前时间
        get_hms() {
            let date = new Date();
            // 当前时间是 00 15 30 45
            let hour = date.getHours();
            let minute = 0;
            //   console.log(date.getMinutes(), 'get_hms')
            if (date.getMinutes() >= 0 && date.getMinutes() <= 15) {
                minute = 15;
            } else if (date.getMinutes() >= 15 && date.getMinutes() <= 30) {
                minute = 30;
            } else if (date.getMinutes() >= 30 && date.getMinutes() <= 45) {
                minute = 45;
            } else if (date.getMinutes() > 45) {
                hour = date.getHours() + 1;
                minute = 0;
            }
            return `${hour}:${minute}`;
        },
        //推算当前结束时间
        get_end_hms() {
            let date = new Date();
            let startTime = this.get_hms();
            let startMinute = startTime.split(":")[1]; // 分钟
            let hours = date.getHours(); //小时
            let minute = 0;
            //   console.log(startMinute, 'get_end_hms')
            if (startMinute == 0) {
                hours = startTime.split(":")[0]; // 小时
                minute = 30;
            } else if (startMinute == 15) {
                minute = 45;
            } else if (startMinute == 30) {
                hours += 1;
                minute = 0;
            } else if (startMinute == 45) {
                hours += 1;
                minute = 15;
            }
            return `${hours}:${minute}`;
        },
        getWeekDate(val = "") {
            let now = new Date(val);
            let day = now.getDay();
            let weeks = [
                this.$t("common.week_1"),
                this.$t("common.week_2"),
                this.$t("common.week_3"),
                this.$t("common.week_4"),
                this.$t("common.week_5"),
                this.$t("common.week_6"),
                this.$t("common.week_7"),
            ];
            let week = weeks[day];
            return week;
        },
        //开始时间选择
        handleChange_start(date) {
            this.frequency = 0;
            this.changeFrequencyList();
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
        //关闭页面
        done() {
            // 关闭预定会议界面时 若有操作
            if ([1, 2].includes(this.status)) {
                this.sharedPickState.conversations.length = 0;
            }
            this.$modal.hide("ConferDialog-modal");
        },
        // 获取用户vip相关信息
        getVipInfo() {
            return new Promise((resolve, reject) => {
                getUserVipInfo({ userId: wfc.getUserId() })
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
        // 切换开启会议密码
        setMeetingPassWord(e) {
            this.$nextTick(() => {
                this.meetingPassWord = e.target.value.replace(/[^\d]/g, "");
            });
        },
        //点击选择指定成员
        getParticipate() {
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
            this.$modal.show(
                PickDesignatedMember,
                {
                    maxLength: conferenceJoinLimit,
                    initialCheckedUsers: this.designatedMember, // 已经选定的人员
                    uncheckableUsers: [],
                    confirmTitle: this.$t("common.confirm"),
                },
                null,
                {
                    name: "pick-designated-member-modal",
                    width: 600,
                    height: 480,
                    clickToClose: false,
                },
                {
                    "before-close": async (event) => {
                        console.log("Closing...", event, event.params);
                        if (!event.params) return;
                        let { confirm, users } = event.params;
                        if (confirm) {
                            this.designatedMember = users;
                            this.oldDesignatedMember = [
                                ...this.designatedMember,
                            ];
                        } else {
                            this.designatedMember = this.oldDesignatedMember
                                .length
                                ? [...this.oldDesignatedMember]
                                : [];
                        }
                    },
                }
            );
        },
        // 切换周期频率
        changeFrequencyList() {
            if ([2].includes(this.status)) {
                this.frequencyList = this.frequencyList.map((item) => {
                    return {
                        ...item,
                        key:
                            item.value === 3
                                ? this.$t("voip.weekly")
                                : item.value === 4
                                ? this.$t("voip.monthly")
                                : item.key,
                    };
                });
            }
        },
        // 非会员/普通（0,1）不可以设置周期会议、高/超/专业（2,3,4）可以
        handlerFrequency(event) {
            let { isAppCharge, privilegeCreateCycleConference } =
                this.permissionList;
            if (isAppCharge && !privilegeCreateCycleConference) {
                this.$alert({
                    content: tipsContent[13],
                    cancelText: "",
                    height: 150,
                });
                event.stopPropagation();
                return;
            }
        },
        // 点击加入，快速，预约按钮
        async handlerCreateConference() {
            switch (this.status) {
                case 0: // 加入会议 0
                    if ((this.code_phone + "").length < 9) {
                        this.$Message.warning(
                            this.$t("voip.invalid_meeting_id")
                        );
                        return;
                    }
                    // 权限检查
                    if (this.audiomike) {
                        const reply = await ipcRenderer.invoke(
                            "media-devices-permissions",
                            "microphone"
                        );
                        if (!reply) {
                            this.checkMediaPermissions("microphone");
                            this.audiomike = false;
                            return;
                        }
                    }
                    // 权限检查
                    if (this.openVideo) {
                        const reply = await ipcRenderer.invoke(
                            "media-devices-permissions",
                            "camera"
                        );
                        if (!reply) {
                            this.checkMediaPermissions("camera");
                            this.openVideo = false;
                            return;
                        }
                    }
                    // 加入会议 step-1
                    getMyMeeting({
                        userId: wfc.getUserId(),
                        code: this.code_phone,
                    })
                        .then((res) => {
                            const { code, data, message } = res.data;
                            if (code === "000000") {
                                //记录当前进入会议的会议信息
                                this.currentJoinMeetingInfo = { ...data };
                                this.joinConference();
                            } else {
                                this.$Message.warning(message);
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                    break;
                case 1: // 快速会议  1
                    // 权限检查
                    if (this.openVideo) {
                        const reply = await ipcRenderer.invoke(
                            "media-devices-permissions",
                            "camera"
                        );
                        if (!reply) {
                            this.checkMediaPermissions("camera");
                            this.openVideo = false;
                            return;
                        }
                    }
                    this.nextStartConference();
                    break;
                case 2: // 预定会议 2
                    //   if (!this.meetingTitle) {
                    //     this.$Message.warning(this.$t("voip.required_meeting_subject"));
                    //     return;
                    //   }
                    if (!this.startTime_value || !this.hour_startTime) {
                        this.$Message.warning(this.$t("voip.enter_start_time"));
                        return;
                    }
                    if (!this.endTime_value || !this.hour_endTime) {
                        this.$Message.warning(this.$t("voip.enter_end_time"));
                        return;
                    }
                    let YmD_start = dayjs(this.startTime_value).format(
                        "YYYY-MM-DD"
                    );
                    let YmD_end = dayjs(this.endTime_value).format(
                        "YYYY-MM-DD"
                    );
                    let ALL_start = `${YmD_start} ${this.hour_startTime}`;
                    let ALL_end = `${YmD_end} ${this.hour_endTime}`;
                    let newD = dayjs().format("YYYY-MM-DD HH:mm");
                    let ALL_start_getTime = +dayjs(ALL_start);
                    let ALL_end_getTime = +dayjs(ALL_end);
                    let now_date_getTime = +dayjs(newD);
                    //开始时间不能大于结束时间
                    if (ALL_start_getTime > ALL_end_getTime) {
                        this.$Message.warning(
                            this.$t("voip.meeting_info_check7")
                        );
                        return;
                    }
                    if (ALL_start_getTime == ALL_end_getTime) {
                        this.$Message.warning(
                            this.$t("voip.meeting_info_check2")
                        );
                        return;
                    }
                    if (dayjs(ALL_start).diff(newD, "day") > 30) {
                        this.$Message.warning(
                            this.$t("voip.meeting_info_check6")
                        );
                        return;
                    }
                    var re = this.getHoursDiff(ALL_start, ALL_end);
                    var h = parseInt(re);
                    //   console.log('h:', h)
                    if (h > 24) {
                        this.$Message.warning(
                            this.$t("voip.meeting_info_check1")
                        );
                        return;
                    } else {
                        let m = parseInt((re - h) * 60);
                        if (h == 24 && m > 0) {
                            this.$Message.warning(
                                this.$t("voip.meeting_info_check1")
                            );
                            return;
                        }
                    }
                    //在判断是否是当前时间以前的时间 (开始时间和结束时间不能是以前的时间)
                    //开始时间的时间戳
                    if (ALL_start_getTime < now_date_getTime) {
                        this.$Message.warning(
                            this.$t("voip.meeting_info_check4")
                        );
                        return;
                    }
                    //结束时间的时间戳
                    if (ALL_end_getTime < now_date_getTime) {
                        this.$Message.warning(
                            this.$t("voip.meeting_info_check3")
                        );
                        return;
                    }
                    // 检测密码是否填写
                    if (this.openMeetingPassWord && !this.meetingPassWord) {
                        this.$Message.warning(
                            this.$t("voip.enter_meeting_password")
                        );
                        return;
                    }
                    // 检测密码位数
                    if (
                        this.openMeetingPassWord &&
                        (this.meetingPassWord.length < 4 ||
                            this.meetingPassWord.length > 6)
                    ) {
                        this.$Message.warning(this.$t("voip.enter_tip"));
                        return;
                    }
                    // 预定会议 step-1
                    this.markConference(ALL_start_getTime, ALL_end_getTime);
                    break;
                default:
                    break;
            }
        },
        // 生成会议基本信息（预约会议，快速会议中使用）
        createConferenceInfo(type) {
            let currentTime = dayjs().format("YYYY-MM-DD HH:mm");
            let info = {
                userId: wfc.getUserId(),
                type,
                title: this.meetingTitle,
                scheduleTime: currentTime, //预约时间
                startTime: currentTime, //会议实际开始时间
                endTime: currentTime, //会议实际结束时间
                isPasswordNeed: "", // 是否需要密码 0-不需要；1-需要
                password: "", // 会议密码
                isDesignatedParticipant: 0, //是否是指定成员会议 0-非；1-是
                designatedParticipantIds: [], //指定 成员id数组
                isCycle: 0, // 是否是周期会议 0-否；1-是
                cycleType: 0, //  周期会议类型
                description: this.meetingDesc, // 会议描述
            };
            // 指定成员
            if (this.designatedMember.length) {
                info.isDesignatedParticipant = 1;
                let ids = [];
                let groupMemberIds = [];
                let index = this.designatedMember.findIndex(
                    (item) => item._isGroup
                ); // 获取群组信息
                if (index > -1) {
                    groupMemberIds = wfc.getGroupMemberIds(
                        this.designatedMember[index].groupId
                    );
                }
                let members = this.designatedMember.filter(
                    (item) => !item._isGroup
                ); // 获取成员
                if (members.length) {
                    ids = members.map((item) => item.uid);
                }
                info.designatedParticipantIds = [
                    ...new Set([...ids, ...groupMemberIds]),
                ];
            }

            // 快速会议 需要多添加野火相关传参
            if (!type) {
                let callId = `${wfc.getUserId()}|${+new Date()}`;
                let pin = Math.ceil(Math.random() * 1000000) + "";
                info.imCreateMeeting = {
                    pin,
                    roomId: callId,
                };
            }
            //预约会议需要处理的参数
            if (type) {
                // 是否开启密码入会 0-不需要；1-需要
                info.isPasswordNeed = Number(this.openMeetingPassWord);
                info.password =
                    this.openMeetingPassWord && this.meetingPassWord
                        ? this.meetingPassWord
                        : ""; // 对应的密码
                // 是周期会议
                info.isCycle = this.frequency ? 1 : 0;
                info.cycleType = this.frequency || 0;
                // 绑定的群
                if (this.discussionGroup && this.bindType) {
                    let { groupId, groupName } = this.discussionGroup;
                    info.groupId = this.bindType === 2 ? groupId : ""; // 绑定方式 传 群id
                    info.groupName = this.bindType === 1 ? groupName : ""; // 创建方式 传 群名称
                }
            }
            return info;
        },
        // 快速会议 step 2
        async nextStartConference() {
            let params = this.createConferenceInfo(0);
            try {
                const res = await getSaveMeeting(params, {
                    "X-Header-FormToken": this.markTokenDate,
                });
                const { code, data, message } = res.data;
                if (code == "000000") {
                    //   let isAudience = !this.externalDevice.hasVideo // 是否是以主持人角色入会
                    avenginekitproxy.startConference(
                        params.imCreateMeeting.roomId,
                        false,
                        params.imCreateMeeting.pin,
                        wfc.getUserId(),
                        this.meetingTitle, // 会议主题
                        this.meetingDesc, // 会议描述
                        false, // false:主持人  true:听众
                        "",
                        false,
                        {
                            meetingCode: data.code, // 6位会议id
                            isQuickMeeting: true,
                            devices: this.externalDevice,
                            designatedMember: this.designatedMember,
                        }, // extra 额外信息
                        null,
                        true, // 静音进入会议
                        !this.openVideo // 是否是关闭摄像头进入会议
                    );
                    this.$modal.hide("ConferDialog-modal");
                } else {
                    this.$Message.warning(
                        code == "5000011"
                            ? this.$t("voip.create_fail")
                            : message
                    );
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 加入会议 step-2
        joinConference() {
            let { imCreateMeeting, isPasswordNeed, password } =
                this.currentJoinMeetingInfo;
            if (
                imCreateMeeting.host !== wfc.getUserId() &&
                isPasswordNeed === 1 &&
                password
            ) {
                this.$modal.show(
                    EnterPassWord,
                    { title: this.$t("voip.meeting_password") },
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
                                const { params, meetingPassWord } =
                                    event.params;
                                // 点击加入会议
                                if (params && meetingPassWord) {
                                    this.currentJoinMeetingInfo._meetingPassWord =
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
        // 加入会议 step-3
        async nextJoinMeeting() {
            const {
                isPasswordNeed,
                password,
                imCreateMeeting,
                _meetingPassWord: meetingPassWord,
                id,
                code: meetingCode,
            } = this.currentJoinMeetingInfo;

            if (meetingPassWord && password && meetingPassWord !== password) {
                this.$Message.warning(this.$t("voip.password_wrong"));
                return;
            }
            // 主持人且有摄像头设备可以以互动模式入会
            let isAudience =
                wfc.getUserId() === imCreateMeeting.host ||
                this.audiomike ||
                this.openVideo
                    ? false
                    : true;
            try {
                const res = await getJoinMeeting({
                    isAudience: Number(isAudience), // 是否互动模式 1  观众模式入会 0  主播模式入会
                    id,
                    code: meetingCode, //会议号
                    status: "",
                    isPasswordNeed: isPasswordNeed,
                    password: meetingPassWord || password,
                });
                const { code, data, message } = res.data;
                if (code == "000000") {
                    let cmc = data.imCreateMeeting;
                    setItem("confer_code", this.code_phone);
                    this.currentJoinMeetingInfo = "";
                    avenginekitproxy.joinConference(
                        data.meetingId, //callId 会议id
                        false, // audioOnly 是否只开启音频
                        cmc.pin, //会议pin码
                        cmc.host, // host 会议主持人
                        data.title, //title 会议标题
                        cmc.description, // desc 会议描述
                        isAudience, // wfc.getUserId()=== cmc.host || this.audiomike || this.openVideo ? false : true, //audience 是否是以观众角色入会
                        false, // advance 是否是高级会议
                        !this.audiomike, // false 是打开 true 是关闭  muteAudio 是否是静音加入会议
                        !this.openVideo, // false 是打开 true 是关闭  muteVideo 是否是关闭摄像头加入会议
                        {
                            video: !this.openVideo,
                            audio: !this.audiomike,
                        } //extra 一些额外信息，主要用于将信息传到音视频通话窗口
                    );
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
                            "before-close": (event) => {
                                event.params &&
                                    this.$modal.hide("ConferDialog-modal");
                            },
                        }
                    );
                } else if (code === "6000021") {
                    // 主播人数过多
                    this.$modal.show(
                        AudienceOverflowTip,
                        { type: "join" },
                        null,
                        {
                            name: "AudienceOverflowTip-modal",
                            width: 320,
                            height: 180,
                            clickToClose: false, // 点击模态框是否关闭
                        },
                        {
                            "before-close": (event) => {
                                // 点击同意
                                if (event.params) {
                                    // 将设备摄像头和声音关闭 再次进入会议
                                    this.audiomike = false;
                                    this.openVideo = false;
                                    this.nextJoinMeeting();
                                }
                            },
                        }
                    );
                } else {
                    this.$Message.warning(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 预定会议 step-2
        async markConference(sTime, eTime) {
            if (!this.designatedMember.length && this.bindType === 1) {
                this.$alert({
                    content: this.$t("voip.discussion_tip"),
                    isText: true,
                    height: 150,
                    cancelText: "",
                });
                return;
            }
            if (this.lock) return;
            this.lock = true;
            let params = this.createConferenceInfo(1);
            params.scheduleTime = sTime;
            params.startTime = sTime;
            params.endTime = eTime;
            try {
                const res = await getSaveMeeting(params, {
                    "X-Header-FormToken": this.markTokenDate,
                });
                this.lock = false;
                const { code, message, data } = res.data;
                if (code == "000000") {
                    //需要关闭当前页面并且刷新会议列表
                    this.$modal.hide("ConferDialog-modal", {
                        meetingDetail: { ...data, ...params },
                        designatedMember: this.designatedMember,
                    });
                } else if (code === "5000011") {
                    this.$alert({
                        content: tipsContent[14],
                        cancelText: "",
                        height: 150,
                    });
                } else {
                    this.$Message.warning(message);
                }
            } catch (error) {
                this.lock = false;
                console.log(error);
                this.$Message.warning(this.$t("common.error_later"));
            }
        },
        //选择确定的时候
        handleOk() {
            let YmD_start = dayjs(this.startTime_value).format("YYYY-MM-DD");
            let YmD_end = dayjs(this.endTime_value).format("YYYY-MM-DD");
            var re = this.getHoursDiff(YmD_start, YmD_end);
            var h = parseInt(re);
            //   console.log('h:', h)
            if (h > 24) {
                this.endTime_value = new Date(this.startTime_value);
                this.$Message.warning(this.$t("voip.meeting_info_check1"));
            } else if (h < 0) {
                this.endTime_value = new Date(this.startTime_value);
                this.$Message.warning(this.$t("voip.meeting_info_check2"));
            }
        },
        // 操作绑定方式选择
        handleBindingGroup(name) {
            switch (name) {
                case "none":
                    this.bindType = 0;
                    this.discussionGroup = "";
                    break;
                case "create":
                    if (!this.designatedMember.length) {
                        this.bindType = 0;
                        this.discussionGroup = "";
                        this.$alert({
                            content: this.$t("voip.discussion_tip"),
                            isText: true,
                            height: 150,
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
                            console.log(groups);
                            this.bindType = 2;
                            let groupInfo = groups[0];
                            this.discussionGroup = {
                                groupId: groupInfo.groupId,
                                groupName: groupInfo.groupName,
                            };
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
            if (isAppCharge) {
                if (this.designatedMember.length + 1 > groupMemberLimit) {
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
                        this.bindType = 1;
                        //进行下一步创建群组
                        this.discussionGroup = {
                            groupId: 0,
                            groupName: this.meetingTitle,
                        };
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
            } else {
                this.bindType = 1;
                this.discussionGroup = {
                    groupId: "",
                    groupName: this.meetingTitle,
                };
            }
        },
    },
};
</script>
<style>
.frequency-select.ivu-select-disabled .ivu-select-selection {
    background-color: #fff;
    color: #515a6e;
}
.operate-wrap .click-item {
    width: 100%;
}
.operate-wrap .ivu-dropdown-rel {
    height: 100%;
}
</style>

<style scoped lang="less">
.confer-dialog-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;

    .confer-nav {
        text-align: center;
        display: table-cell;
        vertical-align: middle;
        font-size: 16px;
        position: relative;
        height: 50px;
        line-height: 60px;
        margin: 0 10px;
        span {
            position: absolute;
            top: 0;
            right: 0;
            height: 50px;
        }
    }
    .tip {
        height: 44px;
        padding-left: 140px;
        padding-right: 28px;
        position: relative;
        color: #fff;
        font-size: 13px;
        vertical-align: middle;
        display: flex;
        align-items: center;
        justify-content: space-between;
        &::before {
            position: absolute;
            content: "";
            width: 104px;
            height: 24px;
            left: 28px;
            top: 10px;
        }
        &.vip-bg-0 {
            padding-left: 60px;
        }
        &.vip-bg-0::before {
            width: 24px;
            background: url("../../../assets/images/vip-bg-0.png") no-repeat
                center left;
            background-size: 100%;
        }
        &.vip-bg-1::before {
            background: url("../../../assets/images/vip-bg-1.png") no-repeat
                center left;
            background-size: 100%;
        }
        &.vip-bg-2::before {
            background: url("../../../assets/images/vip-bg-2.png") no-repeat
                center left;
            background-size: 100%;
        }
        &.vip-bg-3::before {
            background: url("../../../assets/images/vip-bg-3.png") no-repeat
                center left;
            background-size: 100%;
        }
        &.vip-bg-4::before {
            background: url("../../../assets/images/vip-bg-4.png") no-repeat
                center left;
            background-size: 100%;
        }
        &.en.vip-bg-0::before {
            width: 24px;
            background: url("../../../assets/images/vip-bg-0.png") no-repeat
                left center;
            background-size: auto 20px;
        }
        &.en.vip-bg-1::before {
            background: url("../../../assets/images/vip-bg-0.png") no-repeat
                    left center,
                url("../../../assets/images/vip-bg-1-en.png") no-repeat 30px
                    center;
            background-size: auto 20px, auto 22px;
        }
        &.en.vip-bg-2::before {
            background: url("../../../assets/images/vip-bg-0.png") no-repeat
                    left center,
                url("../../../assets/images/vip-bg-2-en.png") no-repeat 30px
                    center;
            background-size: auto 20px, auto 22px;
        }
        &.en.vip-bg-3::before {
            background: url("../../../assets/images/vip-bg-0.png") no-repeat
                    left center,
                url("../../../assets/images/vip-bg-3-en.png") no-repeat 30px
                    center;
            background-size: auto 20px, auto 22px;
        }
        &.en.vip-bg-4::before {
            background: url("../../../assets/images/vip-bg-0.png") no-repeat
                    left center,
                url("../../../assets/images/vip-bg-4-en.png") no-repeat 30px
                    center;
            background-size: auto 20px, auto 22px;
        }
        .open-vip-btn {
            border: 1px solid #ffffff;
            border-radius: 4px;
            padding: 6px 8px;
            box-sizing: border-box;
            font-size: 12px;
            line-height: 12px;
        }
    }
    .dialog-content {
        flex: 1;
        overflow: auto;
        padding: 0 30px 20px;
        box-sizing: border-box;
        .title {
            margin-top: 8px;
            font-size: 12px;
            line-height: 24px;
        }

        .vip-test {
            text-align: center;
            font-size: 12px;
            line-height: 24px;
            margin-top: 10px;

            .count,
            .times {
                color: #333;
                display: flex;
                justify-content: space-between;
                // border-bottom: 1px solid #eee;
                padding: 5px 0;
                color: #535a6c;
                span {
                    color: #000;
                }
            }
        }
        .text-input {
            width: 100%;
            height: 32px;
            line-height: 32px;
            border: 1px solid #e5e5e5;
            border-radius: 3px;
            outline: none;
            padding: 0 5px;
            margin: 5px 0;
            &:active,
            &focus {
                border: 1px solid #1dbb88;
            }
        }
        label {
            width: 100px;
            display: flex;
            font-size: 13px;
            margin: 10px 10px 10px 0;
            align-items: center;
            input {
                vertical-align: middle;
            }
            p:nth-child(2) {
                margin-left: 5px;
                font-size: 12px;
            }
        }
        button {
            display: block;
            width: 100%;
            height: 38px;
            border-radius: 3px;
            background: #1dbb88;
            color: #fff;
            font-size: 14px;
            font-weight: bold;
            border: none;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
        }
        button:disabled {
            opacity: 0.6;
        }
        /* chrome */
        input[type="number"] {
            -moz-appearance: textfield; /* firefox */
        }
        .confer-time ul li p {
            padding: 8px 0px;
        }
        .con-desc {
            text-align: center;
            padding: 8px 0px;
            box-sizing: border-box;
        }
        .con-time-btn {
            background: #1dbb88;
            color: #fff;
            font-size: 14px;
            font-weight: bold;
        }
        .set-meeting-pw {
            margin-top: 10px;
            .pass-word-wrap {
                display: flex;
                flex-direction: row;
                padding: 8px 0;
                label {
                    margin: 0;
                }
                span {
                    margin-left: 5px;
                }
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
        }
        .confer-dialog {
            margin-top: 5px;
        }
    }
    .btn-wrap {
        margin-top: 20px;
    }
    .operate-wrap {
        width: 100%;
        p {
            margin: 8px 0;
            vertical-align: middle;
            display: flex;
            align-items: center;
            line-height: 18px;
        }

        .group-name {
            width: 100%;
            height: 32px;
            background-color: #fff;
            border-radius: 4px;
            border: 1px solid #dcdee2;
            padding: 0 5px;
        }
        .participate {
            width: 100%;
            height: 32px;
            line-height: 32px;
            border: 1px solid #e5e5e5;
            border-radius: 3px;
            outline: none;
            padding: 0 5px;
            margin: 5px 0;
            overflow: hidden;
            word-break: keep-all;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        .group-btn {
            height: 32px;
            display: block;
            box-sizing: border-box;
            cursor: pointer;
            position: relative;
            background-color: #fff;
            border-radius: 4px;
            border: 1px solid #dcdee2;
            transition: all 0.2s ease-in-out;
            .bind-type {
                display: block;
                line-height: 32px;
                padding: 0 5px;
                height: 100%;
            }
        }
    }
}
</style>
