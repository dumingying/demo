/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContentType from "../../../../messages/messageContentType";
import NotificationMessageContent from "../../../../messages/notification/notificationMessageContent";

// 分享屏幕通知消息
export default class ShareScreenNotificationMessageContent extends NotificationMessageContent {
    content;
    quoteInfo;

    constructor(content, mentionedType = 0, mentionedTargets = []) {
        super(
            MessageContentType.Share_Screen_Notification,
            mentionedType,
            mentionedTargets
        );
        this.content = content;
    }

    digest() {
        return this.content;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.content;
        payload.content = this.content;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.content = payload.searchableContent;
        this.content = payload.content;
    }

    setQuoteInfo(quoteInfo) {
        this.quoteInfo = quoteInfo;
    }
}
