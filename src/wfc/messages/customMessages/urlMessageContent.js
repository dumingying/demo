import MessageContent from "../messageContent";
import MessageContentType from "../messageContentType";
import { getItem } from "@/ui/util/storageHelper";

export default class UrlMessageContent extends MessageContent {
    urlTitle;
    urlAddress;
    urlContent;
    urlImage;
    longTitle;
    urlTitleEn = '';
    urlAddressEn = '';
    urlContentEn = '';
    longTitleEn = '';

    constructor(urlTitle, urlAddress, urlContent, urlImage, longTitle) {
        super(MessageContentType.URL_Message_Content);
        this.longTitle = longTitle || urlTitle;
        this.urlTitle = urlTitle;
        this.urlAddress = urlAddress;
        this.urlContent = urlContent;
        this.urlImage = urlImage;

    }

    digest() {
        let lang = getItem('lang')
        let str = lang === 'en' ? "[Link]" : "[链接]"
        let title = lang === 'en' ? this.urlTitleEn || this.urlTitle : this.urlTitle
        return `${str}${title}`;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            longTitle: this.longTitle,
            urlTitle: this.urlTitle,
            urlAddress: this.urlAddress,
            urlContent: this.urlContent,
            urlImage: this.urlImage,
            urlTitleEn: this.urlTitleEn,
            urlAddressEn: this.urlAddressEn,
            urlContentEn: this.urlContentEn,
            longTitleEn: this.longTitleEn
        };
        payload.content = JSON.stringify(obj);
        payload.pushContent = this.digest() //推送
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        if (payload.content) {
            let obj = JSON.parse(payload.content);
            this.longTitle = obj.longTitle;
            this.urlTitle = obj.urlTitle;
            this.urlAddress = obj.urlAddress;
            this.urlContent = obj.urlContent;
            this.longTitleEn = obj.longTitleEn;
            this.urlTitleEn = obj.urlTitleEn;
            this.urlAddressEn = obj.urlAddressEn;
            this.urlContentEn = obj.urlContentEn;
            this.urlImage = obj.urlImage;
        }
    }
}
