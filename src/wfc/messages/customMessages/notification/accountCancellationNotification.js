import MessageContent from "../../messageContent";
import MessageContentType from "../../messageContentType";

export default class AccountCancellationContent extends MessageContent {

    constructor() {
        super(MessageContentType.Account_Cancellation_Notification);
    }

    digest(message) {
        return '';
    }

    encode() {
        return '';
    }

    decode(payload) {
        // super.decode(payload);
    }
}
