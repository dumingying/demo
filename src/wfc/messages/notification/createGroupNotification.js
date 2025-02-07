/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import wfc from '../../client/wfc'
import MessageContentType from '../messageContentType';

import GroupNotificationContent from './groupNotification';

import { getItem } from "@/ui/util/storageHelper";
export default class CreateGroupNotification extends GroupNotificationContent {
    creator = '';
    groupName = '';
    extra = ''

    constructor(creator, groupName, extra) {
        super(MessageContentType.CreateGroup_Notification);
        this.creator = creator;
        this.groupName = groupName;
        this.extra = extra
    }

    formatNotification() {
        let isEn = getItem('lang') === 'en'

        if (this.extra && JSON.parse(this.extra).is_anonymous === 1) {
            return isEn ? "New anonymous Group Chat" : '新的匿名群聊'
        } else {
            let groupName = typeof this.groupName == 'undefined' ? '' : this.groupName
            if (this.fromSelf) {
                return `${isEn ? "You created the group " : '您创建了群聊'}“${groupName}”`;
            } else {
                // 处理脱敏手机号
                let userName = wfc.getUserDisplayName(this.creator)
                if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(userName)) {
                    userName = userName.replace(/(\d{3})\d*(\d{4})/, '$1****$2')
                }
                return `${userName}${isEn ? " created the group " : '创建了群聊'}${groupName}`;
            }
        }
    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            n: this.groupName,
            o: this.creator,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let json = wfc.b64_to_utf8(payload.binaryContent)
        let obj = JSON.parse(json);
        this.groupId = obj.g;
        this.creator = obj.o;
        this.groupName = obj.n;
    }
}
