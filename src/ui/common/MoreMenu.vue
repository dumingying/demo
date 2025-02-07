<template>
    <vue-context
        ref="moreMenu"
        v-slot="{ data: message }"
        v-on:close="onMenuClose"
        :close-on-scroll="true"
        :lazy="true"
    >
        <!-- 更多menu item-->
        <li v-if="isCopyable(message)">
            <a @click.prevent="copy(message)">{{ $t("common.copy") }}</a>
        </li>
        <!--下载 -->
        <li v-if="isDownloadAble(message)">
            <a @click.prevent="download(message)">{{ $t("common.save") }}</a>
        </li>
        <!-- 转文字 -->
        <li v-if="isShowChangeText(message)">
            <a @click.prevent="changeText(message)">{{
                $t("common.change_text")
            }}</a>
        </li>
        <!-- 保存链上文档  -->
        <li v-if="isDownloadCloudDisk(message)">
            <a @click.prevent="saveCloudDiskAction(message)">{{
                $t("common.save_cloud_disk")
            }}</a>
        </li>
        <!-- 双侧删除 -->
        <li v-if="isShowDoubleDelete(message)">
            <a @click.prevent="doubleDelMessage(message)">
                <em
                    v-if="
                        permissionList.isAppCharge &&
                        permissionList.chatDeleteBothVipLevel
                    "
                    :class="[
                        `vip-icon-${permissionList.chatDeleteBothVipLevel}`,
                        'vip-icon-em',
                    ]"
                ></em>
                {{ $t("common.double_delete") }}
            </a>
        </li>
        <!-- 删除 -->
        <li>
            <a @click.prevent="delMessage(message)">{{
                $t("common.delete")
            }}</a>
        </li>
        <!-- 转发 -->
        <li v-if="isForwardable(message)">
            <a @click.prevent="_forward(message)">{{ $t("common.forward") }}</a>
        </li>
        <!-- 引用 -->
        <!-- <li v-if="isQuotable(message)">
      <a @click.prevent="quoteMessage(message)">{{$t("common.quote")}}</a>
    </li> -->
        <!-- 打开文件 -->
        <li v-if="isLocalFile(message)">
            <a @click.prevent="openFile(message)">{{ $t("common.open") }}</a>
        </li>
        <!-- 打开文件夹目录 -->
        <li v-if="isLocalFile(message)">
            <a @click.prevent="openDir(message)">{{ $t("common.open_dir") }}</a>
        </li>
    </vue-context>
</template>

<script>
import MeetingReportMessageContent from "@/wfc/messages/customMessages/meetingReportMessageContent";
import CallStartMessageContent from "@/wfc/av/messages/callStartMessageContent";
import TeamMessageNotification from "@/wfc/messages/customMessages/teamMessageNotification";
import CloudDiskMessageContent from "@/wfc/messages/customMessages/cloudDiskMessageContent";
import DtcMessageContent from "@/wfc/messages/customMessages/dtcMessageContent";
import LocationMessageContent from "@/wfc/messages/locationMessageContent";
import UnknownMessageContent from "@/wfc/messages/unknownMessageContent";
import SoundMessageContent from "@/wfc/messages/soundMessageContent";
import ImageMessageContent from "@/wfc/messages/imageMessageContent";
import VideoMessageContent from "@/wfc/messages/videoMessageContent";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import FileMessageContent from "@/wfc/messages/fileMessageContent";

import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import MessageContentType from "@/wfc/messages/messageContentType";
import ConversationType from "@/wfc/model/conversationType";
import ConversationInfo from "@/wfc/model/conversationInfo";
import GroupMemberType from "@/wfc/model/groupMemberType";
import {
    imageThumbnail,
    videoDuration,
    videoThumbnail,
} from "@/ui/util/imageUtil";
import { fs, isElectron, shell } from "@/platform";
import { getItem, setItem } from "@/ui/util/storageHelper";
import { copyImg, copyText } from "@/ui/util/clipboard";
import { downloadFile } from "@/platformHelper";
import { tipsContent } from "@/ui/common/Tips";

import wfc from "@/wfc/client/wfc";
import store from "@/store";
import {
    getAddIMFileRecord,
    getSaveIMFile,
    delMessage,
    getPostUpload,
    getCloudUsedSpace,
    delMultiMessage,
} from "@/axios";
export default {
    props: {
        currentConversationInfo: {
            type: Object,
        },
    },
    mounted() {
        document.addEventListener("click", this.handleNotRemind);
    },
    data() {
        return {};
    },
    computed: {
        permissionList() {
            return this.$store.state.permissionList;
        },
    },
    methods: {
        // 是否是阅后即焚消息
        isChatMode(msg) {
            try {
                let extra = msg.messageContent.extra;
                //extra 中埋此字段 \"chatMode\":\"1\"
                if (extra && typeof extra === "string") {
                    let extraObj = JSON.parse(extra);
                    return Number(extraObj.chatMode) === 1;
                }
                return false;
            } catch (error) {
                return false;
            }
        },
        // message context menu
        isCopyable(message) {
            return (
                message &&
                !this.isChatMode(message) &&
                (message.messageContent instanceof TextMessageContent ||
                    message.messageContent instanceof TeamMessageNotification ||
                    message.messageContent instanceof ImageMessageContent)
            );
        },
        isDownloadAble(message) {
            return (
                message &&
                !this.isChatMode(message) &&
                (message.messageContent instanceof ImageMessageContent ||
                    message.messageContent instanceof FileMessageContent ||
                    message.messageContent instanceof VideoMessageContent)
            );
        },
        // 保存链上文档 （文件类型才可以保存链上文档 ）
        isDownloadCloudDisk(message) {
            let userId = wfc.getUserId();
            return (
                message &&
                !this.isChatMode(message) &&
                (message.messageContent instanceof ImageMessageContent ||
                    message.messageContent instanceof FileMessageContent ||
                    (message.messageContent instanceof
                        CloudDiskMessageContent &&
                        message.from !== userId) ||
                    message.messageContent instanceof VideoMessageContent)
            );
        },
        // 是否显示双侧删除 个人，群主和管理员
        isShowDoubleDelete(message) {
            if (message) {
                const { conversation } = this.currentConversationInfo;
                if (
                    message.direction === 0 &&
                    conversation.type == ConversationType.Single
                ) {
                    return true;
                }
                if (conversation.type == ConversationType.Group) {
                    let groupMember = wfc.getGroupMember(
                        conversation.target,
                        wfc.getUserId()
                    );
                    return (
                        [
                            GroupMemberType.Manager,
                            GroupMemberType.Owner,
                        ].indexOf(groupMember.type) >= 0
                    );
                }
                return false;
            }
            return false;
        },
        // 是否显示转文字
        isShowChangeText(message) {
            return (
                message &&
                !this.isChatMode(message) &&
                message.messageContent instanceof SoundMessageContent &&
                !message.messageContent.speechText
            );
        },
        // 匿名群，未知消息，语音，视频，400 不能转发
        isForwardable(message) {
            if (message) {
                let isAnonymousUser = false;
                if (message.content.extra) {
                    let extra = JSON.parse(message.content.extra);
                    isAnonymousUser = extra.hasOwnProperty("anonymous_name");
                }
                const { conversation } = this.currentConversationInfo;
                // 是否是匿名群
                let isAnonymous =
                    conversation.type == ConversationType.Group &&
                    isAnonymousUser;

                if (
                    message.messageContent instanceof SoundMessageContent ||
                    message.messageContent instanceof DtcMessageContent ||
                    message.messageContent instanceof VideoMessageContent ||
                    message.messageContent instanceof UnknownMessageContent ||
                    message.messageContent instanceof LocationMessageContent ||
                    message.messageContent instanceof
                        MeetingReportMessageContent ||
                    message.messageContent instanceof CallStartMessageContent ||
                    isAnonymous ||
                    this.isChatMode(message) ||
                    message.messageContent.type === 1010
                ) {
                    return false;
                }
                return true;
            }
            return false;
        },
        isLocalFile(message) {
            if (message && isElectron()) {
                let media = message.messageContent;
                let localPath = media.localPath;
                if (localPath && !this.isChatMode(message)) {
                    return fs.existsSync(localPath);
                }
            }
            return false;
        },
        isQuotable(message) {
            if (message) {
                const { conversation } = this.currentConversationInfo;
                // 匿名群和阅后即焚消息 没有引用功能
                if (
                    (conversation.type === ConversationType.Group &&
                        ConversationInfo.anonymous_memberList &&
                        ConversationInfo.anonymous_memberList.length) ||
                    this.isChatMode(message)
                ) {
                    return false;
                }
                return (
                    [
                        MessageContentType.VOIP_CONTENT_TYPE_START,
                        MessageContentType.Voice,
                        MessageContentType.Video,
                        MessageContentType.Composite_Message,
                        MessageContentType.Articles,
                        MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE,
                    ].indexOf(message.messageContent.type) <= -1
                );
            }
            return false;
        },
        copy(message) {
            let content = message.messageContent;
            if (content instanceof TextMessageContent) {
                let selectedText = window.getSelection().toString();
                if (selectedText) {
                    copyText(selectedText);
                } else {
                    copyText(content.content);
                }
            } else if (content instanceof TeamMessageNotification) {
                let { title, message } = content.content;
                copyText(`${title}${message}`);
            } else {
                // 处理路径不全问题
                content.remotePath &&
                    (content.remotePath = this.mixinCloudDiskRemotePath(
                        content.remotePath
                    ));
                copyImg(content.remotePath);
            }
        },
        async download(message) {
            message.messageContent.remotePath &&
                (message.messageContent.remotePath =
                    this.mixinCloudDiskRemotePath(
                        message.messageContent.remotePath
                    ));

            if (isElectron()) {
                if (message.messageContent instanceof CloudDiskMessageContent) {
                    downloadFile(message);
                } else {
                    let result = await this.mixinCheckImFile(
                        message.messageContent.remotePath
                    );
                    if (result) {
                        downloadFile(message);
                    }
                }
            } else {
                if (!store.isDownloadingMessage(message.messageUid)) {
                    if (
                        message.messageContent instanceof
                        CloudDiskMessageContent
                    ) {
                        downloadFile(message);
                        store.addDownloadingMessage(message.messageUid);
                    } else {
                        let result = await this.mixinCheckImFile(
                            message.messageContent.remotePath
                        );
                        if (result) {
                            downloadFile(message);
                            store.addDownloadingMessage(message.messageUid);
                        }
                    }
                } else {
                    // TODO toast 下载中
                    console.log("file isDownloading");
                }
            }
        },
        async getSpaceData(userId) {
            try {
                let res = await getCloudUsedSpace({ userId });
                const { code, message, data } = res.data;
                if (code == "000000") {
                    let { usedSpace, totalSpace } = data;
                    let notUsedSpace = Number(totalSpace - usedSpace);
                    return notUsedSpace < 0 ? 0 : notUsedSpace;
                } else {
                    this.$Message.error(message);
                    return null;
                }
            } catch (error) {}
        },
        async saveCloudDiskAction(message) {
            const userId = wfc.getUserId();
            let notuse = await this.getSpaceData(userId);
            let { fileSize, size, imFileSize } = message.messageContent;
            let thisSize = fileSize || size || imFileSize;
            if (
                this.permissionList.isAppCharge &&
                notuse - Number(thisSize) < 0
            ) {
                this.$alert({
                    content:
                        this.permissionList.vipLevel === 4
                            ? tipsContent[1]
                            : tipsContent[2],
                    height: 150,
                    cancelText: "",
                });
                return;
            }

            // 区分本地保存还是链上文档 保存
            if (message) {
                // 此消息是否是发送方
                if (message.from === userId) {
                    if (
                        message.messageContent instanceof
                        CloudDiskMessageContent
                    ) {
                        console.log("我是链上文档资源保存");
                    } else {
                        let result = await this.mixinCheckImFile(
                            message.messageContent.remotePath
                        );
                        if (result) {
                            //   发送方本地保存链上文档
                            this.saveIMFile(message, userId);
                        }
                    }
                } else {
                    let result = await this.mixinCheckImFile(
                        message.messageContent.remotePath
                    );
                    if (result) {
                        // 接收方保存链上文档
                        this.addIMFileRecord(message, userId);
                    }
                }
            }
        },
        /**
         * 1、云盘图片和视频，普通图片和视频，截图保存云盘需要本地生成缩略图（图片和视频需要生成缩略图，文件不需要生成）
         *2、 聊天里面的 缩略图格式有 url(云盘), base64
         **/
        async createImageThumbnail(message, nodeId) {
            let {
                remotePath,
                fileName,
                imFileSize,
                imFileName,
                fileSize,
                thumbnail,
                size,
                name,
                duration,
            } = message.messageContent;
            let shotcut = thumbnail;
            let durationValue = duration;

            let file = {
                path: this.mixinCloudDiskRemotePath(remotePath),
                name: fileName || imFileName || name,
                size: fileSize || imFileSize || size,
            };
            if (thumbnail && thumbnail.indexOf("http") === -1) {
                if (thumbnail.indexOf(";base64,") > -1) {
                    shotcut = this.mixinBase64toFile(thumbnail, file.name);
                } else {
                    shotcut = this.mixinBase64toFile(
                        `${
                            message.messageContent instanceof
                            ImageMessageContent
                                ? "data:image/jpeg;base64,"
                                : "data:video/jpeg;base64,"
                        }${thumbnail}`,
                        file.name
                    );
                }
                // console.log('图片，已有缩略图', shotcut)
            } else if (
                message.messageContent instanceof ImageMessageContent &&
                !thumbnail
            ) {
                // 图片
                let base64_image = await imageThumbnail(file);
                shotcut = this.mixinBase64toFile(base64_image, file.name);
                // console.log('图片，后生成缩略图', shotcut)
            } else {
                // 视频
                let base64_video = await videoThumbnail(file);
                shotcut = this.mixinBase64toFile(base64_video, file.name);

                // console.log('视频，后生成缩略图', shotcut)
                if (!durationValue) {
                    let durationNum = await videoDuration(file);
                    durationValue = Math.ceil(durationNum * 1000);
                    //   console.log('视频，后生成时长', durationValue)
                }
            }
            try {
                let mayFormData = new FormData();
                mayFormData.append("shotcut", shotcut);
                mayFormData.append("nodeId", nodeId);
                mayFormData.append("filename", file.name);
                mayFormData.append("videoTime", durationValue);

                let res = await getPostUpload(mayFormData);
                let { code, message } = res.data;
                if (code === "000000") {
                    this.$Message.success(this.$t("common.save_success"));
                } else {
                    console.log(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 接收方点击保存链上文档
        async addIMFileRecord(message, userId) {
            //   console.log("接收方点击保存链上文档", message);
            // 1本地分享, 0 密云分享
            let originType =
                message.messageContent instanceof CloudDiskMessageContent
                    ? "0"
                    : "1";
            let fileType =
                message.messageContent instanceof ImageMessageContent ||
                message.messageContent instanceof VideoMessageContent
                    ? "1"
                    : "2";
            const {
                imFileId,
                remotePath,
                imFileSize,
                imFileName,
                path,
                fileSize,
                fileName,
                fileId,
                name,
                size,
            } = message.messageContent;
            let newPath =
                message.messageContent instanceof CloudDiskMessageContent
                    ? path
                    : remotePath;

            // 云盘有不完整路径拼接完整后保存接口

            try {
                let res = await getAddIMFileRecord({
                    userId,
                    imFileId,
                    messageId: message.messageId,
                    fileSize: fileSize || size || imFileSize,
                    fileName: fileName || name || imFileName,
                    fileType,
                    originType,
                    originFileId: fileId,
                    path: this.mixinCloudDiskRemotePath(newPath),
                });
                let { code, data } = res.data;
                if (code === "000000") {
                    // 图片和视频
                    if (fileType === "1") {
                        this.createImageThumbnail(message, data.nodeId);
                    } else {
                        this.$Message.success(this.$t("common.save_success"));
                    }
                } else {
                    if (code === "1400014") {
                        this.$alert({
                            content:
                                this.permissionList.vipLevel === 4
                                    ? tipsContent[1]
                                    : tipsContent[2],
                            height: 150,
                            cancelText: "",
                        });
                    } else {
                        this.$Message.error(res.data.message);
                    }
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 发送方本地保存链上文档
        async saveIMFile(message, userId) {
            //   console.log("发送方本地保存链上文档", message);
            let fileType =
                message.messageContent instanceof ImageMessageContent ||
                message.messageContent instanceof VideoMessageContent
                    ? "1"
                    : "2";
            // 图片视频是1，普通文件2
            const {
                imFileId,
                fileSize,
                fileName,
                remotePath,
                imFileName,
                imFileSize,
                size,
                name,
            } = message.messageContent;
            try {
                let res = await getSaveIMFile({
                    userId: userId,
                    fileType,
                    imFileId,
                    fileSize: size || fileSize || imFileSize,
                    fileName: name || fileName || imFileName,
                    path: remotePath,
                    messageId: message.messageId,
                });
                let { code, data } = res.data;
                if (code === "000000") {
                    if (fileType === "1") {
                        this.createImageThumbnail(message, data.nodeId);
                    } else {
                        this.$Message.success(this.$t("common.save_success"));
                    }
                } else {
                    if (code === "1400014") {
                        this.$alert({
                            content:
                                this.permissionList.vipLevel === 4
                                    ? tipsContent[1]
                                    : tipsContent[2],
                            height: 150,
                            cancelText: "",
                        });
                    } else {
                        this.$Message.error(res.data.message);
                    }
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        openFile(message) {
            let file = message.messageContent;
            shell.openPath(file.localPath);
        },

        openDir(message) {
            let file = message.messageContent;
            shell.showItemInFolder(file.localPath);
        },
        delMessage(message) {
            wfc.deleteMessage(message.messageId); // 本地删除
            this.$emit("removeMessage", message);
            // wfc.deleteRemoteMessageByUid(message.messageUid,null,null) // 远程删除
        },
        // message 存在是单个删除， 否则多个删除
        doubleDelMessage(message) {
            if (
                !this.permissionList.chatDeleteBoth &&
                this.permissionList.isAppCharge
            ) {
                this.$alert({
                    content: tipsContent[5],
                    height: 150,
                    cancelText: "",
                });
                return;
            }
            if (message) {
                if (!getItem(`double_delete_${wfc.getUserId()}`)) {
                    this.$alert({
                        content: `<p style="text-align:left;">${this.$t(
                            "conversation.deleted_everyone"
                        )}</p><div class="delete-other-wrap"><span id="delete_other_side" class="not-remind-btn">${this.$t(
                            "conversation.no_reminders"
                        )}</span></div>`,
                        height: 160,
                        cancelCallback: () => {},
                        confirmCallback: () => {
                            let notTip =
                                document.querySelector(".not-remind-btn");
                            if (notTip.classList.contains("active")) {
                                setItem(`double_delete_${wfc.getUserId()}`, 1);
                            }
                            this.confirmDelete(message);
                        },
                    });
                } else {
                    this.confirmDelete(message);
                }
            }
        },
        // message 存在是单条删除， 否则多条删除
        async confirmDelete(message) {
            try {
                let conversation = this.currentConversationInfo.conversation;
                let res = null;
                if (conversation.type == ConversationType.Group) {
                    res = await delMultiMessage({
                        userId: wfc.getUserId(),
                        messageIds: [message.messageUid.toString()],
                    });
                } else {
                    // 请求接口
                    res = await delMessage({
                        userId: wfc.getUserId(),
                        messageIds: [message.messageUid.toString()],
                    });
                }
                if (!res) return;
                let { code } = res.data;
                if (code === "000000") {
                    // 删除消息
                    wfc.deleteRemoteMessageByUid(
                        message.messageUid,
                        null,
                        null
                    );
                    let unread = wfc.getConversationUnreadCount(conversation);
                    console.log(unread);
                    this.$emit("removeMessage", message);
                } else {
                    this.$Message.error(res.data.message);
                }
            } catch (error) {}
        },
        // 转成文字
        changeText(message) {
            console.log(message);
            this.$eventBus.$emit("audiosChangeText", message);
        },
        /**
         * @params: message 当前消息
         * @params: [Boolean] filterAnonymous 是否过滤掉匿名群
         * */
        forward(message, filterAnonymous) {
            return this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
                forwardFilterAnonymous: filterAnonymous,
            });
        },

        _forward(message) {
            this.forward(message, true)
                .then((params) => {
                    if (params !== "cancel") {
                        this.$Message.success(this.$t("friend_request.sent"));
                    }
                })
                .catch(() => {
                    // do nothing
                });
        },
        // quoteMessage(message) {
        //   store.quoteMessage(message)
        // },
        onMenuClose() {
            this.$emit("contextMenuClosed");
        },
        handleNotRemind(e) {
            if (
                e.target.nodeName === "SPAN" &&
                e.target.id === "delete_other_side"
            ) {
                let notTip = document.querySelector(".not-remind-btn");
                if (notTip.classList.contains("active")) {
                    notTip.classList.remove("active");
                } else {
                    notTip.classList.add("active");
                }
            }
        },
    },
    beforeUnmount() {
        document.removeEventListener("click", this.handleNotRemind);
    },
};
</script>
