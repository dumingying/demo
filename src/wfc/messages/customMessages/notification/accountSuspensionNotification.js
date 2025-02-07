import MessageContent from "../../messageContent";
import MessageContentType from "../../messageContentType";

export default class AccountSuspensionNotification extends MessageContent {
    constructor() {
        super(MessageContentType.Account_Suspension_Notification);
    }

    digest(message) {
        return "";
    }

    encode() {
        return "";
    }

    decode(payload) {
        // super.decode(payload);
    }
}
