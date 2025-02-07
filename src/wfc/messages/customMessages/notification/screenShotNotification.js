/**
 *  移动端 截屏通知消息
 *  */
/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
import wfc from '../../../client/wfc'
import NotificationMessageContent from '../../notification/notificationMessageContent'
import MessageContentType from '../../messageContentType';

import { getItem } from "@/ui/util/storageHelper";

export default class ScreenShotNotification extends NotificationMessageContent {
    content = '';
    constructor(content) {
        super(MessageContentType.ScreenShot_Notification);
        this.content = content;
    }

    formatNotification() {
        let isEn = getItem('lang') === 'en'
        let name = ''
        let newContent = this.content && JSON.parse(this.content) || {}
        let { userId } = newContent
        name = userId && wfc.getUserDisplayName(userId)
        return `${name}${isEn ? " is taking a screen shot" : ' 正在截屏'}`
    }

    digest() {
        let isEn = getItem('lang') === 'en'
        let name = ''
        let newContent = this.content && JSON.parse(this.content) || {}
        let { userId } = newContent
        name = userId && wfc.getUserDisplayName(userId)
        return `${name}${isEn ? " is taking a screen shot" : ' 正在截屏'}`
    }
    encode() {
        let payload = super.encode();
        payload.content = this.content;
        return payload;
    };

    decode(payload) {
        super.decode(payload);
        this.content = payload.content;
    }
}
