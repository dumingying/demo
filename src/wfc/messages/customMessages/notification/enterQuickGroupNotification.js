
// 快速建群中的进群通知
import MessageContentType from "../../messageContentType";
import NotificationMessageContent from "../../notification/notificationMessageContent";

export default class EnterQuickGroupNotification extends NotificationMessageContent {
    content;

    constructor(content) {
        super(MessageContentType.Enter_QuickGroup_Notification)
        this.content = content;
    }
    digest() {
        return this.content;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.content;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.content = payload.content;
    }

}
