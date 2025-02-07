/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from '../messageContent'
import MessageContentType from '../messageContentType';

// 本消息由调用server api删除消息触发，请勿直接发送本消息
export default class RemoveDoubleConversation extends MessageContent {
    operatorId;

    constructor(operatorId) {
        super(MessageContentType.Remove_Double_Conversation);
        this.operatorId = operatorId;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            operatorId: this.operatorId
        };
        payload.content = JSON.stringify(obj);
        return payload
    }

    decode(payload) {
        super.decode(payload);
        if (payload.content) {
            this.operatorId = JSON.parse(payload.content) && JSON.parse(payload.content).operatorId;
        }

    }
}
