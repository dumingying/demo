/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContentMediaType from "./messageContentMediaType";
import MediaMessageContent from "./mediaMessageContent";
import MessageContentType from "./messageContentType";
import wfc from "../client/wfc";
import { getItem } from "@/ui/util/storageHelper";

export default class FileMessageContent extends MediaMessageContent {
    name = '';
    size = 0;

    imFileId;


    constructor(fileOrLocalPath, remotePath, name, size, imFileId) {
        super(MessageContentType.File, MessageContentMediaType.File, fileOrLocalPath, remotePath);
        if (fileOrLocalPath && fileOrLocalPath.name) {
            this.name = fileOrLocalPath.name;
            this.size = fileOrLocalPath.size;
        } else if (remotePath) {
            this.name = name ? name : remotePath.substring(remotePath.lastIndexOf('/') + 1)
            this.size = size ? size : 0;
        }
        this.imFileId = imFileId
    }

    digest() {
        let lang = getItem('lang')
        let str = lang === 'en' ? '[File]' : '[文件]'
        return str + this.name;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.name;
        let obj = { imFileId: this.imFileId };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj))
        payload.content = this.size + ''
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.searchableContent) {
            this.name = payload.searchableContent;
            let content = JSON.parse(payload.content);
            // 兼容历史错误类型问题
            if (typeof content === 'object') {
                this.size = Number(content.size);
                this.imFileId = content.imFileId;
            } else {
                this.size = Number(payload.content);
                if (payload.binaryContent) {
                    let json = wfc.b64_to_utf8(payload.binaryContent);
                    let obj = JSON.parse(json);
                    this.imFileId = obj.imFileId;
                }
            }
        }
    }

}
