/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MediaMessageContent from './mediaMessageContent';
import MessageContentMediaType from './messageContentMediaType';
import MessageContentType from './messageContentType';
import { getItem } from "@/ui/util/storageHelper";

export default class ImageMessageContent extends MediaMessageContent {
    // base64 encoded, 不包含头部:data:image/png;base64,
    thumbnail;
    imFileId;
    imFileName;
    imFileSize;
    fromDiskShare = 0

    constructor(fileOrLocalPath, remotePath, thumbnail) {
        super(MessageContentType.Image, MessageContentMediaType.Image, fileOrLocalPath, remotePath);
        this.thumbnail = thumbnail;
    }

    digest() {
        let lang = getItem('lang')
        return lang === 'en' ? '[Photo]' : '[图片]'
    }

    encode() {
        let payload = super.encode();
        payload.mediaType = MessageContentMediaType.Image;
        payload.binaryContent = this.thumbnail;
        payload.content = JSON.stringify({
            imFileId: this.imFileId + '',
            imFileName: this.imFileName,
            imFileSize: this.imFileSize,
            fromDiskShare: this.fromDiskShare
        });
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.thumbnail = payload.binaryContent;
        if (payload.content) {
            let obj = JSON.parse(payload.content);
            this.imFileId = obj.imFileId;
            this.imFileName = obj.imFileName;
            this.imFileSize = obj.imFileSize
            this.fromDiskShare = obj.fromDiskShare;
            this.size = obj.imFileSize
            this.name = obj.imFileName
        }
    }
}
