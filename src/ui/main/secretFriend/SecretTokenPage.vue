<!-- 使用说明 -->
<template>
    <instructions-view v-if="showSecretTokenView(0)"></instructions-view>
    <set-secret-token-view
        v-if="showSecretTokenView(1)"
    ></set-secret-token-view>
</template>

<script>
import InstructionsView from "@/ui/main/secretFriend/Instructions"; // 介绍页面
import SetSecretTokenView from "@/ui/main/secretFriend/SetSecretToken"; // 介绍页面
import useSecretTokenStore from "@/store/secretStore";
import { storeToRefs } from "pinia";
export default {
    name: "SecretTokenPage",
    data() {
        return {};
    },
    components: {
        InstructionsView,
        SetSecretTokenView,
    },
    computed: {
        permissionList() {
            return this.$store.state.permissionList;
        },
        showSecretTokenView() {
            return (type) => {
                let { secretSearchView, setSecretTokenView } = storeToRefs(
                    useSecretTokenStore()
                );
                return type ? setSecretTokenView.value : secretSearchView.value;
            };
        },
    },
};
</script>

<style lang="less" scoped>
.instructions-container {
    max-width: 750px;
    margin: 0 auto;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    .back {
        width: 50px;
        height: 40px;
        position: absolute;
        background: url(../../../assets/images/left-arr.svg) no-repeat left
            center;
        background-size: 14px;
    }
    h3 {
        color: #000;
        font-family: PingFang SC;
        font-size: 24px;
        font-weight: 500;
        line-height: 40px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        i {
            width: 40px;
            height: 40px;
            display: inline-block;
            background: url(../../../assets/images/secret-token-icon.svg)
                no-repeat center;
            background-size: 100% auto;
            margin-right: 8px;
        }
    }
    .tip {
        margin-top: 16px;
        font-family: PingFang SC;
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        text-align: center;
    }
    .sub {
        margin-top: 30px;

        font-family: PingFang SC;
        font-size: 16px;
        font-weight: 500;
        line-height: 22.4px;
        text-align: left;
        background: url(../../../assets/images/secret-title-icon.svg) no-repeat
            left center;
        background-size: 24px;
        padding-left: 32px;
    }
    .step-list {
        overflow-x: hidden;
        overflow-y: auto;
        .step {
            margin-top: 32px;
            border-radius: 12px;
            position: relative;
            span {
                border-radius: 12px 0 12px 0;
                font-family: PingFang SC;
                font-size: 13px;
                font-weight: 500;
                line-height: 18px;
                text-align: left;
                padding: 4px 8px;
                position: absolute;
                left: 0;
                top: -18px;
                color: #ffffff;
                z-index: 2;
                text-shadow: 0px 1px 1px 0px #00000033;
            }
            p {
                font-family: PingFang SC;
                font-size: 14px;
                font-weight: 500;
                line-height: 20px;
                text-align: left;
                padding: 20px;
                color: rgba(0, 0, 0, 0.8);
            }
            &:nth-child(1) {
                background: #e7f8f4;
                span {
                    background: linear-gradient(
                        301.23deg,
                        #0cb98d 0%,
                        #15d48a 100%
                    );
                }
            }
            &:nth-child(2) {
                background: #edfbf0;
                span {
                    background: linear-gradient(
                        138.05deg,
                        #9ee430 0.23%,
                        #55cd1f 99.7%
                    );
                }
            }
            &:nth-child(3) {
                background: #fff9e6;
                span {
                    background: linear-gradient(
                        138.05deg,
                        #fbe363 0.23%,
                        #febf37 99.7%
                    );
                }
            }
            &:nth-child(4) {
                background: #fff5ea;
                span {
                    background: linear-gradient(
                        138.05deg,
                        #ffbf61 0.23%,
                        #fe8819 99.7%
                    );
                }
            }
            &:nth-child(5) {
                background: #ffeec0;
                span {
                    background: linear-gradient(
                        138.05deg,
                        #ffbf61 0.23%,
                        #e1ad02 99.7%
                    );
                }
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
            margin-top: 40px;
        }
    }
}
</style>
