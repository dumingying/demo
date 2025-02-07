<template>
    <section class="user-detail-container">
        <div class="header">
            <h2>
                <strong>{{ name }}</strong>
                <span class="cns" v-show="cardInfo.did">
                    {{ cardInfo.did }}
                </span>
            </h2>

            <figure>
                <img
                    class="avatar"
                    @error="mixinImgUrlAlt"
                    draggable="false"
                    :src="
                        mixinDefaultPortrait(
                            sharedStateContact.currentFriend.portrait
                        )
                    "
                />
            </figure>
        </div>
        <div class="content">
            <ul>
                <li v-show="cardInfo.nickname">
                    {{ $t("contact.nickName") }} : {{ cardInfo.nickname }}
                </li>
                <li v-show="cardInfo.position">
                    {{ $t("contact.position") }} : {{ cardInfo.position }}
                </li>
                <li v-show="phoneReplace">
                    {{ $t("contact.mobile") }} : {{ phoneReplace }}
                </li>
                <li v-show="emailReplace">
                    {{ $t("contact.email") }}: {{ emailReplace }}
                </li>
                <li v-show="cardInfo.address">
                    {{ $t("contact.address") }}: {{ cardInfo.address }}
                </li>
            </ul>
        </div>
        <div class="footer">
            <a @click="chat">{{ $t("message.send_message") }}</a>
        </div>
    </section>
</template>

<script>
import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";
import { tipsContent } from "@/ui/common/Tips";
import { getItem } from "@/ui/util/storageHelper";
import wfc from "@/wfc/client/wfc";
import Config from "@/config";
import store from "@/store";
import { getInfoByUserId } from "@/axios";

export default {
    name: "UserDetailView",
    props: {
        user: null,
    },
    data() {
        return {
            sharedStateContact: store.state.contact,
            friendAlias: store.state.contact.currentFriend.friendAlias,
            cardInfo: "",
        };
    },
    watch: {
        "user.uid": {
            handler: function (n, o) {
                console.log(n, o, "===");
                if (n !== o) {
                    this.postUserInfo();
                }
            },
            deep: true,
            immediate: true,
        },
    },
    computed: {
        permissionList() {
            return this.$store.state.permissionList;
        },
        phoneReplace() {
            if (Config.HELPER_IDS.includes(this.user.uid)) {
                return "";
            }
            if (this.user.mobile) {
                return this.mixinResetPhoneNumber(this.user.mobile);
            }
            return "";
        },
        emailReplace() {
            if (Config.HELPER_IDS.includes(this.user.uid)) {
                return "";
            }
            if (this.user.email) {
                return this.mixinResetPhoneNumber(this.user.email);
            }
            return "";
        },
        name: function () {
            let name;
            let friend = this.sharedStateContact.currentFriend;
            name = this.mixinGetUserName(friend);
            (async () => {
                wfc.getUserInfo(friend.uid, true);
            })();
            return name;
        },
    },
    methods: {
        // 获取用户信息
        async postUserInfo() {
            try {
                let res = await getInfoByUserId({
                    toUserId: this.user.uid,
                });
                let { data, code, message } = res.data;
                if (code === "000000") {
                    this.cardInfo = data;
                    console.log(data, message);
                }
            } catch (error) {}
        },
        chat() {
            if (
                this.permissionList.vipLevel < 2 &&
                getItem("UnVipUserChatSwitch") === "OFF"
            ) {
                this.$alert({
                    content: tipsContent[17],
                    cancelText: "",
                });
                return;
            }
            if (
                this.user.uid !== wfc.getUserId() &&
                !wfc.isMyFriend(this.user.uid) &&
                wfc.getMyFriendList(true).length >=
                    this.permissionList.friendsLimit
            ) {
                this.$alert({
                    content: tipsContent[16],
                    height: 150,
                    cancelText: "",
                });
            } else {
                let conversation = new Conversation(
                    ConversationType.Single,
                    this.user.uid,
                    0
                );
                store.setCurrentConversation(conversation);
                this.$router.replace("/home/conversation");
            }
        },
        updateFriendAlias() {
            if (
                this.friendAlias !==
                this.sharedStateContact.currentFriend.friendAlias
            ) {
                wfc.setFriendAlias(
                    this.user.uid,
                    this.friendAlias,
                    () => {
                        // do nothing
                    },
                    (error) => {
                        // do nothing
                    }
                );
            }
        },
    },
};
</script>

<style lang="css" scoped>
.user-detail-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 70px;
}

.header {
    margin: 60px auto 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid #e6e6e6;
}

.header .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
}

.header h2 {
    font-size: 20px;
    font-style: normal;
    font-weight: normal;
    margin-bottom: 5px;
}
.header h2 strong {
    display: grid;
    justify-content: flex-start;
}
.header h2 .cns {
    margin-top: 8px;
    color: #fff;
    padding: 2px 6px 2px 6px;
    border-radius: 8px;
    background: linear-gradient(
        90.99deg,
        #286afe 0.85%,
        #a148b3 49.26%,
        #f36223 96.7%
    );
    font-family: PingFang SC;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
}

.content {
    text-align: left;
}

.content ul {
    list-style: none;
    margin: 20px 0;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
}

.content ul li label {
    margin-right: 20px;
    width: 50px;
    text-align: justify;
    text-align-last: justify;
}

.content ul li .alias > input {
    width: 100%;
    border: none;
    height: 20px;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.footer {
    margin-top: 30px;
    display: flex;
    justify-content: center;
}

.footer a {
    max-width: 200px;
    text-align: center;
    width: 100%;
    color: white;
    height: 48px;
    line-height: 48px;
    background-color: #1dbb88;
    border-radius: 24px;
}
</style>
