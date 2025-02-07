<template>
    <div class="ipfs-modal">
        <div class="header">
            <span>{{ title }}</span>
            <Icon type="md-close" class="close" @click="handlerClose" />
        </div>
        <div class="content">
            <p class="cid">
                {{ $t("disk.cid") }}
                <span @click="copy">{{ cidStr }}</span>
            </p>
        </div>
        <p class="text">
            <span @click="handler">{{ $t("disk.ipfs_tip") }}</span>
        </p>
    </div>
</template>

<script>
import { copyText } from "@/ui/util/clipboard";
import Config from "@/config";
export default {
    name: "IpfsModal",
    props: {
        title: {
            type: String,
        },
        cid: {
            type: String,
        },
    },
    data() {
        return {
            isShow: false,
        };
    },
    computed: {
        isEn() {
            return this.$store.state.currentLanguage === "en";
        },
        cidStr() {
            let str = this.cid.replace(/(.{6}).*(.{4})/, "$1...$2");
            return str;
        },
    },
    methods: {
        copy() {
            copyText(this.cid);
            this.$Message.success(this.$t("web3.copied"));
        },
        handlerClose() {
            this.$modal.hide("Ipfs-modal");
        },
        // 点击展示ipfs说明文案
        handler() {
            this.$alert({
                title: this.$t("disk.ipfs_about"),
                width: 520,
                height: 430,
                content: `<iframe style="width:480px;height:280px;border:none;" src="${
                    this.mixinHttps
                }/ipfs.html?language=${this.isEn ? "en" : "zh"}"></iframe>`,
                isText: false,
                confirmText: this.$t("common.close"),
                cancelText: "",
            });
        },
    },
};
</script>
<style lang="less" scoped>
.ipfs-modal {
    padding: 20px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: url(../../../assets/images/ipfs-bg.png) no-repeat 0 0,
        linear-gradient(180deg, #6fc0c5 0%, #ffffff 100%);
    background-size: 80px;
    overflow: hidden;
    .header {
        height: 40px;
        line-height: 40px;
        text-align: center;
        position: relative;
        span {
            font-family: "Alibaba PuHuiTi";
            font-style: normal;
            font-weight: 400;
            font-size: 18px;
            line-height: 26px;
            text-align: center;
            color: #253456;
        }
        .close {
            position: absolute;
            z-index: 1;
            right: 0;
            top: 0;
            font-size: 24px;
        }
    }
    .content {
        padding: 20px;
        margin-top: 34px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0px 1px 8px 0px rgba(0, 0, 0, 0.12);
    }
    .cid {
        font-family: "Alibaba PuHuiTi";
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 22px;
        color: #666666;
        opacity: 0.8;
    }

    .cid span {
        font-family: "Alibaba PuHuiTi";
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 22px;
        letter-spacing: 1px;
        color: #000000;

        opacity: 0.8;
    }
    .text {
        margin-top: 8px;
        text-align: center;
        font-family: "PingFang SC";
        font-style: normal;
        font-weight: 500;
        font-size: 12px;
        line-height: 20px;
        color: #1dbb88;
        span {
            cursor: pointer;
            padding: 0 10px;
        }
    }
}
</style>
