/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */
import wfc from '../../client/wfc'
import MessageContent from '../messageContent'
import MessageContentType from '../messageContentType'
import Config from '@/config'
import { getItem } from "@/ui/util/storageHelper";
export default class PersonCardMessageContent extends MessageContent {
    userId;
    userName;
    portrait

    constructor(userId, userName, portrait) {
        super(MessageContentType.Person_Card);
        this.userName = userName;
        this.portrait = portrait;
        this.userId = userId;
    }
    encode() {
        let payload = super.encode()
        payload.content = JSON.stringify({
            userId: this.userId,
            userName: this.userName,
            portrait: this.portrait,
        });
        return payload;
    }

    decode(payload) {
        super.decode(payload)
        if (payload.content) {
            let content = JSON.parse(payload.content)
            this.userName = content.userName;
            this.portrait = content.portrait;
            this.userId = content.userId
        }

    }

    digest(message) {
        let lang = getItem('lang')
        let str1 = lang === 'en' ? 'recommended ' : '推荐了'
        let str2 = lang === 'en' ? 'You ' : '你'
        let str3 = lang === 'en' ? 'Recommended' : '向你'
        // console.log(message)
        if (message) {
            let extra = message.messageContent.extra && JSON.parse(message.messageContent.extra)
            let isAnonymous = [1, '1'].includes(extra.is_anonymous)
            let str = str1 + this.userName
            let fromSelf = message.from === wfc.getUserId()
            if (fromSelf) {
                return str2 + str
            } else {
                // 匿名群
                if (isAnonymous) {
                    return `${extra.anonymous_name}: ${str3}'s contact card to you`
                } else if (message.conversation.type === 1) {
                    // 群组
                    return `${this.getUserName(message._from)}: ${str3}'s contact card to you`
                } else {
                    // 个人
                    return `${str3}'s contact card to you`
                }
            }

        } else {
            let msg = lang === 'en' ? '[Contact]' : '[联系人]';
            return msg + this.userName;
        }

    }
    // 群中昵称，备注朋友的名称，真实名称，手机号
    getUserName(user) {
        if (!user) return;
        let name = "";
        // 针对通付盾团队 名称需要特殊处理一下
        if (Config.TEAM_IDS.includes(user.uid)) {
            let arr = user.name.split("|")
            if (arr.length === 2) {
                return getItem('lang') === 'en' ? arr[1] : arr[0]
            } else if (arr.length === 1) {
                return arr[0]
            } else {
                return user.name
            }
        } else if (user.friendAlias) {
            name = user.friendAlias;
        } else if (user.groupAlias) {
            name = user.groupAlias;
        } else if (user.displayName) {
            name = user.displayName;
        } else {
            name = user.mobile;
        }
        if (name.length >= 34 && /^<(?![^a-zA-Z]+$)(?!\D+$)/.test(name)) {
            return user.mobile.replace(/(\d{3})\d*(\d{4})/, "$1****$2");
        }
        if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
            return name.replace(/(\d{3})\d*(\d{4})/, "$1****$2");
        }
        return name || "";
    }
}

