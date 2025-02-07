/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import wfc from '../../client/wfc'
import MessageContentType from '../messageContentType';

import GroupNotificationContent from './groupNotification';

import { getItem } from "@/ui/util/storageHelper";
export default class DismissGroupNotification extends GroupNotificationContent {
    operator = '';

    constructor(operator) {
        super(MessageContentType.DismissGroup_Notification);
        this.operator = operator;
    }

    formatNotification() {
        let isEn = getItem('lang') === 'en'
        return isEn ? 'Group chat does not exist' : '群聊不存在'
        // if (this.fromSelf) {
        //     return '您解散了群聊';
        // } else {
        //     return '群主解散了群聊';
        // }
    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            o: this.operator,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let json = wfc.b64_to_utf8(payload.binaryContent)
        let obj = JSON.parse(json);
        this.groupId = obj.g;
        this.operator = obj.o;
    }
}
