import MessageContent from "../../../messages/messageContent";
import MessageContentType from "../../../messages/messageContentType";

export default class QuickMeetingContent extends MessageContent {
    status
    callId
    host
    meetingCode
    title

    constructor(status, callId, host, meetingCode, title) {
        super(MessageContentType.Voip_QuickMeeting_Ring);
        this.status = status
        this.callId = callId
        this.host = host
        this.meetingCode = meetingCode
        this.title = title
    }

    digest(message) {
        return '';
    }

    encode() {
        let payload = super.encode();
        let obj = {
            status: this.status,
            callId: this.callId,
            host: this.host,
            meetingCode: this.meetingCode,
            title: this.title
        }
        payload.content = JSON.stringify(obj);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.content) {
            let obj = JSON.parse(payload.content)
            if (obj) {
                this.status = obj.status
                this.callId = obj.callId
                this.host = obj.host
                this.meetingCode = obj.meetingCode
                this.title = obj.title
            }
        }
    }
}
