// 秘密令牌开启与关闭
import MessageContentType from "../../messageContentType";
import NotificationMessageContent from "../../notification/notificationMessageContent";

export default class SecretFriendNotification extends NotificationMessageContent {
    content;

    constructor(content) {
        super(MessageContentType.Secret_Friend_Notification);
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
