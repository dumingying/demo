<template>
    <div class="conversation-info">
        <div class="conversation-action-container">
            <div @click="showCreateConversationModal" class="action-item">
                <div class="icon">+</div>
                <p>{{ $t("conversation.add_member") }}</p>
            </div>
        </div>
        <UserListVue
            :users="users"
            :show-category-label="false"
            :padding-left="'20px'"
            :close-group-view-fun="hideConversationInfo"
        />
    </div>
</template>

<script>
import UserListVue from "@/ui/main/user/UserListVue";
import ConversationInfo from "@/wfc/model/conversationInfo";

import { getUserVipInfo } from "@/axios";
import { tipsContent } from "../../common/Tips";

import wfc from "@/wfc/client/wfc";
import store from "@/store";

export default {
    name: "SingleConversationInfoView",
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
        },
        hideConversationInfo: {
            type: Function,
        },
    },
    data() {
        return {
            users: store.getConversationMemberUsrInfos(
                this.conversationInfo.conversation
            ),
            sharedContactState: store.state.contact,
        };
    },
    components: { UserListVue },
    methods: {
        showCreateConversationModal() {
            let users = this.sharedContactState.favContactList.concat(
                this.sharedContactState.friendList
            );
            const successCB = async (users) => {
                if (!users.length) return;
                // 自己聊天框选择1个人，无需创建群聊
                let newPickedUsers = users;
                let userId = wfc.getUserId();
                if (this.users.length === 1 && this.users[0].uid === userId) {
                    store.createConversation({ users: newPickedUsers });
                } else {
                    newPickedUsers.push(
                        this.conversationInfo.conversation._target
                    );
                    if (this.permissionList.isAppCharge) {
                        console.log(
                            "已选中的人数:",
                            newPickedUsers,
                            newPickedUsers.length + 1,
                            "群聊限制人数:",
                            this.permissionList.groupMemberLimit
                        );
                        if (
                            newPickedUsers.length + 1 >
                            this.permissionList.groupMemberLimit
                        ) {
                            this.$alert({
                                content: tipsContent[9],
                                cancelText: "",
                            });
                            return;
                        }
                        try {
                            let res = await getUserVipInfo({ userId });
                            let { code, message, data } = res.data;
                            if (code === "000000") {
                                console.log(
                                    "已创建的个数",
                                    data.groupCountCreatedBy,
                                    "个数限制",
                                    this.permissionList.groupCreateLimit
                                );
                                if (
                                    data.groupCountCreatedBy <
                                    this.permissionList.groupCreateLimit
                                ) {
                                    store.createConversation({
                                        users: newPickedUsers,
                                    });
                                } else {
                                    this.$alert({
                                        content: tipsContent[10],
                                        cancelText: "",
                                    });
                                }
                            } else {
                                this.$Message.error(message);
                            }
                        } catch (error) {
                            console.log(error);
                            this.$Message.error(this.$t("common.error_later"));
                        }
                    } else {
                        store.createConversation({ users: newPickedUsers });
                    }
                }
            };

            this.$pickContact({
                users: users.filter((item) => item.uid !== "wfc_file_transfer"),
                initialCheckedUsers: [
                    this.conversationInfo.conversation._target,
                ],
                uncheckableUsers: [this.conversationInfo.conversation._target],
                confirmTitle: this.$t("common.add"),
                successCB,
            });
        },
    },
    computed: {
        permissionList() {
            return this.$store.state.permissionList;
        },
    },
};
</script>

<style lang="css" scoped>
.conversation-info {
    display: flex;
    flex-direction: column;
    position: relative;
    justify-content: flex-start;
    height: 100%;
}

.action-item {
    height: 50px;
    display: flex;
    padding-left: 20px;
    align-items: center;
}

.action-item .icon {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    border: 1px dashed #d6d6d6;
}

.action-item img {
    width: 40px;
    height: 40px;
}

.action-item p {
    margin-left: 10px;
    font-size: 13px;
}

.action-item:active {
    background-color: #d6d6d6;
}
</style>
