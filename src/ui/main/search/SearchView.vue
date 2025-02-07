<template>
    <div class="search-input-container">
        <input
            id="searchInput"
            ref="input"
            autocomplete="off"
            v-model="sharedSearchState.query"
            type="text"
            :placeholder="$t('common.search')"
            @focus="onFocus(true)"
            @keydown.esc="cancel"
            @contextmenu.prevent="openMenu"
        />
        <i class="search-icon"></i>
        <template v-if="permissionList.vipLevel > 1 || isChatSwitch">
            <span
                v-if="showAddButton"
                class="add-btn"
                @click="handlerAddOrCreate"
            >
                <img
                    v-if="showSearchNewFriends"
                    draggable="false"
                    src="../../../assets/images/add-friend.svg"
                />
                <img
                    v-else
                    draggable="false"
                    src="../../../assets/images/add-group.svg"
                />
            </span>
        </template>

        <!-- 搜索框 右击更多~ -->
        <right-click-menu
            ref="menuComponent"
            :inputText="sharedSearchState.query"
            @resetInputText="resetInputText"
        ></right-click-menu>
    </div>
</template>

<script>
import RightClickMenu from "@/ui/common/rightClick/RightClickMenu";
import { getUserVipInfo } from "@/axios";
import { copyText } from "@/ui/util/clipboard";
import { tipsContent } from "../../common/Tips";
import { getItem } from "@/ui/util/storageHelper";
import wfc from "@/wfc/client/wfc";
import store from "@/store";
import Config from "@/config";

export default {
    name: "SearchView",
    props: {
        showAddButton: {
            type: Boolean,
            default: true,
        },
        searchType: {
            type: String,
            default: "",
        },
    },

    data() {
        return {
            sharedSearchState: store.state.search,
            sharedContactState: store.state.contact,
            showSearchNewFriends: false,
        };
    },
    watch: {
        $route(n, o) {
            // 当前是通讯录页面
            this.showSearchNewFriends = n.path === "/home/contact";
        },
    },
    created() {
        if (this.$route.path === "/home/contact") {
            this.showSearchNewFriends = true;
        }
    },
    components: { RightClickMenu },
    computed: {
        permissionList() {
            return this.$store.state.permissionList;
        },
        isChatSwitch() {
            return getItem("UnVipUserChatSwitch") === "ON";
        },
    },
    methods: {
        resetInputText() {
            this.sharedSearchState.query = "";
        },
        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
        onFocus(focused) {
            store.toggleSearchView(focused);
        },
        // 点击搜索或者
        handlerAddOrCreate() {
            // 搜索手机号添加好友
            if (this.showSearchNewFriends) {
                store.setFindNewFriend();
            } else {
                // 创建群聊或聊天
                this.showCreateConversationModal();
            }
        },
        showCreateConversationModal() {
            let users = this.sharedContactState.favContactList.concat(
                this.sharedContactState.friendList
            );
            //   去除文件助手,系统管理员
            users = users.filter((u) => !Config.HELPER_IDS.includes(u.uid));
            let newUser = [];
            for (let i = 0; i < users.length; i++) {
                users[i].portrait = users[i].portrait1 || users[i].portrait;
                users[i]._displayName = users[i].displayName;
                newUser.push(JSON.parse(JSON.stringify(users[i])));
            }
            const successCB = async (users) => {
                if (!users.length) return;
                if (this.permissionList.isAppCharge) {
                    console.log(
                        "已选中的人数:",
                        users.length + 1,
                        "群聊限制人数:",
                        this.permissionList.groupMemberLimit
                    );
                    if (
                        users.length + 1 >
                        this.permissionList.groupMemberLimit
                    ) {
                        this.$alert({
                            content: tipsContent[9],
                            height: 150,
                            cancelText: "",
                        });
                        return;
                    }

                    try {
                        let res = await getUserVipInfo({
                            userId: wfc.getUserId(),
                        });
                        let { code, message, data } = res.data;
                        if (code === "000000") {
                            console.log(
                                "已创建的个数:",
                                data.groupCountCreatedBy,
                                "个数限制:",
                                this.permissionList.groupCreateLimit
                            );
                            if (
                                data.groupCountCreatedBy <
                                this.permissionList.groupCreateLimit
                            ) {
                                store.createConversation({
                                    users,
                                    minGroupMember: 2,
                                });
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
                        this.$Message.error(this.$t(common.error_later));
                    }
                } else {
                    store.createConversation({ users, minGroupMember: 2 });
                }
            };
            this.$pickContact({
                users: newUser,
                confirmTitle: this.$t("common.create"),
                successCB,
            });
        },
        cancel() {
            store.toggleSearchView(false);
            this.$refs["input"].blur();
        },
        async handlePaste(e) {
            let text;
            e.preventDefault();
            if ((e.originalEvent || e).clipboardData) {
                text = (e.originalEvent || e).clipboardData.getData(
                    "text/plain"
                );
            } else {
                text = await navigator.clipboard.readText();
            }
            if (text && text.trim()) {
                document.execCommand("insertText", false, text);
            }
        },
        copy() {
            if (this.sharedSearchState.query) {
                copyText(this.sharedSearchState.query);
            }
        },
        cut() {
            this.copy();
            this.sharedSearchState.query = "";
        },
    },
};
</script>

<style lang="css" scoped>
.search-input-container {
    height: 56px;
    margin: 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    -webkit-app-region: drag;
    position: relative;
}

.search-input-container input {
    /* flex: 1; */
    /* 兼容Firefox 52 */
    width: 209px;
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

.search-input-container input:active {
    border: 1px solid #1dbb88;
}

.search-input-container input:focus {
    border: 1px solid #1dbb88;
}

.search-input-container .search-icon {
    position: absolute;
    left: 8px;
    /* 兼容Firefox 52 */
    top: 50%;
    transform: translate(0, -50%);
    width: 12px;
    height: 12px;
    background: url(../../../assets/images/search-icon.png) no-repeat center;
    background-size: 100%;
}

.search-input-container span {
    width: 20px;
    height: 20px;
    margin-left: 4px;
}
.search-input-container span img {
    width: 100%;
    vertical-align: middle;
}
</style>
