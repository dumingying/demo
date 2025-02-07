import MessageContent from "../../../messages/messageContent";
import MessageContentType from "../../../messages/messageContentType";

import { getItem } from "@/ui/util/storageHelper";

export default class ConferenceRequestStatusMessageContent extends MessageContent {
    content;

    constructor(content) {
        super(MessageContentType.Conference_Request_Status)
        this.content = content;
    }
    digest(message) {
        let isEn = getItem('lang') === 'en'
        let str = `[${isEn ? "Meeting application" : '会议申请'}:${isEn ? this.content.en : this.content.zh}]`
        return str;
    }
    encode() {
        let payload = super.encode();
        payload.content = JSON.stringify(this.content);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.content) {
            this.content = JSON.parse(payload.content);
        }

    }

}
