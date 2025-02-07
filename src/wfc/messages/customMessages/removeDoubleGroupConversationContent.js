/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from '../messageContent'
import MessageContentType from '../messageContentType';

// 本消息由调用server api删除消息触发，请勿直接发送本消息
export default class RemoveDoubleGroupConversation extends MessageContent {
    groupId;

    constructor(groupId) {
        super(MessageContentType.Remove_Double_Group_Conversation);
        this.groupId = groupId;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            groupId: this.groupId
        };
        payload.content = JSON.stringify(obj);
        return payload
    }

    decode(payload) {
        super.decode(payload);
        if (payload.content) {
            this.groupId = JSON.parse(payload.content) && JSON.parse(payload.content).groupId;
        }

    }
}
