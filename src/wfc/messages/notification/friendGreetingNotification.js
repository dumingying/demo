/*
 * Copyright (c) 2022 WildFireChat. All rights reserved.
 */

import NotificationMessageContent from "./notificationMessageContent";
import MessageContentType from "../messageContentType";
import { getItem } from "@/ui/util/storageHelper";
export default class FriendGreetingNotification extends NotificationMessageContent {
    constructor() {
        super(MessageContentType.Friend_Greeting);
    }

    formatNotification(message) {
        let isEn = getItem('lang') === 'en'
        return isEn ? "Greeting shown above" : "以上是打招呼的内容";
    }
}
