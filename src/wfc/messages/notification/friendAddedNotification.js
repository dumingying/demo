/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import NotificationMessageContent from "./notificationMessageContent";
import MessageContentType from "../messageContentType";

import { getItem } from "@/ui/util/storageHelper";
export default class FriendAddedNotification extends NotificationMessageContent {

    constructor() {
        super(MessageContentType.Friend_Added);
    }

    formatNotification() {
        let isEn = getItem('lang') === 'en'
        // return "链上会团队提醒您，对方已经加您好友，并非任何官方客服，注意个人信息安全，切勿相信一切要求您共享自身信息的会议邀请，谨防诈骗等不法行为";
        return isEn ? 'Friends added successfully' : "好友添加成功";
    }
}
