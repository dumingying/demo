<template>
    <div class="pick-contact-container">
        <section class="contact-list-container">
            <div class="input-container">
                <input
                    type="text"
                    :placeholder="$t('common.search')"
                    v-model="filterQuery"
                    @contextmenu.prevent="openMenu"
                />
                <i class="icon-ion-ios-search"></i>
            </div>
            <div class="select-group" @click="handleSelectGroupList">
                {{ $t("voip.select_discussion_group") }}
            </div>
            <div class="friend-list-container">
                <CheckableUserListView
                    :enable-pick="true"
                    :users="filterUsers"
                    :initial-checked-users="initialCheckedUsers"
                    :uncheckable-users="uncheckableUsers"
                    :show-category-label="showCategoryLabel && !filterQuery"
                    :padding-left="'20px'"
                    :search="filterQuery"
                    from="designated"
                    enable-category-label-sticky
                />
            </div>
        </section>
        <section class="checked-contact-list-container">
            <header>
                <h2>{{ $t("pick.pick_contact") }}</h2>
                <span v-if="checkedUsers.length === 0">{{
                    $t("pick.picked_contact")
                }}</span>
                <span v-else>{{
                    $t("pick.picked_contact") + checkedUsersLength
                }}</span>
            </header>
            <div class="content">
                <div
                    class="picked-user-container"
                    v-for="(user, index) in checkedUsers"
                    :key="index"
                >
                    <div class="picked-user">
                        <img
                            class="avatar"
                            @error="mixinImgUrlAlt"
                            draggable="false"
                            :src="user.portrait"
                        />
                        <button @click="unpick(user)" class="unpick-button">
                            <Icon type="md-close" />
                        </button>
                    </div>
                    <span class="name new-single-line">
                        {{ mixinGetUserName(user) }}
                    </span>
                </div>
            </div>
            <footer>
                <button @click="cancel" class="cancel">
                    {{ $t("common.cancel") }}
                </button>
                <button
                    @click="confirm"
                    :class="[
                        'confirm',
                        { disable: isEdit && !sharedPickState.users.length },
                    ]"
                >
                    {{ confirmTitle }}
                </button>
            </footer>
        </section>
        <!--右击 更多操作 -->
        <right-click-menu
            ref="menuComponent"
            :inputText="filterQuery"
            @resetInputText="resetInputText"
        >
        </right-click-menu>
    </div>
</template>

<script>
import store from "@/store";
import CheckableUserListView from "@/ui/main/user/CheckableUserListView";
import RightClickMenu from "@/ui/common/rightClick/RightClickMenu";
import { modifyParticipant } from "@/axios";
import wfc from "@/wfc/client/wfc";
import Config from "@/config";

export default {
    name: "PickDesignatedMember",
    props: {
        initialCheckedUsers: {
            type: Array,
            required: false,
            default: [],
        },
        uncheckableUsers: {
            type: Array,
            required: false,
            default: [],
        },
        confirmTitle: {
            type: String,
            required: false,
            default: "confirm",
        },
        conferenceItem: {
            type: Object,
            required: false,
        },
        maxLength: {
            type: Number,
            required: false,
        },
        showCategoryLabel: {
            type: Boolean,
            required: false,
            default: true,
        },
        isEdit: {
            type: Boolean,
        },
    },
    data() {
        return {
            sharedPickState: store.state.pick,
            sharedContactState: store.state.contact,
            filterQuery: "",
            users: [],
            userId: "",
            confirmLock: false,
            noFriendMembers: [], // 非好友人数
            friendMembers: [], // 好友人数
            groupMembers: [], // 总群成员
            selectGroupInfo: "", // 群信息
        };
    },
    created() {
        let users = this.sharedContactState.favContactList.concat(
            this.sharedContactState.friendList
        );
        //   去除文件助手,系统管理员
        this.users = users.filter((u) => !Config.HELPER_IDS.includes(u.uid));
        if (this.initialCheckedUsers && this.initialCheckedUsers.length) {
            let index = this.initialCheckedUsers.findIndex(
                (item) => item._isGroup
            );
            if (index > -1) {
                this.selectGroupInfo = this.initialCheckedUsers[index];
                this.setFromGroupFriend(this.initialCheckedUsers[index]);
            }
        }
    },
    methods: {
        unpick(user) {
            if (this.isUserUncheckable(user)) {
                return;
            }
            store.pickOrUnpickUser(user);
            // 处理群，来源群好友数据
            this.removeFromGroupFriend(user);
        },

        isUserUncheckable(user) {
            return (
                this.uncheckableUsers &&
                this.uncheckableUsers.findIndex((u) => u.uid === user.uid) >= 0
            );
        },

        cancel() {
            this.sharedPickState.users.length = 0;
            this.$modal.hide("pick-designated-member-modal", {
                confirm: false,
            });
        },
        async confirm() {
            let pickedUsers = this.sharedPickState.users;
            let users = [...this.uncheckableUsers, ...pickedUsers];

            // 选中人数再加自己
            if (this.maxLength && users.length + 1 > this.maxLength) {
                this.$Message.warning(
                    voip.this.$t("reselect", [this.maxLength])
                );
                return;
            }

            if (this.isEdit) {
                if (!pickedUsers.length) return;

                let index = users.findIndex((item) => item._isGroup);
                let ids = "";
                if (index > -1) {
                    ids = [
                        ...users
                            .filter((item) => !item._isGroup)
                            .map((item) => item.uid),
                        ...this.noFriendMembers.map((item) => item.uid),
                    ];
                } else {
                    ids = users.map((item) => item.uid);
                }
                if (this.confirmLock) return;
                this.confirmLock = true;
                try {
                    let res = await modifyParticipant({
                        userId: wfc.getUserId(),
                        conferenceId: this.conferenceItem.imMeetingId, // 主键id 不是会议id
                        designatedParticipantIds: ids,
                    });
                    this.confirmLock = false;
                    let { message, code } = res.data;
                    if (code === "000000") {
                        //新指定的用户
                        let newUsers = pickedUsers.filter((item) => {
                            return !this.initialCheckedUsers
                                .map((el) => el.uid)
                                .includes(item.uid);
                        });
                        // 新选择的用户发送邀请，
                        this.$modal.hide("pick-designated-member-modal", {
                            confirm: true,
                            pickedUsers: newUsers, // 新添加用户(包含群组,不包含非好友)
                        });
                    } else {
                        this.$Message.error(message);
                    }
                } catch (error) {
                    this.confirmLock = false;
                }
            } else {
                this.$modal.hide("pick-designated-member-modal", {
                    confirm: true,
                    users: users,
                });
            }
            this.sharedPickState.users.length = 0;
        },
        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
        resetInputText() {
            this.filterQuery = "";
        },
        handleSelectGroupList() {
            // 点击绑定群组，展示本地群组列表
            this.$pickGroups({
                localGroup: true,
                singleChoice: true,
                initCheckedGroupIds: [this.selectGroupInfo.groupId],
                successCB: (groups) => {
                    let { groupId, portrait, groupName } = groups[0];
                    // 清空之前选中数据
                    this.removeFromGroupFriend();
                    this.$nextTick(() => {
                        // 获取群成员
                        this.groupMembers = wfc
                            .getGroupMembers(groupId)
                            .map((item) => {
                                return {
                                    ...wfc.getUserInfo(item.memberId),
                                };
                            })
                            .filter((item) => {
                                return item.uid !== wfc.getUserId();
                            });

                        // 当前已经指定成员id（包含默认的,单选的）
                        let groupUserIds = [
                            ...this.uncheckableUsers,
                            ...this.sharedPickState.users,
                        ].map((item) => item.uid);

                        // 过滤群组中是好友
                        let friends = this.groupMembers.filter((item) => {
                            return wfc.isMyFriend(item.uid);
                        });
                        // 设置好友选中状态， 并做备份
                        for (let i = 0; i < friends.length; i++) {
                            if (!groupUserIds.includes(friends[i].uid)) {
                                this.friendMembers.push(friends[i]);
                                store.pickOrUnpickUser(friends[i]);
                            }
                        }
                        // 过滤群组中非好友
                        let notFriends = this.groupMembers.filter((item) => {
                            return !wfc.isMyFriend(item.uid);
                        });
                        // 做备份
                        for (let i = 0; i < notFriends.length; i++) {
                            if (!groupUserIds.includes(notFriends[i].uid)) {
                                this.noFriendMembers.push(notFriends[i]);
                            }
                        }
                        // 设置本次选择的群组
                        this.selectGroupInfo = {
                            groupId,
                            portrait,
                            groupName,
                            uid: groupId,
                            displayName: groupName,
                            _isGroup: true,
                        };
                        // 将群设置选中
                        store.pickOrUnpickUser(this.selectGroupInfo);
                    });
                },
            });
        },
        // 创建预约会议时设置
        setFromGroupFriend(groupInfo) {
            // 获取群成员
            this.groupMembers = wfc
                .getGroupMembers(groupInfo.groupId)
                .map((item) => {
                    return {
                        ...wfc.getUserInfo(item.memberId),
                    };
                })
                .filter((item) => {
                    return item.uid !== wfc.getUserId();
                });
            // 过滤群组中是好友
            this.friendMembers = this.groupMembers.filter((item) => {
                return wfc.isMyFriend(item.uid);
            });
            // 过滤群组中非好友
            this.noFriendMembers = this.groupMembers.filter((item) => {
                return !wfc.isMyFriend(item.uid);
            });
            // 将群设置选中
            store.pickOrUnpickUser(groupInfo);
        },
        // 移除群，和群组反向选择的好友
        removeFromGroupFriend(user) {
            if (!this.selectGroupInfo && !user) return;
            if (!user || user._isGroup) {
                // 移除群，反向删除群来源的好友
                for (let i = 0; i < this.friendMembers.length; i++) {
                    store.pickOrUnpickUser(this.friendMembers[i]);
                }
                // 移除旧的群组选中状态
                if (!user) {
                    store.pickOrUnpickUser(this.selectGroupInfo);
                }
                this.noFriendMembers = [];
                this.friendMembers = [];
                this.groupMembers = [];
                this.selectGroupInfo = "";
            } else {
                this.friendMembers = this.friendMembers.filter(
                    (item) => item.uid !== user.uid
                );
                // 删除群来源的好友， 反向移除群
                if (
                    this.selectGroupInfo &&
                    !this.friendMembers.length &&
                    !this.noFriendMembers.length
                ) {
                    store.pickOrUnpickUser(this.selectGroupInfo);
                    this.noFriendMembers = [];
                    this.groupMembers = [];
                    this.selectGroupInfo = "";
                }
            }
        },
    },
    computed: {
        checkedUsersLength() {
            let users = this.sharedPickState.users;
            let index = users.findIndex((item) => {
                return item._isGroup;
            });
            if (index > -1) {
                return users.length + this.noFriendMembers.length - 1;
            }
            return users.length;
        },
        checkedUsers() {
            let users = this.sharedPickState.users;
            if (
                !this.initialCheckedUsers ||
                this.initialCheckedUsers.length === 0
            ) {
                return users;
            }
            //   let list = users.filter((u) => {
            //     return this.initialCheckedUsers.findIndex((iu) => iu.uid === u) === -1
            //   })
            return users;
        },
        filterUsers() {
            if (this.filterQuery) {
                return store.filterUsers(this.users, this.filterQuery);
            } else {
                return this.users;
            }
        },
    },
    components: { CheckableUserListView, RightClickMenu },
};
</script>

<style lang="css" scoped>
.pick-contact-container {
    display: flex;
    height: 100%;
    width: 100%;
}

.contact-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background-color: #f7f7f7;
}

.contact-list-container .input-container {
    position: relative;
    display: flex;
    width: 100%;
}

.input-container input {
    height: 25px;
    margin: 15px 20px 0 15px;
    flex: 1;
    border-radius: 3px;
    border: 1px solid #ededed;
    background-color: white;
    padding-left: 20px;
    text-align: left;
    outline: none;
}

.input-container input:active {
    border: 1px solid #1dbb88;
}

.input-container input:focus {
    border: 1px solid #1dbb88;
}

.input-container i {
    position: absolute;
    top: 20px;
    left: 20px;
}
.select-group {
    background-color: #f7f7f7;
    height: 40px;
    font-size: 14px;
    padding: 15px;
}
.contact-list-container .friend-list-container {
    height: 100%;
    overflow: auto;
}

.checked-contact-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.checked-contact-list-container header {
    height: 55px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.checked-contact-list-container header h2 {
    font-size: 16px;
    font-weight: normal;
    margin-left: 30px;
}

.checked-contact-list-container header span {
    font-size: 12px;
    margin-right: 20px;
}

.checked-contact-list-container .content {
    height: 100%;
    flex: 1;
    display: flex;
    padding: 0 30px;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    align-content: flex-start;
    overflow: auto;
}

.checked-contact-list-container .content .picked-user-container {
    width: 33%;
    display: flex;
    flex-direction: column;
    column-count: 1;
    justify-content: center;
    align-content: center;
    padding: 5px 10px;
}

.checked-contact-list-container .content .picked-user-container .name {
    width: 100%;
    font-size: 12px;
    text-align: center;
}

.checked-contact-list-container .content .picked-user-container .picked-user {
    position: relative;
    height: 65px;
    width: 65px;
}

.checked-contact-list-container .content .avatar {
    width: 45px;
    height: 45px;
    margin: 10px 10px;
    border-radius: 3px;
}

.checked-contact-list-container .content .unpick-button {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 1px solid white;
    border-radius: 10px;
    background-color: #f2f2f2;
    top: 0;
    right: 0;
}

.checked-contact-list-container .content .unpick-button:active {
    background-color: #e5e5e5;
}

.checked-contact-list-container footer {
    height: 55px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 10px;
}

footer button {
    padding: 5px 30px;
    border-radius: 4px;
    border: 1px solid #cccccc;
}
footer button.cancel {
    background-color: #f7f7f7;
}

footer button.confirm {
    background-color: #20bf64;
    margin-left: 20px;
    margin-right: 20px;
    color: #fff;
    border: none;
}

footer button.confirm.disable {
    background-color: #f2f2f2;
    color: #c2c2c2;
}
</style>
