/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import wfc from '../../client/wfc'
import MessageContentType from "../messageContentType";

import GroupNotificationContent from "./groupNotification";
import { getItem } from "@/ui/util/storageHelper";
export default class ChangeGroupNameNotification extends GroupNotificationContent {
    operator = '';
    name = '';

    constructor(operator, name) {
        super(MessageContentType.ChangeGroupName_Notification);
        this.operator = operator;
        this.name = name;
    }

    formatNotification(message) {
        let extra = message.messageContent.extra && JSON.parse(message.messageContent.extra)
        let isAnonymous = [1, '1'].includes(extra.is_anonymous)
        let lang = getItem('lang')
        let str1 = lang === 'en' ? 'You modify the group name to ' : "您修改群名称为"
        let str2 = lang === 'en' ? 'modify the group name to ' : "群名称改为"
        if (this.fromSelf) {
            return str1 + this.name;
        } else {
            //如果是匿名
            return isAnonymous ? str2 + this.name : wfc.getGroupMemberDisplayName(this.groupId, this.operator) + str2 + this.name;
        }
    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            n: this.name,
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
        this.name = obj.n;
    }

}
