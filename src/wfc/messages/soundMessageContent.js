/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MediaMessageContent from './mediaMessageContent'
import MessageContentMediaType from './messageContentMediaType';
import MessageContentType from './messageContentType';
import { getItem } from "@/ui/util/storageHelper";

export default class SoundMessageContent extends MediaMessageContent {
    duration;
    speechText;

    constructor(fileOrLocalPath, remotePath, duration) {
        super(MessageContentType.Voice, MessageContentMediaType.Voice, fileOrLocalPath, remotePath);
        this.duration = duration;
    }

    digest() {
        let lang = getItem('lang')
        let str = lang === 'en' ? '[Audio]' : "[语音]";
        return str
    }

    encode() {
        let payload = super.encode();
        payload.mediaType = MessageContentMediaType.Voice;
        let obj = {
            duration: this.duration,
            speechText: this.speechText
        };
        payload.content = JSON.stringify(obj);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let obj = JSON.parse(payload.content);
        this.duration = obj.duration;
        this.speechText = obj.speechText;
    }
}
