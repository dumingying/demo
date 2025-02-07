<!-- 我的会议 单项组件 -->

<template>
    <li>
        <p class="time-wrap" @click="toDetail(item)">
            {{ resetMeetingTime(item) }}
            <span v-if="item.isCycle" class="frequency-icon">
                {{ frequency(item) }}
            </span>
        </p>
        <div class="confer-info">
            <div class="info-left" @click="toDetail(item)">
                <p class="title">{{ item.title }}</p>
                <p class="code">
                    {{ $t("voip.meeting_id") }}：{{ item.code }}
                    <!-- 我需要参加的会议 -->
                    <em v-if="item.ownerId !== userId" class="other-icon">
                        {{ $t("voip.invited") }}
                    </em>
                    <em class="status-icon" v-if="item.imMeetingStatus === 2">
                        {{ $t("voip.over") }}
                    </em>
                </p>
            </div>
            <!-- 历史会议 删除 -->
            <span
                class="btn"
                v-if="item.imMeetingStatus === 2"
                @click="historyDelete(item)"
            >
                {{ $t("common.delete") }}
            </span>
            <span class="btn" v-else @click="deleteConfer(item)">
                {{
                    item.ownerId !== userId
                        ? $t("voip.cancel_meeting")
                        : $t("common.delete")
                }}
            </span>
        </div>
    </li>
</template>

<script>
import dayjs from "dayjs";
import wfc from "@/wfc/client/wfc";
export default {
    components: {},
    data() {
        return {
            userId: wfc.getUserId(),
        };
    },
    props: {
        item: {
            type: Object,
            require: true,
        },
        type: {
            type: String,
            require: true,
        },
    },
    computed: {
        //cycleType 0,1每天,2工作日,3每周,4每月,
        frequency() {
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
        resetMeetingTime() {
            return (item) => {
                if (item.startTime && item.endTime) {
                    let start = item.startTime.substr(0, 16);
                    let end = item.endTime.substr(0, 16);
                    let startDate = dayjs(start).format("MM/DD");
                    let startTime = dayjs(start).format("HH:mm");
                    let endDate = dayjs(end).format("MM/DD");
                    let endTime = dayjs(end).format("HH:mm");
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
        statusStr() {
            return (status) => {
                let str = {
                    1: this.$t("voip.over"),
                    2: this.$t("voip.join_now"),
                };
                return str[status];
            };
        },
    },
    methods: {
        historyDelete() {
            this.$emit("historyDelete", this.item);
        },
        deleteConfer() {
            this.$emit("deleteConfer", this.item);
        },
        toDetail() {
            this.$emit("toDetail", this.item, this.type);
        },
    },
};
</script>
<style lang="less" scoped>
li {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 12px;
    background: #ffffff;
    overflow: hidden;
    border: 1px solid #f0f0f0;
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.06);
    border-radius: 12px;
    &:hover {
        box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.2);
    }
    &:first-child {
        margin-top: 10px;
    }
    &:last-child {
        margin-bottom: 40px;
    }
    .time-wrap {
        font-family: "PingFang SC";
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 20px;
        color: #1dbb88;
        display: flex;
        justify-content: space-between;
        align-content: center;
        .frequency-icon {
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 20px;
            text-align: right;
            color: #838383;
        }
    }
    .confer-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        line-height: 20px;
        .info-left {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 8px;
        }
        .title {
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 600;
            font-size: 14px;
            line-height: 22px;
            color: #333333;
        }
        .code {
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 20px;
            color: #989898;
        }
        .other-icon,
        .status-icon {
            margin-right: 5px;
            background: rgb(29, 187, 136);
            color: #fff;
            padding: 1px 4px;
            border-radius: 4px;
            font-size: 12px;
            font-style: normal;
            line-height: 20px;
        }
        .status-icon {
            background: #b9b8b8;
        }
    }

    .btn {
        max-width: 60px;
        min-height: 30px;
        border: 1px solid #ff5758;
        border-radius: 8px;
        font-family: "PingFang SC";
        font-style: normal;
        font-weight: 500;
        font-size: 12px;
        line-height: 18px;
        color: #ff5758;
        padding: 5px;
        text-align: center;
        &:hover {
            background: #ff5758;
            color: #fff;
        }
    }
}
</style>
