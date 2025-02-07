/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
export default class MessageContentType {
    // 基本消息类型
    static Unknown = 0;
    static Text = 1;
    static Voice = 2;
    static Image = 3;
    static Location = 4;
    static File = 5;
    static Video = 6;
    static Sticker = 7;
    static Link = 8;
    static P_Text = 9;
    static UserCard = 10;
    static Composite_Message = 11;
    static Rich_Notification = 12;
    static Articles = 13;

    static Mark_Unread_Sync = 31;

    static StartSecretChat_Notification = 40;

    //频道进出消息
    static Enter_Channel_Chat = 71;
    static Leave_Channel_Chat = 72;
    static Channel_Menu_Event = 73;

    // 提醒消息
    static RecallMessage_Notification = 80;
    static DeleteMessage_Notification = 81; //不存储的
    static Tip_Notification = 90;
    static Typing = 91;

    static Friend_Greeting = 92; // 以上是打招呼的内容
    static Friend_Added = 93;
    static PC_Login_Request = 94;

    // 群相关消息
    static CreateGroup_Notification = 104;
    static AddGroupMember_Notification = 105;
    static KickOffGroupMember_Notification = 106;
    static QuitGroup_Notification = 107;
    static DismissGroup_Notification = 108;
    static TransferGroupOwner_Notification = 109;
    static ChangeGroupName_Notification = 110;
    static ModifyGroupAlias_Notification = 111;
    static ChangeGroupPortrait_Notification = 112;
    static MuteGroup_Notification = 113;
    static ChangeJoinType_Notification = 114;
    static ChangePrivateChat_Notification = 115;
    static ChangeSearchable_Notification = 116;
    static SetGroupManager_Notification = 117;
    //禁言/取消禁言群成员的通知消息
    static MuteGroupMember_Notification = 118;
    // 全局禁言之后，允许群成员发言的通知消息
    static AllowGroupMember_Notification = 119;
    //踢出群成员的可见通知消息
    static KickOffGroupMember_Visible_Notification = 120;
    //退群的可见通知消息
    static QuitGroup_Visible_Notification = 121;

    static ModifyGroupExtra_Notification = 122;
    static ModifyGroupMemberExtra_Notification = 123;

    static VOIP_CONTENT_TYPE_START = 400;
    static VOIP_CONTENT_TYPE_END = 402;
    static VOIP_CONTENT_TYPE_ACCEPT = 401;
    static VOIP_CONTENT_TYPE_SIGNAL = 403;
    static VOIP_CONTENT_TYPE_MODIFY = 404;
    static VOIP_CONTENT_TYPE_ACCEPT_T = 405;
    static VOIP_CONTENT_TYPE_ADD_PARTICIPANT = 406;
    static VOIP_CONTENT_TYPE_MUTE_VIDEO = 407;
    static CONFERENCE_CONTENT_TYPE_INVITE = 408;
    static CONFERENCE_CONTENT_TYPE_CHANGE_MODE = 410;
    static CONFERENCE_CONTENT_TYPE_KICKOFF_MEMBER = 411;
    static CONFERENCE_CONTENT_TYPE_COMMAND = 412;

    static VOIP_Multi_Call_Ongoing = 416;
    static VOIP_Join_Call_Request = 417;

    static MESSAGE_CONTENT_TYPE_FEED = 501;
    static MESSAGE_CONTENT_TYPE_COMMENT = 502;

    //====================================== 分割线【自定义消息类型】 1000+ ====================================//
    static Account_Suspension_Notification = 1005; // token 过期 ，账号拉黑，通知账号
    static Cloud_Disk_Message_Content = 1007; //链上文档消息
    static Team_Message_Notification = 1010; //通付盾团队提醒消息
    static URL_Message_Content = 1012; //URL分享消息
    static Person_Card = 1013; //名片消息
    static ScreenShot_Notification = 1014; //手机截屏消息
    static FENPEI = 1020; // 重新分配的群
    static Share_Screen_Notification = 1021; //屏幕共享通知消息
    static Membership_Coupon = 1022; //会员券消息
    static Remove_Double_Conversation = 1023; // 删除对方消息 不存储的
    static Account_Cancellation_Notification = 1024; // 移动端账号注销
    static Vip_Change = 1025; //会员状态变更
    static Voip_QuickMeeting_Ring = 1026; // 快速会议中拨打会议响铃 1026
    //1027;  邀请会议的文案提醒
    static Share_Membership_Coupon = 1028; // 移动端发起分享会员券消息
    static Channel_Card = 1029; // 分享公众号名片
    static Conference_Request_Notification = 1030; // 会议申请中主持人角色展示的红点
    static Conference_Request_Status = 1031; // 会议申请进程消息
    static Meeting_Report = 1032; // 会议报告消息，1032
    static Conference_FreeUser_TimeNotification = 1033; //免费用户，会议时长50分钟提醒
    static Enter_QuickGroup_Notification = 1034; //快速建群中的进群通知
    static Remove_Double_Group_Conversation = 1035; // 删除群组消息 不存储的（仅群主）
    static AddressBook_ChatFriend_Notification = 1036; // 通讯录中某位好友注册了链上会进行消息提示
    // 1037;  插件管理相关的消息提醒，
    static Secret_Friend_Notification = 1038; // 多端同时登录时，同步密友设置状态
    static DTC_Message_Content = 1040; // 红包消息
}
