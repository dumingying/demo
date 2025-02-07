import MessageContent from "../messageContent";
import MessageContentType from "../messageContentType";
import { getItem } from "@/ui/util/storageHelper";

export default class MembershipCouponMessageContent extends MessageContent {
    couponId;
    fromId;
    fromName;
    couponCount;

    constructor(couponId, fromId, fromName, couponCount) {
        super(MessageContentType.Membership_Coupon);
        this.couponId = couponId;
        this.fromId = fromId;
        this.fromName = fromName;
        this.couponCount = couponCount;
    }

    digest(message) {
        let lang = getItem('lang')
        let str = lang === 'en' ? '[ChainPal]' : "[链上会]";
        return str;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            couponId: this.couponId,
            fromId: this.fromId,
            fromName: this.fromName,
            couponCount: this.couponCount
        };
        payload.content = JSON.stringify(obj);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.content) {
            let content = JSON.parse(payload.content);
            this.couponId = content.couponId;
            this.fromId = content.fromId;
            this.fromName = content.fromName;
            this.couponCount = content.couponCount;
        }
    }
}
