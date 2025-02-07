<template>
    <div>
        <div
            class="url-message-container"
            @click="openLink"
            v-bind:class="{ out: message.direction === 0 }"
        >
            <div class="flex-column flex-align-left url-message-wrap">
                <div class="title-wrap">
                    <p class="second-line title">
                        {{ title }}
                    </p>
                </div>
                <div class="content-wrap flex-row">
                    <p class="three-line desc">{{ content }}</p>
                    <figure width="48" height="48" class="url-img">
                        <img
                            :src="message.messageContent.urlImage"
                            v-real-img="message.messageContent.urlImage"
                            draggable="false"
                            :default-img="defaultImg"
                        />
                    </figure>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import { tipsContent } from "../../../../common/Tips";
import { ipcRenderer } from "@/platform";
import { getQueryShortUrlV1 } from "@/axios";
import { getItem } from "@/ui/util/storageHelper";
export default {
    name: "UrlMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
            modal2: true,
        },
    },
    data() {
        return {
            defaultImg: require("../../../../../assets/images/link-default.png"),
        };
    },
    computed: {
        title() {
            let isEn = getItem("lang") === "en";
            let { longTitleEn, urlTitleEn, longTitle, urlTitle } =
                this.message.messageContent;
            return isEn
                ? longTitleEn || urlTitleEn || longTitle || urlTitle
                : longTitle || urlTitle;
        },
        content() {
            let isEn = getItem("lang") === "en";
            let { urlContent, urlAddress, urlContentEn, urlAddressEn } =
                this.message.messageContent;
            return isEn
                ? urlContentEn || urlAddressEn || urlContent || urlAddress
                : urlContent || urlAddress;
        },
    },
    methods: {
        async openLink() {
            let { urlAddress } = this.message.messageContent;
            let myHref = this.mixinGetUrlHost(urlAddress);
            if (
                myHref.indexOf("dwz.cn") > -1 ||
                myHref.indexOf("s-tfd.cn") > -1 ||
                myHref.indexOf("s-test-tfd.cn") > -1
            ) {
                try {
                    let res = await getQueryShortUrlV1({
                        shortUrl: urlAddress,
                    });
                    let { data, code } = res.data;
                    if (
                        code === "000000" &&
                        data &&
                        data.longUrl.indexOf("vipInfo") > -1
                    ) {
                        // 开通会员
                        this.$alert({
                            content: tipsContent[11],
                            cancelText: "",
                        });
                        return;
                    }
                    this.handleOpenLink(urlAddress);
                } catch (error) {
                    this.handleOpenLink(urlAddress);
                }
                return;
            }
            if (
                urlAddress.startsWith(`${this.mixinHttps}/vipInfo/index.html`)
            ) {
                // 开通会员
                this.$alert({
                    content: tipsContent[11],
                    cancelText: "",
                });
                return;
            }
            this.handleOpenLink(urlAddress);
        },
        handleOpenLink(urlAddress) {
            if (
                ["messageHistory", "conversationMessageHistory"].includes(
                    this.$router.currentRoute.value.name
                )
            ) {
                ipcRenderer.send("message-history-openUrl", { urlAddress });
            } else {
                this.mixinGo2Web3View(urlAddress);
            }
        },
    },
};
</script>

<style lang="less" scoped>
.url-message-container {
    margin: 0 10px;
    padding: 16px;
    background-color: #fff;
    width: 250px;
    max-width: 250px;
    position: relative;
    border-radius: 5px;
    box-sizing: border-box;
}
.second-line,
.three-line {
    max-width: 100%;
    width: 100%;
    flex: 1;
    font-size: 14px;
    line-height: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.second-line {
    -webkit-line-clamp: 2;
}
.three-line {
    -webkit-line-clamp: 3;
    margin-right: 5px;
}
.url-message-wrap {
    /*padding: 10px 5px;*/
    border-radius: 5px 5px 0px 0px;
    .desc {
        word-break: normal;
        color: #666;
        font-family: PingFang SC;
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
    }
}

.title-wrap {
    flex-direction: column;
}

.title {
    font-size: 14px;
    font-weight: 700;
    color: #333;
    font-family: PingFang SC;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
}

.content-wrap {
    margin-top: 8px;
    justify-content: space-between;
    display: flex;
    align-items: center;
    figure {
        width: 48px;
        height: 48px;
        border-radius: 4px;
        overflow: hidden;
        img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
    }
}
</style>
