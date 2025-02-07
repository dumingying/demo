<template>
    <ul>
        <li v-for="groupedUser in groupedUsers" :key="groupedUser.category">
            <div ref="contactItem" class="contact-item">
                <div
                    v-if="showCategoryLabel"
                    class="label"
                    :style="paddingStyle"
                    v-bind:class="{ sticky: enableCategoryLabelSticky }"
                >
                    <p>{{ groupedUser.category.toUpperCase() }}</p>
                </div>
                <ul v-if="imGroupMembers && imGroupMembers.length">
                    <li
                        v-for="user in this.search
                            ? groupedUser.users
                            : imGroupMembers"
                        :key="user.uid"
                    >
                        <div
                            class="content"
                            :ref="`userCardTippy-${user.uid}`"
                            :id="`user-${user.uid}`"
                            :style="paddingStyle"
                            :class="{ active: activeClass(user) }"
                            @click.stop="clickUserItem(user)"
                        >
                            <img
                                class="avatar"
                                draggable="false"
                                :src="user.portrait"
                                @error="mixinImgUrlAlt"
                            />
                            <span class="single-line">
                                {{
                                    currentLanguage === "en"
                                        ? user.anonymousEnName
                                        : user.anonymousName
                                }}
                            </span>
                        </div>
                    </li>
                </ul>
                <ul v-else>
                    <li v-for="user in groupedUser.users" :key="user.uid">
                        <tippy
                            v-if="!from"
                            :to="`#user-${user.uid}`"
                            :animate-fill="false"
                            :style="tippyStyleFix"
                            interactive
                            theme="light"
                            distant="7"
                            animation="fade"
                            trigger="click"
                            placement="left-start"
                        >
                            <template #content>
                                <UserCardView
                                    :user-info="user"
                                    v-on:close="closeUserCard(user)"
                                />
                            </template>
                        </tippy>
                        <div
                            class="content"
                            :ref="`userCardTippy-${user.uid}`"
                            :id="`user-${user.uid}`"
                            :style="paddingStyle"
                            :class="{ active: activeClass(user) }"
                            @click.stop="clickUserItem(user)"
                        >
                            <img
                                class="avatar"
                                draggable="false"
                                :src="user.portrait"
                                @error="mixinImgUrlAlt"
                            />
                            <span class="single-line">
                                {{ filterName(user) }}</span
                            >
                        </div>
                    </li>
                </ul>
            </div>
        </li>
    </ul>
</template>

<script>
import UserCardView from "@/ui/main/user/UserCardView";
import ConversationInfo from "@/wfc/model/conversationInfo";
import { getIsHasUser } from "@/axios";
import Config from "@/config";
import store from "@/store";

export default {
    name: "UserListVue",
    props: {
        from: {
            type: String,
            required: false,
            default: "",
        },
        users: {
            type: Array,
            required: true,
        },
        currentUser: {
            type: Object,
            default: null,
        },
        showCategoryLabel: {
            type: Boolean,
            required: false,
            default: true,
        },
        enableCategoryLabelSticky: {
            type: Boolean,
            required: false,
            default: false,
        },
        clickUserItemFunc: {
            type: Function,
            required: false,
        },
        closeGroupViewFun: {
            type: Function,
            required: false,
        },
        paddingLeft: {
            type: String,
            required: false,
            default: "5px",
        },
        search: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            sharedContactState: store.state.contact,
            imGroupMembers: [],
        };
    },
    computed: {
        currentLanguage() {
            return this.$store.state.currentLanguage;
        },
        groupedUsers() {
            let groupedUsers = [];
            this.users.forEach((item) => {
                item.portrait = this.mixinDefaultPortrait(item.portrait);
            });

            if (!this.showCategoryLabel) {
                groupedUsers.push({
                    category: "not-show-category",
                    users: this.users,
                });
            } else {
                let current = { users: [] };
                let lastCategory = null;
                this.users.forEach((user) => {
                    if (!lastCategory || lastCategory !== user._category) {
                        lastCategory = user._category;
                        current = {
                            category: user._category,
                            users: [user],
                        };
                        groupedUsers.push(current);
                    } else {
                        current.users.push(user);
                    }
                });
            }
            return groupedUsers;
        },
        paddingStyle() {
            return {
                paddingLeft: this.paddingLeft,
            };
        },
        filterName() {
            return (user) => {
                // 针对通付盾团队,针对会议助手 名称需要特殊处理一下
                if (Config.TEAM_IDS.includes(user.uid)) {
                    return this.mixinOfficialName(user.name);
                }
                return this.mixinGetUserName(user);
            };
        },
        activeClass() {
            return (user) => {
                let { currentFriend } = this.sharedContactState;
                return (
                    (currentFriend &&
                        user._category === currentFriend._category &&
                        user.uid === currentFriend.uid) ||
                    (this.currentUser && this.currentUser.uid === user.uid)
                );
            };
        },
    },
    components: {
        UserCardView,
    },
    methods: {
        async clickUserItem(user) {
            this.clickUserItemFunc && this.clickUserItemFunc(user);
            try {
                let res = await getIsHasUser({ toUserId: user.uid });
                let { message, code } = res.data;
                if (code !== "000000") {
                    this.$Toast.show({
                        type: "error",
                        text: message,
                        time: 2000,
                    });
                }
            } catch (error) {}
        },

        scrollActiveElementCenter() {
            let el = this.$el.getElementsByClassName("active")[0];
            el && el.scrollIntoView({ behavior: "instant", block: "center" });
        },

        tippyStyleFix() {
            let root = document.documentElement;
            root.style.setProperty("--tippy-right", "250px");
        },

        tippyStyleReset() {
            let root = document.documentElement;
            root.style.setProperty("--tippy-right", "0");
        },
        closeUserCard(user) {
            this.$refs["userCardTippy-" + user.uid][0]._tippy.hide();
            this.closeGroupViewFun && this.closeGroupViewFun();
        },
    },
    created() {
        //判断是不是匿名群
        if (
            ConversationInfo &&
            ConversationInfo.anonymous_memberList &&
            ConversationInfo.anonymous_memberList.length
        ) {
            this.imGroupMembers = ConversationInfo.anonymous_memberList;
        }
        //判断是不是点击的联系人
        if (this.from === "concat") {
            this.imGroupMembers = [];
        }
    },
    mounted() {
        if (!this.clickUserItemFunc) {
            this.tippyStyleFix();
        }
    },

    activated() {
        this.scrollActiveElementCenter();
    },

    unmounted() {
        if (!this.clickUserItemFunc) {
            this.tippyStyleReset();
        }
    },
};
</script>

<style lang="css" scoped>
.contact-item {
    --user-item-padding-left: 30px;
}

ul {
    list-style: none;
    width: 100%;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
}

.checkbox {
    margin-right: 10px;
}

.contact-item {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    align-items: flex-start;
}

.contact-item .label {
    width: 100%;
}

.contact-item .label p {
    margin-top: 10px;
    height: 30px;
    line-height: 30px;
    position: relative;
}
.contact-item .label p:after {
    position: absolute;
    top: 29px;
    right: 0;
    content: "";
    width: 100%;
    height: 0.5px;
    background: #dddddd;
    opacity: 0.5;
}
.contact-item .label.sticky {
    position: sticky;
    top: 0;
}

.contact-item .content {
    padding: 6px 0;
    display: flex;
    width: 100%;
    align-items: center;
}

.contact-item .content span {
    margin-left: 10px;
    color: #222222;
    flex: 1;
}

.contact-item .content.active,
.contact-item .content:active {
    background-color: #eceef4;
}

/*.contact-item .content:hover {*/
/*  background-color: red;*/
/*}*/
</style>

<!--<style>-->
<!--.tippy-tooltip {-->
<!--  right: 250px !important;-->
<!--  border: 1px solid #f5f5f5 !important;-->
<!--  background-color: #fcfcfc !important;-->
<!--}-->
<!--</style>-->
