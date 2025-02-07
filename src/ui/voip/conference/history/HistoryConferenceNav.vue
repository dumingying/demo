<template>
    <div class="history-conference-nav">
        <!-- 顶部操作 -->
        <div class="header-wrap">
            <p @click="goBack" class="back">
                <img
                    src="../../../../assets/images/back.png"
                    draggable="false"
                    class="back-img"
                />
                <label>{{ $t("voip.historical_meeting") }}</label>
            </p>
        </div>
        <div class="input-wrap">
            <input
                id="searchInput"
                ref="input"
                autocomplete="off"
                v-model="submitData.searchContent"
                type="text"
                :placeholder="$t('voip.search_placeholder')"
                @input="search"
                @compositionstart="isLock = true"
                @compositionend="isLock = false"
                @contextmenu.prevent="openMenu"
            />
            <i class="search-icon"></i>
        </div>
        <Scroll
            :on-reach-bottom="handleReachBottom"
            height="100%"
            :loading-text="$t('common.loading')"
            class="scroll-wrap"
        >
            <template v-if="historyList.length">
                <div
                    v-for="(item, index, key) in filterHistoryList"
                    :key="key"
                    class="history-item"
                >
                    <p class="date-wrap">{{ index }}</p>
                    <ol class="item-list">
                        <li
                            v-for="(el, i) in item"
                            :key="`${index}-${i}`"
                            @click="goPage(el)"
                            :class="{
                                active:
                                    currentDetail &&
                                    currentDetail.imMeetingId ===
                                        el.imMeetingId,
                            }"
                        >
                            <p class="title">
                                {{ el.imMeetingTitle }}
                                <span v-if="el.isCycle" class="frequency-icon"
                                    >({{ frequency(el) }})
                                </span>
                            </p>
                            <p class="code">
                                {{ $t("voip.meeting_id") }}：{{
                                    el.imMeetingCode
                                }}
                            </p>
                            <p class="host">
                                {{ $t("voip.meeting_duration") }}：{{
                                    timeDuration(el.duration)
                                }}
                            </p>
                            <p class="host new-single-line">
                                {{ $t("voip.host") }}：{{
                                    mixinResetPhoneNumber(
                                        el.imMeetingOwnerDisplayname
                                    )
                                }}
                            </p>
                        </li>
                    </ol>
                </div>
            </template>
            <EmptyList v-else style="margin-top: 120px"></EmptyList>
        </Scroll>
        <!-- menu 操作栏 -->
        <right-click-menu
            ref="menuComponent"
            :inputText="submitData.searchContent"
            @resetInputText="resetInputText"
        ></right-click-menu>
    </div>
</template>
<script>
import { meetingHistoryList } from "@/axios";
import dayjs from "dayjs";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import EmptyList from "@/ui/common/empty/EmptyList";
import RightClickMenu from "@/ui/common/rightClick/RightClickMenu";

let duration = require("dayjs/plugin/duration");
dayjs.extend(duration);
export default {
    components: {
        EmptyList,
        RightClickMenu,
    },
    data() {
        return {
            submitData: {
                fromTime: "",
                toTime: "",
                searchContent: "",
                userId: "",
                imMeetingType: 0, //会议类型 0(全部), 1(快速会议), 2(周期会议)
                pageNum: 1,
                pageSize: 10,
            },
            isLock: false,
            total: 0,
            historyList: [],
            filterHistoryList: {},
            allow: true,
            conferenceState: store.state.conference,
        };
    },
    watch: {
        $route(n) {
            if (this.$route.name === "historyConference") {
                this.resetSubmit();
                this.getList(1);
            }
        },
    },
    computed: {
        setHeight() {
            return "calc(100% - 60px)";
        },
        currentDetail() {
            return this.conferenceState.currentHistoryConference;
        },
        timeDuration() {
            return (duration) => {
                let millisecond = duration * 1000;
                return dayjs.duration(millisecond).format("HH:mm:ss");
            };
        },
        frequency() {
            return (item) => {
                //cycleType 0,1每天,2工作日,3每周,4每月,
                let strObj = {
                    1: this.$t("voip.daily"),
                    2: this.$t("voip.weekday"),
                    3: this.$t("voip.weekly"),
                    4: this.$t("voip.monthly"),
                };
                return strObj[item.cycleType];
            };
        },
    },
    mounted() {
        this.$eventBus.$on("uploadHistoryConference", (data) => {
            this.uploadHistoryConference(data);
        });
    },
    created() {
        this.submitData.userId = wfc.getUserId();
        this.historyList = [];
        this.filterHistoryList = {};
        this.submitData.pageNum = 1;
        this.getList(1);
    },
    methods: {
        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
        resetInputText() {
            this.submitData.searchContent = "";
            this.resetSubmit();
            this.getList();
        },
        resetSubmit() {
            this.historyList = [];
            this.filterHistoryList = {};
            this.submitData.pageNum = 1;
            this.allow = true;
        },
        // 设置默认选中项
        setDefaultConference() {
            if (
                this.filterHistoryList &&
                Object.keys(this.filterHistoryList).length
            ) {
                let firstConference = Object.values(
                    this.filterHistoryList
                )[0][0];
                this.goPage(firstConference);
            }
        },
        async getList(type) {
            if (!this.allow) return;
            this.allow = false;
            try {
                let res = await meetingHistoryList(this.submitData);
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.total = data.totalPage;
                    if (
                        this.submitData.pageNum === 1 &&
                        !this.historyList.length
                    ) {
                        this.allow = true;
                    }
                    // 处理新的数据
                    let newList = data.list.map((item) => {
                        return {
                            ...item,
                            _startDate: dayjs(item.imMeetingStartTime).format(
                                "YYYY-MM-DD"
                            ),
                            _startTime: dayjs(item.imMeetingStartTime).format(
                                "HH:mm"
                            ),
                        };
                    });
                    // 合并数组
                    let allList = [...this.historyList, ...newList];
                    this.handleFilterHistoryList(allList);
                    // 备份一下
                    this.historyList = [...allList];
                    if (this.submitData.pageNum >= data.totalPage) {
                        this.allow = false;
                    } else {
                        this.allow = true;
                    }
                    if (type) {
                        this.setDefaultConference();
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 滚动加载更多
        handleReachBottom() {
            return new Promise((resolve) => {
                let timer = setTimeout(() => {
                    if (!this.total) return;
                    this.submitData.pageNum++;
                    if (this.submitData.pageNum <= this.total) {
                        this.getList();
                    } else {
                        this.$Message.warning(this.$t("common.no_more"));
                    }
                    timer && clearTimeout(timer);
                    resolve();
                }, 1000);
            });
        },
        search() {
            if (!this.isLock) {
                this.resetSubmit();
                this.getList();
            }
        },
        goBack() {
            this.submitData.pageNum = 1;
            this.submitData.searchContent = "";
            if (this.$router.currentRoute.value.name === "historyConference") {
                this.$router.replace("/home");
            }
        },
        goPage(item) {
            store.setCurrentHistoryConference(item);
        },
        uploadHistoryConference(data) {
            this.historyList = this.historyList.filter((item) => {
                if (
                    !data.isCycle ||
                    (data.imCycleMeetingDetailDtoList &&
                        data.imCycleMeetingDetailDtoList.length === 1)
                ) {
                    return item.imMeetingId !== data.imMeetingId;
                } else {
                    return item;
                }
            });
            //   console.log(this.filterHistoryList, "更新后的数据");
            this.handleFilterHistoryList(this.historyList);
        },
        //处理数组结构
        handleFilterHistoryList(list) {
            let newHistoryList = {};
            for (let i = 0; i < list.length; i++) {
                let filterList = list.filter(
                    (el) => el._startDate === list[i]._startDate
                );
                newHistoryList[list[i]._startDate] = filterList;
            }
            this.filterHistoryList = newHistoryList;
        },
    },
    beforeUnmount() {
        this.$eventBus.$off("uploadHistoryConference");
    },
};
</script>
<style>
.history-conference-nav .ivu-scroll-wrapper {
    width: 100%;
    flex: 1 !important;
    overflow: hidden;
}
</style>
<style lang="less" scoped>
.history-conference-nav {
    width: 240px;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    background: #fff;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    &::after {
        position: absolute;
        right: 0;
        top: 0;
        content: "";
        width: 1px;
        height: 100%;
        background: #e6e6e6;
    }
    .header-wrap {
        display: flex;
        justify-content: space-between;
        padding: 30px 12px 0;
    }
    .header-wrap .back {
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
    }
    .header-wrap .back img {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        overflow: hidden;
    }
    .header-wrap .back label {
        margin-left: 8px;
        font-family: "PingFang SC";
        font-style: normal;
        font-weight: 500;
        font-size: 16px;
        line-height: 20px;
        color: #000000;
    }
    .input-wrap {
        height: 56px;
        margin: 0 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        -webkit-app-region: drag;
        position: relative;
        input {
            /* flex: 1; */
            /* 兼容Firefox 52 */
            width: 100%;
            height: 24px;
            padding-left: 24px;
            border: none;
            outline: none;
            background: #f5f6f9;
            border-radius: 3px;
            font-family: "PingFang SC";
            font-size: 12px;
            line-height: 24px;
            color: #000;
            text-align: left;
            border: 1px solid #f5f6f9;
        }

        input:active {
            border: 1px solid #1dbb88;
        }

        input:focus {
            border: 1px solid #1dbb88;
        }
        .search-icon {
            position: absolute;
            left: 8px;
            /* 兼容Firefox 52 */
            top: 50%;
            transform: translate(0, -50%);
            width: 12px;
            height: 12px;
            background: url(../../../../assets/images/search-icon.png) no-repeat
                center;
            background-size: 100%;
        }
    }
    .history-item {
        .date-wrap {
            padding: 0 20px;
            height: 40px;
            background: #f5f6f9;
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 500;
            font-size: 14px;
            line-height: 40px;
            color: #4f4f4f;
        }
        .item-list {
            li {
                font-family: "PingFang SC";
                padding: 12px 20px;
                &.active {
                    background: #e8e8e8;
                }
                .title {
                    font-style: normal;
                    font-weight: 500;
                    font-size: 16px;
                    line-height: 22px;
                    color: #333333;
                }
                .code,
                .host {
                    display: flex;
                    margin-top: 4px;
                    font-style: normal;
                    font-weight: 400;
                    font-size: 12px;
                    line-height: 18px;
                    color: #989898;
                    &.new-single-line {
                        display: -webkit-box;
                        flex: 1;
                    }
                }
            }
        }
    }
    .empty {
        width: 120px;
        margin: 60px auto;
        img {
            width: 100%;
            height: auto;
        }
    }
}
</style>
