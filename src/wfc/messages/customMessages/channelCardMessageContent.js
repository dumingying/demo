/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from '../messageContent'
import MessageContentType from '../messageContentType'
import { getItem } from "@/ui/util/storageHelper";
export default class ChannelCardMessageContent extends MessageContent {
    channelId;
    title;
    desc;
    portrait
    channelName

    constructor(channelId, title, desc, portrait) {
        super(MessageContentType.Channel_Card);
        this.channelId = channelId;
        this.title = title;
        this.channelName = title;
        this.desc = desc;
        this.portrait = portrait;
    }

    encode() {
        let payload = super.encode()
        let obj = {
            channelId: this.channelId,
            title: this.title,
            desc: this.desc,
            portrait: this.portrait,
        };
        payload.content = JSON.stringify(obj);
        return payload;
    }

    decode(payload) {
        super.decode(payload)
        let obj = JSON.parse(payload.content);
        this.channelName = obj.title;
        this.portrait = obj.portrait;
        this.channelId = obj.channelId
        this.title = obj.title
        this.desc = obj.desc
    }

    digest() {
        let lang = getItem('lang')
        let msg = lang === 'en' ? '[Official Accounts]' : '[公众号名片]';
        return msg + this.title;
    }
}
