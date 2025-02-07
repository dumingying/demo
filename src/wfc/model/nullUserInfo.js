/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import UserInfo from "./userInfo";
import { getItem } from "@/ui/util/storageHelper";
export default class NullUserInfo extends UserInfo {
    constructor(userId) {
        super();
        this.uid = userId;
        //this.name = '<' + userId + '>';
        this.name = getItem('lang') === 'en' ? 'Unknown user' : '未知用户';
        this.displayName = this.name;
        this.portrait = '';
    }
}
