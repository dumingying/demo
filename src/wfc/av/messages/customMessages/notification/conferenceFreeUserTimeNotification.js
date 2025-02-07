
import MessageContentType from "../../../../messages/messageContentType";
import NotificationMessageContent from "../../../../messages/notification/notificationMessageContent";

export default class ConferenceRequestNotification extends NotificationMessageContent {
    content;

    constructor(content) {
        super(MessageContentType.Conference_FreeUser_TimeNotification)
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
