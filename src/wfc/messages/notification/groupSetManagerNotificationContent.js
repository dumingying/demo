/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */


import GroupNotificationContent from "./groupNotification";
import MessageContentType from "../messageContentType";
import wfc from "../../client/wfc";

import { getItem } from "@/ui/util/storageHelper";

export default class GroupSetManagerNotificationContent extends GroupNotificationContent {
    operator;
    // 1, 设置为管理员；0，取消管理员
    setManagerType;

    memberIds = [];


    constructor(operator, setManagerType, memberIds) {
        super(MessageContentType.SetGroupManager_Notification);
        this.operator = operator;
        this.setManagerType = setManagerType;
        this.memberIds = memberIds;
    }


    formatNotification(message) {
        // console.log(message, this.fromSelf, this.operator, this.memberIds)
        let isEn = getItem('lang') === 'en'
        // this.operator  操作人 this.fromSelf 仅群主可操作
        // this.memberIds 被操作人
        let str1 = isEn ? 'has been ' : "已将“"
        let str2 = isEn ? 'You have been ' : "你已被群主"
        let str3 = isEn ? 'removed from the group administrator by the group owner: ' : "从群管理员中移除"
        let str4 = isEn ? 'set as a group administrator by the group owner: ' : "设置为群管理员"

        let str5 = isEn ? 'added as a group administrator' : "添加为群管理员"
        let str6 = isEn ? 'removed from the group admins' : "从群管理员中移除"
        let notifyStr = ''
        if (this.memberIds.length === 1) {
            if (this.fromSelf || this.memberIds[0] !== wfc.getUserId()) {
                if (isEn) {
                    notifyStr = `“${wfc.getGroupMemberDisplayName(this.groupId, this.memberIds[0])}”${str1}${this.setManagerType === 0 ? str6 : str5}`
                } else {
                    notifyStr = `已将“${wfc.getGroupMemberDisplayName(this.groupId, this.memberIds[0])}”`
                    notifyStr += this.setManagerType === 0 ? '从群管理员中移除' : '添加为群管理员';
                }

            } else {
                if (isEn) {
                    notifyStr = `${str2}${this.setManagerType === 0 ? str3 : str4}“${wfc.getGroupMemberDisplayName(this.groupId, this.operator)}”`
                } else {
                    notifyStr = `你已被群主“${wfc.getGroupMemberDisplayName(this.groupId, this.operator)} ”`
                    notifyStr += this.setManagerType === 0 ? '从群管理员中移除' : '设置为群管理员';
                }

            }
        } else {
            if (isEn) {
                this.memberIds.forEach((memberId) => {
                    notifyStr = `“${wfc.getGroupMemberDisplayName(this.groupId, memberId)}”`
                })
                if (this.fromSelf) {
                    notifyStr += `${str1}${this.setManagerType === 0 ? str6 : str5}`
                }
            } else {
                if (this.fromSelf) {
                    notifyStr = str1
                }
                this.memberIds.forEach((memberId) => {
                    notifyStr += `“${wfc.getGroupMemberDisplayName(this.groupId, memberId)}”`
                })
                notifyStr += this.setManagerType === 0 ? '从群管理员中移除' : '添加为群管理员';
            }

        }
        return notifyStr;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            o: this.operator,
            n: this.setManagerType + '',
            ms: this.memberIds,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let obj = JSON.parse(wfc.b64_to_utf8(payload.binaryContent));
        this.groupId = obj.g;
        this.operator = obj.o;
        this.setManagerType = parseInt(obj.n);
        this.memberIds = obj.ms;
    }
}
