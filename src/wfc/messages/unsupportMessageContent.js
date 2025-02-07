/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContent from "./messageContent";
import { getItem } from "@/ui/util/storageHelper";

export default class UnsupportMessageContent extends MessageContent {

    digest() {
        let lang = getItem('lang')
        let str = lang === 'en' ? 'This type of message is not supported yet, please check on your mobile phone' : "尚不支持该类型消息, 请手机查看:"
        return str + this.type;
    }
}
