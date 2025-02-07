import MessageContent from "../messageContent";
import MessageContentType from "../messageContentType";
import { getItem } from "@/ui/util/storageHelper";

export default class ShareMembershipCouponMessageContent extends MessageContent {
    fromId;
    fromName;

    constructor(fromId, fromName) {
        super(MessageContentType.Share_Membership_Coupon);
        this.fromId = fromId;
        this.fromName = fromName;
    }

    digest(message) {
        let lang = getItem('lang')
        let str = lang === 'en' ? '[ChainPal]' : "[链上会]";
        return str;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            fromId: this.fromId,
            fromName: this.fromName
        };
        payload.content = JSON.stringify(obj);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.content) {
            let content = JSON.parse(payload.content);
            this.fromId = content.fromId;
            this.fromName = content.fromName;
        }
    }
}
