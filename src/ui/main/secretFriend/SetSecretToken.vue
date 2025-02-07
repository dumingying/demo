<!-- 设置秘密令牌 -->
<template>
    <div class="secret-token-container">
        <span class="back" @click="handleClose"></span>
        <h3>
            {{ $t("secretToken.tokenTitle") }}
            <i class="icon" @click="goInstructions"></i>
            <span class="change-password" @click="handleChange">
                {{ $t("secretToken.changePassword") }}
            </span>
        </h3>
        <div class="header">
            <p class="tab-wrap">
                <span
                    v-for="(tab, index) in tabList"
                    :key="tab"
                    :class="activeTab === index ? 'active' : ''"
                    @click="handleTab(index)"
                >
                    {{ tab }}
                </span>
            </p>
            <button class="add-btn" @click="handleAdd">
                {{
                    $t(
                        activeTab
                            ? "secretToken.addGroup"
                            : "secretToken.addFriend"
                    )
                }}
            </button>
        </div>
        <div class="friend-group-list">
            <ul class="list" v-if="list.length">
                <li v-for="item in list">
                    <figure>
                        <img :src="item.portrait" alt="" />
                        <figcaption>{{ item.name }}</figcaption>
                    </figure>
                    <span class="remove" @click="handleRemove(item)">{{
                        $t("common.remove")
                    }}</span>
                </li>
            </ul>
            <p class="empty" v-else>
                {{
                    $t(
                        activeTab
                            ? "secretToken.noGroup"
                            : "secretToken.noFriends"
                    )
                }}
            </p>
        </div>
        <button class="go-message" @click="handleClose">
            {{ $t("secretToken.goMessage") }}
        </button>
    </div>
</template>

<script>
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import { postDelSafeFriendList, postAddSafeFriendList } from "@/axios";
import SecretPassword from "./SecretPassword";
import Config from "@/config";
import useSecretTokenStore from "@/store/secretStore";
import { storeToRefs } from "pinia";
export default {
    name: "SetSecretToken",
    data() {
        return {
            activeTab: 0,
            secretTokenStore: useSecretTokenStore(),
            sharedContactState: store.state.contact,
        };
    },
    created() {},
    computed: {
        tabList() {
            return [
                this.$t("secretToken.tabFriend"),
                this.$t("secretToken.tabGroup"),
            ];
        },
        list() {
            let { secretFriends, secretGroups } = storeToRefs(
                this.secretTokenStore
            );
            return this.activeTab ? secretGroups.value : secretFriends.value;
        },
    },
    methods: {
        handleTab(index) {
            this.activeTab = index;
        },
        handleChange() {
            this.$modal.show(
                SecretPassword,
                {
                    from: "edit",
                },
                null,
                {
                    name: "SecretPassword-modal",
                    width: 450,
                    height: 560,
                    clickToClose: true, // 点击模态框是否关闭
                },
                { "before-close": () => {} }
            );
        },
        // 关闭这个页面
        handleClose() {
            store.toggleSetSecretTokenView(false);
        },
        goInstructions() {
            store.toggleSetSecretTokenView(false);
            store.toggleSecretSearchView(true);
        },
        // 添加好友，群聊回调
        async addSuccessCB(ids, type) {
            if (!ids.length) return;
            try {
                let params = {};
                if (type === "single") {
                    params = { friendIds: ids.map((item) => item.uid) };
                } else {
                    params = { groupIds: ids.map((item) => item.groupId) };
                }
                const res = await postAddSafeFriendList({
                    userId: wfc.getUserId(),
                    ...params,
                });
                const { data, code, message } = res.data;
                if (code !== "000000") {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        handleAdd() {
            let { secretFriends, secretGroups } = storeToRefs(
                this.secretTokenStore
            );
            // 群聊
            if (this.activeTab) {
                let checkedGroups = secretGroups.value.map(
                    (item) => item.groupId
                );
                this.$pickGroups({
                    localGroup: true,
                    singleChoice: false,
                    uncheckableGroupIds: checkedGroups,
                    initCheckedGroupIds: checkedGroups,
                    successCB: (groups) => {
                        this.addSuccessCB(groups, "group");
                    },
                });
            } else {
                // console.log(secretFriends.value.map((item) => item.userId));
                let checkedUserIds = secretFriends.value.map((item) => {
                    return {
                        ...item,
                        uid: item.userId,
                    };
                });
                //好友 显示好友弹窗
                this.$pickContact({
                    initialCheckedUsers: checkedUserIds,
                    uncheckableUsers: checkedUserIds,
                    users: this.sharedContactState.friendList.filter(
                        (u) => !Config.HELPER_IDS.includes(u.uid)
                    ), //   去除文件助手,系统管理员
                    confirmTitle: this.$t("secretToken.confirmBtn"),
                    successCB: (userInfos) => {
                        this.addSuccessCB(userInfos, "single");
                    },
                });
            }
        },
        // 点击删除
        async handleRemove(item) {
            let friendIds = [];
            let groupIds = [];
            if (this.activeTab) {
                groupIds = [item.groupId]; // 群
            } else {
                friendIds = [item.userId]; // 个人
            }
            try {
                let res = await postDelSafeFriendList({
                    userId: wfc.getUserId(),
                    friendIds,
                    groupIds,
                    walletAddresses: [],
                });
                const { code, data, message } = res.data;
                if (code !== "000000") {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
    },
};
</script>

<style lang="less" scoped>
.secret-token-container {
    max-width: 750px;
    margin: 0 auto;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    .back {
        width: 50px;
        height: 40px;
        position: absolute;
        left: 0;
        z-index: 1;
        background: url(../../../assets/images/left-arr.svg) no-repeat left
            center;
        background-size: 14px;
    }
    h3 {
        font-family: PingFang SC;
        font-size: 18px;
        font-weight: 500;
        line-height: 20px;
        text-align: center;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        i {
            width: 40px;
            height: 40px;
            display: inline-block;
            background: url(../../../assets/images/info-icon.svg) no-repeat
                center;
            background-size: 18px;
        }
        .change-password {
            position: absolute;
            right: 0;
            font-family: PingFang SC;
            font-size: 16px;
            font-weight: 500;
            line-height: 22px;
            color: rgba(29, 187, 136, 1);
        }
    }

    .header {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        span {
            font-family: PingFang SC;
            font-size: 14px;
            font-weight: 400;
            line-height: 28px;
            color: #000;
            margin-right: 20px;
        }
        .active {
            font-weight: bold;
            position: relative;
            &::after {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                bottom: -6px;
                content: "";
                width: 60%;
                height: 2px;
                background: rgba(29, 187, 136, 1);
                border-radius: 2px;
            }
        }
        .add-btn {
            font-family: PingFang SC;
            font-size: 13px;
            font-weight: 500;
            line-height: 20px;
            color: rgba(29, 187, 136, 1);
            border: 2px solid rgba(29, 187, 136, 1);
            background: #fff url(../../../assets/images/add-icon.svg) no-repeat
                left center;
            background-size: 20px;
            padding: 2px 10px 2px 22px;
            border-radius: 18px;
        }
    }
    .friend-group-list {
        margin-top: 30px;
        flex: 1;
        overflow-x: hidden;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        .empty {
            margin-top: 100px;
            color: #999;
            font-size: 12px;
        }
        .list {
            width: 100%;
            border-radius: 12px;
            position: relative;
            background: #fbfbfd;
            border: 2px solid #f5f6f9;
            padding: 0 16px;
            li {
                padding: 16px 0;
                border-bottom: 1px #f2f2f2 solid;
                display: flex;
                justify-content: space-between;
                align-items: center;
                figure {
                    display: flex;
                    align-items: center;
                    flex: 1;
                    img {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                    }
                    figcaption {
                        font-family: PingFang SC;
                        font-size: 16px;
                        font-weight: 500;
                        line-height: 24px;
                        margin-left: 12px;
                    }
                }
                &:last-child {
                    border-bottom: none;
                }
                span {
                    border: 1.4px solid #e1313199;
                    font-family: PingFang SC;
                    font-size: 12px;
                    font-weight: 500;
                    line-height: 18px;
                    color: rgba(225, 49, 49, 0.9);
                    padding: 2px 8px;
                    border-radius: 12px;
                }
            }
        }
    }
    .go-message {
        width: 100%;
        background: rgba(29, 187, 136, 1);
        color: #fff;
        height: 46px;
        text-align: center;
        border-radius: 24px;
        border: none;
        margin-top: 40px;
    }
}
</style>
