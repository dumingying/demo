/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import GroupNotificationContent from '../../notification/groupNotification'
import MessageContentType from '../../messageContentType';
import { getItem } from "@/ui/util/storageHelper";
//ANONYMOUS_REFRESH
export default class AnonymousRefreshNotificationMessageContent extends GroupNotificationContent {


    constructor() {
        super(MessageContentType.TENPEI);
    }

    formatNotification() {
        let lang = getItem('lang')
        return lang === 'en' ? 'Anonymous has been reset' : '匿名已重新分配';
    }

    encode() {
        let payload = super.encode();
        return payload;
    };

    decode(payload) {
        super.decode(payload);
    }
}
