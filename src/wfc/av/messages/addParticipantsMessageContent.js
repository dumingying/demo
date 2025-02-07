/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
import NotificationMessageContent from "../../messages/notification/notificationMessageContent";
import MessageContentType from "../../messages/messageContentType";
import wfc from "../../client/wfc"

import { getItem } from "@/ui/util/storageHelper";

class ParticipantStatus {
    userId;
    acceptTime;
    joinTime;
    videoMuted;
}

export default class AddParticipantsMessageContent extends NotificationMessageContent {
    callId;
    initiator;
    pin;
    participants;
    existParticipants;
    audioOnly;
    autoAnswer;
    clientId;

    constructor() {
        super(MessageContentType.VOIP_CONTENT_TYPE_ADD_PARTICIPANT);
    }

    formatNotification(message) {
        let isEn = getItem('lang') === 'en'
        let str1 = isEn ? 'You' : '您'
        let str2 = isEn ? 'invited' : '邀请'
        let str3 = isEn ? ' to join to an encrypted call' : "加入了加密通话"
        let nameStr = ''
        if (this.participants.length) {
            nameStr = this.participants.map(item => {
                return item === wfc.getUserId() ? str1 : wfc.getUserDisplayName(item)
            }).join('、')
        }
        return `${this.initiator === wfc.getUserId() ? str1 : wfc.getUserDisplayName(this.initiator)} ${str2} ${nameStr} ${str3}`
    }

    encode() {
        let payload = super.encode();
        payload.content = this.callId;

        let obj = {
            initiator: this.initiator,
            audioOnly: this.audioOnly ? 1 : 0,
            pin: this.pin,
            participants: this.participants,
            existParticipants: this.existParticipants,
            autoAnswer: this.autoAnswer,
            clientId: this.clientId,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        // 注释掉了
        let epids = this.existParticipants.map(p => p.userId);
        let pushData = {
            callId: this.callId,
            audioOnly: this.audioOnly,
            participants: this.participants,
            existParticipants: epids,
        }
        payload.pushData = JSON.stringify(pushData);
        // 注释掉了
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.callId = payload.content;
        let json = wfc.b64_to_utf8(payload.binaryContent);
        let obj = JSON.parse(json);
        this.initiator = obj.initiator;
        this.audioOnly = obj.audioOnly === 1;
        this.pin = obj.pin;
        this.participants = obj.participants;
        this.existParticipants = obj.existParticipants;
        this.autoAnswer = obj.autoAnswer;
        this.clientId = obj.clientId;
    }
}
