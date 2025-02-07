/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import wfc from '../../client/wfc'
import MessageContentType from '../messageContentType';
import GroupNotificationContent from './groupNotification';
import { getItem } from "@/ui/util/storageHelper";

export default class AddGroupMemberNotification extends GroupNotificationContent {
    invitor = '';
    invitees = [];

    constructor(invitor, invitees) {
        super(MessageContentType.AddGroupMember_Notification);
        this.invitor = invitor;
        this.invitees = invitees;
    }

    formatNotification(message) {
        let lang = getItem('lang')
        let extra = message.messageContent.extra && JSON.parse(message.messageContent.extra)
        let isAnonymous = [1, '1'].includes(extra.is_anonymous)
        let str1 = lang === 'en' ? 'You' : "您"
        let str2 = lang === 'en' ? 'joined the group chat' : "加入了群聊"
        let str3 = lang === 'en' ? 'invited ' : "邀请"
        let str4 = lang === 'en' ? 'to join the group chat' : "加入群聊"

        // 匿名群e
        if (isAnonymous) {
            return lang === 'en' ? 'New member joined the anonymous group chat' : "新的成员加入了匿名群聊"
        } else {
            if (this.invitees && this.invitees.length) {
                let length = this.invitees.length
                if (length === 1 && this.invitees[0] === this.invitor) {
                    return `${this.fromSelf || this.invitor === wfc.getUserId() ? str1 : wfc.getGroupMemberDisplayName(this.groupId, this.invitor)} ${str2}`
                } else {
                    let nameStr = ''
                    nameStr = this.invitees.map(item => {
                        return item === wfc.getUserId() ? str1 : wfc.getUserDisplayName(item)
                    }).join('、')
                    return `${this.fromSelf || this.invitor === wfc.getUserId() ? str1 : wfc.getGroupMemberDisplayName(this.groupId, this.invitor)
                        } ${str3} ${nameStr} ${str4}`;

                }
            } else {
                return lang === 'en' ? 'New member joined the group chat' : "新的成员加入了群聊"
            }
        }

    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            o: this.invitor,
            ms: this.invitees,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let json = wfc.b64_to_utf8(payload.binaryContent);
        let obj = JSON.parse(json);
        this.groupId = obj.g;
        this.invitor = obj.o;
        this.invitees = obj.ms;
    }
}
