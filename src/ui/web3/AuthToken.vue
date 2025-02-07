<template>
    <div class="auth-token-wrap">
        <h4 class="title">
            <span class="name">{{ $t("login.authorization") }}</span>
            <div class="btn-wrap">
                <span class="tip-btn" @click="handleTips"></span>
                <span class="close-btn" @click="close">
                    <Icon
                        type="ios-close"
                        style="font-size: 30px; font-weight: 500"
                    />
                </span>
            </div>
        </h4>
        <ul class="content">
            <li class="auth-name">
                <figure>
                    <img
                        :src="authTokenData.icon"
                        draggable="false"
                        alt="logo"
                    />
                </figure>
                <strong> {{ authTokenData.appname }}</strong>
                {{ $t("login.want_use") }}
            </li>
            <li class="text">{{ $t("login.your_account") }}</li>
            <li class="tel">
                {{ mixinResetPhoneNumber(authTokenData.mobile) }}
            </li>
        </ul>
        <div class="footer">
            <button class="cancel" @click="cancel">
                {{ $t("common.decline") }}
            </button>
            <button class="confirm" @click="confirm">
                {{ $t("common.agree") }}
            </button>
        </div>
    </div>
</template>

<script>
import AuthTokenTips from "./AuthTokenTips";
export default {
    props: {
        authTokenData: {
            type: Object,
            default: {},
        },
        title: {
            type: String,
            default: "",
        },
    },
    data() {
        return {};
    },
    methods: {
        handleTips() {
            this.$modal.show(
                AuthTokenTips,
                { title: this.$t("login.user_auth_title") },
                null,
                {
                    name: "AuthTokenTips-modal",
                    width: 400,
                    height: 300,
                    clickToClose: false,
                },
                { closed: (event) => {} }
            );
        },
        close() {
            this.$modal.hide("AuthToken-modal");
        },
        cancel() {
            this.$modal.hide("AuthToken-modal", { cancel: true });
        },
        confirm() {
            this.$modal.hide("AuthToken-modal", { confirm: true });
        },
    },
};
</script>
<style lang="less" scoped>
//@import url(); 引入公共css类
.auth-token-wrap {
    height: 100%;
    padding: 24px 30px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .title {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 40px;
        text-align: center;
        font-size: 14px;
        color: #1dbb88;
        position: relative;
        .name {
            flex: 1;
            font-size: 16px;
        }
        .btn-wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            right: -10px;
        }
        .close-btn {
            margin-left: 8px;
        }
        .tip-btn {
            display: inline-block;
            width: 20px;
            height: 20px;
            background: url(../../assets/images/tip-btn.png) no-repeat center
                center;
            background-size: 100%;
        }
    }
    .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        li {
            flex: 1;
            line-height: 44px;
            font-size: 14px;
        }

        .auth-name {
            display: flex;
            align-items: center;
            font-size: 16px;
            color: #000;
            figure {
                width: 32px;
                height: 32px;
            }
            img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            strong {
                margin: 0 8px;
            }
        }
        .tel {
            color: #1dbb88;
        }
        .text {
            margin-top: 6px;
            border-bottom: 1px solid #eee;
        }
    }

    .footer {
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 1px solid #eee;
        padding-top: 10px;
    }

    .footer button {
        max-width: 100px;
        flex: 1;
        font-size: 14px;
        padding: 8px 15px;
        border-radius: 4px;
        background: none;
        text-align: center;
        border: none;
        margin: 14px 16px 0;
        color: #1dbb88;
    }

    .footer .cancel {
        background: #dddddd;
    }

    .footer .confirm {
        font-weight: bold;
        position: relative;
        color: #fff;
        background: #1dbb88;
    }
}
</style>
