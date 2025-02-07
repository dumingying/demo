import MessageContent from "../messageContent";
import MessageContentType from "../messageContentType";
// import wfc from "../../client/wfc";

export default class VipChangeContent extends MessageContent {

    constructor() {
        super(MessageContentType.Vip_Change);
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
