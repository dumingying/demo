/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from "../messageContent";
import MessageContentType from "../messageContentType";
import { getItem } from "@/ui/util/storageHelper";
import wfc from "../../client/wfc";
export default class DTCMessageContent extends MessageContent {
    content;
    constructor(content) {
        super(MessageContentType.DTC_Message_Content);
        this.content = content;
    }
    digest(message) {
        let lang = getItem("lang");
        const { sendUserId } = message.messageContent.content;

        let str1 =
            lang === "en"
                ? "[You received a integral red packet, please check it on your phone]"
                : "[你收到了一个积分红包，请在手机上查看]";
        let str2 =
            lang === "en"
                ? "[You sent a integral red packet]"
                : "[你发送了一个积分红包]";

        return sendUserId === wfc.getUserId() ? str2 : str1;
    }

    encode() {
        let payload = super.encode();
        payload.content = this.content;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let content =
            typeof payload.content === "string"
                ? JSON.parse(payload.content)
                : payload.content;
        this.content = content;
    }
}
