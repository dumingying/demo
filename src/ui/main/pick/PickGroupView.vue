<template>
    <div class="select-group-list">
        <h4>
            {{ title }}
            <span @click="handleCancel">
                <Icon type="ios-close" style="font-size: 36px" />
            </span>
        </h4>
        <div class="header">
            <input
                type="text"
                ref="input"
                autocomplete="off"
                v-model="groupName"
                :maxlength="60"
                :placeholder="$t('common.search_keyword')"
                @keydown.enter="send"
                @input="search"
                @compositionstart="isLock = true"
                @compositionend="isLock = false"
                @contextmenu.prevent="openMenu"
            />
            <h5>
                {{ $t("voip.discuss_group") }}
                <span v-if="groupList.length">({{ groupList.length }})</span>
            </h5>
        </div>
        <ul class="group-list" v-if="groupList.length">
            <li
                v-for="(item, index) in groupList"
                :key="index"
                :class="{ disabled: isGroupUncheckable(item) }"
                @click.stop="choose(item)"
            >
                <figure>
                    <img :src="item.portrait" />
                </figure>
                <div class="name">
                    <p class="new-single-line">{{ item.groupName }}</p>
                    <label class="checkbox-wrap">
                        <input
                            v-if="singleChoice"
                            type="radio"
                            class="checkbox"
                            :disabled="isGroupUncheckable(item)"
                            :value="item.groupId"
                            :checked="isGroupChecked(item)"
                        />
                        <input
                            v-else
                            type="checkbox"
                            class="checkbox"
                            :disabled="isGroupUncheckable(item)"
                            :value="item.groupId"
                            :checked="isGroupChecked(item)"
                        />
                        <span></span>
                    </label>
                </div>
            </li>
        </ul>
        <EmptyList v-else>{{ $t("disk.no_data") }}</EmptyList>
        <div
            :class="['btn-wrap', { active: newCheckedGroupIds.length }]"
            @click="confirm"
        >
            {{ $t("common.confirm") }}
        </div>
        <!-- menu 操作栏 -->
        <right-click-menu
            ref="menuComponent"
            :inputText="groupName"
            @resetInputText="resetInputText"
        ></right-click-menu>
    </div>
</template>

<script>
import RightClickMenu from "@/ui/common/rightClick/RightClickMenu";
import EmptyList from "@/ui/common/empty/EmptyList";
import { getGroupList } from "@/axios";
import wfc from "@/wfc/client/wfc";
import store from "@/store";
export default {
    name: "PickGroupView",
    props: {
        // 标题
        title: {
            type: String,
            default: "",
        },
        // 已选群组
        initCheckedGroupIds: {
            type: Array,
            required: false,
            default: null,
        },
        //已选，不能更改的群组
        uncheckableGroupIds: {
            type: Array,
            required: false,
            default: null,
        },
        // 是否本地
        localGroup: {
            type: Boolean,
            default: false,
        },
        // 是否单选
        singleChoice: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            groupIds: [], // 选中的群id
            groupName: "", // 搜索群名
            groupList: [],
            isLock: false,
        };
    },
    async created() {
        if (this.initCheckedGroupIds) {
            this.groupIds = [...this.initCheckedGroupIds];
        }
        if (this.localGroup) {
            this.groupList = await store._getLocalGroupList();
            // 本地群组
        } else {
            // 我参与的所有群组
            this.handleGetGroupList();
        }
    },
    components: {
        RightClickMenu,
        EmptyList,
    },
    computed: {
        isGroupUncheckable() {
            return (group) => {
                return (
                    this.uncheckableGroupIds &&
                    this.uncheckableGroupIds.includes(group.groupId)
                );
            };
        },
        isGroupChecked() {
            return (group) => {
                return this.groupIds.includes(group.groupId);
            };
        },
        newCheckedGroupIds() {
            if (this.initCheckedGroupIds) {
                return this.groupIds.filter(
                    (item) => !this.initCheckedGroupIds.includes(item)
                );
            } else {
                return this.groupIds;
            }
        },
    },
    methods: {
        resetInputText() {
            this.groupName = "";
        },
        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
        handleGetGroupList() {
            getGroupList({ userId: wfc.getUserId(), name: this.groupName })
                .then((res) => {
                    let { data, message, code } = res.data;
                    if (code === "000000") {
                        this.groupList = data;
                    } else {
                        this.$Message.error(message);
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        search() {
            if (this.isLock) return;
            this.groupList = [];
            this.groupIds = [];
            if (this.localGroup) {
                this.groupList = store._getLocalGroupList(this.groupName);
            } else {
                this.handleGetGroupList();
            }
        },
        send() {
            if (!this.groupName) return;
            this.search();
        },
        choose(item) {
            if (
                this.uncheckableGroupIds &&
                this.uncheckableGroupIds.includes(item.groupId)
            ) {
                return;
            }
            //单选
            if (this.singleChoice) {
                this.groupIds =
                    this.groupIds.length && this.groupIds.includes(item.groupId)
                        ? this.groupIds.filter((e) => e !== item.groupId)
                        : [item.groupId];
                console.log(
                    "单选",
                    this.groupIds.length,
                    this.groupIds.includes(item.groupId),
                    this.groupIds
                );

                return;
            }
            if (this.groupIds.includes(item.groupId)) {
                this.groupIds = this.groupIds.filter((e) => e !== item.groupId);
            } else {
                this.groupIds.push(item.groupId);
            }
        },
        handleCancel() {
            this.$modal.hide("pick-group-modal");
        },
        confirm() {
            // 初始选中群组一并返回
            if (!this.newCheckedGroupIds.length) return;
            let groups = this.groupList.filter((item) =>
                this.groupIds.includes(item.groupId)
            );

            this.$modal.hide("pick-group-modal", { groups });
        },
    },
};
</script>
<style lang="less" scoped>
.select-group-list {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #f2f2f3;
    h4 {
        text-align: center;
        vertical-align: middle;
        font-size: 16px;
        position: relative;
        padding: 20px;
        background: #fff;
        span {
            position: absolute;
            top: 12px;
            right: 10px;
            z-index: 1;
        }
    }
    .header {
        background: #fff;
        input {
            margin: 0 20px 10px;
            width: calc(100% - 40px);
            background: #f5f6f9;
            border-radius: 18px;
            height: 36px;
            line-height: 36px;
            border: none;
            outline: none;
            line-height: 24px;
            padding: 0 10px;
            box-sizing: border-box;
        }
        h5 {
            padding: 0 20px;
            text-align: left;
            height: 40px;
            border-top: 0.3px solid #dddddd;
            background: #f2f2f3;
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 40px;
            color: #999999;
            span {
                font-size: 12px;
            }
        }
    }
    .group-list {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;

        li {
            display: flex;
            align-items: center;
            height: 56px;
            background: #fff;
            padding-left: 20px;
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 400;
            font-size: 16px;
            line-height: 26px;
            color: #333333;
            &.disabled {
                pointer-events: none;
                opacity: 0.5;
            }
            figure {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                overflow: hidden;
                img {
                    width: 100%;
                    height: 100%;
                }
            }
            .name {
                margin-left: 12px;
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 0.3px solid #dddddd;
                padding-right: 20px;
                p {
                    flex: 1;
                    height: 55px;
                    line-height: 55px;
                }
            }
            &:last-child {
                .name {
                    border-bottom: none;
                }
            }
            .checkbox-wrap {
                margin-left: 10px;
                width: 18px;
                height: 18px;
                position: relative;
                .checkbox {
                    width: 18px;
                    height: 18px;
                    border: none;
                    top: 0;
                    opacity: 0;
                    position: absolute;
                    right: 0;
                    z-index: 1;
                }
                .checkbox + span {
                    position: absolute;
                    width: 18px;
                    height: 18px;
                    z-index: 0;
                    top: 0;
                    right: 0;
                    border: 1px solid #ccc;
                    border-radius: 50%;
                    overflow: hidden;
                }
                .checkbox:checked + span {
                    border: 0;
                    background: #1dbb88 url(../../../assets/images/ok-icon.png)
                        no-repeat center center;
                    background-size: 10px auto;
                }
            }
        }
    }
    .btn-wrap {
        width: 120px;
        margin: 20px auto;
        background: #1dbb88;
        text-align: center;
        margin-top: 10px;
        border-radius: 10px;
        overflow: hidden;
        height: 42px;
        line-height: 42px;
        color: #fff;
        opacity: 0.5;
        font-size: 14px;
        font-weight: bold;
        &.active {
            opacity: 1;
        }
    }
}
</style>
