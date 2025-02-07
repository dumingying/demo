<template>
    <section class="user-info-container">
        <div class="header">
            <div class="desc">
                <h2>{{ resetCardUserName }}</h2>
                <!-- 展示脱敏手机号 -->
                <p v-if="isShowPhone">
                    <span> {{ $t("contact.phone") }}:</span>
                    {{ mixinResetPhoneNumber(userInfo.mobile) }}
                </p>
                <p v-if="userInfo.email">
                    <span> {{ $t("contact.email") }}:</span>
                    {{ userInfo.email }}
                </p>
            </div>
            <div>
                <img
                    class="avatar"
                    draggable="false"
                    @error="mixinImgUrlAlt"
                    :src="mixinDefaultPortrait(userInfo.portrait)"
                />
                <!-- @click="pickFile" -->
                <input
                    v-if="enableUpdatePortrait"
                    ref="fileInput"
                    @change="onPickFile($event)"
                    class="icon-ion-android-attach"
                    type="file"
                    accept="image/png, image/jpeg"
                    style="display: none"
                />
            </div>
        </div>
        <!-- <div class="content">
      <ul>
        <li v-if="isFriend">
          <label>{{ $t('common.alias') }}</label>
          <div class="alias">
            <input @click.stop=""
                   type="text"
                   v-model.trim="friendAlias"
                   @keyup.enter="updateFriendAlias"
                   placeholder="备注名" />
          </div>
        </li>
        <li>
          <label>{{ $t('common.area') }}</label>
          <div>{{ $t('misc.beijing') }}</div>
        </li>
        <li>
          <label>{{ $t('common.label') }}</label>
          <div>{{ $t('misc.test_user') }}</div>
        </li>
      </ul>
    </div> -->
        <div class="action" v-if="from !== 'conference'">
            <!-- <a href="#"><i class="icon-ion-ios-shuffle"
           @click="share"></i></a> -->
            <a v-if="isFriend" href="#" @click.prevent>
                <i class="icon-ion-ios-chatboxes" @click.prevent="chat(0)"></i>
            </a>
            <!-- 加为好友 -->
            <a v-else href="#" @click.prevent
                ><i class="icon-ion-person-add" @click.prevent="chat(1)"></i>
            </a>
        </div>
    </section>
</template>

<script>
import MessageContentMediaType from "@/wfc/messages/messageContentMediaType";
import store from "@/store";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";
import wfc from "@/wfc/client/wfc";
import Config from "@/config";
export default {
    name: "UserCardView",
    props: {
        userInfo: {
            type: Object,
            required: true,
        },
        enableUpdatePortrait: {
            type: Boolean,
            required: false,
        },
        from: {
            type: String,
            required: "",
        },
    },
    data() {
        return {
            friendAlias: this.userInfo.friendAlias,
            sharedContactState: store.state.contact,
        };
    },
    computed: {
        currentLanguage() {
            return this.$store.state.currentLanguage;
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
        resetCardUserName() {
            let name = this.userInfo.displayName;
            if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
                return this.mixinResetPhoneNumber(name);
            }
            // 针对通付盾团队 名称需要特殊处理一下
            // 针对通付盾团队,针对会议助手 名称需要特殊处理一下
            if (Config.TEAM_IDS.includes(this.userInfo.uid)) {
                return this.mixinOfficialName(this.userInfo.name);
            }
            return name;
        },
        isFriend() {
            return (
                this.userInfo &&
                (this.userInfo.uid === wfc.getUserId() ||
                    wfc.isMyFriend(this.userInfo.uid))
            );
        },
        isShowPhone() {
            if (
                [...Config.HELPER_IDS, ...Config.TEAM_IDS].includes(
                    this.userInfo.uid
                ) ||
                !this.userInfo.mobile
            ) {
                return false;
            }
            return true;
        },
    },
    methods: {
        chat(type) {
            if (
                type &&
                wfc.getMyFriendList(true).length >=
                    this.permissionList.friendsLimit
            ) {
                this.$alert({
                    content: tipsContent[16],
                    height: 150,
                    cancelText: "",
                });
            } else {
                if (
                    this.$router.currentRoute.value.path !==
                    "/home/conversation"
                ) {
                    this.$router.replace("/home/conversation");
                }
                let conversation = new Conversation(
                    ConversationType.Single,
                    this.userInfo.uid,
                    0
                );
                store.setCurrentConversation(conversation);
                this.close();
            }
        },
        updateFriendAlias() {
            if (this.userInfo.uid === wfc.getUserId()) {
                if (this.friendAlias !== this.userInfo.displayName) {
                    let entry = new ModifyMyInfoEntry();
                    entry.type = ModifyMyInfoType.Modify_DisplayName;
                    entry.value = this.friendAlias;
                    wfc.modifyMyInfo([entry]);
                }
            } else {
                if (this.friendAlias !== this.userInfo.friendAlias) {
                    wfc.setFriendAlias(
                        this.userInfo.uid,
                        this.friendAlias,
                        () => {
                            // do nothing
                        },
                        (error) => {
                            // do nothing
                        }
                    );
                }
            }
            this.close();
        },
        close() {
            this.$emit("close");
        },

        pickFile() {
            this.$refs["fileInput"].click();
        },
        onPickFile(event) {
            // this.batchProcess(e.target.files[0]);
            let file = event.target.files[0];

            wfc.uploadMedia(
                file.name,
                file,
                MessageContentMediaType.Portrait,
                (url) => {
                    let entry = new ModifyMyInfoEntry();
                    entry.type = ModifyMyInfoType.Modify_Portrait;
                    entry.value = url;

                    wfc.modifyMyInfo(
                        [entry],
                        () => {
                            //this.userInfo.portrait = url;
                            // 会触发userInfosUpdate 通知
                        },
                        (err) => {
                            console.log("modify my info error", err);
                        }
                    );
                },
                (err) => {
                    console.log("err", err);
                },
                (p, t) => {
                    console.log("progress", p, t);
                }
            );
        },
    },
};
</script>

<style lang="css" scoped>
.user-info-container {
    width: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #292a2c;
    background-color: #fcfcfc;
}

.user-info-container .avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
}

.header {
    width: calc(100% - 40px);
    margin: 10px 20px;
    display: flex;
    justify-content: space-between;
}

.header .desc {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    margin-right: 6px;
}
.header .desc p {
    margin-top: 10px;
}
.header .desc h2 {
    max-width: 100%;
    display: -webkit-box;
    text-align: left;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.content {
    width: 100%;
    text-align: left;
}

.content ul {
    border: 1px solid white;
    list-style: none;
    margin: 10px 20px;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
}

.content ul li label {
    margin-right: 20px;
}

.content ul li .alias {
    border: none;
    background: none;
}

.content ul li .alias > input {
    width: 100%;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.action {
    border-top: 1px solid lightgray;

    width: calc(100% - 40px);
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    padding-bottom: 10px;
}

.action a {
    display: inline-block;
    text-decoration: none;
}

.action a i {
    font-size: 24px;
    padding: 5px 30px;
}

.action a i:last-of-type {
    padding-right: 0;
    color: #1dbb88;
}

i:hover {
    color: #1dbb88;
}
</style>
