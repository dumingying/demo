/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import NotificationMessageContent from "./notificationMessageContent";
import MessageContentType from "../messageContentType";

export default class SafeNotificationMessageContent extends NotificationMessageContent {
    tip = "";

    constructor(tip) {
        super(MessageContentType.Safe_Notification);
        this.tip = tip;
    }

    formatNotification() {
        return this.tip;
    }

    digest() {
        return this.tip;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.tip;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.tip =
            payload.content ||
            "“链上会”团队提醒您，对方已经加您好友，并非任何官方客服，注意个人信息安全，切勿相信一切要求您共享自身信息的会议邀请，谨防诈骗等不法行为";
    }
}
