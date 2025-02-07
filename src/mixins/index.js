import { getItem, setItem } from "@/ui/util/storageHelper";
import Config from "@/config";
import wfc from "@/wfc/client/wfc";
import store from "@/store";
import {
    checkImFileExist,
    getPermissionList,
    getPluginsList,
    getHttpsPrepare,
} from "@/axios";

export default {
    data() {
        return {};
    },
    computed: {
        mixinHttps() {
            return getItem("ServerURL") || Config.DEFAULT_APP_SERVER;
        },
    },
    methods: {
        // 所有上传文件类型
        mixinUploaderFileType(type) {
            let obj = {
                image: [".gif", ".jpg", ".jpeg", ".png", ".bmp", ".webp"],
                audio: [".mp3", ".wav", ".wma", ".ogg", ".aac", ".flac"],
                document: [
                    ".doc",
                    ".txt",
                    ".docx",
                    ".pages",
                    ".epub",
                    ".pdf",
                    ".numbers",
                    ".csv",
                    ".xls",
                    ".xlsx",
                    ".keynote",
                    ".ppt",
                    ".pptx",
                    ".zip",
                    ".exe",
                    ".apk",
                    ".rar",
                    ".iso",
                    ".torrent",
                    ".wps",
                ],
            };
            return type === "all"
                ? [...obj["image"], ...obj["audio"], ...obj["document"]]
                : obj[type];
        },
        // 是否是图片 params {fileName:文件名称}
        mixinIsImage(fileName) {
            let arr = fileName.split(".");
            let suffix = arr[arr.length - 1];
            return this.mixinIsImageExt(suffix);
        },
        // 是否是图片 (后缀)
        mixinIsImageExt(ext) {
            return (
                [
                    "png",
                    "jpg",
                    "jpeg",
                    "bmp",
                    "gif",
                    "webp",
                    "psd",
                    "svg",
                    "tiff",
                ].indexOf(ext.toLowerCase()) !== -1
            );
        },
        // 是否是视频
        mixinIsVideo(fileName) {
            let arr = fileName.split(".");
            let suffix = arr[arr.length - 1];
            return this.mixinIsVideoExt(suffix);
        },
        // 视频 (后缀)
        mixinIsVideoExt(ext) {
            return (
                [
                    "mp4",
                    "avi",
                    "mov",
                    "ogg",
                    "mkv",
                    "rm",
                    "rmvb",
                    "mod",
                    "wmv",
                    "ram",
                    "swf",
                    "flv",
                    "mpg",
                    "mpeg",
                ].indexOf(ext.toLowerCase()) !== -1
            );
        },
        // 这是微信小程序官方给出的比较方法
        mixinCompareVersion(v1, v2) {
            if (!v1 || !v2) return;
            v1 = v1.split(".");
            v2 = v2.split(".");
            let sum1 = v1.join("");
            let sum2 = v2.join("");
            if (sum1 < sum2) {
                return 1;
            }
            if (sum1 > sum2) {
                return -1;
            }
            return 0;
        },
        // 群中昵称，备注朋友的名称，真实名称，手机号
        mixinGetUserName(user) {
            if (!user) return;
            let name = "";
            // 针对通付盾团队 名称需要特殊处理一下
            if (Config.TEAM_IDS.includes(user.uid)) {
                return this.mixinOfficialName(user.name);
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
                return this.mixinResetPhoneNumber(user.mobile);
            }
            if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
                return this.mixinResetPhoneNumber(name);
            }
            return name || this.$t("contact.unknown_user");
        },
        // 展示在群里面的名称
        mixinShowGroupUserName(user) {
            let name = "";
            if (user.groupAlias) {
                name = user.groupAlias;
            } else if (user.displayName) {
                name = user.displayName;
            } else {
                name = user.mobile;
            }
            if (name.length >= 34 && /^<(?![^a-zA-Z]+$)(?!\D+$)/.test(name)) {
                return this.mixinResetPhoneNumber(user.mobile);
            }
            if (/^1[3|4|5|7|8|9][0-9]{9}$/.test(name)) {
                return this.mixinResetPhoneNumber(name);
            }
            return name;
        },
        // 设置脱敏手机号
        mixinResetPhoneNumber(tel) {
            return (
                (tel && tel.replace(/(\d{3})\d*(\d{4})/, "$1****$2")) || "****"
            );
        },
        // 转换
        mixinTimestampFormat(timestamp) {
            timestamp = ~~(timestamp / 1000);
            let str = "";
            let hour = ~~(timestamp / 3600);
            str = hour > 0 ? (hour < 10 ? "0" : "") + hour + ":" : "";
            let min = ~~((timestamp % 3600) / 60);
            str += (min < 10 ? "0" : "") + min + ":";
            let sec = ~~(timestamp % 60);
            str += (sec < 10 ? "0" : "") + sec;
            return str;
        },
        // 设置默认头像
        mixinDefaultPortrait(src) {
            if (src) {
                if (src.indexOf("data:image") > -1) {
                    return src;
                } else if (src.startsWith("/fs/")) {
                    return `${Config.STATIC_SERVER}/im-fs${src}`;
                } else if (src.indexOf("http") > -1) {
                    return Config.OLD_HTTP_PORTRAIT.includes(src) ||
                        src === `${Config.STATIC_SERVER}/im-fs`
                        ? Config.DEFAULT_PORTRAIT_URL
                        : src;
                } else {
                    return Config.DEFAULT_PORTRAIT_URL;
                }
            } else {
                return Config.DEFAULT_PORTRAIT_URL;
            }
        },
        // 失败头像显示默认头像
        mixinImgUrlAlt(e) {
            e.target.src = Config.DEFAULT_PORTRAIT_URL;
        },
        // b=>gb 文件大小单位转换
        mixinTransfromByte(limit) {
            limit = Number(limit);
            let size = "";
            // 1 * 1024 * 1024 = 1048576;
            // 1 * 1024 * 1024 * 1024 =  1073741824
            if (limit < 1024) {
                //小于1KB，则转化成B
                // size = limit.toFixed(2) + "B";
                size = Math.round(limit * 100) / 100 + "B";
            } else if (limit < 1048576) {
                //小于1MB，则转化成KB
                // size = (limit / 1024).toFixed(2) + "KB";
                size = Math.round((limit / 1024) * 100) / 100 + "KB";
            } else if (limit < 1073741824) {
                //小于1GB，则转化成MB
                // size = (limit / 1048576).toFixed(2) + "MB";
                size = Math.round((limit / 1048576) * 100) / 100 + "MB";
            } else {
                //其他转化成GB
                // size = (limit / 1073741824).toFixed(2) + "GB";
                size = Math.round((limit / 1073741824) * 100) / 100 + "GB";
            }

            let sizeStr = size + ""; //转成字符串
            let index = sizeStr.indexOf("."); //获取小数点处的索引
            let dou = sizeStr.substr(index + 1, 2); //获取小数点后两位的值
            if (dou == "00") {
                //判断后两位是否为00，如果是则删除00
                return (
                    sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2)
                );
            }
            return sizeStr;
        },
        // ua 区分系统
        mixinIsMacOrWindow() {
            var agent = navigator.userAgent.toLowerCase();
            var isMac = /macintosh|mac os x/i.test(navigator.userAgent);
            if (agent.indexOf("win32") >= 0 || agent.indexOf("wow32") >= 0) {
                // console.log("这是windows32位系统")
                return "win";
            }
            if (agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) {
                // console.log("这是windows64位系统")
                return "win";
            }
            if (isMac) {
                // console.log("这是mac系统")
                return "mac";
            }
        },
        // html 进行转码
        mixinHtmlEncode(str) {
            var s = "";
            if (str.length == 0) return "";
            s = str.replace(/&/g, "&amp;");
            s = s.replace(/</g, "&lt;");
            s = s.replace(/>/g, "&gt;");
            s = s.replace(/ /g, "&nbsp;");
            s = s.replace(/\'/g, "&#39;");
            s = s.replace(/\"/g, "&quot;");
            return s;
        },
        // html 进行解码 (暂时未用)
        mixinHtmlDecode(str) {
            var s = "";
            if (str.length === 0) return "";
            s = str.replace(/&amp;/g, "&");
            s = s.replace(/&lt;/g, "<");
            s = s.replace(/&gt;/g, ">");
            s = s.replace(/&nbsp;/g, " ");
            s = s.replace(/&#39;/g, "\\'");
            s = s.replace(/&quot;/g, '"');
            return s;
        },
        /**
         * base64 转file文件
         * param {string} dataUrl base64地址
         * param {string} filename 文件名称】
         * */
        mixinBase64toFile(dataUrl, filename = "file") {
            let arr = dataUrl.split(",");
            let mime = arr[0].match(/:(.*?);/)[1];
            // let suffix = mime.split("/")[1];
            let bstr = atob(arr[1]);
            let n = bstr.length;
            let u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            let theBlob = new Blob([u8arr], { type: mime });
            theBlob.lastModifiedDate = new Date();
            theBlob.name = theBlob;
            // `${filename}.${suffix}`
            return new File([theBlob], filename, {
                type: mime,
            });
        },
        // 云盘有不完整路径拼接完整后保存接口
        mixinCloudDiskRemotePath(path) {
            if (!path) return "";
            if (path.startsWith("/fs/")) {
                path = `${Config.STATIC_SERVER}/im-fs${path}`;
            } else if (path.startsWith("fs/")) {
                path = `${Config.STATIC_SERVER}/im-fs/${path}`;
            }
            return path;
        },
        /**
         * url 需要检测链接 当前链接是否有效
         */
        mixinCheckImFile(url) {
            if (!url) return;
            return new Promise(async (resolve, reject) => {
                let newUrl = url;
                // 兼容移动端的相对路径图片
                if (newUrl.startsWith("/fs/")) {
                    newUrl = `${Config.STATIC_SERVER}/im-fs${url}`;
                } else if (newUrl.startsWith("fs/")) {
                    newUrl = `${Config.STATIC_SERVER}/im-fs/${url}`;
                }
                // 云盘资源暂时不用检测
                if (
                    newUrl.indexOf(Config.CLOUD_IMG_SERVER) > -1 ||
                    newUrl.indexOf(Config.CLOUD_IMG_SERVER_QA) > -1
                ) {
                    resolve(1);
                } else {
                    try {
                        let res = await checkImFileExist({
                            userId: wfc.getUserId(),
                            url: newUrl,
                        });
                        let { code } = res.data;
                        if (code === "000000") {
                            resolve(1);
                        } else if (
                            [
                                "6000002",
                                "6000003",
                                "6000004",
                                "1400017",
                            ].includes(code)
                        ) {
                            let textObj = {
                                6000002: this.$t("common.photo"),
                                6000003: this.$t("common.video"),
                                6000004: this.$t("common.audio"),
                                1400017: this.$t("common.document"),
                            };
                            // this.$t("message.image_expired", [this.$t("common.photo")]),
                            this.$Toast.show({
                                type: "error",
                                // text: `${textObj[Number(code)]
                                //     }已过期或已被清理`,
                                text: this.$t("message.expired", [
                                    textObj[Number(code)],
                                ]),
                                time: 2000,
                            });
                            resolve(0);
                        } else {
                            this.$Toast.show({
                                type: "error",
                                text: res.data.message,
                                time: 3000,
                            });
                            resolve(0);
                        }
                    } catch (error) {
                        console.log(error);
                        this.$Toast.show({
                            type: "error",
                            text: this.$t("common.error_later"),
                            time: 1800,
                        });
                        reject(0);
                    }
                }
            });
        },
        /**
         * 获取当前账号会员信息 | 获取当前全局信息
         */
        async mixinPublicPermission() {
            try {
                let res = await getPermissionList({
                    userId: wfc.getUserId() || getItem("userId"),
                });
                let { data, code, message } = res.data;
                if (code === "000000") {
                    this.$store.dispatch("UpdatePermissionList", data);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        /**
         * 获取当前账号会员信息 | 获取当前全局信息
         */
        async mixinPluginsList() {
            try {
                let res = await getPluginsList({
                    userId: wfc.getUserId() || getItem("userId"),
                });
                let { data, code, message } = res.data;
                if (code === "000000") {
                    this.$store.dispatch("UpdatePluginsList", data);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        /**
         * 获取url连接信息
         * @param  name => 参数
         * @param  ulr => 当前链接
         * @return  value
         * */
        mixinGetQueryString(name, url) {
            let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            let r = url.search.substr(1).match(reg);
            if (r != null) return decodeURI(r[2]);
            return null;
        },
        /**
         * 外链打开Web3跳转 =》对应的Web3页面
         * @param  web3Url =》url
         * */
        mixinGo2Web3View(web3Url, isDecode) {
            if (this.$router.currentRoute.value.path !== "/home/web3") {
                this.$router.replace("/home/web3");
            }
            let lightAppUrl = isDecode
                ? window.decodeURIComponent(web3Url)
                : web3Url;
            // 打开链接
            let appInfo = {
                appId: "",
                lightAppName: "",
                lightAppIconUrl: "",
                lightAppUrl,
                _id: "",
                _isOpen: 1,
                _loaded: false,
            };
            let timer = setTimeout(() => {
                this.$eventBus.$emit("sendOpenWeb3", appInfo);
                timer && clearTimeout(timer);
            }, 1000);
        },
        // 跳转频道
        mixinGo2ChannelInfo(channelId) {
            try {
                if (this.$router.currentRoute.value.path !== "/home/contact") {
                    this.$router.replace("/home/contact");
                }
                let channel = wfc.getChannelInfo(channelId, true);
                store.setCurrentChannel(channel);
            } catch (error) {
                console.log(error);
            }
        },
        /**
         * 获取当前链接的 host
         * @param  url
         * */
        mixinGetUrlHost(url) {
            try {
                return new URL(url).host;
            } catch (error) {
                console.log(error);
                return url;
            }
        },
        mixinGetStrUrl(str) {
            const reg =
                /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
            str = str.match(reg);
            if (str && str.length > 0) {
                return str[0];
            }
            return null;
        },
        mixinOfficialName(name) {
            let arr = name.split("|");
            if (arr.length === 2) {
                return this.$store.state.currentLanguage === "en"
                    ? arr[1]
                    : arr[0];
            } else if (arr.length === 1) {
                return arr[0];
            } else {
                return name || this.$t("contact.unknown_user");
            }
        },
        async mixinPrepare() {
            try {
                const res = await getHttpsPrepare({});
                const { data, code } = res.data;
                if (code === "000000") {
                    setItem("ServerURL", data.serverURL);
                    setItem("UnVipUserChatSwitch", data.unVipUserChatSwitch);
                }
            } catch (error) {
                console.log(error);
            }
        },
    },
};
