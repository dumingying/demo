<template>
    <section>
        <!-- 秘密令牌 -->
        <div v-if="showSecretTokenView" class="secret-container">
            <SecretTokenPage></SecretTokenPage>
        </div>
        <div
            v-else-if="sharedConversationState.currentConversationInfo == null"
            class="conversation-empty-container"
        >
            <img
                src="../../../assets/images/default-bg.png"
                width="120"
                draggable="false"
            />
        </div>
        <div v-else class="conversation-container">
            <header>
                <div class="title-container">
                    <h1>
                        <div class="conversation-title">
                            <p
                                class="single-line"
                                @click.stop="toggleConversationInfo"
                            >
                                {{ conversationTitle }}
                            </p>
                            <span v-if="groupMemberUserInfos_len">
                                ({{ groupMemberUserInfos_len }})
                            </span>
                            <span v-if="inputting" class="inputting-container">
                                {{ $t("conversation.other_typing") }}
                            </span>
                        </div>
                        <span v-if="groupFromMeeting" class="from">
                            ({{ $t("conversation.from_meeting") }})
                        </span>
                    </h1>
                    <span
                        class="more-btn"
                        v-if="isShowMoreBtn"
                        @click.prevent="toggleConversationInfo"
                    >
                        <i
                            class="icon-ion-ios-settings-strong"
                            ref="setting"
                            :style="{
                                marginTop:
                                    sharedMiscState.isElectronWindowsOrLinux
                                        ? '30px'
                                        : '0',
                            }"
                    /></span>
                </div>
            </header>
            <div
                ref="conversationContentContainer"
                class="conversation-content-container"
                @dragover="dragEvent($event, 'dragover')"
                @dragleave="dragEvent($event, 'dragleave')"
                @dragenter="dragEvent($event, 'dragenter')"
                @drop="dragEvent($event, 'drop')"
                :dummy_just_for_reactive="currentVoiceMessage"
            >
                <!-- <div v-if="ongoingCalls && ongoingCalls.length > 0" class="ongoing-call-container">
               <div v-for="(value, index) in ongoingCalls" :key="index" class="ongoing-call-item">
                    <p>{{ value.messageContent.digest(value) }}</p>
                   <button @click="joinMultiCall(value)">加入</button>
                </div>
            </div> -->
                <div
                    v-show="dragAndDropEnterCount > 0"
                    class="drag-drop-container"
                >
                    <div class="drag-drop">
                        <p>
                            {{
                                $t("conversation.drag_to_send_to", [
                                    conversationTitle,
                                ])
                            }}
                        </p>
                    </div>
                </div>
                <div
                    ref="conversationMessageList"
                    class="conversation-message-list"
                    @scroll="onScroll"
                    infinite-wrapper
                >
                    <infinite-loading
                        :identifier="loadingIdentifier"
                        @infinite="infiniteHandler"
                        force-use-infinite-wrapper
                        direction="top"
                    >
                        <template #no-more>
                            {{ $t("conversation.no_more_message") }}
                        </template>
                        <template #no-results>
                            {{ $t("conversation.all_message_load") }}
                        </template>
                    </infinite-loading>
                    <ul v-if="fixTippy" ref="messageListWrap">
                        <!--todo item.messageId or messageUid as key-->
                        <li
                            v-for="message in this.sharedConversationState
                                .currentConversationMessageList"
                            :key="message.messageId"
                        >
                            <!--todo 不同的消息类型 notification in out-->
                            <NotificationMessageContentView
                                v-if="isNotificationMessage(message)"
                                :message="message"
                            />
                            <RecallNotificationMessageContentView
                                v-else-if="isRecallNotificationMessage(message)"
                                :message="message"
                            />
                            <ContextableNotificationMessageContentContainerView
                                v-else-if="
                                    isContextableNotificationMessage(message)
                                "
                                @click.native.capture="
                                    sharedConversationState.enableMessageMultiSelection
                                        ? clickMessageItem($event, message)
                                        : null
                                "
                                :message="message"
                                @openMessageContextMenu="openMessageContextMenu"
                                @openMessageSenderContextMenu="
                                    openMessageSenderContextMenu
                                "
                            />
                            <NormalOutMessageContentView
                                v-else-if="message.direction === 0"
                                @openMessageContextMenu="openMessageContextMenu"
                                @click.native.capture="
                                    sharedConversationState.enableMessageMultiSelection
                                        ? clickMessageItem($event, message)
                                        : null
                                "
                                :message="message"
                            />
                            <NormalInMessageContentView
                                v-else
                                @click.native.capture="
                                    sharedConversationState.enableMessageMultiSelection
                                        ? clickMessageItem($event, message)
                                        : null
                                "
                                :message="message"
                                @openMessageContextMenu="openMessageContextMenu"
                                @openMessageSenderContextMenu="
                                    openMessageSenderContextMenu
                                "
                            />
                        </li>
                    </ul>
                </div>
                <!-- <div v-if="unreadMessageCount > 0"
             class="unread-count-tip-container"
             @click="showUnreadMessage">
          {{ '' +  + '`${unreadMessageCount}条新消息`' }}
        </div> -->
                <template
                    v-if="
                        isFriend &&
                        (permissionList.vipLevel > 1 || isChatSwitch)
                    "
                >
                    <div
                        v-show="
                            !sharedConversationState.enableMessageMultiSelection &&
                            !sharedContactState.showChannelMenu
                        "
                        v-on:mousedown="dragStart"
                        class="divider-handler"
                    ></div>
                    <MessageInputView
                        :conversationInfo="
                            sharedConversationState.currentConversationInfo
                        "
                        :notFriend="notFriend"
                        v-show="
                            !sharedConversationState.enableMessageMultiSelection
                        "
                        ref="messageInputView"
                        style="flex: 1"
                    />
                </template>
                <!-- 当前不是好友 -->
                <div class="add-friend-wrap" v-if="!isFriend">
                    <p>{{ $t("conversation.add_friends_start_chat") }}</p>
                    <div class="btn-wrap">
                        <button
                            class="delete-btn"
                            @click="handlerFriendRequest(0)"
                        >
                            {{ $t("common.delete") }}
                        </button>
                        <button
                            class="add-btn"
                            @click="handlerFriendRequest(1)"
                        >
                            {{ $t("conversation.add_to_friends") }}
                        </button>
                    </div>
                </div>
                <MultiSelectActionView
                    v-show="sharedConversationState.enableMessageMultiSelection"
                />
                <SingleConversationInfoView
                    v-if="
                        showConversationInfo &&
                        sharedConversationState.currentConversationInfo
                            .conversation.type === 0
                    "
                    v-v-on-click-outside="hideConversationInfo"
                    :conversation-info="
                        sharedConversationState.currentConversationInfo
                    "
                    :class="[
                        'conversation-info-container',
                        { active: showConversationInfo },
                    ]"
                    :hideConversationInfo="hideConversationInfo"
                />
                <GroupConversationInfoView
                    v-if="
                        showConversationInfo &&
                        sharedConversationState.currentConversationInfo
                            .conversation.type === 1
                    "
                    v-v-on-click-outside="hideConversationInfo"
                    :conversation-info="
                        sharedConversationState.currentConversationInfo
                    "
                    :class="[
                        'conversation-info-container',
                        { active: showConversationInfo },
                    ]"
                    :hideConversationInfo="hideConversationInfo"
                />
                <!-- <ChannelConversationInfoView
          v-if="showConversationInfo && currentConversationInfo.conversation.type === 3"
          v-v-on-click-outside="hideConversationInfo"
          :conversation-info="currentConversationInfo"
          v-bind:class="{ active: showConversationInfo }"
          class="conversation-info-container"
        /> -->
                <vue-context
                    ref="menu"
                    v-slot="{ data: message }"
                    :close-on-scroll="true"
                    v-on:close="onMenuClose"
                >
                    <!-- 更多menu item-->
                    <li v-if="isCopyable(message)">
                        <a @click.prevent="copy(message)">{{
                            $t("common.copy")
                        }}</a>
                    </li>
                    <!--下载 -->
                    <li v-if="isDownloadAble(message)">
                        <a @click.prevent="download(message)">{{
                            $t("common.save")
                        }}</a>
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
                            >
                            </em>
                            {{ $t("common.double_delete") }}
                        </a>
                    </li>
                    <!-- 删除 -->
                    <li>
                        <a @click.prevent="delMessage(message)">
                            {{ $t("common.delete") }}
                        </a>
                    </li>
                    <!-- 转发 -->
                    <li v-if="isForwardable(message)">
                        <a @click.prevent="_forward(message)">
                            {{ $t("common.forward") }}
                        </a>
                    </li>
                    <!-- 收藏 -->
                    <!-- <li v-if="isFavable(message)">
              <a @click.prevent="favMessage(message)">{{ $t('common.fav') }}</a>
            </li> -->
                    <!-- 引用 -->
                    <li v-if="isQuotable(message)">
                        <a @click.prevent="quoteMessage(message)">
                            {{ $t("common.quote") }}
                        </a>
                    </li>
                    <!-- 多选 -->
                    <li>
                        <a @click.prevent="multiSelect(message)">
                            {{ $t("common.multi_select") }}
                        </a>
                    </li>
                    <!-- 撤回 -->
                    <li v-if="isRecallable(message)">
                        <a @click.prevent="recallMessage(message)">
                            {{ $t("common.recall") }}
                        </a>
                    </li>
                    <!-- 取消发送 -->
                    <!-- <li v-if="isCancelable(message)">
              <a @click.prevent="cancelMessage(message)">{{ $t('common.cancel_send') }}</a>
            </li> -->
                    <li v-if="isLocalFile(message)">
                        <a @click.prevent="openFile(message)">
                            {{ $t("common.open") }}
                        </a>
                    </li>
                    <li v-if="isLocalFile(message)">
                        <a @click.prevent="openDir(message)">
                            {{ $t("common.open_dir") }}
                        </a>
                    </li>
                </vue-context>
                <!-- 仅支持群里 -->
                <vue-context
                    ref="messageSenderContextMenu"
                    v-slot="{ data: message }"
                    :close-on-scroll="true"
                    v-on:close="onMessageSenderContextMenuClose"
                >
                    <li>
                        <!-- 发消息 -->
                        <a @click.prevent="mentionMessageChat(message)">
                            {{ $t("message.send_message") }}
                        </a>
                    </li>
                    <li>
                        <!-- @他 -->
                        <a @click.prevent="mentionMessageSender(message)">
                            {{ mentionMessageSenderTitle(message) }}
                        </a>
                    </li>
                </vue-context>
            </div>
        </div>
    </section>
</template>

<script>
import PreviewQuotedMessageView from "@/ui/main/conversation/message/PreviewQuotedMessageView";
import SingleConversationInfoView from "@/ui/main/conversation/SingleConversationInfoView";
import GroupConversationInfoView from "@/ui/main/conversation/GroupConversationInfoView";
import MessageInputView from "@/ui/main/conversation/MessageInputView";
import NormalOutMessageContentView from "@/ui/main/conversation/message/NormalOutMessageContentContainerView";
import NormalInMessageContentView from "@/ui/main/conversation/message/NormalInMessageContentContainerView";
import NotificationMessageContentView from "@/ui/main/conversation/message/NotificationMessageContentView";
import RecallNotificationMessageContentView from "@/ui/main/conversation/message/RecallNotificationMessageContentView";
import MultiSelectActionView from "@/ui/main/conversation/MessageMultiSelectActionView";
// import ChannelConversationInfoView from "./ChannelConversationInfoView";
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import SecretTokenPage from "@/ui/main/secretFriend/SecretTokenPage"; //秘密令牌
import ForgotSecretPassword from "@/ui/main/secretFriend/ForgotPassword"; //秘密令牌

import FileMessageContent from "@/wfc/messages/fileMessageContent";
import CloudDiskMessageContent from "@/wfc/messages/customMessages/cloudDiskMessageContent";
import ImageMessageContent from "@/wfc/messages/imageMessageContent";
import Message from "@/wfc/messages/message";
import VideoMessageContent from "@/wfc/messages/videoMessageContent";
import UnknownMessageContent from "@/wfc/messages/unknownMessageContent";
import CallStartMessageContent from "@/wfc/av/messages/callStartMessageContent";
import LocationMessageContent from "@/wfc/messages/locationMessageContent";
import MeetingReportMessageContent from "@/wfc/messages/customMessages/meetingReportMessageContent";
import DtcMessageContent from "@/wfc/messages/customMessages/dtcMessageContent";
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import TeamMessageNotification from "@/wfc/messages/customMessages/teamMessageNotification";
import RichNotificationMessageContent from "@/wfc/messages/notification/richNotificationMessageContent";
import SoundMessageContent from "@/wfc/messages/soundMessageContent";
import MessageContentType from "@/wfc/messages/messageContentType";

// import FavItem from '@/wfc/model/favItem'
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";
import ConversationInfo from "@/wfc/model/conversationInfo";
import EventType from "@/wfc/client/wfcEvent";
import MultiCallOngoingMessageContent from "@/wfc/av/messages/multiCallOngoingMessageContent";
import JoinCallRequestMessageContent from "@/wfc/av/messages/joinCallRequestMessageContent";
import ArticlesMessageContent from "@/wfc/messages/articlesMessageContent";
import ContextableNotificationMessageContentContainerView from "./message/ContextableNotificationMessageContentContainerView";
import MessageStatus from "@/wfc/messages/messageStatus";
import MediaMessageContent from "@/wfc/messages/mediaMessageContent";
import GroupMemberType from "@/wfc/model/groupMemberType";

import ScaleLoader from "vue-spinner/src/ScaleLoader";
import BenzAMRRecorder from "benz-amr-recorder";
import InfiniteLoading from "@imndx/vue-infinite-loading";

import { copyImg, copyText } from "@/ui/util/clipboard";
import { fs, isElectron, shell, ipcRenderer } from "@/platform";
import { downloadFile } from "@/platformHelper";
import { vOnClickOutside } from "@vueuse/components";
import { numberValue } from "@/wfc/util/longUtil";
import { getItem, setItem } from "@/ui/util/storageHelper";
import { tipsContent } from "@/ui/common/Tips";

import wfc from "@/wfc/client/wfc";
import Config from "@/config";
import store from "@/store";
import useSecretTokenStore from "@/store/secretStore";
import { storeToRefs } from "pinia";
import {
    imageThumbnail,
    videoDuration,
    videoThumbnail,
} from "@/ui/util/imageUtil";

import {
    getAddIMFileRecord,
    getSaveIMFile,
    delMessage,
    getPostUpload,
    getCloudUsedSpace,
    checkIsFriends,
    groupLinkImHistoryMeeting,
    delMultiMessage,
} from "@/axios";

let amr;

export default {
    components: {
        // ChannelConversationInfoView,
        MultiSelectActionView,
        NotificationMessageContentView,
        RecallNotificationMessageContentView,
        NormalInMessageContentView,
        NormalOutMessageContentView,
        MessageInputView,
        GroupConversationInfoView,
        SingleConversationInfoView,
        InfiniteLoading,
        ScaleLoader,
        ContextableNotificationMessageContentContainerView,
        PreviewQuotedMessageView,
        SecretTokenPage,
    },
    data() {
        return {
            isFirstInit: false,
            conversationInfo: null,
            showConversationInfo: false,
            sharedConversationState: store.state.conversation,
            sharedContactState: store.state.contact,
            sharedPickState: store.state.pick,
            sharedMiscState: store.state.misc,
            isHandlerDragging: false,
            groupMemberUserInfos_len: 0,
            savedMessageListViewHeight: -1,
            saveMessageListViewFlexGrow: -1,
            dragAndDropEnterCount: 0,
            // FIXME 选中一个会话，然后切换到其他page，比如联系人，这时该会话收到新消息或发送消息，会导致新收到/发送的消息的界面错乱，尚不知道原因，但这么做能解决。
            fixTippy: true,
            ongoingCalls: [],
            ongoingCallTimer: 0,
            messageInputViewResized: false,
            unreadMessageCount: 0,
            isFriend: true, // 是否是好友 控制 是否显示加好友的按钮
            notFriend: false, // 是否不是好友 控制 输入框内的音视频、视频
            groupFromMeeting: "",
            list: [],
            quotedMessage: null,
            message: null,
            secretToken: storeToRefs(useSecretTokenStore()),
        };
    },
    activated() {
        this.fixTippy = true;
    },

    deactivated() {
        this.fixTippy = false;
    },
    methods: {
        dragEvent(e, v) {
            if (v === "dragenter") {
                this.dragAndDropEnterCount++;
            } else if (v === "dragleave") {
                this.dragAndDropEnterCount--;
            } else if (v === "drop") {
                const { conversation } =
                    this.sharedConversationState.currentConversationInfo;
                this.dragAndDropEnterCount--;
                let isFile;
                if (
                    e.dataTransfer.items &&
                    e.dataTransfer.items.length > 0 &&
                    e.dataTransfer.items[0].kind === "file"
                ) {
                    if (
                        typeof e.dataTransfer.items[0].webkitGetAsEntry ==
                        "function"
                    ) {
                        isFile =
                            e.dataTransfer.items[0].webkitGetAsEntry().isFile;
                    } else if (
                        typeof e.dataTransfer.items[0].getAsEntry == "function"
                    ) {
                        isFile = e.dataTransfer.items[0].getAsEntry().isFile;
                    }

                    if (!isFile) {
                        this.$notify({
                            // title: '不支持',
                            text: this.$t(
                                "conversation.not_support_send_folder"
                            ),
                            type: "warn",
                        });
                        return true;
                    }
                }
                let length = e.dataTransfer.files.length;
                if (length > 0 && length < 5) {
                    for (let i = 0; i < length; i++) {
                        this.$eventBus.$emit(
                            "uploadFile",
                            e.dataTransfer.files[i]
                        );
                        let obj = null;
                        if (conversation.type == ConversationType.Group) {
                            if (ConversationInfo.anonymous_memberList.length) {
                                ConversationInfo.anonymous_memberList.map(
                                    (item) => {
                                        if (item.memberId == wfc.getUserId()) {
                                            obj = {
                                                anonymous_name:
                                                    item.anonymousName,
                                                portrait: item.portrait,
                                                anonymous_en_name:
                                                    item.anonymousEnName,
                                            };
                                        }
                                    }
                                );
                            }
                        }
                        store.sendFile(
                            conversation,
                            e.dataTransfer.files[i],
                            obj
                        );
                        // 发送消息时，会话消息列表需要滚动到最后
                        store.setShouldAutoScrollToBottom(true);
                    }
                } else {
                    if (length > 5) {
                        this.$notify({
                            text: this.$t(
                                "conversation.drag_to_send_limit_tip"
                            ),
                            type: "warn",
                        });
                    }
                    //   console.log("拖拽", e, v);
                }
            } else if (v === "dragover") {
                // If not st as 'copy', electron will open the drop file
                e.dataTransfer.dropEffect = "copy";
            }
        },
        toggleConversationInfo() {
            const { conversation } =
                this.sharedConversationState.currentConversationInfo;
            if (
                [...Config.TEAM_IDS, ...Config.HELPER_IDS].includes(
                    conversation._target.uid
                ) ||
                conversation.type === ConversationType.Channel
            ) {
                return;
            }
            this.showConversationInfo = !this.showConversationInfo;
        },

        toggleMessageMultiSelectionActionView(message) {
            //   console.log(this.sharedConversationState.enableMessageMultiSelection)
            if (!this.sharedConversationState.enableMessageMultiSelection) {
                this.saveMessageListViewFlexGrow =
                    this.$refs["conversationMessageList"].style.flexGrow;
                this.savedMessageListViewHeight =
                    this.$refs["conversationMessageList"].style.height;
                this.$refs["conversationMessageList"].style.flexGrow = 1;
            } else {
                if (
                    this.saveMessageListViewFlexGrow !== -1 &&
                    this.savedMessageListViewHeight !== -1
                ) {
                    this.$refs["conversationMessageList"].style.height =
                        this.savedMessageListViewHeight;
                    this.$refs["conversationMessageList"].style.flexGrow =
                        this.saveMessageListViewFlexGrow;
                }
            }
            this.sharedPickState.messages.forEach((m) =>
                console.log(m.messageId)
            );
            store.toggleMessageMultiSelection(message);
        },

        clickMessageItem(event, message) {
            if (message.messageContent instanceof NotificationMessageContent) {
                return;
            }
            if (this.sharedConversationState.enableMessageMultiSelection) {
                store.selectOrDeselectMessage(message);
                event.stopPropagation();
            }
        },

        hideConversationInfo() {
            // TODO
            // 是否在创建群聊，或者是在查看会话参与者信息
            this.showConversationInfo && (this.showConversationInfo = false);
        },

        isNotificationMessage(message) {
            return (
                message &&
                message.messageContent instanceof NotificationMessageContent &&
                message.messageContent.type !==
                    MessageContentType.RecallMessage_Notification
            );
        },

        isRecallNotificationMessage(message) {
            return (
                message &&
                message.messageContent.type ===
                    MessageContentType.RecallMessage_Notification
            );
        },
        isContextableNotificationMessage(message) {
            return (
                message &&
                (message.messageContent instanceof
                    RichNotificationMessageContent ||
                    message.messageContent instanceof ArticlesMessageContent)
            );
        },

        isCancelable(message) {
            return (
                message &&
                message.messageContent instanceof MediaMessageContent &&
                message.status === MessageStatus.Sending
            );
        },

        reedit(message) {
            this.$refs.messageInputView.insertText(
                message.messageContent.originalSearchableContent
            );
        },

        onScroll(e) {
            // hide tippy userCard
            for (const popper of document.querySelectorAll(".tippy-popper")) {
                const instance = popper._tippy;
                if (instance.state.isVisible) {
                    instance.hide();
                }
            }
            // hide message context menu
            this.$refs.menu && this.$refs.menu.close();
            // 当用户往上滑动一段距离之后，收到新消息，不自动滚到到最后
            if (
                e.target.scrollHeight >
                e.target.clientHeight +
                    e.target.scrollTop +
                    e.target.clientHeight / 3
            ) {
                store.setShouldAutoScrollToBottom(false);
            } else {
                store.setShouldAutoScrollToBottom(true);
                this.clearConversationUnreadStatus();
            }
        },

        dragStart() {
            this.isHandlerDragging = true;
            console.log("drag start");
        },

        drag(e) {
            // Don't do anything if dragging flag is false
            if (!this.isHandlerDragging) {
                return false;
            }

            // Get offset
            let containerOffsetTop =
                this.$refs["conversationContentContainer"].offsetTop;

            // Get x-coordinate of pointer relative to container
            let pointerRelativeYpos = e.clientY - containerOffsetTop;

            // Arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
            let boxAminHeight = 150;

            // Resize box A
            // * 8px is the left/right spacing between .handler and its inner pseudo-element
            // * Set flex-grow to 0 to prevent it from growing
            this.$refs["conversationMessageList"].style.height =
                Math.max(boxAminHeight, pointerRelativeYpos) + "px";
            this.$refs["conversationMessageList"].style.flexGrow = 0;
            this.messageInputViewResized = true;
        },

        dragEnd() {
            this.isHandlerDragging = false;
        },

        onMenuClose() {
            this.$eventBus.$emit("contextMenuClosed");
        },
        onMessageSenderContextMenuClose() {
            console.log("onMessageSenderContextMenuClose");
            this.$eventBus.$emit("onMessageSenderContextMenuClose");
        },
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
                const { conversation } =
                    this.sharedConversationState.currentConversationInfo;
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
        /**
         * 匿名群，未知消息，语音，视频，400 不能转发
         *  */
        isForwardable(message) {
            if (message) {
                const { conversation } =
                    this.sharedConversationState.currentConversationInfo;
                // 是否是匿名群
                let isAnonymous =
                    conversation.type == ConversationType.Group &&
                    ConversationInfo.anonymous_memberList &&
                    ConversationInfo.anonymous_memberList.length;

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

        isFavable(message) {
            if (!message) {
                return false;
            }
            return (
                [
                    MessageContentType.VOIP_CONTENT_TYPE_START,
                    MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE,
                ].indexOf(message.messageContent.type) <= -1
            );
        },

        isRecallable(message) {
            if (message) {
                //判断是不是匿名群
                const { conversation } =
                    this.sharedConversationState.currentConversationInfo;
                let delta = wfc.getServerDeltaTime();
                let now = new Date().getTime();

                if (
                    (conversation.type === ConversationType.Group &&
                        ConversationInfo.anonymous_memberList &&
                        ConversationInfo.anonymous_memberList.length) ||
                    this.isChatMode(message)
                ) {
                    return false;
                }
                return (
                    message.direction === 0 &&
                    now - (numberValue(message.timestamp) - delta) < 180 * 1000
                );
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
                const { conversation } =
                    this.sharedConversationState.currentConversationInfo;
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
                content.remotePath = this.mixinCloudDiskRemotePath(
                    content.remotePath
                );
                copyImg(content.remotePath);
            }
        },
        async download(message) {
            message.messageContent.remotePath = this.mixinCloudDiskRemotePath(
                message.messageContent.remotePath
            );

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
            console.log(
                "需要保存云盘的大小:",
                thisSize,
                "剩余空间大小:",
                notuse,
                "限定云盘总大小",
                this.mixinTransfromByte(this.permissionList.storageLimit)
            );
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
            } else if (
                message.messageContent instanceof ImageMessageContent &&
                !thumbnail
            ) {
                // 图片
                let base64_image = await imageThumbnail(file);
                shotcut = this.mixinBase64toFile(base64_image, file.name);
            } else {
                // 视频
                let base64_video = await videoThumbnail(file);
                shotcut = this.mixinBase64toFile(base64_video, file.name);
                if (!durationValue) {
                    let durationNum = await videoDuration(file);
                    durationValue = Math.ceil(durationNum * 1000);
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

        recallMessage(message) {
            wfc.recallMessage(message.messageUid, null, null);
        },
        cancelMessage(message) {
            let canceled = wfc.cancelSendingMessage(message.messageId);
            if (!canceled) {
                this.$notify({
                    text: this.$t("conversation.cancel_fail"),
                    type: "warn",
                });
            }
        },

        delMessage(message) {
            wfc.deleteMessage(message.messageId); // 本地删除
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
            } else {
                // 每次都提醒
                this.$alert({
                    content: `<p style="text-align:center;">${this.$t(
                        "conversation.delete_both"
                    )}</p>`,
                    height: 150,
                    confirmText: this.$t("common.delete"),
                    cancelCallback: () => {},
                    confirmCallback: () => {
                        this.confirmDelete();
                    },
                });
            }
        },
        // message 存在是单条删除， 否则多条删除
        async confirmDelete(message) {
            try {
                let { conversation } =
                    this.sharedConversationState.currentConversationInfo;
                let res = null;
                if (conversation.type == ConversationType.Group) {
                    res = await delMultiMessage({
                        userId: wfc.getUserId(),
                        messageIds: message
                            ? [message.messageUid.toString()]
                            : this.sharedPickState.messages.map((item) =>
                                  item.messageUid.toString()
                              ),
                    });
                } else {
                    // 请求接口
                    res = await delMessage({
                        userId: wfc.getUserId(),
                        messageIds: message
                            ? [message.messageUid.toString()]
                            : this.sharedPickState.messages
                                  .filter((item) => item.direction === 0)
                                  .map((item) => item.messageUid.toString()),
                    });
                }
                if (!res) return;
                let { code } = res.data;
                if (code === "000000") {
                    this.$nextTick(() => {
                        if (message) {
                            wfc.deleteRemoteMessageByUid(
                                message.messageUid,
                                null,
                                null
                            );
                        } else {
                            store.deleteSelectedMessages(1);
                        }
                        let unread =
                            wfc.getConversationUnreadCount(conversation);
                        console.log(unread);
                    });
                } else {
                    this.$Message.error(res.data.message);
                }
            } catch (error) {}
        },
        // 转成文字
        changeText(message) {
            this.$eventBus.$emit("audiosChangeText", message);
            store.setShouldAutoScrollToBottom(false);
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
            this.forward(message, true).then((data) => {
                if (data !== "cancel") {
                    this.$Message.success(this.$t("friend_request.sent"));
                }
            });
        },

        quoteMessage(message) {
            store.quoteMessage(message);
        },

        multiSelect(message) {
            this.toggleMessageMultiSelectionActionView(message);
        },

        infiniteHandler($state) {
            console.log("to load more message");
            store.loadConversationHistoryMessages(
                () => {
                    console.log("loaded");
                    $state.loaded();
                },
                () => {
                    console.log("complete");
                    $state.complete();
                }
            );
        },

        playVoice(message) {
            if (amr) {
                amr.stop();
            }
            if (this.isPlaying) {
                amr = new BenzAMRRecorder();
                let voice = message.messageContent;
                amr.initWithUrl(voice.remotePath).then(() => {
                    this.$set(message, "_isPlaying", true);
                    amr.play();
                });
                amr.onEnded(() => {
                    this.$set(message, "_isPlaying", false);
                    store.playVoice(null);
                });
            } else {
                amr.stop();
            }
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
        // 设置匿名群发送文件消息体数据
        setAnonymousFileInfo() {
            let obj = null;
            const currentConversation = this.conversationInfo.conversation;
            if (currentConversation.type === ConversationType.Group) {
                const memberList = ConversationInfo.anonymous_memberList;
                const userId = wfc.getUserId();
                // 是否是群聊
                if (memberList?.length) {
                    memberList.forEach((item) => {
                        if (item.memberId === userId) {
                            obj = {
                                anonymous_name: item.anonymousName,
                                portrait: item.portrait,
                                anonymous_en_name: item.anonymousEnName,
                            };
                            return obj;
                        }
                    });
                }
            }
            return obj;
        },

        onReceiveMessage(message, hasMore) {
            if (
                this.conversationInfo?.conversation.equal(
                    message.conversation
                ) &&
                message.messageContent instanceof MultiCallOngoingMessageContent
            ) {
                // 自己是不是已经在通话中
                // console.log("MultiCallOngoingMessageContent", message.messageContent);
                if (
                    message.messageContent.targets.indexOf(wfc.getUserId()) >= 0
                ) {
                    return;
                }
                let index = this.ongoingCalls.findIndex(
                    (call) =>
                        call.messageContent.callId ===
                        message.messageContent.callId
                );
                if (index > -1) {
                    this.ongoingCalls[index] = message;
                } else {
                    this.ongoingCalls.push(message);
                }
                if (!this.ongoingCallTimer) {
                    this.ongoingCallTimer = setInterval(() => {
                        this.ongoingCalls = this.ongoingCalls.filter((call) => {
                            return (
                                new Date().getTime() -
                                    (numberValue(call.timestamp) -
                                        numberValue(wfc.getServerDeltaTime())) <
                                3 * 1000
                            );
                        });
                        if (this.ongoingCalls.length === 0) {
                            clearInterval(this.ongoingCallTimer);
                            this.ongoingCallTimer = 0;
                        }
                        // console.log("ongoing calls", this.ongoingCalls.length);
                    }, 1000);
                }
            }
        },

        joinMultiCall(message) {
            let request = new JoinCallRequestMessageContent(
                message.messageContent.callId,
                wfc.getClientId()
            );
            wfc.sendConversationMessage(
                this.conversationInfo.conversation,
                request
            );
        },

        showUnreadMessage() {
            let messageListElement = this.$refs["conversationMessageList"];
            if (messageListElement) {
                messageListElement.scroll({
                    top: messageListElement.scrollHeight,
                    left: 0,
                    behavior: "auto",
                });
            }
            this.unreadMessageCount = 0;
        },
        clearConversationUnreadStatus() {
            let info = this.sharedConversationState.currentConversationInfo;
            if (this.isHasUnreadMentionAll && info && info.conversation) {
                store.clearConversationUnreadStatus(info.conversation);
            }
        },
        openMessageContextMenu(event, message) {
            this.$refs.menu.open(event, message);
        },
        // 是否是好友
        async checkFriend(type) {
            if (!this.sharedConversationState.currentConversationInfo) return;
            const { conversation, target } =
                this.sharedConversationState.currentConversationInfo;
            this.notFriend = false;
            // 当前聊天窗口是不是群组，切换不是团队或公众号
            if (
                conversation.type === ConversationType.Group ||
                [
                    ...Config.TEAM_IDS,
                    ...Config.HELPER_IDS,
                    wfc.getUserId(),
                ].includes(target)
            ) {
                this.isFriend = true;
            } else if (conversation.type === ConversationType.Single) {
                if (wfc.isMyFriend(target)) {
                    this.isFriend = true;
                } else {
                    try {
                        let res = await checkIsFriends({
                            friendUserId: target,
                            userId: wfc.getUserId(),
                        });
                        let { data, message, code } = res.data;
                        if (code === "000000") {
                            let { isFriend, hasSendFriendRequest } = data;
                            // isFriend: 1已经是好友0 非好友 hasSendFriendRequest： 1发送过好友邀请， 0 未发送过好友
                            let mySelfName = this.mixinGetUserName(
                                this.sharedContactState.selfUserInfo
                            );
                            let requestText = this.$t(
                                "friend_request.request_add_friends",
                                [mySelfName]
                            );
                            let isFriendNum = Number(isFriend);
                            let hasSendFriendRequestNum =
                                Number(hasSendFriendRequest);
                            if (hasSendFriendRequestNum) {
                                this.isFriend = false;
                            } else if (isFriendNum) {
                                this.isFriend = true;
                            } else if (
                                !isFriendNum &&
                                !hasSendFriendRequestNum &&
                                !type
                            ) {
                                //  发送信息：  我是 xxx ，请求添加您为好友
                                wfc.sendFriendRequest(
                                    target,
                                    "",
                                    null,
                                    () => {
                                        this.isFriend = true;
                                        this.notFriend = true;
                                        let textMessageContent =
                                            new TextMessageContent();
                                        textMessageContent.content =
                                            requestText;
                                        wfc.sendConversationMessage(
                                            conversation,
                                            textMessageContent
                                        );
                                    },
                                    (err) => {
                                        this.notFriend = true;
                                    }
                                );
                            } else if (type) {
                                this.notFriend = true;
                            }
                        } else {
                            console.log(message);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        },
        // 点击同意或者删除
        handlerFriendRequest(type) {
            //type: 0: 删除 1: 加好友
            const { target, conversation } =
                this.sharedConversationState.currentConversationInfo;
            if (type) {
                // 是否达到自己的好友人数上线
                if (
                    wfc.getMyFriendList(true).length <
                    this.permissionList.friendsLimit
                ) {
                    wfc.handleFriendRequest(
                        target,
                        true,
                        "",
                        () => {
                            this.isFriend = true;
                        },
                        (err) => {
                            console.log("accept friend request error", err);
                        }
                    );
                } else {
                    this.$alert({
                        content: this.$t("friend_request.add_friends_failed"),
                        isText: true,
                        height: 128,
                        cancelText: this.$t("common.cancel"),
                        confirmText: this.$t("friend_request.go_to"),
                    });
                }
            } else {
                wfc.clearUnreadFriendRequestStatus();
                store.removeConversation(conversation);
            }
        },
        // 监听 好友，好友列表更新时 处理页面展示
        onFriendRequestOrListUpdate(ids) {
            this.checkFriend(1);
            let { currentConversationInfo } = this.sharedConversationState;
            if (currentConversationInfo && ids && ids.length) {
                let myIdIndex = ids.findIndex((id) => {
                    return id === currentConversationInfo.target;
                });
                if (myIdIndex > -1) {
                    this.isFriend = true;
                    wfc.clearUnreadFriendRequestStatus();
                }
            }
        },
        // 处理人数数量显示
        setAnonymousMemberLength() {
            if (!this.sharedConversationState.currentConversationInfo) return;
            const { conversation } =
                this.sharedConversationState.currentConversationInfo;
            const { anonymous_memberList } = ConversationInfo;
            if (conversation.type == ConversationType.Group) {
                if (anonymous_memberList && anonymous_memberList.length) {
                    this.groupMemberUserInfos_len = anonymous_memberList.length;
                } else {
                    this.groupMemberUserInfos_len =
                        store.getConversationMemberUsrInfos(
                            conversation
                        ).length;
                }
            } else {
                this.groupMemberUserInfos_len = 0;
            }
        },
        async getGroupFrom() {
            const { anonymous_memberList } = ConversationInfo;
            const { conversation } =
                this.sharedConversationState.currentConversationInfo;
            if (!anonymous_memberList || !anonymous_memberList.length) {
                try {
                    let res = await groupLinkImHistoryMeeting({
                        groupId: conversation.target,
                    });
                    let { code, data } = res.data;
                    if (code === "000000" && data) {
                        this.groupFromMeeting = data.imMeetingId;
                    }
                } catch (error) {}
            }
        },
        // 将会话框置底
        setScrollToBottom() {
            if (this.isFirstInit) {
                this.$refs.conversationMessageList &&
                    (this.$refs.conversationMessageList.style.opacity = 0);
            }
            let timer = setTimeout(() => {
                let messageListElement = this.$refs["conversationMessageList"];
                messageListElement &&
                    messageListElement.scroll({
                        top: messageListElement.scrollHeight,
                        left: 0,
                        behavior: "auto",
                    });
                this.clearConversationUnreadStatus();
                if (this.isFirstInit) {
                    this.$refs.conversationMessageList &&
                        (this.$refs.conversationMessageList.style.opacity = 1);
                    this.isFirstInit = false;
                }
                timer && clearTimeout(timer);
            }, 300);
        },
        openMessageSenderContextMenu(event, message) {
            // 目前只支持群会话里面，消息发送者右键@
            if (message.conversation.type === ConversationType.Group) {
                this.$refs.messageSenderContextMenu.open(event, message);
            }
        },
        mentionMessageSenderTitle(message) {
            if (!message) {
                return "";
            }
            let displayName = wfc.getGroupMemberDisplayName(
                message.conversation.target,
                message.from
            );
            return "@" + displayName;
        },

        mentionMessageSender(message) {
            this.$refs.messageInputView.mention(
                message.conversation.target,
                message.from
            );
        },
        mentionMessageChat(message) {
            // 是否是好友，
            let type = this.mentionIsFriend(message);
            if (
                !type &&
                wfc.getMyFriendList(true).length >=
                    this.permissionList.friendsLimit
            ) {
                this.$alert({
                    content: tipsContent[16],
                    height: 150,
                    cancelText: "",
                });
            } else {
                if (
                    this.$router.currentRoute.value.path !==
                    "/home/conversation"
                ) {
                    this.$router.replace("/home/conversation");
                }
                let conversation = new Conversation(
                    ConversationType.Single,
                    message.from,
                    0
                );
                store.setCurrentConversation(conversation);
            }
        },
        showForgotPage() {
            this.$modal.show(
                ForgotSecretPassword,
                {},
                null,
                {
                    name: "ForgotSecretPassword-modal",
                    width: 450,
                    height: 560,
                    clickToClose: true, // 点击模态框是否关闭
                },
                {}
            );
        },
    },

    mounted() {
        this.popupItem = this.$refs["setting"];
        document.addEventListener("mouseup", this.dragEnd);
        document.addEventListener("mousemove", this.drag);

        this.$eventBus.$on("send-file", (args) => {
            let fileMessageContent = new FileMessageContent(
                null,
                args.remoteUrl,
                args.name,
                args.size
            );
            let message = new Message(null, fileMessageContent);
            this.forward(message, true);
        });

        this.$eventBus.$on("forward-fav", (args) => {
            let favItem = args.favItem;
            let message = favItem.toMessage();
            this.forward(message, true);
        });

        // 进程层 监听切换到聊天需要 check 是否是好友
        ipcRenderer.on("send-check-friend", (event, args) => {
            this.groupFromMeeting = "";
            // 群组无需check 需要将样式设置初始
            if (args.type === ConversationType.Group) {
                this.isFriend = true;
                this.notFriend = false;
                this.getGroupFrom();
            } else {
                this.checkFriend();
            }
        });

        // 监听好友变化
        wfc.eventEmitter.on(
            EventType.FriendRequestUpdate,
            this.onFriendRequestOrListUpdate
        );
        // 监听好友列表变化
        wfc.eventEmitter.on(
            EventType.FriendListUpdate,
            this.onFriendRequestOrListUpdate
        );
        // 群人数数量显示
        this.setAnonymousMemberLength();
        // wfc.eventEmitter.on(EventType.ReceiveMessage, this.onReceiveMessage)
        //监听当前是否选择
        document.addEventListener("click", this.handleNotRemind);
        // before-inputEvent-electron
        ipcRenderer.on("before-inputEvent-electron", (event, args) => {
            // 消息页面监听
            if (this.currentPage === "conversation") {
                let secretTokenStore = useSecretTokenStore();
                let { secretStatus, secretConfig, secretPassword } =
                    storeToRefs(secretTokenStore);
                // 当前是false显示、 true:隐藏
                if (
                    secretConfig.value &&
                    !secretStatus.value &&
                    secretPassword.value
                ) {
                    console.log("隐藏秘密令牌==");
                    secretTokenStore.setSecretToken(false);
                    secretTokenStore.setForgotPassword(false);
                    store.toggleSecretTokenConversation(1); // 执行隐藏
                }
            }
        });
    },

    beforeUnmount() {
        document.removeEventListener("mouseup", this.dragEnd);
        document.removeEventListener("mousemove", this.drag);
        document.removeEventListener("click", this.handleNotRemind);
        this.$eventBus.$off("send-file");
        this.$eventBus.$off("forward-fav");
        // 移除监听好友变化
        wfc.eventEmitter.removeListener(
            EventType.FriendRequestUpdate,
            this.onFriendRequestOrListUpdate
        );
        // 移除监听好友列表变化
        wfc.eventEmitter.removeListener(
            EventType.FriendListUpdate,
            this.onFriendRequestOrListUpdate
        );
        // wfc.eventEmitter.removeListener(
        //   EventType.ReceiveMessage,
        //   this.onReceiveMessage
        // )
    },
    watch: {
        // 记录当前聊天框首次加载
        "sharedConversationState.currentConversationInfo.target"() {
            this.isFirstInit = true;
        },
        "sharedConversationState.shouldAutoScrollToBottom"(n) {
            //  页面显示&&页面shouldAutoScrollToBottom置底变量为true && 当前聊天中有未读消息
            if (
                n &&
                !this.sharedMiscState.isPageHidden &&
                this.isHasUnreadMentionAll
            ) {
                this.setScrollToBottom();
            }
        },
        "secretToken.forgotPasswordView"(n, o) {
            if (n) {
                this.showForgotPage();
            }
        },
    },

    updated() {
        if (!this.sharedConversationState.currentConversationInfo) {
            return;
        }
        this.popupItem = this.$refs["setting"];
        // refer to http://iamdustan.com/smoothscroll/
        if (
            this.sharedConversationState.shouldAutoScrollToBottom &&
            !this.sharedMiscState.isPageHidden
        ) {
            this.setScrollToBottom();
        } else {
            // 用户滑动到上面之后，收到新消息，不自动滑动到最下面
        }
        const { unreadCount, conversation } =
            this.sharedConversationState.currentConversationInfo;
        if (unreadCount.unread > 0) {
            if (this.sharedMiscState.isPageHidden) {
                this.unreadMessageCount = unreadCount.unread;
            }
        } else {
            this.unreadMessageCount = 0;
        }

        // 切换到新的会话
        if (
            this.conversationInfo &&
            !this.conversationInfo.conversation.equal(conversation)
        ) {
            this.showConversationInfo = false;
            this.ongoingCalls = null;
            if (this.ongoingCallTimer) {
                clearInterval(this.ongoingCallTimer);
                this.ongoingCallTimer = 0;
            }
        }
        if (conversation.type == ConversationType.Group) {
            if (ConversationInfo.anonymous_memberList) {
                if (ConversationInfo.anonymous_memberList.length) {
                    this.groupMemberUserInfos_len =
                        ConversationInfo.anonymous_memberList.length;
                } else {
                    this.groupMemberUserInfos_len =
                        store.getConversationMemberUsrInfos(
                            conversation
                        ).length;
                }
            }
        } else {
            this.groupMemberUserInfos_len = 0;
        }
    },
    computed: {
        currentPage() {
            return this.$router.currentRoute.value.name;
        },
        isPlaying() {
            return this.$store.state.isPlaying;
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
        isChatSwitch() {
            return getItem("UnVipUserChatSwitch") === "ON";
        },
        // 标题显示
        conversationTitle() {
            let { conversation } =
                this.sharedConversationState.currentConversationInfo;
            let name = conversation._target._displayName;
            // 处理异常显示名称问题<88ee>
            const reg = /^<(?![^a-zA-Z]+$)(?!\D+$)/;
            if (name.length >= 34 && reg.test(name)) {
                //   conversation._target.mobile
                return this.mixinResetPhoneNumber(conversation._target.mobile);
            }
            //  _displayName 是手机号的处理为脱敏
            if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
                return this.mixinResetPhoneNumber(name);
            }
            // 针对通付盾团队,针对会议助手  名称需要特殊处理一下
            if (Config.TEAM_IDS.includes(conversation._target.uid)) {
                return this.mixinOfficialName(conversation._target.name);
            }
            return name;
        },
        loadingIdentifier() {
            let { conversation } =
                this.sharedConversationState.currentConversationInfo;
            return (
                conversation.type +
                "-" +
                conversation.target +
                "-" +
                conversation.line
            );
        },
        currentVoiceMessage() {
            let voice = this.sharedConversationState.currentVoiceMessage;
            if (voice) {
                this.playVoice(voice);
            } else {
                if (amr) {
                    amr.stop();
                }
            }
            return null;
        },
        isShowMoreBtn() {
            const { conversation } =
                this.sharedConversationState.currentConversationInfo;
            if (
                [...Config.TEAM_IDS, ...Config.HELPER_IDS].includes(
                    conversation._target.uid
                ) ||
                conversation.type === ConversationType.Channel
            ) {
                return false;
            }
            if (this.permissionList.vipLevel < 2 && !this.isChatSwitch) {
                return false;
            }
            return true;
        },
        // 单聊显示对方正在输入
        inputting() {
            const { currentConversationInfo, inputtingUser } =
                this.sharedConversationState;
            return (
                inputtingUser &&
                inputtingUser.uid !== wfc.getUserId() &&
                currentConversationInfo.conversation.type ===
                    ConversationType.Single
            );
        },
        // 当前聊天是否有未读的消息
        isHasUnreadMentionAll() {
            let info = this.sharedConversationState.currentConversationInfo;
            return (
                info &&
                info.unreadCount &&
                info.unreadCount.unread +
                    info.unreadCount.unreadMention +
                    info.unreadCount.unreadMentionAll >
                    0
            );
        },
        mentionIsFriend() {
            return (message) => {
                if (message) {
                    return (
                        message.from === wfc.getUserId() ||
                        wfc.isMyFriend(message.from)
                    );
                }
                return false;
            };
        },
        // 是否显示秘密令牌页面
        showSecretTokenView() {
            let { secretSearchView, setSecretTokenView } = storeToRefs(
                useSecretTokenStore()
            );
            return secretSearchView.value || setSecretTokenView.value;
        },
    },
    directives: {
        vOnClickOutside,
    },
};
</script>

<style lang="css" scoped>
.conversation-empty-container {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f6f9;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
}

.conversation-empty-container h1 {
    font-size: 17px;
    font-weight: normal;
}

.title-container {
    width: 100%;
    height: 60px;
    display: flex;
    padding: 0 0 0 20px;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e6e6e6;
    border-top-right-radius: var(--main-border-radius);
    position: relative;
    box-sizing: border-box;
}

.title-container h1 {
    flex: 1;
    font-size: 16px;
    line-height: 22px;
    font-weight: normal;
    display: flex;
    flex-direction: column;
}

.title-container .conversation-title {
    display: flex;
    color: rgba(0, 0, 0, 1);
}

.title-container .conversation-title .single-line {
    max-width: calc(100% - 130px);
    overflow: hidden;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    white-space: normal;
}

.title-container .from {
    line-height: 10px;

    font-size: 10px;
    color: rgba(102, 102, 102, 1);
}

.title-container .more-btn {
    width: 40px;
    height: 40px;
    display: flex;
    text-align: center;
    justify-content: center;
    align-items: center;
}

.title-container .more-btn .icon-ion-ios-settings-strong {
    font-size: 14px;
    display: inline-block;
}

.conversation-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.conversation-container header {
    border-top-right-radius: var(--main-border-radius);
}

.conversation-container header {
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e6e6e6;
}

.conversation-content-container {
    flex: 1;
    /* height: calc(100% - 60px); */
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    background-color: #f3f3f3;
    border-bottom-right-radius: var(--main-border-radius);
}

.conversation-content-container .drag-drop-container {
    position: absolute;
    background-color: #f2f2f2a5;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    height: 100%;
    padding: 20px 15px 15px 15px;
}

.conversation-content-container .drag-drop {
    border: 2px dashed #b2b2b2;
    height: 100%;
    width: 100%;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.conversation-content-container .drag-drop p {
    padding-bottom: 100px;
}

.conversation-message-list {
    flex: 1 1 auto;
    height: calc(100% - 200px);
    overflow-x: hidden;
    overflow-y: auto;
}

.conversation-message-list ul {
    list-style: none;
}

.unread-count-tip-container {
    margin-left: auto;
    padding: 4px 8px;
    background: white;
    width: auto;
    color: #4168e0;
    border-radius: 4px;
}

/*.handler {*/
/*  height: 1px;*/
/*  background-color: #e2e2e2;*/
/*}*/

.inputting-container {
    display: flex;
    padding: 0 10px;
    align-items: center;
    font-size: 12px;
}

/* .self-inputting {
  flex-direction: row-reverse;
} */

.inputting-container .avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
    margin-right: 20px;
}

.self-inputting .avatar {
    margin-right: 0;
    margin-left: 20px;
}

.divider-handler::before {
    cursor: row-resize;
    content: "";
    display: block;
    width: 100%;
    height: 3px;
    border-top: 1px solid #e2e2e2;
    margin: 0 auto;
}

.conversation-info-container {
    display: none;
    width: 266px;
    height: 100%;
    top: 0;
    right: 0;
    position: absolute;
    /* background-color: #ffffffe5; */
    background-color: #fff;
    backdrop-filter: blur(6px);
    border-left: 1px solid #e6e6e6;
}

.conversation-info-container.active {
    display: flex;
}

em.vip-icon-em {
    margin-left: -20px;
}

.conversation-content-container .ongoing-call-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    background: white;
}

.ongoing-call-item {
    padding: 10px 20px;
    display: flex;
    border-bottom: 1px solid lightgrey;
}

.ongoing-call-item p {
    flex: 1;
}

.ongoing-call-item button {
    padding: 5px 10px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
}

.ongoing-call-item button:active {
    border: 1px solid #4168e0;
}

.add-friend-wrap {
    padding: 20px;
    text-align: center;
}

.add-friend-wrap p {
    line-height: 20px;
    margin: 20px;
}

.btn-wrap {
    display: flex;
    justify-content: space-around;
}

.add-friend-wrap .delete-btn,
.add-friend-wrap .add-btn {
    display: inline-block;
    border: none;
    background: #fff;
    padding: 10px 25px;
    border-radius: 5px;
}

.add-friend-wrap .add-btn {
    background: #20bf64;
    color: #fff;
}

.secret-container {
    padding: 40px 40px 20px;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
}
</style>
