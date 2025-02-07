<template>
    <div
        class="text-message-container"
        v-bind:class="{ out: message.direction === 0 }"
    >
        <p
            class="text"
            @click="handleUrl"
            @mouseup="mouseUp"
            v-html="textContent"
            @contextmenu="preventContextMenuTextSelection"
        ></p>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";
import EnterPassWord from "@/ui/voip/conference/EnterPassWord";
import RequestMeeting from "@/ui/voip/conference/RequestMeeting";
import { tipsContent } from "../../../../common/Tips";
import { parser as emojiParse } from "@/ui/util/emoji";
import { setItem } from "@/ui/util/storageHelper";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";
import wfc from "@/wfc/client/wfc";
import store from "@/store";

import {
    getJoinMeeting,
    getMyMeeting,
    getQueryShortUrlV1,
    getUserInfoWeb,
    getGroupInfoWeb,
} from "@/axios";

export default {
    name: "TextMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
    },
    data() {
        return {
            textSelected: false,
            lock: false, // 点击会议连接锁
        };
    },
    mounted() {},

    computed: {
        textContent() {
            if (this.message !== null) {
                try {
                    let extra = this.message.messageContent.extra;
                    if (extra && typeof extra === "string") {
                        let extraObj = JSON.parse(extra);
                        if (Number(extraObj.chatMode) === 1) {
                            return this.$t("message.unsupport_message_desc");
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            }

            let tmp = emojiParse(
                this.message.messageContent.digest(this.message)
            );
            // pls refer to https://stackoverflow.com/questions/4522124/replace-leading-spaces-with-nbsp-in-javascript
            tmp = tmp.replace(/^[ \t]+/gm, function (x) {
                return new Array(x.length + 1).join("&nbsp;");
            });
            if (tmp.indexOf("<img") >= 0) {
                tmp = tmp.replace(/<img/g, '<img style="max-width:40px;"');
                return tmp;
            }
            return tmp;
        },
        // 媒体设备信息
        externalDevice() {
            return this.$store.state.deviceObj;
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
    },
    methods: {
        mouseUp() {
            let selection = window.getSelection().toString();
            this.textSelected = !!selection;
        },
        preventContextMenuTextSelection() {
            if (!this.textSelected) {
                if (window.getSelection) {
                    if (window.getSelection().empty) {
                        // Chrome
                        window.getSelection().empty();
                    } else if (window.getSelection().removeAllRanges) {
                        // Firefox
                        window.getSelection().removeAllRanges();
                    }
                } else if (document.selection) {
                    // IE?
                    document.selection.empty();
                }
            }
        },
        // 点击会议连接
        async handleUrl(event) {
            let nodeName = event.target.nodeName;
            if (nodeName === "A") {
                const href = event.target.href;
                const userId = wfc.getUserId();
                let myHref = this.mixinGetUrlHost(href);
                if (
                    myHref.indexOf("dwz.cn") > -1 ||
                    myHref.indexOf("s-tfd.cn") > -1 ||
                    myHref.indexOf("s-test-tfd.cn") > -1 ||
                    href.startsWith(
                        `${this.mixinHttps}/launchMeet/index.html`
                    ) ||
                    href.startsWith(`${this.mixinHttps}/web3/index.html`)
                ) {
                    event.preventDefault();
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
                            let { longUrl } = data;
                            if (code === "000000" && longUrl) {
                                // 处理 外链入会
                                if (longUrl.indexOf("launchMeet") > -1) {
                                    const str = longUrl.split("?")[1];
                                    this.tojoinConference(str, userId);
                                    return;
                                }
                                // 处理 开通会员
                                if (longUrl.indexOf("vipInfo") > -1) {
                                    this.$alert({
                                        content: tipsContent[11],
                                        height: 150,
                                        cancelText: "",
                                    });
                                    return;
                                }
                                //处理 web3中转页面
                                if (longUrl.indexOf("web3") > -1) {
                                    let newUrl = new URL(longUrl);
                                    let web3Url = this.mixinGetQueryString(
                                        "url",
                                        newUrl
                                    );
                                    let url = web3Url + newUrl.hash;
                                    this.mixinGo2Web3View(url);
                                    return;
                                }
                                // 处理 外链加好友，进群等逻辑
                                if (longUrl.indexOf("notice-lang") > -1) {
                                    let fromPage = this.mixinGetQueryString(
                                        "from",
                                        new URL(longUrl)
                                    );
                                    // 解码判断逻辑
                                    let token = this.mixinGetQueryString(
                                        "token",
                                        new URL(longUrl)
                                    );
                                    this.toAddSingleOrGroup(fromPage, token);
                                    return;
                                }

                                return;
                                // 其他
                                this.openBrowser(longUrl);
                            } else {
                                this.openBrowser(href);
                            }
                        } catch (error) {
                            console.log(error);
                            //   this.openBrowser(href)
                        }
                        return;
                    }
                    if (
                        href.startsWith(
                            `${this.mixinHttps}/launchMeet/index.html`
                        )
                    ) {
                        const str = href.split("?")[1];
                        this.tojoinConference(str, userId);
                        return;
                    }
                    // web3链接
                    if (href.startsWith(`${this.mixinHttps}/web3/index.html`)) {
                        let newUrl = new URL(href);
                        let web3Url = this.mixinGetQueryString("url", newUrl);
                        let url = web3Url + newUrl.hash;
                        this.mixinGo2Web3View(url);
                        return;
                    }
                    this.openBrowser(href);
                } else {
                    event.stopPropagation();
                }
            }
        },
        // 默认打开浏览器
        openBrowser(url) {
            try {
                // shell.openExternal(url)
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
                            console.log("Closing...", event, event.params);
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
        async toAddSingleOrGroup(type, token) {
            try {
                let methodsAction = {
                    single: getUserInfoWeb,
                    group: getGroupInfoWeb,
                };
                let params = {
                    single: { mobile: token },
                    group: { groupId: token },
                };

                let res = await methodsAction[type](params[type]);
                let { data, code, message } = res.data;
                if (code === "000000") {
                    let { userId, groupId, owner } = data;
                    switch (type) {
                        case "single":
                            // 加好友
                            if (
                                userId !== wfc.getUserId() &&
                                !wfc.isMyFriend(userId) &&
                                wfc.getMyFriendList(true).length >=
                                    this.permissionList.friendsLimit
                            ) {
                                this.$alert({
                                    content: tipsContent[16],
                                    height: 150,
                                    cancelText: "",
                                });
                            } else {
                                let conversation = new Conversation(
                                    ConversationType.Single,
                                    userId,
                                    0
                                );
                                store.setCurrentConversation(conversation);
                            }
                            break;
                        case "group":
                            // 进群
                            let groupMembers = wfc.getGroupMemberIds(
                                groupId,
                                true
                            );
                            if (groupMembers.includes(wfc.getUserId())) {
                                // 在群里面
                                let conversation = new Conversation(
                                    ConversationType.Group,
                                    groupId,
                                    0
                                );
                                store.setCurrentConversation(conversation);
                            } else {
                                // 已在群内人数 + 自己
                                let totalMembers = groupMembers.length + 1;
                                if (
                                    totalMembers >
                                    this.permissionList.groupMemberLimit
                                ) {
                                    this.$alert({
                                        content:
                                            totalMembers > 800
                                                ? tipsContent[6]
                                                : owner === wfc.getUserId()
                                                ? tipsContent[7]
                                                : tipsContent[8],
                                        height: 150,
                                        cancelText: "",
                                    });
                                } else {
                                    // 不在群，
                                    wfc.addGroupMembers(
                                        groupId,
                                        [wfc.getUserId()],
                                        null,
                                        [0],
                                        null,
                                        () => {
                                            store.updateGroupPortraitFromAjax(
                                                groupId,
                                                wfc.getGroupMemberIds(
                                                    groupId,
                                                    true
                                                )
                                            );
                                            // 在群里面
                                            let conversation = new Conversation(
                                                ConversationType.Group,
                                                groupId,
                                                0
                                            );
                                            store.setCurrentConversation(
                                                conversation
                                            );
                                        }
                                    );
                                }
                            }

                            break;
                        default:
                            break;
                    }
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
    },
};
</script>

<style lang="css" scoped>
.text-message-container {
    min-width: 20px;
    margin: 0 10px;
    padding: 12px 16px;
    line-height: 22px;
    background-color: white;
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: center;
}

.text-message-container p {
    font-family: PingFang SC;
    user-select: text;
    white-space: pre-line;
}

.text-message-container.out {
    background-color: #1dbb88;
}

.text-message-container .text {
    font-family: PingFang SC;
    color: #050505;
    font-size: 14px;
    line-height: 22px;
    word-break: break-word;
    overflow: hidden;
    display: inline-block;
    text-overflow: ellipsis;
    vertical-align: middle;
    user-select: text;
}
.text-message-container.out .text {
    color: #fff;
}
/*style for v-html */
.text-message-container .text :deep(img) {
    max-width: 24px !important;
    display: inline-block;
    vertical-align: middle;
    line-height: 22px;
    margin: 0 2px;
    -webkit-user-drag: none;
}

.text-message-container .text :deep(a) {
    white-space: normal;
    color: #002754;
    font-family: PingFang SC;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
}
</style>
