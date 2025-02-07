<template>
    <div class="new-friends-list">
        <span class="close-btn" @click="handlerClose">
            <Icon type="md-close" />
        </span>
        <h5>{{ $t("friend_request.find_user") }}</h5>
        <ul>
            <li v-for="item in list" :key="item.uid" @click="goUserInfo(item)">
                <figure class="portrait">
                    <img
                        :src="item.portrait || defaultImage"
                        draggable="false"
                        alt=""
                    />
                </figure>
                <div class="user-info-wrap">
                    <p class="name">{{ userName(item) }}</p>
                    <p class="cns" v-if="item.cns">{{ item.cns }}</p>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import store from "@/store";
export default {
    name: "NewFriendList",
    props: {
        list: {
            type: Array,
            default: [],
        },
    },
    components: {},
    data() {
        return {
            defaultImage: require("../../../assets/images/default.jpg"),
        };
    },
    computed: {
        userName() {
            return (item) => {
                return this.mixinGetUserName(item);
            };
        },
    },
    methods: {
        // 点击关闭
        handlerClose() {
            this.$modal.hide("new-friends-list");
        },
        // 点击打开好友详情
        goUserInfo(userInfo) {
            store.setCurrentFriend({ ...userInfo, uid: userInfo.userId });
            this.$modal.hide("new-friends-list");
        },
    },
};
</script>
<style lang="less" scoped>
.new-friends-list {
    padding: 20px;
    position: relative;
    h5 {
        font-size: 16px;
        text-align: center;
        padding: 10px;
        border-bottom: 1px solid #ccc;
    }

    .close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        i {
            font-size: 20px;
        }
    }
    ul {
        height: 336px;
        margin-top: 30px;
        padding: 0 16px;
        overflow-x: hidden;
        overflow-y: auto;
    }
    li {
        margin-bottom: 20px;
        padding: 10px;
        display: flex;
        border-bottom: 1px solid #eee;
        &:last-child {
            border-bottom: none;
        }
        .portrait {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            overflow: hidden;
            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        .user-info-wrap {
            margin-left: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            p {
                font-size: 14px;
            }
            .name {
                font-weight: bold;
                color: #333;
            }
            .tel {
                color: #999;
            }
        }
    }
}
</style>
