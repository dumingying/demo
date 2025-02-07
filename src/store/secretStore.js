import { defineStore } from "pinia";
import {
    postSecretTokenConfig,
    postSecretTokenUpdateConfig,
    postSecretFriendsOrGroup,
} from "@/axios";
import wfc from "@/wfc/client/wfc";
// import { ref } from "vue";
// 创建store,命名规则： useXxxxStore
// 参数1：store的唯一表示
// 参数2：对象，可以提供state actions getters
const useSecretTokenStore = defineStore("secretToken", {
    state: () => {
        return {
            secretConfig: false, //是否开启过秘密令牌功能 默认 没有开启
            secretStatus: false, // 当前秘密令牌状态 false:显示、 true:隐藏
            secretSearchView: false, // 输入的秘密令牌内容
            setSecretTokenView: false, // 显示设置密友，密群页面
            forgotPasswordView: false, // 显示忘记密码页面
            secretPassword: "", // 是否设置秘密 没设置过秘密意味着没开启
            secretFriends: [], //秘密好友
            secretGroups: [], // 秘密群聊
        };
    },
    getters: {},
    actions: {
        // 更新秘密令牌的配置信息
        async secretTokenConfigAsync() {
            try {
                const res = await postSecretTokenConfig({
                    userId: wfc.getUserId(),
                });
                const { data, message, code } = res.data;
                if (code === "000000") {
                    this.secretConfig = !!data; // 是否开启过秘密令牌
                    console.log(this.secretConfig, "是否开启过秘密令牌");
                    if (data) {
                        this.secretStatus = Boolean(data.safeFriendHideStatus); // 是否隐藏
                        this.secretPassword = data.safeFriendPassword;
                    }
                    return false;
                } else {
                    return message;
                }
            } catch (error) {
                console.log(error);
                return error;
            }
        },
        // 获取 秘密好友，群聊数据
        async secretFriendsOrGroupsAsync() {
            try {
                let res = await postSecretFriendsOrGroup({
                    userId: wfc.getUserId(),
                });
                let { data, code, message } = res.data;
                if (code === "000000") {
                    this.secretFriends = data.friends;
                    this.secretGroups = data.groups;
                    return false;
                } else {
                    return message;
                }
            } catch (error) {
                console.log(error);
                return error;
            }
        },
        // 设置秘密令牌
        // tsecretStatus   0/false 显示    1/true 隐藏
        // secretPassword  更新秘密令牌密码
        async changeSecretStatusAsync(params) {
            // safeFriendHideStatus,safeFriendPassword,
            try {
                const res = await postSecretTokenUpdateConfig({
                    userId: wfc.getUserId(),
                    ...params,
                });
                const { data, message, code } = res.data;
                if (code === "000000") {
                    if (data) {
                        this.secretStatus = Boolean(data.safeFriendHideStatus); // 是否隐藏
                        this.secretPassword = data.safeFriendPassword;
                    }
                    return false;
                } else {
                    return message;
                }
            } catch (error) {
                console.log(error);
                return error;
            }
        },

        setSecretSearch(query) {
            this.secretSearchView = query;
        },
        setSecretToken(query) {
            this.setSecretTokenView = query;
        },
        setForgotPassword(query) {
            this.forgotPasswordView = query;
        },
        resetSecretTokenAllData() {
            this.secretConfig = false;
            this.secretStatus = false;
            this.secretSearchView = false;
            this.setSecretTokenView = false;
            this.forgotPasswordView = false;
            this.secretPassword = "";
            this.secretFriends = [];
            this.secretGroups = [];
        },
    },
});

export default useSecretTokenStore;
