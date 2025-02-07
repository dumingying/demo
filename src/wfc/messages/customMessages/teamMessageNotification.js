/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from "../messageContent";
import MessageContentType from "../messageContentType";
import { getItem } from "@/ui/util/storageHelper";


export default class TeamMessageNotificationMessageContent extends MessageContent {
    content;
    constructor(content) {
        super(MessageContentType.Team_Message_Notification);
        this.content = content;
    }
    digest() {
        let lang = getItem('lang')
        return lang === 'en' ? this.content.titleEn || this.content.title : this.content.title
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
