/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import TextMessageContent from "../messages/textMessageContent";
import PTextMessageContent from "../messages/ptextMessageContent";
import ImageMessageContent from "../messages/imageMessageContent";

import MessageContentType from "../messages/messageContentType";

import PersistFlag from "../messages/persistFlag";
import TipNotificationMessageContent from "../messages/notification/tipNotification";
import UnknownMessageContent from "../messages/unknownMessageContent";
import UnsupportMessageContent from "../messages/unsupportMessageContent";
import ChangeGroupNameNotification from "../messages/notification/changeGroupNameNotification";
import KickoffGroupMemberNotification from "../messages/notification/kickoffGroupMemberNotification";
import KickoffGroupMemberVisiableNotification from "../messages/notification/kickoffGroupMemberVisiableNotification";
import AddGroupMemberNotification from "../messages/notification/addGroupMemberNotification";
import ChangeGroupPortraitNotification from "../messages/notification/changeGroupPortraitNotification";
import CreateGroupNotification from "../messages/notification/createGroupNotification";
import DismissGroupNotification from "../messages/notification/dismissGroupNotification";
import ModifyGroupAliasNotification from "../messages/notification/modifyGroupAliasNotification";
import ModifyGroupExtraNotification from "../messages/notification/modifyGroupExtraNotification";
import ModifyGroupMemberExtraNotification from "../messages/notification/modifyGroupMemberExtraNotification";
import QuitGroupNotification from "../messages/notification/quitGroupNotification";
import QuitGroupVisiableNotification from "../messages/notification/quitGroupVisiableNotification";
import TransferGroupOwnerNotification from "../messages/notification/transferGroupOwnerNotification";
import FileMessageContent from "../messages/fileMessageContent";
import VideoMessageContent from "../messages/videoMessageContent";
import StickerMessageContent from "../messages/stickerMessageContent";
import SoundMessageContent from "../messages/soundMessageContent";
import TypingMessageContent from "../messages/typingMessageContent";
import RecallMessageNotification from "../messages/notification/recallMessageNotification";
import DeleteMessageContent from "../messages/deleteMessageContent";

import CallStartMessageContent from "../av/messages/callStartMessageContent";
import CallAnswerMessageContent from "../av/messages/callAnswerMessageContent";
import CallAnswerTMessageContent from "../av/messages/callAnswerTMessageContent";
import CallByeMessageContent from "../av/messages/callByeMessageContent";
import CallSignalMessageContent from "../av/messages/callSignalMessageContent";
import CallModifyMessageContent from "../av/messages/callModifyMessageContent";
import AddParticipantsMessageContent from "../av/messages/addParticipantsMessageContent";
import MuteVideoMessageContent from "../av/messages/muteVideoMessageContent";
import GroupJoinTypeNotificationContent from "../messages/notification/groupJoinTypeNotificationContent";
import GroupMuteNotificationContent from "../messages/notification/groupMuteNotificationContent";
import GroupSetManagerNotificationContent from "../messages/notification/groupSetManagerNotificationContent";
import GroupPrivateChatNotificationContent from "../messages/notification/groupPrivateChatNotificationContent";
import LocationMessageContent from "../messages/locationMessageContent";
import MuteGroupMemberNotification from "../messages/notification/muteGroupMemberNotification";
import AllowGroupMemberNotification from "../messages/notification/allowGroupMemberNotification";
import CardMessageContent from "../messages/cardMessageContent";
import CompositeMessageContent from "../messages/compositeMessageContent";
import ConferenceInviteMessageContent from "../av/messages/conferenceInviteMessageContent";
import ConferenceChangeModeContent from "../av/messages/conferenceChangeModeContent";
import ConferenceKickoffMemberMessageContent from "../av/messages/conferenceKickoffMemberMessageContent";
// import MarkUnreadMessageContent from "../messages/markUnreadMessageContent";
import LinkMessageContent from "../messages/linkMessageContent";
import FriendAddedNotification from "../messages/notification/friendAddedNotification";
import FriendGreetingNotification from "../messages/notification/friendGreetingNotification";
import MultiCallOngoingMessageContent from "../av/messages/multiCallOngoingMessageContent";
import JoinCallRequestMessageContent from "../av/messages/joinCallRequestMessageContent";
import RichNotificationMessageContent from "../messages/notification/richNotificationMessageContent";
import ArticlesMessageContent from "../messages/articlesMessageContent";
import ConferenceCommandMessageContent from "../av/messages/conferenceCommandMessageContent";
import ChannelMenuEventMessageContent from "../messages/channelMenuEventMessageContent";
import EnterChannelChatMessageContent from "../messages/enterChannelChatMessageContent";
import LeaveChannelChatMessageContent from "../messages/leaveChannelChatMessageContent";

// ===================================== 自定义消息类型 ================================//
import AccountSuspensionNotification from "../messages/customMessages/notification/accountSuspensionNotification"; // 账号被拉黑 1005
import CloudDiskMessageContent from "../messages/customMessages/cloudDiskMessageContent";
import TeamMessageNotification from "../messages/customMessages/teamMessageNotification"; // 通付盾团队消息提醒
import UrlMessageContent from "../messages/customMessages/urlMessageContent";
import PersonCardMessageContent from "../messages/customMessages/personCardMessageContent";
import ScreenShotNotification from "../messages/customMessages/notification/screenShotNotification";
import AnonymousRefreshNotificationMessageContent from "../messages/customMessages/notification/anonymousRefreshNotification";
import ShareScreenNotificationMessageContent from "../av/messages/customMessages/notification/shareScreenNotificationMessageContent"; // 会议相关： 共享屏幕通知
import MembershipCoupon from "../messages/customMessages/membershipCouponMessageContent"; // 会员券
import RemoveDoubleConversationContent from "../messages/customMessages/removeDoubleConversationContent";
import AccountCancellationNotification from "../messages/customMessages/notification/accountCancellationNotification"; // 账号注销
import VipChange from "../messages/customMessages/vipChange"; // 会员等级变更
import QuickMeetingContent from "../av/messages/customMessages/quickMeetingContent"; // 会议相关： 快速会议呼起邀请处理
import ShareMembershipCoupon from "../messages/customMessages/shareMembershipCouponMessageContent"; // 会员券
import ChannelCardMessageContent from "../messages/customMessages/channelCardMessageContent";
import ConferenceRequestNotification from "../av/messages/customMessages/notification/conferenceRequestNotification"; //会议相关： 会议申请通知
import ConferenceRequestStatusMessage from "../av/messages/customMessages/conferenceRequestStatusMessage"; // 会议通知状态
import MeetingReportMessageContent from "../messages/customMessages/meetingReportMessageContent"; // 会议报告
import ConferenceFreeUserTimeNotification from "../av/messages/customMessages/notification/conferenceFreeUserTimeNotification"; // 会议中免费用户会议时长50分钟提醒
import EnterQuickGroupNotification from "../messages/customMessages/notification/enterQuickGroupNotification";
import RemoveDoubleGroupConversationContent from "../messages/customMessages/removeDoubleGroupConversationContent";
import AddressBookChatFriendNotification from "../messages/customMessages/notification/addressBookChatFriendNotification"; // 1036
import SecretFriendNotification from "../messages/customMessages/notification/secretFriendNotification"; // 1038
import DtcMessageContent from "../messages/customMessages/dtcMessageContent"; // 1040

export default class MessageConfig {
    static getMessageContentClazz(type) {
        for (const content of MessageConfig.MessageContents) {
            if (content.type === type) {
                if (content.contentClazz) {
                    return content.contentClazz;
                } else {
                    return UnsupportMessageContent;
                }
            }
        }
        console.log(`message type ${type} is unknown`);
        return UnknownMessageContent;
    }

    static getMessageContentFlag(type) {
        let flag = PersistFlag.No_Persist;
        for (const content of MessageConfig.MessageContents) {
            if (content.type === type) {
                flag = content.flag;
            }
        }
        return flag;
    }

    static getMessageContentPersitFlag(type) {
        for (const content of MessageConfig.MessageContents) {
            if (content.type === type) {
                return content.flag;
            }
        }
        return -1;
    }

    static getMessageContentType(messageContent) {
        for (const content of MessageConfig.MessageContents) {
            if (
                content.contentClazz &&
                messageContent instanceof content.contentClazz
            ) {
                return content.type;
            }
        }

        return MessageContentType.Unknown;
    }

    static registerMessageContent(name, flag, type, clazz) {
        // TODO validate args

        MessageConfig.MessageContents.push({
            name: name,
            flag: flag,
            type: type,
            contentClazz: clazz,
        });
    }

    static MessageContents = [
        {
            name: "unknown",
            flag: PersistFlag.Persist,
            type: MessageContentType.Unknown,
            contentClazz: UnknownMessageContent,
        },
        {
            name: "text",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Text,
            contentClazz: TextMessageContent,
        },
        {
            name: "ptext",
            flag: PersistFlag.Persist,
            type: MessageContentType.P_Text,
            contentClazz: PTextMessageContent,
        },
        {
            name: "voice",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Voice,
            contentClazz: SoundMessageContent,
        },

        {
            name: "image",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Image,
            contentClazz: ImageMessageContent,
        },
        {
            name: "location",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Location,
            contentClazz: LocationMessageContent,
        },
        {
            name: "file",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.File,
            contentClazz: FileMessageContent,
        },
        {
            name: "video",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Video,
            contentClazz: VideoMessageContent,
        },
        {
            name: "sticker",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Sticker,
            contentClazz: StickerMessageContent,
        },
        {
            name: "link",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Link,
            contentClazz: LinkMessageContent,
        },
        {
            name: "userCard",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.UserCard,
            contentClazz: CardMessageContent,
        },
        {
            name: "compositeMessage",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Composite_Message,
            contentClazz: CompositeMessageContent,
        },
        {
            name: "tip",
            flag: PersistFlag.Persist,
            type: MessageContentType.Tip_Notification,
            contentClazz: TipNotificationMessageContent,
        },
        {
            name: "typing",
            flag: PersistFlag.Transparent,
            type: MessageContentType.Typing,
            contentClazz: TypingMessageContent,
        },
        {
            name: "friendGreeting",
            flag: PersistFlag.Persist,
            type: MessageContentType.Friend_Greeting,
            contentClazz: FriendGreetingNotification,
        },
        {
            name: "friendAdded",
            flag: PersistFlag.Persist,
            type: MessageContentType.Friend_Added,
            contentClazz: FriendAddedNotification,
        },
        {
            name: "addGroupMemberNotification",
            flag: PersistFlag.Persist,
            type: MessageContentType.AddGroupMember_Notification,
            contentClazz: AddGroupMemberNotification,
        },
        {
            name: "changeGroupNameNotification",
            flag: PersistFlag.Persist,
            type: MessageContentType.ChangeGroupName_Notification,
            contentClazz: ChangeGroupNameNotification,
        },
        {
            name: "changeGroupPortraitNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.ChangeGroupPortrait_Notification,
            contentClazz: ChangeGroupPortraitNotification,
        },
        {
            name: "createGroupNotification",
            flag: PersistFlag.Persist,
            type: MessageContentType.CreateGroup_Notification,
            contentClazz: CreateGroupNotification,
        },
        // 0 不发送，1 退群时发送，2 踢人时发送，3 退群和踢人时都发送。
        {
            name: "dismissGroupNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.DismissGroup_Notification,
            contentClazz: DismissGroupNotification,
        },
        {
            name: "kickoffGroupMemberNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.KickOffGroupMember_Notification,
            contentClazz: KickoffGroupMemberNotification,
        },
        {
            name: "kickoffGroupMemberVisiableNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.KickOffGroupMember_Visible_Notification,
            contentClazz: KickoffGroupMemberVisiableNotification,
        },
        {
            name: "modifyGroupAliasNotification",
            flag: PersistFlag.Persist,
            type: MessageContentType.ModifyGroupAlias_Notification,
            contentClazz: ModifyGroupAliasNotification,
        },
        {
            name: "modifyGroupExtraNotification",
            flag: PersistFlag.Persist,
            type: MessageContentType.ModifyGroupExtra_Notification,
            contentClazz: ModifyGroupExtraNotification,
        },
        {
            name: "modifyGroupMemberExtraNotification",
            flag: PersistFlag.Persist,
            type: MessageContentType.ModifyGroupMemberExtra_Notification,
            contentClazz: ModifyGroupMemberExtraNotification,
        },
        {
            name: "quitGroupNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.QuitGroup_Notification,
            contentClazz: QuitGroupNotification,
        },
        {
            name: "quitGroupVisiableNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.QuitGroup_Visible_Notification,
            contentClazz: QuitGroupVisiableNotification,
        },
        {
            name: "transferGroupOwnerNotification",
            flag: PersistFlag.Persist,
            type: MessageContentType.TransferGroupOwner_Notification,
            contentClazz: TransferGroupOwnerNotification,
        },
        {
            name: "groupJoinTypeNotificationContent",
            flag: PersistFlag.Persist,
            type: MessageContentType.ChangeJoinType_Notification,
            contentClazz: GroupJoinTypeNotificationContent,
        },
        {
            name: "groupMuteNotificationContent",
            flag: PersistFlag.Persist,
            type: MessageContentType.MuteGroup_Notification,
            contentClazz: GroupMuteNotificationContent,
        },
        {
            name: "groupPrivateChatNotificationContent",
            flag: PersistFlag.Persist,
            type: MessageContentType.ChangePrivateChat_Notification,
            contentClazz: GroupPrivateChatNotificationContent,
        },
        {
            name: "groupSetManagerNotificationContent",
            flag: PersistFlag.Persist,
            type: MessageContentType.SetGroupManager_Notification,
            contentClazz: GroupSetManagerNotificationContent,
        },
        {
            name: "muteGroupMemberNotificationContent",
            flag: PersistFlag.Persist,
            type: MessageContentType.MuteGroupMember_Notification,
            contentClazz: MuteGroupMemberNotification,
        },
        {
            name: "allowGroupMemberNotificationContent",
            flag: PersistFlag.Persist,
            type: MessageContentType.AllowGroupMember_Notification,
            contentClazz: AllowGroupMemberNotification,
        },
        {
            name: "recall",
            flag: PersistFlag.Persist,
            type: MessageContentType.RecallMessage_Notification,
            contentClazz: RecallMessageNotification,
        },
        {
            name: "delete",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.DeleteMessage_Notification,
            contentClazz: DeleteMessageContent,
        },
        {
            name: "callStartMessageContent",
            flag: PersistFlag.Persist,
            type: MessageContentType.VOIP_CONTENT_TYPE_START,
            contentClazz: CallStartMessageContent,
        },
        {
            name: "callAnswerMessageContent",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.VOIP_CONTENT_TYPE_ACCEPT,
            contentClazz: CallAnswerMessageContent,
        },
        {
            name: "callAnswerTMessageContent",
            flag: PersistFlag.Transparent,
            type: MessageContentType.VOIP_CONTENT_TYPE_ACCEPT_T,
            contentClazz: CallAnswerTMessageContent,
        },
        {
            name: "callByeMessageContent",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.VOIP_CONTENT_TYPE_END,
            contentClazz: CallByeMessageContent,
        },
        {
            name: "callSignalMessageContent",
            flag: PersistFlag.Transparent,
            type: MessageContentType.VOIP_CONTENT_TYPE_SIGNAL,
            contentClazz: CallSignalMessageContent,
        },
        {
            name: "callModifyMessageContent",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.VOIP_CONTENT_TYPE_MODIFY,
            contentClazz: CallModifyMessageContent,
        },
        {
            name: "callAddParticipant",
            flag: PersistFlag.Persist,
            type: MessageContentType.VOIP_CONTENT_TYPE_ADD_PARTICIPANT,
            contentClazz: AddParticipantsMessageContent,
        },
        {
            name: "callMuteVideo",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.VOIP_CONTENT_TYPE_MUTE_VIDEO,
            contentClazz: MuteVideoMessageContent,
        },
        {
            name: "conferenceInvite",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE,
            contentClazz: ConferenceInviteMessageContent,
        },
        {
            name: "conferenceChangeMode",
            flag: PersistFlag.Transparent,
            type: MessageContentType.CONFERENCE_CONTENT_TYPE_CHANGE_MODE,
            contentClazz: ConferenceChangeModeContent,
        },
        {
            name: "conferenceKickoffMember",
            flag: PersistFlag.Transparent,
            type: MessageContentType.CONFERENCE_CONTENT_TYPE_KICKOFF_MEMBER,
            contentClazz: ConferenceKickoffMemberMessageContent,
        },
        {
            name: "multiCallOngoing",
            flag: PersistFlag.Transparent,
            type: MessageContentType.VOIP_Multi_Call_Ongoing,
            contentClazz: MultiCallOngoingMessageContent,
        },
        {
            name: "joinCallRequest",
            flag: PersistFlag.Transparent,
            type: MessageContentType.VOIP_Join_Call_Request,
            contentClazz: JoinCallRequestMessageContent,
        },
        // {
        //     name: 'markUnreadMessage',
        //     flag: PersistFlag.No_Persist,
        //     type: MessageContentType.Mark_Unread_Sync,
        //     contentClazz: MarkUnreadMessageContent,
        // },
        {
            name: "richNotification",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Rich_Notification,
            contentClazz: RichNotificationMessageContent,
        },
        {
            name: "articlesMessageContent",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Articles,
            contentClazz: ArticlesMessageContent,
        },
        // 公众号相关
        {
            name: "channelMenuEventMessageContent",
            flag: PersistFlag.Transparent,
            type: MessageContentType.Channel_Menu_Event,
            contentClazz: ChannelMenuEventMessageContent,
        },
        {
            name: "enterChannelChatMessageContent",
            flag: PersistFlag.Transparent,
            type: MessageContentType.Enter_Channel_Chat,
            contentClazz: EnterChannelChatMessageContent,
        },
        {
            name: "leaveChannelChatMessageContent",
            flag: PersistFlag.Transparent,
            type: MessageContentType.Leave_Channel_Chat,
            contentClazz: LeaveChannelChatMessageContent,
        },
        {
            name: "leaveChannelChatMessageContent",
            flag: PersistFlag.Transparent,
            type: MessageContentType.CONFERENCE_CONTENT_TYPE_COMMAND,
            contentClazz: ConferenceCommandMessageContent,
        },
        // ========================= 分割线【自定义消息类型】============================//
        // 自定义消息类型:账号被拉黑 1005
        {
            name: "accountSuspensionNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Account_Suspension_Notification,
            contentClazz: AccountSuspensionNotification,
        },
        // 自定义消息类型: 链上文档消息 1007
        {
            name: "cloudDiskMessageContent",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Cloud_Disk_Message_Content,
            contentClazz: CloudDiskMessageContent,
        },

        // 自定义消息类型: 通付盾团队消息提醒 1010
        {
            name: "teamMessage",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Team_Message_Notification,
            contentClazz: TeamMessageNotification,
        },
        // 自定义消息类型: URL分享链接消息  1012; //URL分享消息
        {
            name: "urlMessageContent",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.URL_Message_Content,
            contentClazz: UrlMessageContent,
        },
        //自定义消息类型:  名片消息 1013
        {
            name: "personCard",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Person_Card,
            contentClazz: PersonCardMessageContent,
        },
        // 自定义消息类型: 防截屏消息 1014
        {
            name: "screenShotNotification",
            flag: PersistFlag.Persist,
            type: MessageContentType.ScreenShot_Notification,
            contentClazz: ScreenShotNotification,
        },
        // 自定义消息类型: 重新分配的群 1020
        {
            name: "Reset",
            flag: PersistFlag.Persist,
            type: MessageContentType.FENPEI,
            contentClazz: AnonymousRefreshNotificationMessageContent,
        },
        // 自定义消息类型: 屏幕共享通知消息 1021
        {
            name: "shareScreenNotificationMessageContent",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Share_Screen_Notification,
            contentClazz: ShareScreenNotificationMessageContent,
        },
        // 自定义消息类型: 会员券消息 1022
        {
            name: "membershipCoupon",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Membership_Coupon,
            contentClazz: MembershipCoupon,
        },
        // 自定义消息类型: 删除对方消息 不存储的 1023;
        {
            name: "doubleDelete",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Remove_Double_Conversation,
            contentClazz: RemoveDoubleConversationContent,
        },
        // 自定义消息类型:账号注销消息 1024
        {
            name: "accountCancellation",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Account_Cancellation_Notification,
            contentClazz: AccountCancellationNotification,
        },
        // 自定义消息类型:会员信息变更 1025;
        {
            name: "vipChange",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Vip_Change,
            contentClazz: VipChange,
        },
        // 自定义消息类型:聊天框内快速会议呼起，1026
        {
            name: "quickMeetingContent",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Voip_QuickMeeting_Ring,
            contentClazz: QuickMeetingContent,
        },
        // 自定义消息类型: 会员券消息 1028
        {
            name: "shareMembershipCoupon",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Share_Membership_Coupon,
            contentClazz: ShareMembershipCoupon,
        },
        // 自定义消息类型:分享公众号名片 1029
        {
            name: "channelCard",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Channel_Card,
            contentClazz: ChannelCardMessageContent,
        },
        // 自定义消息类型:申请参会 1030
        {
            name: "conferenceRequest",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Conference_Request_Notification,
            contentClazz: ConferenceRequestNotification,
        },
        // 自定义消息类型:申请参会进度状态， 1031
        {
            name: "conferenceRequestStatus",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Conference_Request_Status,
            contentClazz: ConferenceRequestStatusMessage,
        },
        // 自定义消息类型:会议报告消息，1032
        {
            name: "meetingReportMessageContent",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.Meeting_Report,
            contentClazz: MeetingReportMessageContent,
        },
        // 自定义消息类型: 会议中免费用户会议时长50分钟提醒，1033
        {
            name: "conferenceFreeUserTimeNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Conference_FreeUser_TimeNotification,
            contentClazz: ConferenceFreeUserTimeNotification,
        },
        // 自定义消息类型: 快速建群中的成员 进群通知 1034
        {
            name: "enterQuickGroupNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Enter_QuickGroup_Notification,
            contentClazz: EnterQuickGroupNotification,
        },
        // 自定义消息类型: 群组中群主双侧删除消息 1035
        {
            name: "doubleDeleteGroup",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Remove_Double_Group_Conversation,
            contentClazz: RemoveDoubleGroupConversationContent,
        },
        // 自定义消息类型: 通讯录中某位好友注册了链上会进行消息提示 1036
        {
            name: "addressBookChatFriendNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.AddressBook_ChatFriend_Notification,
            contentClazz: AddressBookChatFriendNotification,
        },
        // 自定义消息类型: 秘密令牌开启与关闭同步消息
        {
            name: "secretFriendNotification",
            flag: PersistFlag.No_Persist,
            type: MessageContentType.Secret_Friend_Notification,
            contentClazz: SecretFriendNotification,
        },
        // 自定义消息类型: 秘密令牌开启与关闭同步消息 1040
        {
            name: "dtcMessageContent",
            flag: PersistFlag.Persist_And_Count,
            type: MessageContentType.DTC_Message_Content,
            contentClazz: DtcMessageContent,
        },
    ];
}
