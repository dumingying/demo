<template>
    <div class="request-message">
        <div class="content" v-html="content" @click="handleUrl"></div>
    </div>
</template>

<script>
import { getJoinMeeting, getMyMeeting, getQueryShortUrlV1 } from "@/axios";
import { setItem } from "@/ui/util/storageHelper";
import wfc from "@/wfc/client/wfc";

import Message from "@/wfc/messages/message";
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";
import EnterPassWord from "@/ui/voip/conference/EnterPassWord";
import RequestMeeting from "@/ui/voip/conference/RequestMeeting";

export default {
    components: {},
    props: {
        message: {
            type: Message,
            required: true,
            modal2: true,
        },
    },
    data() {
        return {
            lock: false, // 点击会议连接锁
        };
    },
    computed: {
        content() {
            let message = this.message.messageContent.content.zh;
            const reg =
                /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
            let url = message.match(reg);
            if (url && url.length > 0) {
                return message.replace(
                    url,
                    `<a target="_blank"  href="${url}">${url}</a>`
                );
            } else {
                return message;
            }
        },
        // 媒体设备信息
        externalDevice() {
            return this.$store.state.deviceObj;
        },
    },
    //   created() {
    //     console.log(this.message)
    //   },
    methods: {
        // 点击会议连接
        async handleUrl(e) {
            e.preventDefault();
            let href = this.mixinGetStrUrl(this.content);
            if (href) {
                const userId = wfc.getUserId();
                let myHref = this.mixinGetUrlHost(href);
                if (
                    myHref.indexOf("dwz.cn") > -1 ||
                    myHref.indexOf("s-tfd.cn") > -1 ||
                    myHref.indexOf("s-test-tfd.cn") > -1
                ) {
                    try {
                        let res = await getQueryShortUrlV1({
                            userId,
                            shortUrl: href,
                        });
                        let { data, code } = res.data;
                        if (code === "000000") {
                            if (!data.longUrl) {
                                this.$Message.warning(
                                    this.$t("common.error_later")
                                );
                                return;
                            }
                            // 外链入会
                            if (data.longUrl.indexOf("launchMeet") > -1) {
                                const str = data.longUrl.split("?")[1];
                                this.tojoinConference(str, userId);
                            } else {
                                // 其他
                                this.openBrowser(data.longUrl);
                            }
                        } else {
                            this.openBrowser(href);
                        }
                    } catch (error) {
                        this.openBrowser(href);
                    }
                    return;
                }
                this.openBrowser(url);
            }
        },
        // 默认打开浏览器
        openBrowser(url) {
            try {
                this.mixinGo2Web3View(url);
            } catch (error) {
                console.log(error);
                this.$Message.warning(this.$t("web3.browser_tip"));
            }
        },
        tojoinConference(str, userId) {
            let meetingCode = window.atob(str);
            if (meetingCode && meetingCode.length === 9) {
                const code = meetingCode.replace(/(\w{3})(?=\w)/g, "$1 ");
                if (this.lock) return;
                this.lock = true;
                getMyMeeting({ userId, code })
                    .then((res) => {
                        this.lock = false;
                        const { code, data, message } = res.data;
                        if (code == "000000") {
                            this.joinConference(userId, data);
                        } else {
                            this.$Message.warning(message);
                        }
                    })
                    .catch((error) => {
                        this.lock = false;
                        event.stopPropagation();
                        console.log(error);
                    });
            }
        },
        joinConference(userId, data) {
            if (
                data.imCreateMeeting.host !== userId &&
                data.isPasswordNeed === 1 &&
                data.password
            ) {
                this.$modal.show(
                    EnterPassWord,
                    { title: this.$t("voip.meeting_password") },
                    null,
                    {
                        name: "EnterPassWord-modal",
                        width: 300,
                        height: 160,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    {
                        "before-close": (event) => {
                            if (event.params) {
                                const { params, meetingPassWord } =
                                    event.params;
                                // 点击加入会议
                                if (params && meetingPassWord) {
                                    this.joinMeeting(meetingPassWord, data);
                                }
                            }
                        },
                    }
                );
                return;
            }
            this.joinMeeting("", data);
        },
        // 加入会议
        joinMeeting(meetingPassWord, meetingInfo) {
            const userId = wfc.getUserId();
            const { isPasswordNeed, password, imCreateMeeting } = meetingInfo;
            if (meetingPassWord && password && meetingPassWord !== password) {
                this.$Message.warning(this.$t("voip.password_wrong"));
                return;
            }
            let isAudience = imCreateMeeting.host === userId ? false : true;
            getJoinMeeting({
                isAudience: Number(isAudience), // 是否互动模式 1  观众模式入会 0  主播模式入会
                code: meetingInfo.code, //会议号
                status: "",
                isPasswordNeed: isPasswordNeed,
                password: meetingPassWord || password,
            }).then((res) => {
                const { code, data, message } = res.data;
                if (code == "000000") {
                    let cmc = data.imCreateMeeting;
                    avenginekitproxy.joinConference(
                        cmc.roomId,
                        false,
                        cmc.pin,
                        cmc.host,
                        data.title,
                        cmc.description,
                        isAudience, // 是否是以观众角色入会
                        "", // false, // Boolean(cmc.advance), // 是否是高级会议
                        true,
                        true,
                        {
                            video: true,
                            audio: true,
                        }
                    );
                    setItem("confer_code", data.code);
                } else if (code === "5000021") {
                    // 非指定会议弹窗申请
                    this.$modal.show(
                        RequestMeeting,
                        {
                            title: this.$t("voip.private_meeting_title"),
                            meetingInfo: data,
                        },
                        null,
                        {
                            name: "RequestMeeting-modal",
                            width: 340,
                            height: 266,
                            clickToClose: false, // 点击模态框是否关闭
                        },
                        {
                            "before-close": (event) => {
                                console.log("Closing...", event, event.params);
                            },
                        }
                    );
                } else {
                    this.$Message.warning(message);
                }
            });
        },
    },
};
</script>
<style lang="less" scoped>
.request-message {
    margin: 0 10px;
    padding: 10px;
    max-width: 500px;
    background-color: white;
    position: relative;
    border-radius: 5px;

    .content {
        font-size: 14px;
        line-height: 22px;
        color: #666;
        white-space: pre-line;
    }
}
</style>
