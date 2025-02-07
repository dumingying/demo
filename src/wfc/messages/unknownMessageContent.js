/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";
import { getItem } from "@/ui/util/storageHelper";

export default class UnknownMessageContent extends MessageContent {
    originalPayload;

    constructor(originalPayload) {
        super(MessageContentType.Unknown);
        this.originalPayload = originalPayload;
    }

    encode() {
        return this.originalPayload;
    }

    decode(payload) {
        this.originalPayload = payload;
    }

    digest() {
        let lang = getItem('lang')
        return lang === 'en' ? 'Unknown Message' : '未知类型消息';
    }
}
