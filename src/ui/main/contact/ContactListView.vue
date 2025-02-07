<template>
    <section class="contact-list">
        <ul>
            <!-- 新朋友添加 -->
            <!-- <li>
        <div @click="showNewFriends"
             class="category-item-container">
          <i class="arrow right"
             v-bind:class="{down: sharedContactState.expandFriendRequestList}"></i>
          <div class="category-item">
            <span class="title">{{ $t('contact.new_friend') }}</span>
            <span class="desc"
                  v-if="sharedContactState.unreadFriendRequestCount > 0">{{ sharedContactState.unreadFriendRequestCount }}</span>
          </div>
        </div>
        <NewFriendListView v-if="sharedContactState.expandFriendRequestList" />
      </li> -->
            <!-- 保存通讯录的群组 -->
            <!-- <li>
        <div @click="showGroups"
             class="category-item-container">
          <i class="arrow right"
             v-bind:class="{down: sharedContactState.expandGroup}"></i>
          <div class="category-item">
            <span class="title">{{ $t('contact.group') }}</span>
            <span class="desc">{{ sharedContactState.favGroupList.length }}</span>
          </div>
        </div>
        <GroupListView v-if="sharedContactState.expandGroup" />
      </li> -->
            <!--隐藏频道 -->
            <!-- <li>
        <div @click="showChannels"
             class="category-item-container">
          <i class="arrow right"
             v-bind:class="{down: sharedContactState.expandChanel}"></i>
          <div class="category-item">
            <span class="title">{{ $t('contact.channel') }}</span>
            <span class="desc">{{ sharedContactState.channelList.length }}</span>
          </div>
        </div>
        <ChannelListView v-if="sharedContactState.expandChanel"
                         :channels="sharedContactState.channelList" />
      </li> -->
            <!-- 联系人 -->
            <li>
                <div @click="showContacts" class="category-item-container">
                    <i
                        class="arrow right"
                        :class="{
                            down: sharedContactState.expandFriendList,
                        }"
                    ></i>
                    <div class="category-item">
                        <span class="title">{{ $t("contact.contact") }}</span>
                        <span class="desc">{{
                            sharedContactState.friendList.length
                        }}</span>
                    </div>
                </div>
                <UserListVue
                    from="contact"
                    :enable-pick="false"
                    :users="users"
                    :click-user-item-func="setCurrentUser"
                    :padding-left="'30px'"
                    v-if="sharedContactState.expandFriendList"
                />
            </li>
        </ul>
    </section>
</template>
<script>
import FriendRequestListView from "@/ui/main/contact/FriendRequestListView";
import GroupListView from "@/ui/main/contact/GroupListView";
// import ChannelListView from './ChannelListView'
import store from "@/store";
import UserListVue from "@/ui/main/user/UserListVue";
import wfc from "@/wfc/client/wfc";
import Config from "@/config";
import useSecretTokenStore from "@/store/secretStore";
import { storeToRefs } from "pinia";
export default {
    name: "ContactListView",
    components: {
        UserListVue,
        GroupListView,
        NewFriendListView: FriendRequestListView,
        // ChannelListView
    },
    data() {
        return {
            sharedContactState: store.state.contact,
        };
    },
    computed: {
        users() {
            // let users = this.sharedContactState.favContactList.concat(
            //       this.sharedContactState.friendList
            //   );
            //   去除文件助手,系统管理员
            let users = this.sharedContactState.friendList.filter(
                (u) => !Config.HELPER_IDS.includes(u.uid)
            );
            users = users.map((item) => {
                return {
                    ...item,
                    //如果没有头像就设置默认头像
                    portrait: item.portrait || Config.DEFAULT_PORTRAIT_URL,
                    _displayName: item.displayName,
                };
            });
            let { secretFriends, secretStatus, secretConfig } = storeToRefs(
                useSecretTokenStore()
            );
            if (secretConfig.value && secretStatus.value) {
                let friends = secretFriends?.value.map((item) => item.userId);
                return users.filter((item) => !friends?.includes(item.uid));
            } else {
                return users;
            }
        },
    },
    mounted() {
        // 更新信息
        for (let index = 0; index < this.users.length; index++) {
            wfc.getUserInfo(this.users[index].uid, true);
        }
    },
    methods: {
        setCurrentUser(userInfo) {
            store.setCurrentFriend(userInfo);
        },
        showNewFriends() {
            store.toggleFriendRequestList();
        },
        showGroups() {
            store.toggleGroupList();
        },
        showContacts() {
            store.toggleFriendList();
        },
        // showChannels() {
        //   store.toggleChannelList()
        // }
    },
};
</script>

<style lang="css" scoped>
.contact-list {
    height: 100%;
    overflow: auto;
}

.category-item-container {
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-size: 14px;
    color: #222222;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 10;
}

.category-item {
    display: flex;
    width: 100%;
    justify-content: space-between;
}
.category-item .desc {
    font-size: 12px;
    line-height: 16px;
    text-align: right;
    color: #999999;
}

.arrow {
    border: solid #b9b9b9;
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 3px;
    margin-right: 10px;
}

.right {
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
}

.left {
    transform: rotate(135deg);
    -webkit-transform: rotate(135deg);
}

.up {
    transform: rotate(-135deg);
    -webkit-transform: rotate(-135deg);
}

.down {
    transform: rotate(45deg);
    -webkit-transform: rotate(45deg);
}
</style>
