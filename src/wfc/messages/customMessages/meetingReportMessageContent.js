import MessageContent from "../messageContent";
import MessageContentType from "../messageContentType";
import { getItem } from "@/ui/util/storageHelper";

export default class MeetingReportMessageContent extends MessageContent {
    content
    posterUrl
    constructor() {
        super(MessageContentType.Meeting_Report)
    }

    digest(message) {
        if (message) {
            let lang = getItem('lang')
            let week = lang === 'en' ? 'Week summary' : "一周小结 "
            let month = lang === 'en' ? 'Monthly summary' : "月度总结 "
            let { content } = message.messageContent
            let time = `${content.startTime}-${content.endTime}`
            if (content.reportType === 1) {
                return `${week}  |  ${time}`
            } else {
                return `${month}  |  ${time}`
            }
        }
    }

    encode() {
        let payload = super.encode();
        payload.content = JSON.stringify(this.content);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let content = JSON.parse(payload.content)
        this.content = { ...content }
    }
}
