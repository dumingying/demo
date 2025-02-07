<!-- 密码设置 -->
<template>
    <div class="secret-password-container">
        <h3>
            {{ title }}
            <Icon
                type="ios-close"
                style="font-size: 32px"
                @click="toDone"
                class="close-btn"
            />
        </h3>
        <div class="input-wrap">
            <p class="tip">{{ $t("secretToken.passwordTip") }}</p>
            <input
                v-if="from === 'edit'"
                type="password"
                v-model="oldPassword"
                :placeholder="$t('secretToken.oldPasswordPlacehodler')"
            />
            <input
                type="password"
                v-model="password"
                :placeholder="placeholder(1)"
            />
            <input
                type="password"
                v-model="againPassword"
                :placeholder="placeholder(0)"
            />
        </div>
        <button
            @click="handleConfirm"
            :disabled="disabled"
            :class="disabled ? 'disabled' : ''"
        >
            {{ $t("secretToken.confirmBtn") }}
        </button>
    </div>
</template>

<script>
import { storeToRefs } from "pinia";
import useSecretTokenStore from "@/store/secretStore";
import { MD5 } from "crypto-js";

export default {
    name: "SecretPassword",
    props: {
        from: {
            type: String,
        },
    },
    data() {
        return {
            oldPassword: "",
            password: "",
            againPassword: "",
        };
    },
    created() {},
    computed: {
        title() {
            return this.from === "set"
                ? this.$t("secretToken.passwordTitle")
                : this.$t("secretToken.changePassword");
        },
        placeholder() {
            return (type) => {
                let isSet = this.from === "set";
                return type
                    ? this.$t(
                          isSet
                              ? "secretToken.passwordPlacehodler"
                              : "secretToken.newPasswordPlacehodler"
                      )
                    : this.$t(
                          isSet
                              ? "secretToken.nextPasswordPlacehodler"
                              : "secretToken.nextNewPasswordPlacehodler"
                      );
            };
        },
        disabled() {
            return this.from === "set"
                ? !this.password || !this.againPassword
                : !this.oldPassword || !this.password || !this.againPassword;
        },
    },
    methods: {
        toDone() {
            this.password = "";
            this.againPassword = "";
            this.$modal.hide("SecretPassword-modal");
        },
        async handleConfirm() {
            let secretToken = useSecretTokenStore();

            if (this.password !== this.againPassword) {
                this.$Message.error(this.$t("secretToken.passwordError"));
                return;
            }
            if (["123456", "654321"].includes(this.password)) {
                this.$Message.error(this.$t("secretToken.invalidPassward"));
                return;
            }
            const { secretPassword } = storeToRefs(secretToken);
            if (
                this.from === "edit" &&
                secretPassword.value !== MD5(this.oldPassword).toString()
            ) {
                this.$Message.error(this.$t("secretToken.oldPasswordError"));
                return;
            }
            let res = await secretToken.changeSecretStatusAsync({
                safeFriendPassword: this.password,
            });
            if (!res) {
                this.$modal.hide("SecretPassword-modal", true);
            }
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
    .input-wrap {
        flex: 1;
        margin-top: 12px;
        .tip {
            margin-top: 16px;
            background: rgba(255, 109, 3, 1);
            padding: 16px;
            border-radius: 24px;
            color: #fff;
            font-family: PingFang SC;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
        }

        input {
            width: 100%;
            display: block;
            height: 40px;
            margin-top: 40px;
            border: none;
            border-bottom: 1px solid rgba(242, 242, 242, 1);
            outline: none;
        }
    }

    button {
        width: 100%;
        background: rgba(29, 187, 136, 1);
        color: #fff;
        height: 46px;
        text-align: center;
        border-radius: 24px;
        border: none;
        opacity: 1;
        &.disabled {
            opacity: 0.6;
        }
    }
}
</style>
