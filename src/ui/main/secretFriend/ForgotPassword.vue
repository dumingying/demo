<!-- 忘记密码 -->
<template>
    <div class="secret-password-container">
        <div class="info">
            <h3>
                {{ $t("secretToken.stepName4") }}
                <Icon
                    type="ios-close"
                    style="font-size: 32px"
                    @click="toDone"
                    class="close-btn"
                />
            </h3>
            <span>{{ $t("secretToken.forgetTipTitle") }}</span>
            <div class="card">
                <p class="tip">{{ $t("secretToken.forgetTip") }}</p>
                <p class="bold-tip">
                    {{ $t("secretToken.ServeEmail") }}service@tongfudun.com
                </p>
                <p class="bold-tip">
                    {{ $t("secretToken.ServeTel") }}400-831-8116
                </p>
            </div>
        </div>

        <button @click="toDone">
            {{ $t("secretToken.closeBtn") }}
        </button>
    </div>
</template>

<script>
import store from "@/store";
export default {
    name: "ForgotPassword",
    data() {
        return {};
    },
    methods: {
        toDone() {
            this.$modal.hide("ForgotSecretPassword-modal");
            store.toggleSetForgotPasswordView(false);
        },
    },
};
</script>

<style lang="less" scoped>
.secret-password-container {
    height: 100%;
    box-sizing: border-box;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .info {
        h3 {
            font-family: PingFang SC;
            font-size: 18px;
            font-weight: 500;
            line-height: 30px;
            text-align: center;
            color: #000;
            position: relative;
            .close-btn {
                position: absolute;
                right: -20px;
                top: -2px;
                z-index: 2;
            }
        }
        span {
            margin-top: 20px;
            display: block;
            font-family: PingFang SC;
            font-size: 16px;
            font-weight: 500;
            line-height: 24px;
            color: rgba(0, 0, 0, 1);
            &:before {
                vertical-align: middle;
                width: 24px;
                height: 24px;
                display: inline-block;
                content: "";
                background: url("../../../assets/images/kind-tips.svg")
                    no-repeat center;
                background-size: 24px auto;
                margin-right: 4px;
            }
        }
        .card {
            background: rgba(231, 248, 244, 1);
            padding: 20px;
            border-radius: 24px;
            margin-top: 16px;
        }
        .tip {
            font-family: PingFang SC;
            font-size: 14px;
            font-weight: 400;
            line-height: 24px;
        }
        .bold-tip {
            font-family: PingFang SC;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
        }
    }

    button {
        width: 100%;
        border: 2px solid rgba(29, 187, 136, 1);
        color: rgba(29, 187, 136, 1);
        height: 46px;
        text-align: center;
        border-radius: 24px;
        margin-top: 100px;
        background-color: transparent;
        font-family: PingFang SC;
        font-size: 16px;
        font-weight: 500;
        line-height: 22px;
        text-align: center;
    }
}
</style>
