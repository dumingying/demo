<template>
    <div>
        <section
            class="message-input-container"
            v-if="!sharedConversationState.showChannelMenu"
        >
            <section class="input-action-container">
                <VEmojiPicker
                    id="emoji"
                    v-if="showEmojiDialog"
                    labelSearch="Search"
                    :customEmojis="emojis"
                    :showSearch="false"
                    :showCategories="false"
                    lang="pt-BR"
                    v-v-on-click-outside="hideEmojiView"
                    :emojisByRow="6"
                    @select="onSelectEmoji"
                />
                <ul class="action-bar">
                    <!-- 表情 -->
                    <li>
                        <img
                            @click="toggleEmojiView"
                            :alt="$t('message.emoji')"
                            :title="$t('message.emoji')"
                            id="showEmoji"
                            draggable="false"
                            src="../../../assets/images/svg/1-icon.svg"
                        />
                    </li>
                    <!-- 本地文件选择 -->
                    <li>
                        <img
                            @click="pickFile"
                            :alt="$t('message.send_folder')"
                            :title="$t('message.send_folder')"
                            draggable="false"
                            src="../../../assets/images/svg/2-icon.svg"
                        />
                        <input
                            multiple
                            ref="fileInput"
                            type="file"
                            style="display: none"
                            class="icon-ion-android-attach"
                            @change="onPickFile($event)"
                        />
                    </li>
                    <!-- 链上文档 -->
                    <li>
                        <img
                            @click="pickCloudFile"
                            :alt="$t('common.cloud_disk')"
                            :title="$t('common.cloud_disk')"
                            draggable="false"
                            src="../../../assets/images/svg/3-icon.svg"
                        />
                    </li>
                    <!--截图 -->
                    <li v-show="sharedMiscState.isElectron" class="screen-shot">
                        <img
                            id="screenShot"
                            :alt="$t('message.screenshot')"
                            :title="$t('message.screenshot')"
                            @click="screenShot(false)"
                            draggable="false"
                            src="../../../assets/images/svg/4-icon.svg"
                        />
                        <div class="hidden-btn">
                            <i class="icon-ion-chevron-down" />
                            <span
                                @click="screenShot(true)"
                                class="screen-shot-button"
                            >
                                {{ $t("message.hide_current_window") }}
                            </span>
                        </div>
                    </li>
                    <!-- 历史消息 -->
                    <li
                        v-if="sharedMiscState.isElectron"
                        style="margin-left: 0px"
                    >
                        <img
                            @click="showMessageHistory"
                            :alt="$t('message.search_history_chat')"
                            :title="$t('message.search_history_chat')"
                            draggable="false"
                            src="../../../assets/images/svg/8-icon.svg"
                        />
                    </li>
                </ul>
                <ul
                    class="action-bar"
                    v-show="isAnonymous && !notFriend && !isChannel"
                >
                    <!-- 预定会议 -->
                    <li>
                        <img
                            @click="bookMeeting"
                            :alt="$t('voip.schedule')"
                            :title="$t('voip.schedule')"
                            draggable="false"
                            src="../../../assets/images/svg/9-icon.svg"
                        />
                    </li>
                    <!-- 快速会议 -->
                    <li>
                        <img
                            @click="quickMeetingCall"
                            :alt="$t('message.quick_meeting')"
                            :title="$t('message.quick_meeting')"
                            draggable="false"
                            src="../../../assets/images/svg/7-icon.svg"
                        />
                    </li>
                    <!-- 视频通话 -->
                    <li>
                        <img
                            @click="startVideoCall"
                            :alt="$t('message.video_call')"
                            :title="$t('message.video_call')"
                            draggable="false"
                            src="../../../assets/images/svg/6-icon.svg"
                        />
                    </li>
                    <!-- 音频通话 -->
                    <li>
                        <img
                            @click="startAudioCall"
                            :alt="$t('message.voice_call')"
                            :title="$t('message.voice_call')"
                            draggable="false"
                            src="../../../assets/images/svg/5-icon.svg"
                        />
                    </li>
                </ul>
                <ul
                    class="action-bar"
                    v-if="
                        isChannel &&
                        conversationInfo.conversation._target.menus &&
                        conversationInfo.conversation._target.menus.length
                    "
                >
                    <li @click="toggleChannelMenu">
                        <img
                            :alt="$t('channel.show_menu')"
                            :title="$t('channel.show_menu')"
                            draggable="false"
                            src="../../../assets/images/input-icon.svg"
                        />
                    </li>
                </ul>
            </section>
            <!-- 输入框以及引用消息 -->
            <section :class="['input-wrap', { 'flex-input': !quotedMessage }]">
                <div
                    @keydown.enter="send($event)"
                    @paste="handlePaste"
                    @input="onInput"
                    @contextmenu.prevent="$refs.menu.open($event)"
                    :title="$t('message.shortcut_key')"
                    v-on:tribute-replaced="onTributeReplaced"
                    ref="input"
                    class="input"
                    id="input"
                    draggable="false"
                    autofocus
                    onmouseover="this.setAttribute('org_title', this.title); this.title='';"
                    onmouseout="this.title = this.getAttribute('org_title');"
                    contenteditable="true"
                ></div>
                <QuoteMessageView
                    v-if="quotedMessage"
                    style="padding: 10px 20px"
                    @cancelQuoteMessage="cancelQuoteMessage"
                    :enable-message-preview="false"
                    :quoted-message="quotedMessage"
                    :show-close-button="true"
                />
            </section>
            <!-- window发送按钮 -->
            <div class="wra_con_send" v-if="!isOsx">
                <button
                    class="con_send"
                    :title="$t('conversation.enter_send')"
                    @click="send($event)"
                >
                    {{ $t("common.send") }}
                </button>
            </div>
            <vue-context ref="menu" :lazy="true">
                <li>
                    <a @click.prevent="handlePaste($event)">
                        {{ $t("common.paste") }}
                    </a>
                </li>
                <li>
                    <a @click.prevent="copy">{{ $t("common.copy") }}</a>
                </li>
                <li>
                    <a @click.prevent="cut">{{ $t("common.cut") }}</a>
                </li>
            </vue-context>
        </section>
        <ChannelMenuView
            v-else
            :menus="conversationInfo.conversation._target.menus"
            :conversation="conversationInfo.conversation"
        ></ChannelMenuView>
    </div>
</template>

<script>
import { vOnClickOutside } from "@vueuse/components";

import { parser as emojiParse } from "@/ui/util/emoji";
import { VEmojiPicker } from "@imndx/v-emoji-picker-vue3";
import "@imndx/v-emoji-picker-vue3/lib/v-emoji-picker.esm.css";
import { MyEmojis } from "./MyEmojis";

import Config from "@/config";
import Tribute from "tributejs";
import "../../../tribute.css";

import TextMessageContent from "@/wfc/messages/textMessageContent";
import ConversationType from "@/wfc/model/conversationType";
import ModelConversationInfo from "@/wfc/model/conversationInfo";
import Conversation from "@/wfc/model/conversation";
import GroupInfo from "@/wfc/model/groupInfo";
import GroupType from "@/wfc/model/groupType";
import GroupMemberType from "@/wfc/model/groupMemberType";
import QuoteInfo from "@/wfc/model/quoteInfo";
import Draft from "@/ui/util/draft";
import Mention from "@/wfc/model/mention";

import QuickMeetingContent from "@/wfc/av/messages/customMessages/quickMeetingContent";
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";

import StickerMessageContent from "@/wfc/messages/stickerMessageContent";
import TypingMessageContent from "@/wfc/messages/typingMessageContent";

import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import QuickCloudFile from "@/ui/main/cloudDisk/QuickCloudFile";
import QuoteMessageView from "@/ui/main/conversation/message/QuoteMessageView";
import ForwardDesignatedMemberView from "@/ui/voip/conference/ForwardDesignatedMemberView";
import ConferDialog from "@/ui/voip/conference/ConferDialog";
import ChannelMenuView from "./ChannelMenuView";

import EventType from "@/wfc/client/wfcEvent";
import IpcEventType from "../../../ipcEventType";
import { ipcRenderer, isElectron, currentWindow } from "@/platform";
import { fileFromDataUri } from "@/ui/util/imageUtil";
import { copyText } from "../../util/clipboard";
import wfc from "@/wfc/client/wfc";
import store from "@/store";
import {
    getInviteMessageContent,
    createConferenceInfo,
} from "@/ui/voip/conferenceConfig";

import {
    getGroupAnonymousMembersInfo,
    shareFile,
    getUserVipInfo,
    getSaveMeeting,
} from "@/axios";

// vue 不允许在computed里面有副作用
// 和store.state.conversation.quotedMessage 保持同步
let md5 = require("js-md5");
export default {
    name: "MessageInputView",
    props: {
        conversationInfo: {
            type: ModelConversationInfo,
            required: true,
            default: null,
        },
        notFriend: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
            sharedContactState: store.state.contact,
            sharedMiscState: store.state.misc,
            userInfo: store.state.contact.selfUserInfo,
            showEmojiDialog: false,
            tribute: null,
            mentions: [],
            emojis: MyEmojis,
            lastConversationInfo: null,
            storeDraftIntervalId: 0,
            tributeReplaced: false,
            isOsx: process.platform === "darwin",
            isAnonymous: true,
            lastTypingMessageTimestamp: 0,
            quickMeetingSelectUser: [],
        };
    },
    methods: {
        // 设置是否显示语音和视频图标
        setIsAnonymous() {
            // 当前conversation信息
            let currentConversation = this.conversationInfo.conversation;
            if (currentConversation.type === ConversationType.Group) {
                // 是否有匿名人员
                let memberList = ModelConversationInfo.anonymous_memberList;
                this.isAnonymous = !(memberList && memberList.length);
            } else {
                this.isAnonymous = true;
                // 当前聊天窗口是自己,助手，团队 隐藏拨打电话和视频
                if (
                    [
                        ...Config.TEAM_IDS,
                        ...Config.HELPER_IDS,
                        wfc.getUserId(),
                    ].includes(currentConversation.target)
                ) {
                    this.isAnonymous = false;
                }
            }
        },
        // 设置匿名群发送文件消息体数据
        setAnonymousFileInfo() {
            let obj = null;
            const currentConversation = this.conversationInfo.conversation;
            if (currentConversation.type === ConversationType.Group) {
                const memberList = ModelConversationInfo.anonymous_memberList;
                // 是否是群聊
                if (memberList && memberList.length) {
                    memberList.forEach((item) => {
                        if (item.memberId === wfc.getUserId()) {
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
        async getGroupAnonymousMembers(conversationInfo) {
            try {
                let res = await getGroupAnonymousMembersInfo({
                    userId: wfc.getUserId(),
                    groupId: conversationInfo.target,
                });
                const { code, data, message } = res.data;
                if (code == "000000") {
                    ModelConversationInfo.anonymous_memberList =
                        data.imGroupMembers.map((item) => {
                            return {
                                ...item,
                                portrait: `${Config.STATIC_SERVER}/im-fs${item.portrait}`,
                            };
                        });
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        onTributeReplaced(e) {
            // 正常下面这两行应当就生效了，不知道为啥不生效，所以采用了后面的 trick
            e.detail.event.preventDefault();
            e.detail.event.stopPropagation();

            this.tributeReplaced = true;
        },
        canisend() {
            let target =
                this.conversationInfo &&
                this.conversationInfo.conversation._target;
            if (target instanceof GroupInfo) {
                let groupInfo = target;
                if (groupInfo.type === GroupType.Restricted) {
                    let groupMember = wfc.getGroupMember(
                        groupInfo.target,
                        wfc.getUserId()
                    );
                    if (
                        groupInfo.mute === 1 &&
                        groupMember.type === GroupMemberType.Normal
                    ) {
                        return false;
                    }
                }
            }

            return true;
        },
        cancelQuoteMessage() {
            this.conversationInfo._quotedMessage = null;
            store.quoteMessage(null);
            Draft.setConversationDraft(
                this.conversationInfo.conversation,
                "",
                null,
                null
            );
        },
        onInput(e) {
            this.notifyTyping(TypingMessageContent.TYPING_TEXT);
        },

        notifyTyping(type) {
            //  群无需发送
            if (
                [ConversationType.Single].indexOf(
                    this.conversationInfo.conversation.type
                ) >= 0
            ) {
                let now = new Date().getTime();
                if (now - this.lastTypingMessageTimestamp > 10 * 1000) {
                    let typing = new TypingMessageContent(type);
                    wfc.sendConversationMessage(
                        this.conversationInfo.conversation,
                        typing
                    );
                    this.lastTypingMessageTimestamp = now;
                }
            }
        },

        async handlePaste(e) {
            let text;
            e.preventDefault();
            if ((e.originalEvent || e).clipboardData) {
                text = (e.originalEvent || e).clipboardData.getData(
                    "text/plain"
                );
            } else {
                text = await navigator.clipboard.readText();
            }
            if (isElectron()) {
                let args = ipcRenderer.sendSync(IpcEventType.FILE_PASTE);
                if (args.hasImage) {
                    document.execCommand("insertText", false, " ");
                    document.execCommand(
                        "insertImage",
                        false,
                        "local-resource://" + args.filename
                    );
                    return;
                } else if (args.hasFile) {
                    // 发送文件，
                    args.files.forEach((file) => {
                        let obj = this.setAnonymousFileInfo();
                        store.sendFile(
                            this.conversationInfo.conversation,
                            file,
                            obj
                        );
                    });
                    // 发送消息时，会话消息列表需要滚动到最后
                    store.setShouldAutoScrollToBottom(true);
                    return;
                }
            }

            if (text && text.trim()) {
                document.execCommand("insertText", false, text);
                // Safari 浏览器 execCommand 失效，可以采用下面这种方式处理粘贴
                // this.$refs.input.innerText += text;
            }
        },

        mention(groupId, memberId) {
            let displayName = wfc.getGroupMemberDisplayName(groupId, memberId);
            this.mentions.push({
                key: displayName,
                value: "@" + memberId,
            });
            let text = this.$refs.input.innerText;
            let mentionValue;
            if (text.endsWith(" ")) {
                mentionValue = "@" + displayName + " ";
            } else {
                mentionValue = " @" + displayName + " ";
            }
            document.execCommand("insertText", false, mentionValue);
        },

        insertText(text) {
            this.$refs.input.focus();
            this.$refs["input"].innerText = text;
            // document.execCommand("insertText", false, text); // 产生div 标签替换了 br 导致按一次换行显示2个换行，
        },

        copy() {
            let text = this.$refs["input"].innerText;
            if (text) {
                copyText(text);
            }
        },

        cut() {
            this.copy();
            this.$refs["input"].innerHTML = "";
        },

        async send(e) {
            if (e.keyCode === 229) {
                return;
            }
            if (this.tribute && this.tribute.isActive) {
                this.tributeReplaced = false;
                return;
            }

            // let text = this.$refs['input'].textContent;
            // if (!text.trim()) {
            //   return;
            // }
            // this.$refs['input'].textContent = '';
            //
            // let textMessageContent = this.handleMention(text)
            // let conversation = this.conversationInfo.conversation;
            // wfc.sendConversationMessage(conversation, textMessageContent);
            //

            let input = this.$refs["input"];
            let message = input.innerHTML.trim();
            let currentConversation = this.conversationInfo.conversation;

            if (!currentConversation || !this.canisend() || !message) return;
            if (e.ctrlKey) {
                // e.preventDefault();
                // this.refs.input.innerHTML = this.refs.input.innerHTML+ "<div><br></div>";
                if (window.getSelection) {
                    let nextChar = window
                        .getSelection()
                        .focusNode.textContent.charAt(
                            window.getSelection().focusOffset
                        );
                    if (!nextChar) {
                        document.execCommand("InsertHTML", true, "<br>");
                    }

                    let selection = window.getSelection(),
                        range = selection.getRangeAt(0),
                        br = document.createElement("br");
                    range.deleteContents();
                    range.insertNode(br);
                    range.setStartAfter(br);
                    //   range.setEndAfter(br);
                    // range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    // return false;
                }
                return;
            }

            // if(!message.startsWith('<')){
            //     message = message.replace(/<br>/g, '\n').trim()
            // }

            let imgs = [...input.getElementsByTagName("img")];
            if (imgs) {
                for (const img of imgs) {
                    if (img.className.indexOf("emoji") >= 0) {
                        continue;
                    }
                    let src = img.src;
                    let file;
                    if (isElectron() && src.startsWith("local-resource")) {
                        // 'local-resource://' + 绝对路径
                        file = decodeURI(src.substring(17, src.length));
                    } else {
                        if (src.startsWith("blob:")) {
                            let blob = await fetch(src).then((r) => r.blob());
                            file = new File(
                                [blob],
                                new Date().getTime() + ".png"
                            );
                        } else {
                            file = fileFromDataUri(
                                src,
                                new Date().getTime() + ".png"
                            );
                        }
                    }
                    this.$eventBus.$emit("uploadFile", file);
                    //匿名群发送消息需要添加额外消息
                    let obj = this.setAnonymousFileInfo();
                    store.sendFile(currentConversation, file, obj);
                    store.setShouldAutoScrollToBottom(true);
                    // 会影响 input.getElementsByTagName 返回的数组，所以上面拷贝了一下
                    img.parentNode.removeChild(img);
                }
            }
            message = input.innerHTML.trim();
            message = message
                .replace(/<br>/g, "\n")
                .replace(/<div>/g, "\n")
                .replace(/<\/div>/g, "")
                .replace(/<b>/g, "")
                .replace(/<\/b>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&lt;/g, "< ")
                .replace(/&gt;/g, "> ")
                .replace(/&amp;/g, "&");

            // TODO 可以在此对文本消息进行处理，比如过滤掉 script，iframe 等标签

            //  自行部署表情时，需要手动替换下面的正则
            // TODO 在正则中使用变量，避免手动替换
            message = message
                .replace(/<img class="emoji" draggable="false" alt="/g, "")
                .replace(
                    /" src="https:\/\/chat-minio\.tongfudun\.com\/emoji\/72x72\/[0-9a-z-]+\.png">/g,
                    ""
                );

            if (message && message.trim()) {
                let textMessageContent = this.handleMention(message);
                let quotedMessage = this.sharedConversationState.quotedMessage;
                if (quotedMessage) {
                    let quoteInfo = QuoteInfo.initWithMessage(quotedMessage);
                    textMessageContent.setQuoteInfo(quoteInfo);
                }
                let extraObj = this.setAnonymousFileInfo();
                if (extraObj) {
                    let extraStr = JSON.stringify(extraObj);
                    textMessageContent.extra = extraStr;
                    textMessageContent.pushData = extraStr;
                } else {
                    textMessageContent.extra = "";
                    textMessageContent.pushData = "";
                }
                // console.log('发送文字', textMessageContent)
                wfc.sendConversationMessage(
                    currentConversation,
                    textMessageContent
                );
                this.$refs["input"].innerHTML = "";
            }
            this.conversationInfo._quotedMessage = null;
            store.quoteMessage(null);
            Draft.setConversationDraft(currentConversation, "", null, null);
            input.innerHTML = "";
            // 发送消息时，会话消息列表需要滚动到最后
            store.setShouldAutoScrollToBottom(true);
            e.preventDefault();
        },

        toggleEmojiView() {
            this.showEmojiDialog = !this.showEmojiDialog;
            this.focusInput();
        },

        screenShot(hideCurrentWindow = false) {
            if (hideCurrentWindow) {
                currentWindow.hide();
            }
            ipcRenderer.send(IpcEventType.START_SCREEN_SHOT, {});
        },
        showMessageHistory() {
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(
                    hash,
                    "#/history/conversation"
                );
            } else {
                url += "/history/conversation";
            }
            let conversation = this.conversationInfo.conversation;
            ipcRenderer.send(IpcEventType.showConversationMessageHistoryPage, {
                url: url,
                type: conversation.type,
                target: conversation.target,
                line: conversation.line,
            });
        },

        hideEmojiView(e) {
            if (e.target.id !== "showEmoji") {
                this.showEmojiDialog = false;
            }
        },

        onSelectEmoji(emoji) {
            this.showEmojiDialog = false;
            if (emoji.data.indexOf("http") >= 0) {
                let sticker = new StickerMessageContent(
                    "",
                    emoji.data,
                    200,
                    200
                );
                wfc.sendConversationMessage(
                    this.conversationInfo.conversation,
                    sticker
                );
                return;
            }

            this.$refs.input.focus();
            this.insertHTML(emojiParse(emoji.data));
            this.focusInput();
        },

        createElementFromHTML(htmlString) {
            let div = document.createElement("div");
            div.innerHTML = htmlString.trim();
            // Change this to div.childNodes to support multiple top-level nodes
            return div.firstChild;
        },

        insertHTML(html) {
            let sel, range;

            if (window.getSelection && (sel = window.getSelection())) {
                range = sel.getRangeAt(0);
                range.collapse(true);
                let imgEmoji = this.createElementFromHTML(html);
                range.insertNode(imgEmoji);

                // Move the caret immediately after the inserted span
                range.setStartAfter(imgEmoji);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && document.selection.createRange) {
                document.selection.createRange().text = html;
            }
        },

        pickFile() {
            this.$refs["fileInput"].click();
            this.notifyTyping(TypingMessageContent.TYPING_FILE);
        },
        // 获取用户vip相关信息
        async getVipInfo() {
            try {
                let res = await getUserVipInfo({
                    userId: wfc.getUserId(),
                });
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.vipInfo = data;
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 预定会议
        bookMeeting() {
            let { type, target, _target } = this.conversationInfo.conversation;
            this.$modal.show(
                ConferDialog,
                {
                    title: this.$t("voip.schedule"),
                    hdesc: this.$t("voip.meeting_subject"),
                    status: 2,
                    isSetGroup:
                        type === ConversationType.Group
                            ? JSON.stringify({
                                  groupId: target,
                                  groupName: _target.name,
                              })
                            : "",
                },
                null,
                {
                    name: "ConferDialog-modal",
                    width: 440,
                    height: 560,
                    clickToClose: true,
                },
                {
                    "before-close": (event) => {
                        if (
                            event.params &&
                            event.params.designatedMember &&
                            event.params.designatedMember.length
                        ) {
                            let { designatedMember, meetingDetail } =
                                event.params;
                            let message =
                                getInviteMessageContent(meetingDetail);
                            let ids = designatedMember
                                .filter((item) => !item.groupId)
                                .map((item) => item.uid);
                            let conversations =
                                store.getDesignatedMemberConversations(ids);
                            let groupConversations = "";
                            let groupId = "";
                            let index = designatedMember.findIndex(
                                (item) => item.groupId
                            );
                            if (index > -1) {
                                groupId = designatedMember[index].uid;
                            }
                            if (groupId) {
                                groupConversations =
                                    store.getDesignatedGroupConversations(
                                        groupId
                                    );
                            }
                            this.sendMemberInviteMessage({
                                messages: [message],
                                conversations,
                                groupConversations,
                            });
                        }
                    },
                }
            );
        },
        // 发送会议邀请消息
        sendMemberInviteMessage(data) {
            let { messages, conversations, groupConversations } = data;
            this.$modal.show(
                ForwardDesignatedMemberView,
                {
                    forwardType: ForwardType.NORMAL,
                    designatedMember: [...conversations, ...groupConversations],
                    confirmTitle: this.$t("common.confirm"),
                    messages,
                },
                null,
                {
                    name: "forward-designated-member-modal",
                    width: 440,
                    height: 520,
                    clickToClose: false, // 点击模态框是否关闭
                },
                {
                    "before-close": (event) => {
                        if (!event.params) return;
                        let { confirm, extraMessageText } = event.params;
                        if (confirm) {
                            if (groupConversations.length) {
                                store.forwardMessage(
                                    ForwardType.NORMAL,
                                    groupConversations,
                                    messages,
                                    `${this.$t(
                                        "conversation.atAll"
                                    )} ${extraMessageText}`,
                                    "isAtAll"
                                );
                            }
                            if (conversations.length) {
                                store.forwardMessage(
                                    ForwardType.NORMAL,
                                    conversations,
                                    messages,
                                    extraMessageText
                                );
                            }
                            this.$Message.success(
                                this.$t("friend_request.sent")
                            );
                        }
                    },
                }
            );
        },
        // 快速会议 step 1
        quickMeetingCall() {
            // 群组选人 -  确认弹窗 - 发送消息
            if (
                this.conversationInfo.conversation.type ===
                ConversationType.Group
            ) {
                let successCB = (users) => {
                    this.quickMeetingSelectUser = users;
                    this.quickMeetingModel();
                };
                let users = store
                    .getGroupMemberUserInfos(
                        this.conversationInfo.conversation.target,
                        true,
                        true
                    )
                    .filter((item) => item.uid !== wfc.getUserId());
                this.$pickContact({
                    successCB,
                    users: users,
                    initEditUsers: true,
                    showCategoryLabel: false,
                    initialCheckedUsers: users,
                });
                return;
            }
            // 单聊- 确认弹窗 - 发送消息
            this.quickMeetingSelectUser = [
                this.conversationInfo.conversation._target,
            ];
            this.quickMeetingModel();
        },
        // 弹窗确认 step 1-1
        quickMeetingModel() {
            let time = +new Date();
            this.$alert({
                title: this.$t("message.quick_meeting"),
                cancelText: this.$t("message.quick_meeting_call"),
                confirmText: this.$t("message.quick_meeting_sendText"),
                content: this.$t("message.quick_meeting_tip"),
                styles: {
                    cancelBtn: "color:#1dbb88;fontWeight:bold;",
                },
                cancelCallback: () => {
                    this.nextStartConference(time, 0); //呼叫邀请
                },
                confirmCallback: () => {
                    this.nextStartConference(time, 1); // 发送信息邀请
                },
            });
        },

        // 快速会议 step 2
        async nextStartConference(time, type) {
            try {
                // 准备好发起快速会议的配置信息
                let params = createConferenceInfo(0, {
                    meetingTitle: this.$t("voip.encrypted_meeting", [
                        this.mixinGetUserName(this.userInfo),
                    ]),
                });

                const res = await getSaveMeeting(params, {
                    "X-Header-FormToken": time,
                });
                const { code, data, message } = res.data;
                if (code == "000000") {
                    let requestData = avenginekitproxy.startConference(
                        params.imCreateMeeting.roomId,
                        false,
                        params.imCreateMeeting.pin,
                        wfc.getUserId(),
                        params.title, // 会议主题
                        params.description, // 会议描述
                        false, // false:主持人  true:听众
                        "",
                        false,
                        {
                            meetingCode: data.code, // 6位会议id
                            isQuickMeeting: true,
                            devices: this.externalDevice,
                            designatedMember: params.designatedParticipantIds,
                        }, // extra 额外信息
                        null,
                        true, // 静音进入会议
                        true, // 是否是关闭摄像头进入会议
                        true //是否是聊天框的快速会议发起
                    );
                    //   console.log(requestData);
                    if (!requestData) {
                        // 1? 仅发送信息邀请 : 发送响铃 和 信息邀请
                        type
                            ? this.sendInviteMessage({ ...params, ...data })
                            : this.sendInviteRingAndMessage({
                                  ...params,
                                  ...data,
                              });
                    }
                } else {
                    this.$Message.warning(
                        code == "5000011"
                            ? this.$t("voip.create_fail")
                            : message
                    );
                }
            } catch (error) {
                console.log(error);
            }
        },
        //发送会议邀请信息
        sendInviteMessage(data) {
            wfc.sendConversationMessage(
                this.conversationInfo.conversation,
                getInviteMessageContent(data).messageContent
            );
            this.$nextTick(() => {
                store.setShouldAutoScrollToBottom(true);
            });
        },
        // 发送@消息
        sendAtMessage() {
            let textMessageContent = new TextMessageContent();
            let str = [];
            this.quickMeetingSelectUser.forEach((userInfo) => {
                str.push(`@${this.mixinGetUserName(userInfo)} `);
            });
            textMessageContent.content = str.join("");
            textMessageContent.mentionedType = 2;
            let quotedMessage = this.sharedConversationState.quotedMessage;
            if (quotedMessage) {
                let quoteInfo = QuoteInfo.initWithMessage(quotedMessage);
                textMessageContent.setQuoteInfo(quoteInfo);
            }
            textMessageContent.extra = "";
            textMessageContent.pushData = "";
            //   console.log("发送文字", textMessageContent);
            wfc.sendConversationMessage(
                this.conversationInfo.conversation,
                textMessageContent
            );
        },
        // 发送铃声 和信息
        sendInviteRingAndMessage(data) {
            let { callId, code, title } = data;
            let quickContent = new QuickMeetingContent(
                0,
                callId,
                wfc.getUserId(),
                code,
                title
            );
            this.quickMeetingSelectUser.forEach((userInfo) => {
                let thisConversation = new Conversation(
                    ConversationType.Single,
                    userInfo.uid,
                    0
                );
                let pushStr = JSON.stringify({ title });
                thisConversation.extra = pushStr;
                thisConversation.pushData = pushStr;
                wfc.sendConversationMessage(thisConversation, quickContent);
            });
            if (
                this.conversationInfo.conversation.type ===
                ConversationType.Group
            ) {
                this.sendAtMessage();
            }
            this.sendInviteMessage(data);
        },
        // video audio 屏幕录制
        async checkMediaPermissions(type) {
            const nameObj = {
                camera: this.$t("mediaDevices.video"),
                microphone: this.$t("mediaDevices.audio"),
            };
            const name = nameObj[type];
            this.$alert({
                content: this.$t("mediaDevices.mac-tip", [name]),
                title: `${this.$t("mediaDevices.title")}${name}`,
                cancelText: this.$t("mediaDevices.cancel"),
                confirmText: this.$t("mediaDevices.confirm"),
                width: 450,
                height: 200,
                confirmCallback: () => {
                    ipcRenderer.send(
                        "media-devices-permissions-callback",
                        type
                    );
                },
            });
        },
        async startAudioCall() {
            // 麦克风权限检查
            const reply = await ipcRenderer.invoke(
                "media-devices-permissions",
                "microphone"
            );
            console.log("reply", reply);
            if (!reply) {
                this.checkMediaPermissions("microphone");
                return;
            }
            let conversation = this.conversationInfo.conversation;
            this.$startVoipCall({
                audioOnly: true,
                conversation: conversation,
                devices: this.externalDevice,
            });
        },

        async startVideoCall() {
            // 权限检查
            const reply = await ipcRenderer.invoke(
                "media-devices-permissions",
                "camera"
            );
            console.log("reply", reply);
            if (!reply) {
                this.checkMediaPermissions("camera");
                return;
            }
            let conversation = this.conversationInfo.conversation;
            this.$startVoipCall({
                audioOnly: false,
                conversation: conversation,
                devices: this.externalDevice,
            });
        },

        onPickFile(event) {
            let files = event.target.files;
            for (let i = 0; i < files.length; i++) {
                if (isElectron()) {
                    if (
                        new Date().getTime() - files[i].lastModified <
                            30 * 1000 &&
                        files[i].path.indexOf("/var/folders") === 0
                    ) {
                        return;
                    }
                }
                this.$eventBus.$emit("uploadFile", files[i]);
                let obj = this.setAnonymousFileInfo();
                store.sendFile(
                    this.conversationInfo.conversation,
                    files[i],
                    obj
                );
            }
            event.target.value = "";
            // 发送文件，会话消息列表需要滚动到最后
            store.setShouldAutoScrollToBottom(true);
        },

        // initEmojiPicker() {
        //   let config = emojiConfig()
        //   if (
        //     this.conversationInfo.conversation.type === ConversationType.SecretChat
        //   ) {
        //     this.emojiCategories = config.emojiCategories.filter(
        //       (c) => !c.name.startsWith('Sticker')
        //     )
        //     this.emojis = config.emojis.filter(
        //       (c) => !c.category.startsWith('Sticker')
        //     )
        //     this.$refs.emojiPicker.changeCategory({ name: 'Peoples' })
        //   } else {
        //     this.emojiCategories = config.emojiCategories
        //     this.emojis = config.emojis
        //   }
        // },

        initMention(conversation) {
            // TODO group, channel
            if (this.tribute) {
                this.tribute.detach(this.$refs["input"]);
                this.tribute = null;
            }
            let type = conversation.conversationType;
            if (
                type === ConversationType.Single ||
                type === ConversationType.ChatRoom
            ) {
                return;
            }

            let mentionMenuItems = [];
            let groupInfo = wfc.getGroupInfo(conversation.target);
            //首先要判断权限如果不是群主不能@所有人然后在进行添加所有人
            //   let groupMember = wfc.getGroupMember(groupInfo.target, wfc.getUserId())
            // if (groupMember.type == 2) {
            let groupAvatar = groupInfo.portrait.startsWith("/fs/")
                ? `${Config.STATIC_SERVER}/im-fs/${groupInfo.portrait}`
                : groupInfo.portrait;
            mentionMenuItems.push({
                key: this.$t("conversation.all_people"),
                value: "@" + conversation.target,
                avatar: groupAvatar,
                //searchKey: '所有人' + pinyin.letter('所有人', '', null)
                searchKey:
                    this.$t("conversation.all_people") + "suoyouren" + "syr",
                showName: this.$t("conversation.all_people"),
            });
            // }
            //判断是不是匿名群聊如果是就循环
            if (
                ModelConversationInfo &&
                ModelConversationInfo.anonymous_memberList &&
                ModelConversationInfo.anonymous_memberList.length
            ) {
                ModelConversationInfo.anonymous_memberList.map((item) => {
                    if (item.memberId != wfc.getUserId()) {
                        mentionMenuItems.push({
                            key: item.anonymousName,
                            value: "@" + item.anonymousName,
                            avatar: `${Config.STATIC_SERVER}/im-fs${item.portrait}`,
                            searchKey: item.anonymousName,
                            showName: item.anonymousName,
                        });
                    }
                });
            } else {
                let groupMemberUserInfos = store.getGroupMemberUserInfos(
                    conversation.target,
                    true
                );
                groupMemberUserInfos.forEach((e) => {
                    mentionMenuItems.push({
                        key: this.mixinGetUserName(e),
                        value: "@" + e.uid,
                        avatar: e.portrait,
                        searchKey: e.displayName + e._pinyin + e._firstLetters,
                        showName: this.mixinShowGroupUserName(e),
                    });
                });
            }
            this.tribute = new Tribute({
                // specify whether a space is required before the trigger string
                requireLeadingSpace: false,
                // specify whether a space is allowed in the middle of mentions
                values: mentionMenuItems,
                selectTemplate: (item) => {
                    if (typeof item === "undefined") return null;
                    // if (this.range.isContentEditable(this.current.element)) {
                    //     return '<span contenteditable="false"><a href="http://zurb.com" target="_blank" title="' + item.original.email + '">' + item.original.value + '</a></span>';
                    // }
                    this.mentions.push({
                        key: this.mixinHtmlEncode(item.original.key),
                        value: item.original.value,
                        showName: this.mixinHtmlEncode(item.original.showName),
                    });
                    return `@${this.mixinHtmlEncode(item.original.showName)}`;
                },
                menuItemTemplate: (item) => {
                    return `<img width="24" height="24"  draggable="false" src="${
                        !Config.OLD_HTTP_PORTRAIT.includes(item.original.avatar)
                            ? item.original.avatar
                            : Config.DEFAULT_PORTRAIT_URL
                    }">${this.mixinHtmlEncode(item.original.key)}`;
                },
                noMatchTemplate: () => {
                    return '<span style:"visibility: hidden;"></span>';
                },
                lookup: (item) => {
                    return item.searchKey;
                },
                menuContainer: document.getElementById("conversation-content"),
            });
            this.tribute.attach(this.$refs["input"]);
        },

        handleMention(text) {
            let textMessageContent = new TextMessageContent();
            textMessageContent && (textMessageContent.content = text.trim());
            this.mentions.forEach((e) => {
                if (text.indexOf(e.key) > -1) {
                    if (
                        e.value ===
                        "@" + this.conversationInfo.conversation.target
                    ) {
                        textMessageContent.mentionedType = 2;
                    } else {
                        if (textMessageContent.mentionedType !== 2) {
                            textMessageContent.mentionedType = 1;
                            textMessageContent.mentionedTargets.push(
                                e.value.substring(1)
                            );
                        }
                    }
                }
            });

            this.mentions.length = 0;
            return textMessageContent;
        },

        focusInput() {
            this.$nextTick(() => {
                this.$refs["input"] && this.$refs["input"].focus();
                console.log("focus end");
            });
        },

        moveCursorToEnd(contentEditableDiv) {
            let range = document.createRange();
            range.selectNodeContents(contentEditableDiv);
            range.collapse(false);
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },

        restoreDraft() {
            let draft = Draft.getConversationDraftEx(this.conversationInfo);
            if (!draft) {
                return;
            }
            console.log("restore draft", this.conversationInfo, draft);
            store.quoteMessage(draft.quotedMessage);
            let input = this.$refs["input"];
            if (input.innerHTML.trim()) {
                // console.log("inputting, ignore", draft.text);
            } else {
                input.innerHTML = draft.text
                    .replace(/ /g, "&nbsp")
                    .replace(/\n/g, "<br>");
                this.moveCursorToEnd(input);
            }
        },

        storeDraft(conversationInfo) {
            if (!this.$refs["input"]) {
                return;
            }
            let draftText = this.$refs["input"].innerHTML.trim();
            draftText = draftText
                .replace(/<br>/g, "\n")
                .replace(/<div>/g, "\n")
                .replace(/<\/div>/g, "")
                .replace(/<div><\/div>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/<img class="emoji" draggable="false" alt="/g, "")
                // https://chat-minio.tongfudun.com/emoji/72x72/263a.png
                .replace(
                    /" src="https:\/\/chat-minio\.tongfudun\.com\/emoji\/72x72\/[0-9a-z-]+\.png">/g,
                    ""
                )
                .replace(/<img src="local-resource:.*">/g, "")
                .trimStart()
                .replace(/\s+$/g, " ");

            let mentions = [];
            this.mentions.forEach((e) => {
                let mention;
                /**
                 *  e.key: "13866666666"
                 *  e.value: "@q0H7q7MM"
                 */
                let start = draftText.indexOf("@" + e.key);
                let end = start + 1 + e.key.length;
                if (start > -1) {
                    if (
                        e.value ===
                        "@" + this.conversationInfo.conversation.target
                    ) {
                        mention = new Mention(
                            start,
                            end,
                            this.conversationInfo.conversation.target,
                            true
                        );
                    } else {
                        mention = new Mention(
                            start,
                            end,
                            e.value.substring(1),
                            false
                        );
                    }
                    mentions.push(mention);
                }
            });

            let mentionCount = this.mentions ? this.mentions.length : 0;
            if (
                mentionCount > 0 &&
                draftText.endsWith(
                    "@" + this.mentions[mentionCount - 1].key + " "
                )
            ) {
                // @的最后一个空格不能删除
                // do nothing
            } else {
                draftText = draftText.trimEnd();
            }

            let quoteInfo = null;
            if (conversationInfo._quotedMessage) {
                quoteInfo = QuoteInfo.initWithMessage(
                    conversationInfo._quotedMessage
                );
            }

            if (draftText.length === 0 && !quoteInfo) {
                if (conversationInfo.draft !== "") {
                    Draft.setConversationDraft(
                        conversationInfo.conversation,
                        draftText,
                        quoteInfo,
                        mentions
                    );
                }
            } else {
                if (
                    draftText !== conversationInfo.draft ||
                    (!conversationInfo.draft && quoteInfo)
                ) {
                    Draft.setConversationDraft(
                        conversationInfo.conversation,
                        draftText,
                        quoteInfo,
                        mentions
                    );
                }
            }
        },

        onGroupMembersUpdate(groupId) {
            if (
                this.conversationInfo &&
                this.conversationInfo.conversation.type ===
                    ConversationType.Group &&
                this.conversationInfo.conversation.target === groupId
            ) {
                this.initMention(this.conversationInfo.conversation);
            }
        },
        // 获取链上文档分享信息
        async shareFileInfo(originFileId, i, length) {
            try {
                const { conversation } = this.conversationInfo;
                let res = await shareFile({
                    originFileId,
                    originType: "0", //0:链上文档分享  1:本地
                    targetType:
                        conversation.type === ConversationType.Group
                            ? "1"
                            : "0", //  0个人  1 群
                    imFileId: md5(Math.random() * 1e31 + ""), // 生成32位字符串
                });
                const { data, code, message } = res.data;
                if (code === "000000") {
                    if (i === length - 1) {
                        this.$Message.loading({
                            content: this.$t("message.sending"),
                            duration: length,
                        });
                    }
                    // 链上文档发送格式
                    store.sendCloudFile(
                        conversation,
                        {
                            ...data,
                            fromUserId: wfc.getUserId(),
                            fileId: originFileId,
                        },
                        this.setAnonymousFileInfo()
                    );
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 点击发送链上文档
        pickCloudFile() {
            this.$modal.show(
                QuickCloudFile,
                { title: "", btn: this.$t("common.send") },
                null,
                {
                    name: "QuickCloudFile-modal",
                    width: 750,
                    height: 500,
                    clickToClose: false, // 点击模态框是否关闭
                },
                {
                    "before-close": (event) => {
                        if (event.params && event.params.length) {
                            let arr = event.params;
                            for (let i = 0; i < arr.length; i++) {
                                this.shareFileInfo(arr[i], i, arr.length);
                            }
                        }
                    },
                }
            );
        },
        toggleChannelMenu(toggle = true) {
            if (toggle) {
                this.$parent.$refs[
                    "conversationMessageList"
                ].style.flexGrow = 1;
                this.storeDraft(this.lastConversationInfo);
                this.$refs["input"].innerHTML = "";
            } else {
                if (this.$parent.messageInputViewResized) {
                    this.$parent.$refs[
                        "conversationMessageList"
                    ].style.flexGrow = 0;
                }
            }
            store.toggleChannelMenu(toggle);
        },
    },

    activated() {
        if (!this.sharedConversationState.showChannelMenu) {
            this.restoreDraft();
            this.focusInput();
        }
    },

    deactivated() {
        if (!this.sharedConversationState.showChannelMenu) {
            this.storeDraft(this.lastConversationInfo);
            this.$refs["input"].innerHTML = "";
        }
    },

    mounted() {
        if (!this.sharedConversationState.showChannelMenu) {
            if (this.conversationInfo) {
                this.initMention(this.conversationInfo.conversation);
                //   this.initEmojiPicker()
                window.__twemoji_base_url__ = Config.TWEMOJI_URL;
                this.emojis = MyEmojis;
                this.restoreDraft();
            }
            this.focusInput();
        }
        this.lastConversationInfo = this.conversationInfo;

        if (isElectron()) {
            ipcRenderer.on("screenshots-ok", (event, args) => {
                // 插入图片
                if (args.filePath) {
                    setTimeout(() => {
                        document.execCommand(
                            "insertImage",
                            false,
                            "local-resource://" + args.filePath
                        );
                    }, 100);
                }
            });
        }
        this.storeDraftIntervalId = setInterval(() => {
            this.storeDraft(this.conversationInfo);
        }, 5 * 1000);
        // 设置音视频图标
        this.$nextTick(() => {
            this.isAnonymous = true;
            this.setIsAnonymous();
        });
    },

    created() {
        wfc.eventEmitter.on(
            EventType.GroupMembersUpdate,
            this.onGroupMembersUpdate
        );
    },

    unmounted() {
        if (isElectron()) {
            ipcRenderer.removeAllListeners("screenshots-ok");
        }
        if (this.storeDraftIntervalId) {
            clearInterval(this.storeDraftIntervalId);
        }
        wfc.eventEmitter.removeListener(
            EventType.GroupMembersUpdate,
            this.onGroupMembersUpdate
        );
    },

    watch: {
        conversationInfo: {
            handler: function () {
                let currentConversation = this.conversationInfo.conversation;
                let lastConversation = this.lastConversationInfo.conversation;
                if (
                    this.lastConversationInfo &&
                    !currentConversation.equal(lastConversation)
                ) {
                    this.$nextTick(() => {
                        if (this.sharedConversationState.showChannelMenu) {
                            this.$parent.$refs[
                                "conversationMessageList"
                            ].style.flexGrow = 1;
                            return;
                        }
                        if (this.$parent.messageInputViewResized) {
                            this.$parent.$refs[
                                "conversationMessageList"
                            ].style.flexGrow = 0;
                        }
                        if (
                            this.lastConversationInfo &&
                            !this.conversationInfo.conversation.equal(
                                lastConversation
                            )
                        ) {
                            this.storeDraft(this.lastConversationInfo);
                        }

                        if (
                            this.conversationInfo &&
                            (!this.lastConversationInfo ||
                                !this.conversationInfo.conversation.equal(
                                    lastConversation
                                ))
                        ) {
                            this.$refs.input.innerHTML = "";
                            this.restoreDraft();
                            this.initMention(
                                this.conversationInfo.conversation
                            );
                        }
                        this.lastConversationInfo = this.conversationInfo;
                        this.focusInput();
                    });
                }
                // 设置音视频图标
                this.$nextTick(() => {
                    this.setIsAnonymous();
                });

                //判断消息类型如果是1020就需要更新数据
                if (
                    this.lastConversationInfo &&
                    this.lastConversationInfo.lastMessage &&
                    this.lastConversationInfo.lastMessage.content.type == 1020
                ) {
                    this.getGroupAnonymousMembers(currentConversation);
                }
            },
            deep: true,
        },
    },

    computed: {
        externalDevice() {
            return this.$store.state.deviceObj;
        },
        quotedMessage() {
            this.$refs.input && this.$refs.input.focus();
            return this.sharedConversationState.quotedMessage;
        },

        // hasInputTextOrImage() {
        //   // TODO 监听input的输入情况
        //   return true;
        // },
        permissionList() {
            return this.$store.state.permissionList;
        },
        isChannel() {
            return (
                this.conversationInfo.conversation.type ===
                ConversationType.Channel
            );
        },
    },
    components: {
        ChannelMenuView,
        QuoteMessageView,
        VEmojiPicker,
    },
    directives: {
        vOnClickOutside,
        focus,
    },
};
</script>

<style lang="css" scoped>
.message-input-container {
    min-height: 200px;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}

#emoji {
    position: absolute;
    bottom: 55px;
    left: 0;
    background: #fff;
}

/*pls refer to https://vue-loader.vuejs.org/guide/scoped-css.html#child-component-root-elements*/
#emoji :deep(.container-emoji) {
    margin: 10px 0;
    height: 280px;
}

#emoji :deep(.container-emoji) .emoji-c {
    margin: 3px 0;
}

.input-action-container {
    height: 50px;
    min-height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding: 0 10px;
}

.input-wrap {
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
}

.input-wrap.flex-input {
    display: flex;
    flex-direction: column;
}

.input {
    flex: 1 1 auto;
    outline: none;
    padding: 0 20px;
    margin: 5px 0;
    overflow: auto;
    user-select: text;
    -webkit-user-select: text;
    font-size: 14px;
    min-height: 24px;
    word-break: break-word;
}

.input-action-container .action-bar {
    display: flex;
    align-items: center;
}

.input-action-container ul li {
    height: 22px;
    margin: 0 6px;
    transition: all 1s;
    position: relative;
}

.input-action-container ul li.screen-shot {
    display: flex;
    align-items: flex-end;
}

.input-action-container ul li .screen-shot-button {
    white-space: nowrap;
    position: absolute;
    left: 0;
    top: 100%;
    display: none;
    padding: 5px 10px;
    font-size: 12px;
    background-color: #b8b8b8;
    border-radius: 5px;
    color: #fff;
}

.input-action-container ul li .hidden-btn {
    width: 10px;
    height: 17px;
    margin-left: 5px;
    font-size: 10px;
}

.input-action-container ul li .hidden-btn:hover .screen-shot-button {
    display: block;
    min-width: 120px;
    font-size: 12px;
}

.input-action-container ul li .hidden-btn:hover .screen-shot-button:hover {
    background-color: #1dbb88;
}

.input-action-container ul li img {
    color: #000;
    width: 22px;
    height: auto;
    display: inline-block;
}

.con_send {
    width: 100px;
    padding: 5px 30px;
    border-radius: 4px;
    margin-left: 20px;
    margin-right: 20px;
    border: 1px solid #cccccc;
}

.wra_con_send {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    margin: 10px 0;
}

button.con_send:hover {
    width: 100px;
    background-color: #20bf64;
    margin-left: 20px;
    margin-right: 20px;
    color: white;
}
</style>
<style>
.input img {
    width: auto;
    max-width: 100px;
    max-height: 100px;
}
</style>
