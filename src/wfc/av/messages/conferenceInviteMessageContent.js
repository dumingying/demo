import MessageContent from "../../messages/messageContent";
import MessageContentType from "../../messages/messageContentType";
import { getItem } from "@/ui/util/storageHelper";
import wfc from "../../client/wfc";
export default class ConferenceInviteMessageContent extends MessageContent {
    callId;
    host;
    title;
    desc;
    startTime;
    endTime;
    audioOnly;
    audience;
    pin;
    advanced;
    meetingCode;
    meetingType;
    isPasswordNeed;
    password;
    constructor(callId, host, title, desc, startTime, audioOnly, audience, advance, pin, endTime, meetingCode, meetingType, isPasswordNeed, password) {
        super(MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE);
        this.callId = callId;
        this.host = host;
        this.title = title;
        this.desc = desc;
        this.startTime = startTime;
        this.audioOnly = audioOnly;
        this.audience = audience;
        this.advanced = advance;
        this.pin = pin;
        this.endTime = endTime;
        this.meetingCode = meetingCode;
        this.meetingType = meetingType;
        this.isPasswordNeed = isPasswordNeed;
        this.password = password;

    }

    digest(message) {
        let isEn = getItem('lang') === 'en'
        return `[${isEn ? 'Meeting Invitation' : "会议邀请"}:${this.title}]`
    }

    encode() {
        let payload = super.encode();
        let isEn = getItem('lang') === 'en'
        payload.content = this.callId;
        payload.pushContent = isEn ? 'Meeting Invitation' : "会议邀请";//推送
        let obj = {
            h: this.host,
            s: this.startTime,
            t: this.title,
            d: this.desc,
            audience: this.audience ? 1 : 0,
            advanced: this.advanced ? 1 : 0,
            a: this.audioOnly ? 1 : 0,
            p: this.pin,
            endTime: this.endTime,
            meetingCode: this.meetingCode,
            meetingType: this.meetingType,
            isPasswordNeed: this.isPasswordNeed,
            password: this.password

        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.binaryContent) {
            let json = wfc.b64_to_utf8(payload.binaryContent);
            let obj = JSON.parse(json);
            this.host = obj.h;
            this.startTime = obj.s;
            this.title = obj.t;
            this.desc = obj.d;
            this.audience = obj.audience > 0;
            this.advanced = obj.advanced > 0;
            this.audioOnly = obj.a > 0;
            this.pin = obj.p;
            this.endTime = obj.endTime;
            this.meetingCode = obj.meetingCode;
            this.meetingType = obj.meetingType;
            this.isPasswordNeed = obj.isPasswordNeed;
            this.password = obj.password;
        }
        this.callId = payload.content;
    }
}
