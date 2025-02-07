<template>
    <div class="workspace-container">
        <!-- tab -->
        <div :class="['etabs-tabgroup', setTabClass, setLeftClass]">
            <div class="etabs-tabs"></div>
            <div class="etabs-buttons" @click="addWeb3Home">＋</div>
        </div>
        <!-- 导航 -->
        <div class="app-main-content-container" v-if="!showWeb3Home">
            <span
                :class="['toogle-menu-btn', toggleMenubar ? '' : 'hide']"
                @click="handleToogleMenu"
                :title="toggleMenubar ? $t('web3.expand') : $t('web3.collapse')"
            >
            </span>
            <ul class="bar" style="margin-left: 20px">
                <li class="pre-btn" @click="handle('pre')">
                    <Tooltip :content="$t('web3.previous_page')">
                        <Icon type="ios-arrow-back" />
                    </Tooltip>
                </li>
                <li class="next-btn" @click="handle('next')">
                    <Tooltip :content="$t('web3.next_page')">
                        <Icon type="ios-arrow-forward" />
                    </Tooltip>
                </li>
                <li class="refresh-btn" @click="handle('refresh')">
                    <Tooltip :content="$t('web3.refresh')"></Tooltip>
                </li>
                <li class="home-btn" @click="handle('home')">
                    <Tooltip :content="$t('web3.home')"></Tooltip>
                </li>
            </ul>
            <!-- 搜索框 -->
            <web3-search fromType="web3-view" :fromUrl="fromUrl"></web3-search>
            <ul class="bar">
                <li class="copy-btn" @click="handle('copy')">
                    <Tooltip :content="$t('web3.copy_link')"></Tooltip>
                </li>
                <li class="browser-btn" @click="handle('browser')">
                    <Tooltip :content="$t('web3.open_browser')"></Tooltip>
                </li>
                <li class="forward-btn" @click="handle('forward')">
                    <Tooltip :content="$t('web3.send_chat')"></Tooltip>
                </li>
                <li class="status-btn" @click="handle('status')">
                    <Tooltip :content="$t('web3.send_status')"></Tooltip>
                </li>
                <li
                    :class="['star-btn', isFavorite ? 'full-star' : '']"
                    @click="handle('collection')"
                >
                    <Tooltip
                        :content="
                            isFavorite
                                ? $t('web3.collected')
                                : $t('web3.collect')
                        "
                    ></Tooltip>
                </li>
                <li class="more-btn" ref="moreBtn" @click="handle('more')">
                    <Tooltip :content="$t('web3.more')"></Tooltip>
                </li>
                <!-- <li class="clear-btn"
              @click="handle('clear')">
            <Tooltip content="清除缓存">
            </Tooltip>
          </li> -->
            </ul>
        </div>
        <div
            class="more-wrap"
            @mouseleave="handlerMouseLeave(0)"
            ref="moreWrap"
            v-show="showFirstContent && !showWeb3Home"
        >
            <div
                class="proxy-wrap"
                @mouseenter="handlerMouseLeave(1)"
                v-if="
                    permissionList.vipLevel >=
                    permissionList.proxySwitchVipLevel
                "
            >
                <span class="proxy-text"> {{ $t("web3.cdnm") }} </span>
                <span
                    :class="['proxy-btn', { active: isProxy }]"
                    @click="handlerOpenProxy(0)"
                ></span>
            </div>
            <div class="btn" @mouseenter="handlerMouse(0, 1)">
                {{ $t("web3.favorites") }}
            </div>
            <div class="btn" @mouseenter="handlerMouse(1, 1)">
                {{ $t("web3.history_record") }}
            </div>
            <ol class="show-content" v-show="showSecondContent">
                <li class="title">
                    {{
                        handlerMouseFrom
                            ? $t("web3.history_record")
                            : $t("web3.favorites")
                    }}
                </li>
                <template v-if="contentList.length">
                    <li
                        v-for="item in contentList"
                        :key="item._id"
                        @click="goWeb3(item)"
                    >
                        <img
                            :src="appIconUrl(item)"
                            v-real-img="appIconUrl(item)"
                            :default-img="defaultImage"
                            draggable="false"
                        />
                        <p class="new-single-line">{{ item.lightAppName }}</p>
                    </li>
                </template>
                <li class="empty" v-else>{{ $t("common.none") }}</li>
            </ol>
        </div>
        <div class="etabs-views" v-show="!showWeb3Home"></div>
        <!-- web3主页 -->
        <web3-home
            v-show="showWeb3Home"
            @handlerOpenProxy="handlerOpenProxy"
            :isProxy="isProxy"
            :fromUrl="fromUrl"
            ref="web"
        ></web3-home>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import UrlMessageContent from "@/wfc/messages/customMessages/urlMessageContent";
import { init } from "./bridgeServerImpl";
import Config from "../../config";
import { shell } from "electron";
import { ipcRenderer, remote } from "@/platform";
import { copyText } from "..//util/clipboard";
import { downloadOtherFile } from "@/platformHelper";
import { getItem, setItem, removeItem } from "@/ui/util/storageHelper";
import { tipsContent } from "@/ui/common/Tips";
import MessageContentMediaType from "@/wfc/messages/messageContentMediaType";
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import QuickCloudFile from "@/ui/main/cloudDisk/QuickCloudFile";
import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";
import ChannelInfo from "@/wfc/model/channelInfo";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import ImageMessageContent from "@/wfc/messages/imageMessageContent";
import { generateUUID } from "@/ui/util/idGenerate";
import { imageThumbnail } from "@/ui/util/imageUtil";
import tmp from "tmp";
import ElectronTabs from "electron-tabs";
import wfc from "@/wfc/client/wfc";
import store from "@/store";
import Web3Home from "./Web3Home";
import Web3Search from "./Web3Search";
import pkg from "../../../package.json";
import nodePath from "path";
import {
    addSearchHistory,
    getParseUrl,
    addWeb3Favorite,
    delWeb3Favorite,
    web3IsInFavorite,
    proxySwitch,
    getWeb3Favorites,
    getSearchHistory,
    getApplyToken,
} from "@/axios";
// import AuthToken from './AuthToken'

let tabGroup = null;
export default {
    name: "Web3View",
    data() {
        return {
            firstLoading: true,
            homeTitle: this.$t("web3.plugin"),
            userInfo: "",
            activeWeb3Id: 0,
            fromUrl: {
                showWeb3Url: "",
                web3ViewId: "",
            },
            activeWeb3Url: "",
            inviteLock: false,
            // 记录所有页面加载情况
            webviewList: [],
            lock: false,
            collectionLock: false,
            proxyLock: false, // 跨域请求锁
            isProxy: false,
            proxyData: {
                proxyPassword: "",
                proxySwitch: 0,
                proxyUrl: "",
                proxyUsername: "",
            }, // 跨域信息
            // 公司内部域名过滤掉
            notProxyList: [
                "tongfudun.com",
                "dqianyue.com",
                "chainaegis.com",
                "tfdyun.com",
                "dwz.cn",
            ],
            defaultImage: require("../../assets/images/ic_us_logo.png"),
            chainpalFavicon: "https://chainpal.tongfudun.com/favicon.ico",
            showDeleteIcon: false, // 是否显示清除全部的icon
            showFirstContent: false, // 是否展示更多内容一级
            showSecondContent: false, //  是否展示更多内容二级
            historyListLock: false,
            collectionListLock: false,
            isFocus: false,
            historyList: [], // 搜索历史
            contentList: [], // 当前展示的数据
            sharedMiscState: store.state.misc,
            sharedPickState: store.state.pick,
            isFullscreen: false,
            handlerMouseFrom: 0,
            checkFavoriteNum: 0,
        };
    },
    components: {
        Web3Home,
        Web3Search,
        // AuthToken
    },
    created() {
        this.setDefaultProxy();
        try {
            const win = remote.getCurrentWindow();
            this.isFullscreen = win.isMaximized();
        } catch (error) {}
        this.userInfo = wfc.getUserInfo(wfc.getUserId());
    },
    watch: {
        activeWeb3Url(n) {
            if (n.indexOf("web3home") > -1) {
                // this.$refs.web.getHotList() // 热度推荐
                this.$refs.web.getCollectionList(); // 个人收藏
            }
        },
        "permissionList.vipLevel": {
            handler: function (n, o) {
                // console.log(n, o, '监听会员变更')
                if (n !== o) {
                    this.setDefaultProxy();
                }
            },
            deep: true,
            immediate: true,
        },
    },
    mounted() {
        tabGroup = new ElectronTabs();
        tabGroup.on("tab-active", this.onTabActive);
        tabGroup.on("tab-removed", this.onRemovedTab);
        // 默认第一个是web3页面
        this.addWeb3Home();
        // 外部链接进行打开
        this.$eventBus.$on("sendOpenWeb3", (item) => {
            this.addTab(item);
        });
        // 处理新home页面搜索内容
        this.$eventBus.$on("markSearchUrl", (url) => {
            let index = this.currentIndex(this.activeWeb3Id);
            if (index > -1) {
                this.webviewList[index]._searchShowUrl = url;
            }
        });
        // 处理替换当前页打开
        this.$eventBus.$on("openThisWeb3", (item) => {
            let tab = tabGroup.getActiveTab();
            if (tab) {
                let oldPosition = tab.getPosition();
                tab.close();
                this.addTab(item, oldPosition);
            } else {
                this.addTab(item);
            }
        });
        const win = remote.getCurrentWindow();
        win.on("enter-full-screen", () => {
            this.isFullscreen = true;
        });
        win.on("leave-full-screen", () => {
            this.isFullscreen = false;
        });
    },
    computed: {
        pluginsList() {
            return this.$store.state.pluginsList;
        },
        toggleMenubar() {
            return this.$store.state.toggleMenubar;
        },
        showWeb3Home() {
            return this.activeWeb3Url.indexOf("web3home") > -1;
        },
        // 轻应用图标
        appIconUrl() {
            return (item) => {
                return item.lightAppIconUrl || this.defaultImage;
            };
        },
        isFavorite() {
            let index = this.currentIndex(this.activeWeb3Id);
            if (index > -1) {
                return this.webviewList[index]._isFavorite;
            }
            return false;
        },
        setTabClass() {
            return process.platform === "darwin" ? "" : "win-style";
        },
        setLeftClass() {
            return process.platform === "darwin" &&
                this.toggleMenubar &&
                !this.isFullscreen
                ? "has-left"
                : "";
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
        getHost() {
            return (url) => {
                try {
                    return new URL(url).host;
                } catch (error) {
                    console.log(error);
                    return url;
                }
            };
        },
    },
    methods: {
        onTabActive(tab) {
            this.handlerMouseLeave();
            this.activeWeb3Id = tab.id;
            this.fromUrl.web3ViewId = tab.id;
            this.fromUrl.showWeb3Url = "";
            let index = this.currentIndex(tab.id);
            if (index !== -1) {
                let myWeb3Item = this.webviewList[index];
                let { lightAppUrl, _searchShowUrl } = myWeb3Item;
                if (lightAppUrl.indexOf("web3home") === -1) {
                    this.checkFavoriteNum = 0;
                    console.log("onTabActive");
                    this.getIsInFavorite(tab);
                    // 未在个人收藏和推荐,热门，列表中的才需要添加到搜索历史
                    !this.getNotAddHistoryList(lightAppUrl) &&
                        this.addSearchHistoryItem(
                            {
                                lightAppUrl,
                                lightAppName: tab.title,
                                lightAppIconUrl: tab.iconURL,
                            },
                            tab.id
                        );
                    this.$set(
                        this.fromUrl,
                        "showWeb3Url",
                        tab.webview.getURL()
                    );
                } else {
                    this.$set(this.fromUrl, "showWeb3Url", _searchShowUrl);
                }
                this.activeWeb3Url = lightAppUrl;
            }
        },
        onRemovedTab(tab, tabGroup) {
            let tabs = tabGroup.getTabs();
            if (!tabs || tabs.length === 0) {
                this.activeWeb3Url = `web3home?ts=${+new Date()}`;
                this.$set(this.fromUrl, "showWeb3Url", "");
            } else {
                this.webviewList = this.webviewList.filter((item) => {
                    return item._tabId !== tab.id;
                });
            }
        },
        checkUrlPermissions(url) {
            let isPermissions = false;
            let length = this.pluginsList.length;
            for (let index = 0; index < length; index++) {
                if (
                    url &&
                    url.indexOf(this.pluginsList[index].pluginUrl) > -1 &&
                    this.permissionList.vipLevel <
                        this.pluginsList[index].vipLevel
                ) {
                    isPermissions = true;
                    return isPermissions;
                }
            }
            return isPermissions;
        },
        addTab(webItem, oldPosition) {
            if (this.checkUrlPermissions(webItem.lightAppUrl)) {
                this.$alert({
                    content: tipsContent[17],
                    height: 150,
                    cancelText: "",
                });
                return;
            }
            init(wfc, this, Config.OPEN_PLATFORM_SERVE_PORT);
            //过滤内部网站
            let notProxy = false;
            if (webItem.lightAppUrl.indexOf("web3home") === -1) {
                notProxy = this.checkUrlProxy(webItem.lightAppUrl);
            }
            let partition =
                webItem.lightAppUrl.indexOf("web3home") > -1 || notProxy
                    ? {}
                    : { partition: "persist:webviewsession" };

            //   app.chainaegis.com  不需要设置重定向
            //   www.uniondefi.net  需要重定向
            //   chainaegis.com  需要重定向
            //   allowredirects=true  会导致授权登录失败
            //   需要授权登录的url
            let webpreferences =
                webItem.lightAppUrl.indexOf("www.uniondefi.net") > -1 ||
                (webItem.lightAppUrl.indexOf("chainaegis.com") > -1 &&
                    webItem.lightAppUrl.indexOf("app.chainaegis.com") === -1)
                    ? "contextIsolation=false;allowredirects=true"
                    : "contextIsolation=false";
            let lang = getItem("lang") === "en" ? "en-US" : "zh-CH";

            let tab = tabGroup.addTab({
                src: webItem.lightAppUrl || "",
                visible: true,
                active: true,
                closable: true,
                webviewAttributes: {
                    allowpopups: true,
                    nodeintegration: true,
                    webpreferences,
                    ...partition,
                    useragent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8 ChainMeet/${pkg.version} ChainPalForPC  Language/${lang} appVersion=${pkg.version}`,
                },
            });

            if (oldPosition && typeof oldPosition !== "undefined") {
                // console.log(oldPosition, '设置位置')
                tab.setPosition(oldPosition);
            }

            //设置初始值
            this.$set(webItem, "_loaded", false);
            this.$set(webItem, "_isFavorite", false);
            this.$set(webItem, "_tabId", tab.id);
            this.$set(webItem, "_isAddHistory", false);
            this.$set(webItem, "_searchShowUrl", "");
            this.webviewList.push(webItem);
            this.activeWeb3Url = tab.webviewAttributes.src;
            // console.log(this.webviewList)
            // 设置默认title
            if (
                !webItem.lightAppUrl ||
                webItem.lightAppUrl.indexOf("web3home") > -1
            ) {
                tab.setTitle(this.homeTitle);
            } else {
                tab.setTitle(webItem.lightAppUrl);
            }
            webItem.userId = wfc.getUserId();

            tab.webview.addEventListener("dom-ready", () => {
                console.log("webview dom-ready");
                // 首次打开 dappstore 清除登录缓存
                if (
                    webItem.lightAppUrl.indexOf("dappstore.tongfudun.com") >
                        -1 &&
                    this.firstLoading
                ) {
                    this.firstLoading = false;
                    tab.webview.executeJavaScript(
                        ` localStorage.removeItem("Authorization") `
                    );
                }
                // debug
                if (pkg.appDebug) {
                    tab.webview.openDevTools();
                }
            });

            this.checkFavoriteNum = 0;

            //当任何 frame (包括 main) 开始导航时触发。 当页面内导航 isInPlace 为 true 。 会有空页面路径
            tab.webview.addEventListener("did-start-navigation", (e) => {
                if (tabGroup.getActiveTab().id === tab.id && e.isMainFrame) {
                    this.$set(
                        this.fromUrl,
                        "showWeb3Url",
                        this.showWeb3Home ? "" : e.url
                    );
                    this.$set(
                        this.fromUrl,
                        "web3ViewId",
                        `${tab.id}-${e.timeStamp}`
                    );
                    let index = this.currentIndex(tab.id);
                    if (
                        this.showWeb3Home &&
                        index > -1 &&
                        this.webviewList[index]._searchShowUrl
                    ) {
                        this.$set(
                            this.fromUrl,
                            "showWeb3Url",
                            this.webviewList[index]._searchShowUrl
                        );
                    }
                    if (webItem.lightAppUrl.indexOf("web3home") === -1) {
                        console.log("did-start-navigation");
                        this.getIsInFavorite(tab);
                    }
                }
            });
            //更新标题
            tab.webview.addEventListener("page-title-updated", (e) => {
                // console.log('page-title-updated', e)
                if (webItem.lightAppUrl.indexOf("web3home") === -1) {
                    tab.setTitle(e.title);
                    webItem.lightAppName = e.title;
                } else {
                    tab.setIcon(this.chainpalFavicon);
                }
            });

            //favicon
            tab.webview.addEventListener("page-favicon-updated", (e) => {
                // console.log('page-favicon-updated', e)
                webItem.lightAppIconUrl =
                    e.favicons && e.favicons.length
                        ? e.favicons[0]
                        : this.defaultImage;
                this.$set(webItem, "_loaded", true);
                // 谷歌特殊处理一下
                if (
                    webItem.lightAppIconUrl.indexOf("google.com/favicon.ico") >
                    -1
                ) {
                    tab.setIcon(require("../../assets/images/google.png"));
                } else if (webItem.lightAppIconUrl.indexOf("web3home") > -1) {
                    tab.setIcon(this.chainpalFavicon);
                } else {
                    tab.setIcon(webItem.lightAppIconUrl);
                }
            });

            // webview 内部跳转更多页面
            tab.webview.addEventListener("new-window", (e) => {
                // console.log('new-window', e, 444)
                e.preventDefault();
                const protocol = require("url").parse(e.url).protocol;
                if (protocol === "http:" || protocol === "https:") {
                    // 打开链接
                    let obj = {
                        appId: "",
                        lightAppName: "",
                        lightAppIconUrl: "",
                        lightAppUrl: e.url,
                        _id: "",
                        _isOpen: 2,
                        _loaded: false,
                        _isFavorite: false,
                        _isAddHistory: false,
                    };
                    this.addTab(obj);
                }
            });
            // 加载完成
            tab.webview.addEventListener("did-finish-load", (e) => {
                // console.log('did-finish-load', e)
                //成功打开的页面添加到轻应用历史预览列表里面
                if (
                    webItem._isOpen === 1 &&
                    webItem.lightAppUrl.indexOf("web3home") === -1
                ) {
                    webItem.lightAppUrl = tab.webview.getURL();
                    // 未在个人收藏和推荐,热门，列表中的才需要添加到搜索历史
                    !this.getNotAddHistoryList(webItem.lightAppUrl) &&
                        this.addSearchHistoryItem(webItem, tab.id);
                }
            });
            // 渲染失败
            tab.webview.addEventListener("did-fail-load", (e) => {
                console.log("did-fail-load", e);
                if (
                    e.errorDescription &&
                    webItem.lightAppUrl.indexOf("web3home") === -1 &&
                    tabGroup.getActiveTab().id === tab.id &&
                    e.errorCode !== -105
                ) {
                    webItem._isOpen = 0;
                    this.$Modal.warning({
                        title: this.$t("web3.notice"),
                        content: this.$t("web3.link_loading_failed"),
                        okText: this.$t("voip.i_known"),
                        onOk: () => {},
                    });
                }
            });
            //  home 页不需要添加 preload
            if (webItem.lightAppUrl.indexOf("web3home") === -1) {
                if (process.env.NODE_ENV === "development") {
                    let path =
                        process.platform === "darwin"
                            ? "/../../../../../../../../"
                            : "/../../../../../../";
                    tab.webview.preload = `file://${__dirname}${path}src/ui/web3/bridgeClientImpl.js`;
                } else {
                    tab.webview.preload = `file://${__dirname}/preload.js`;
                }
            }
        },
        addWeb3Home() {
            // 拼接一个无效链接，仅仅为了区分占位用
            //web3home?ts=${+new Date()}
            this.addTab({
                lightAppUrl: `web3home?ts=${+new Date()}`,
                lightAppName: this.homeTitle,
            });
            this.handlerMouseLeave();
            this.$refs.web.getBannerList(0); // banner 数据
            // this.$refs.web.getBannerList(1); // banner 数据
            this.$refs.web.getAiList(); // ai数据
        },
        // 推荐，热门，个人收藏
        getNotAddHistoryList(url) {
            let lock = false;
            try {
                let host = this.mixinGetUrlHost(url);
                let arr = [
                    ...this.$refs.web.collectionList,
                    ...this.$refs.web.appList,
                    ...this.$refs.web.productList,
                ].map((item) => item.lightAppUrl || item.linkUrl);
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].indexOf(host) > -1) {
                        lock = true;
                        return lock;
                    }
                }
                return lock;
            } catch (error) {
                console.log(error);
                return lock;
            }
        },
        // 获取当前 id 的 index
        currentIndex(id) {
            return this.webviewList.findIndex((item) => {
                return item._tabId === id;
            });
        },
        checkUrlProxy(url) {
            let lock = false;
            let hostUrl = this.getHost(url);
            for (let i = 0; i < this.notProxyList.length; i++) {
                let el = this.notProxyList[i];
                if (hostUrl.indexOf(el) > -1) {
                    lock = true;
                    return lock;
                }
            }
            return lock;
        },
        getShareUrlTitleContent(tab) {
            return new Promise(async (resolve, reject) => {
                try {
                    let currentUrl = tab.webview.getURL();
                    let appInfo = {
                        longTitle: tab.title,
                        lightAppUrl: currentUrl,
                        lightAppContent: tab.webviewAttributes.content,
                        lightAppName: tab.title,
                        lightAppIconUrl: tab.iconURL,
                    };
                    let res = await getParseUrl({ url: currentUrl });
                    let { code, data } = res.data;
                    this.$Toast.hide();
                    this.inviteLock = false;
                    if (code === "000000") {
                        appInfo.lightAppContent =
                            data.content || tab.webviewAttributes.content;
                        appInfo.lightAppName = data.title || tab.title;
                        appInfo.longTitle =
                            data.longTitle || data.title || tab.title;
                        appInfo.lightAppIconUrl =
                            data.shareIconUrl || tab.iconURL;
                        // 处理一下 若是接口获取不到，使用自己获取的title
                        if (
                            ["链接分享", "link sharing"].includes(
                                appInfo.lightAppName
                            ) &&
                            tab.title
                        ) {
                            appInfo.lightAppName = tab.title;
                        }
                        if (
                            ["链接分享", "link sharing"].includes(
                                appInfo.longTitle
                            ) &&
                            tab.title
                        ) {
                            appInfo.longTitle = tab.title;
                        }
                        resolve(appInfo);
                    } else {
                        resolve(appInfo);
                    }
                } catch (error) {
                    this.inviteLock = false;
                    this.$Toast.hide();
                    console.log(error);
                    reject("");
                }
            });
        },
        // 调起邀请弹窗
        async invite(tab) {
            if (this.inviteLock) return;
            this.inviteLock = true;
            this.$Toast.show({
                type: "loading",
                text: this.$t("common.loading"),
                time: 30000,
            });
            let appInfo = await this.getShareUrlTitleContent(tab);
            if (appInfo) {
                // let url =
                //     appInfo.lightAppUrl.indexOf("?") > -1
                //         ? `${appInfo.lightAppUrl}&chainsource=chainmeet`
                //         : `${appInfo.lightAppUrl}?chainsource=chainmeet`;
                // this.sendInviteMessage({ ...appInfo, lightAppUrl: url });
                this.sendInviteMessage(appInfo);
            }
        },
        // 发送邀请消息
        sendInviteMessage(appInfo) {
            let {
                lightAppName,
                lightAppUrl,
                lightAppContent,
                lightAppIconUrl,
                longTitle,
            } = appInfo;
            let messageContent = Message.messageContentFromMessagePayload(
                new UrlMessageContent(
                    lightAppName,
                    lightAppUrl,
                    lightAppContent,
                    lightAppIconUrl,
                    longTitle
                ).encode(),
                wfc.getUserId()
            );
            let message = new Message(null, messageContent);
            // 可以分享到匿名群
            this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
                isCallBack: true,
            }).then((params) => {
                if (params !== "cancel") {
                    store.forwardAnonymousGroupMessage(params, true);
                    this.$Message.success(this.$t("friend_request.sent"));
                }
            });
        },
        // 更多操作
        async handle(action) {
            let tab = tabGroup.getActiveTab();
            let currentUrl = tab.webview.getURL();
            let currentPageTitle = tab.webview.getTitle();
            switch (action) {
                case "pre":
                    tab.webview.goBack();
                    break;
                case "next":
                    tab.webview.goForward();
                    break;
                case "copy":
                    //处理复制后粘贴没有样式问题
                    let aux = document.createElement("div");
                    aux.innerHTML = currentUrl || this.activeWeb3Url;
                    document.body.appendChild(aux);
                    copyText(aux.innerText);
                    document.body.removeChild(aux);
                    this.$Message.success(this.$t("web3.copied"));
                    break;
                case "refresh":
                    //   if (tab.webview.isLoading()) return
                    tab.webview.reload();
                    let index = this.currentIndex(tab.id);
                    if (
                        index > -1 &&
                        this.webviewList[index] &&
                        this.webviewList[index]._isAddHistory
                    ) {
                        this.webviewList[index]._isAddHistory = false;
                    }
                    break;
                case "collection":
                    // 收藏或取消收藏
                    this.handlerWeb3Favorite(tab);
                    break;
                case "browser":
                    if (!currentUrl) return;
                    try {
                        shell.openExternal(currentUrl);
                    } catch (error) {
                        console.log(error);
                        this.$Message.warning(this.$t("web3.browser_tip"));
                    }
                    break;
                case "forward":
                    if (!currentUrl) return;
                    this.invite(tab);
                    break;
                case "status": // 链上打卡
                    // qa,,https://dappstore.tongfudun.com ,http://192.168.83.20:8009
                    let http =
                        Config.APP_SERVER.indexOf("chat-auth.tongfudun") > -1
                            ? "https://dappstore.tongfudun.com"
                            : "http://192.168.83.20:8009";

                    let appInfo = await this.getShareUrlTitleContent(tab);
                    if (appInfo) {
                        this.addTab({
                            lightAppUrl: `${http}/oa/newDailyReport?type=website&ts=${+new Date()}`,
                            _shareInfo: {
                                webTitle: appInfo.lightAppName,
                                webContent: appInfo.lightAppContent,
                                webUrl: appInfo.lightAppUrl,
                                webIconUrl: appInfo.lightAppIconUrl,
                            },
                        });
                    }
                    break;
                case "home":
                    //web3页面 主页
                    this.$eventBus.$emit("openThisWeb3", {
                        lightAppUrl: `web3home?ts=${+new Date()}`,
                        lightAppName: this.homeTitle,
                    });

                    break;
                case "more":
                    this.showFirstContent = !this.showFirstContent;
                    if (!this.showFirstContent) {
                        this.showSecondContent = false;
                        this.contentList = [];
                    }
                    break;
                // case 'clear':
                //   let getWebContentsId = tab.webview.getWebContentsId()
                //   let tabSession = remote.webContents.fromId(getWebContentsId).session
                //   console.log('清除缓存', tabSession)
                //   tabSession.clearCache(() => {
                //     console.log('成功')
                //     tab.webview.reload()
                //   })
                //   break
            }
        },
        // 添加浏览历史
        async addSearchHistoryItem(obj, id) {
            let index = this.currentIndex(id);
            // 防止重复添加
            if (
                index > -1 &&
                this.webviewList[index] &&
                !this.webviewList[index]._isAddHistory &&
                obj.lightAppUrl &&
                obj.lightAppIconUrl &&
                obj.lightAppName
            ) {
                // console.log('添加历史', obj)
                try {
                    let res = await addSearchHistory({
                        userId: wfc.getUserId(),
                        url: obj.lightAppUrl,
                        title: obj.lightAppName,
                        iconUrl: obj.lightAppIconUrl,
                    });
                    let { code, message } = res.data;
                    if (code === "000000") {
                        this.webviewList[index]._isAddHistory = true;
                    } else {
                        this.$Message.error(message);
                    }
                } catch (error) {
                    console.log(error);
                    this.$Message.error(this.$t("common.error_later"));
                }
            }
        },
        // 当前链接是否在收藏列表中
        async getIsInFavorite(tab) {
            this.checkFavoriteNum++;
            //   console.log(this.checkFavoriteNum, 'getIsInFavorite')
            if (this.checkFavoriteNum > 1) return;
            let index = this.currentIndex(tab.id);
            if (index > -1) {
                if (this.lock) return;
                this.lock = true;
                try {
                    let res = await web3IsInFavorite({
                        userId: wfc.getUserId(),
                        url: tab.webview.getURL() || tab.webviewAttributes.src,
                    });
                    this.lock = false;
                    let { data, code } = res.data;
                    if (code === "000000" && data) {
                        if (index > -1) {
                            this.$set(
                                this.webviewList[index],
                                "_isFavorite",
                                true
                            );
                            this.$set(
                                this.webviewList[index],
                                "_lightAppFavoriteId",
                                data.lightAppFavoriteId
                            );
                        }
                    } else {
                        if (index > -1) {
                            this.$set(
                                this.webviewList[index],
                                "_isFavorite",
                                false
                            );
                        }
                    }
                } catch (error) {
                    this.lock = false;
                    if (index > -1) {
                        this.$set(
                            this.webviewList[index],
                            "_isFavorite",
                            false
                        );
                    }
                }
            }
        },
        // 添加/取消收藏
        async handlerWeb3Favorite(tab) {
            if (this.collectionLock) return;
            this.collectionLock = true;
            try {
                let index = this.currentIndex(tab.id);
                let res = null;
                let {
                    _isFavorite: isFavorite,
                    _lightAppFavoriteId: lightAppFavoriteId,
                } = this.webviewList[index];
                if (isFavorite) {
                    if (lightAppFavoriteId) {
                        // 取消收藏
                        res = await delWeb3Favorite({ lightAppFavoriteId });
                    } else {
                        console.log(
                            this.webviewList[index],
                            lightAppFavoriteId,
                            "收藏id不能为空"
                        );
                    }
                } else {
                    //   console.log(tab.webview.getURL(), tab.webviewAttributes.src)
                    // 添加收藏
                    res = await addWeb3Favorite({
                        title: tab.title,
                        url: tab.webview.getURL() || tab.webviewAttributes.src,
                        userId: wfc.getUserId(),
                    });
                }
                this.collectionLock = false;
                if (res) {
                    let { code, message, data } = res.data;
                    if (code === "000000") {
                        this.$Message.success(
                            isFavorite
                                ? this.$t("web3.favorites_remove")
                                : this.$t("web3.favorites_success")
                        );
                        if (!isFavorite) {
                            this.$set(
                                this.webviewList[index],
                                "_lightAppFavoriteId",
                                data.lightAppFavoriteId
                            );
                        }
                        this.$set(
                            this.webviewList[index],
                            "_isFavorite",
                            !isFavorite
                        );
                        // this.$refs.web.getCollectionList()
                    } else {
                        this.$Message.error(message);
                    }
                } else {
                    this.$Message.error(
                        isFavorite
                            ? this.$t("web3.favorites_remove_fail")
                            : this.$t("web3.favorites_fail")
                    );
                }
            } catch (error) {
                this.collectionLock = false;
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 获取跨域专网
        handlerOpenProxy(type) {
            if (!type) {
                this.isProxy = !this.isProxy;
            }
            setItem("chainpalProxy", this.isProxy ? 1 : "");
            if (this.isProxy) {
                if (this.proxyLock) return;
                this.proxyLock = true;
                try {
                    proxySwitch({ userId: wfc.getUserId() })
                        .then((res) => {
                            this.proxyLock = false;
                            let { data, code, message } = res.data;
                            if (code === "000000") {
                                this.proxyData = data;
                                this.sendIpcRenderer({
                                    ...data,
                                    isProxy: this.isProxy,
                                });
                            } else {
                                this.$Message.error(message);
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            this.proxyLock = false;
                        });
                } catch (error) {
                    console.log(error);
                    this.proxyLock = false;
                }
            } else {
                this.sendIpcRenderer({
                    ...this.proxyData,
                    isProxy: this.isProxy,
                });
            }
            if (!type) {
                this.$nextTick(() => {
                    this.$Message.warning({
                        content: this.isProxy
                            ? this.$t("web3.cdnm_turned_on")
                            : this.$t("web3.cdnm_turned_off"),
                    });
                });
            }
        },
        sendIpcRenderer(params) {
            ipcRenderer.send("change-proxy", params);
        },
        // 根据当前等级设置默认跨域信息
        setDefaultProxy() {
            if (
                this.permissionList.vipLevel >=
                this.permissionList.proxySwitchVipLevel
            ) {
                this.isProxy = !!getItem("chainpalProxy") || true;
                this.handlerOpenProxy(1);
            } else {
                this.isProxy = false;
                this.sendIpcRenderer({
                    isProxy: this.isProxy,
                });
                removeItem("chainpalProxy");
            }
        },
        // 鼠标划上展示收藏和历史列表
        handlerMouse(from, type) {
            this.showSecondContent = !!type;
            this.handlerMouseFrom = from;
            // from :0 收藏，1历史
            if (from) {
                this.getSearchHistoryList();
            } else {
                this.getCollectionList();
            }
        },
        // 更多弹窗隐藏
        handlerMouseLeave(type) {
            if (!type) {
                this.showFirstContent = false;
            }
            this.showSecondContent = false;
            this.contentList = [];
        },
        //点击历史或者收藏夹中的连接
        goWeb3(item) {
            this.addTab(item);
            this.handlerMouseLeave();
        },
        // 获取个人收藏列表
        async getCollectionList() {
            if (this.collectionListLock) return;
            this.collectionListLock = true;
            try {
                let res = await getWeb3Favorites({ userId: wfc.getUserId() });
                this.collectionListLock = false;
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.contentList = data.map((item) => {
                        return {
                            ...item,
                            lightAppUrl: item.url,
                            lightAppIconUrl: item.iconUrl,
                            lightAppName: item.title,
                            _id: item.lightAppFavoriteId,
                        };
                    });
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.collectionListLock = false;
                console.log(error);
            }
        },
        // 获取预览历史列表
        async getSearchHistoryList() {
            if (this.historyListLock) return;
            this.historyListLock = true;
            try {
                let res = await getSearchHistory({ userId: wfc.getUserId() });
                this.historyListLock = false;
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.historyList = data.map((item) => {
                        return {
                            ...item,
                            lightAppUrl: item.url,
                            lightAppIconUrl: item.iconUrl,
                            lightAppName: item.title,
                            _id: item.lightAppSearchHistoryId,
                        };
                    });
                    this.contentList = this.historyList;
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.historyListLock = false;
                console.log(error);
            }
        },
        handleToogleMenu() {
            this.$store.dispatch("UpdateToogleMenuBar", !this.toggleMenubar);
        },
        // ==============================以下是 与外部 Web 页面 通讯的方法与回调 ==============================//
        //h5 授权登录
        async getAuthCode(params, callback) {
            if (params && params.args) {
                let authTokenData = JSON.parse(params.args);
                // 轻应用点击授权登录step1 弹授权窗
                if (authTokenData.name === "LightApplication") {
                    try {
                        let { appid } = authTokenData;
                        let res = await getApplyToken({
                            userId: wfc.getUserId(),
                            appId: appid,
                        });
                        let { data, code, message } = res.data;
                        if (code === "000000") {
                            let successJson = {
                                code: 1,
                                msg: "授权成功",
                                transactionCode: data.token,
                            };
                            callback && callback(JSON.stringify(successJson));
                        } else {
                            let errorJson = {
                                code: 0,
                                msg: message,
                                transactionCode: "",
                            };
                            callback && callback(JSON.stringify(errorJson));
                        }
                    } catch (error) {
                        let errorJson = {
                            code: 0,
                            msg: "授权失败",
                            transactionCode: "",
                        };
                        callback && callback(JSON.stringify(errorJson));
                        this.$Message.error(this.$t("common.error_later"));
                    }
                }
            }
        },
        //H5 唤起公众号
        goToChannelInfo(params) {
            try {
                let channelData = params.args;
                if (typeof params.args === "string") {
                    channelData = JSON.parse(params.args);
                }
                let channel = wfc.getChannelInfo(channelData.channelId, true);
                if (channel instanceof ChannelInfo) {
                    store.setCurrentChannel(channel);
                } else {
                    let timer = setTimeout(() => {
                        store.setCurrentChannel(
                            wfc.getChannelInfo(channelData.channelId, false)
                        );
                        timer && clearTimeout(timer);
                    }, 200);
                }
                if (this.$router.currentRoute.value.path !== "/home/contact") {
                    this.$router.replace("/home/contact");
                }
            } catch (error) {
                console.log(error);
            }
        },
        //H5 唤起云盘列表
        getCloudFileSelector(data, callback) {
            try {
                this.$modal.show(
                    QuickCloudFile,
                    { title: "", btn: this.$t("web3.done"), from: "web3" },
                    null,
                    {
                        name: "QuickCloudFile-modal",
                        width: 750,
                        height: 500,
                        clickToClose: false, // 点击模态框是否关闭
                    },
                    {
                        "before-close": (event) => {
                            if (event.params && event.params.length) {
                                let arr = event.params.map((item) => {
                                    return {
                                        fileId: item.fileid,
                                        fileName: item.fileName,
                                        cid: item.cid,
                                    };
                                });
                                let dataJson = {
                                    code: 0,
                                    mobile: this.userInfo.mobile,
                                    errMsg: "",
                                    platform: "pc",
                                    data: arr,
                                };
                                callback && callback(JSON.stringify(dataJson));
                            }
                        },
                    }
                );
            } catch (error) {}
        },
        //H5 唤起聊天
        goToConversation(params) {
            if (params.args) {
                let info = JSON.parse(params.args);
                let { groupId, mobile, userId, name } = info;
                // 去群聊
                if (name === "OpenGroupConversation") {
                    let conversation = new Conversation(
                        ConversationType.Group,
                        groupId,
                        0
                    );
                    store.setCurrentConversation(conversation);
                    this.$router.replace("/home/conversation");
                } else {
                    if (mobile) {
                        store.searchSeverUser(mobile + "", (newFriends) => {
                            if (newFriends && newFriends.length) {
                                store.setCurrentConversation(
                                    new Conversation(
                                        ConversationType.Single,
                                        newFriends[0].uid,
                                        0
                                    )
                                );
                                this.$router.replace("/home/conversation");
                            } else {
                                this.$alert({
                                    content: this.$t(
                                        "login.not_chainpal_user_tip"
                                    ),
                                    isText: true,
                                    cancelText: "",
                                });
                            }
                        });
                    } else {
                        wfc.getUserInfoEx(
                            userId,
                            true,
                            () => {
                                store.setCurrentConversation(
                                    new Conversation(
                                        ConversationType.Single,
                                        userId,
                                        0
                                    )
                                );
                                this.$router.replace("/home/conversation");
                            },
                            () => {
                                this.$alert({
                                    content: this.$t(
                                        "login.not_chainpal_user_tip"
                                    ),
                                    isText: true,
                                    cancelText: "",
                                });
                            }
                        );
                    }
                }
            }
        },
        //H5 唤起分享（仅链上会内）
        async getNativeShareModal(params) {
            try {
                let info = JSON.parse(params.args);
                this.sendInviteMessage({
                    lightAppContent: info.desc,
                    lightAppName: info.title,
                    lightAppUrl: info.shareUrl,
                    longTitle: info.title,
                    lightAppIconUrl: info.iconUrl,
                });
            } catch (error) {
                console.log(error);
            }
        },
        async uploadBusinessCardImage(image) {
            return new Promise((resolve, reject) => {
                wfc.uploadMedia(
                    `${tmp.tmpNameSync()}.png`,
                    image,
                    MessageContentMediaType.Image,
                    (url) => {
                        resolve(url);
                    },
                    (error) => {
                        reject("");
                    }
                );
            });

            console.log(res);
            return res;
        },
        // H5 链上名片 分享名片功能
        async goToContactShareImage(params) {
            let { base64Image } = JSON.parse(params.args);
            let url = await this.uploadBusinessCardImage(base64Image);
            url && this.getImageMessageContent(url);
        },
        // 生成图片消息体并唤起分享弹窗
        async getImageMessageContent(remotePath) {
            try {
                let size = await store.getUrlImageInfo(remotePath); // 获取图片内存大小
                let fileName = remotePath.substring(
                    remotePath.lastIndexOf("/") + 1
                );
                let file = {
                    path: remotePath,
                    name: fileName,
                    size,
                };
                let iThumbnail = await imageThumbnail(file);
                iThumbnail = iThumbnail || Config.DEFAULT_THUMBNAIL_URL;
                let message = new Message();
                let messageContent = new ImageMessageContent(
                    null,
                    remotePath,
                    iThumbnail.split(",")[1]
                );
                messageContent.imFileId = generateUUID();
                messageContent.imFileName = file.name;
                messageContent.imFileSize = file.size;
                messageContent.remotePath = remotePath;
                message.messageContent = messageContent;
                // 唤起邀请弹窗
                this.sharedPickState.conversations.length = 0;
                this.$forwardMessage({
                    forwardType: ForwardType.NORMAL,
                    messages: [message],
                    forwardFilterAnonymous: true,
                }).then((data) => {
                    if (data !== "cancel") {
                        this.$Message.success(this.$t("friend_request.sent"));
                    }
                });
            } catch (error) {}
        },
        async goToBusinessCardDownloadImage(params) {
            let { base64Image } = JSON.parse(params.args);
            let url = await this.uploadBusinessCardImage(base64Image);
            url &&
                downloadOtherFile(
                    {
                        fileName: nodePath.basename(url),
                        url,
                    },
                    false // 仅下载
                );
        },
        // H5内打开新页面
        goToNewPage(params) {
            try {
                let info = JSON.parse(params.args);
                let obj = {
                    appId: "",
                    lightAppName: "",
                    lightAppIconUrl: "",
                    lightAppUrl: info.url,
                    _id: "",
                    _isOpen: 2,
                    _loaded: false,
                    _isFavorite: false,
                    _isAddHistory: false,
                };
                this.addTab(obj);
            } catch (error) {
                console.log(error);
            }
        },
        // 关闭webview
        goToCloseWebView() {
            let tab = tabGroup.getActiveTab();
            tab.close();
        },
        // H5内获取群列表
        async getLocalGroupChatList(data, callback) {
            try {
                let groupList = await store._getLocalGroupList();
                callback && callback(JSON.stringify(groupList));
            } catch (error) {
                console.log(error);
            }
        },
        getWebsiteInfo(data, callback) {
            let tab = tabGroup.getActiveTab();
            let index = this.currentIndex(tab.id);
            if (index > -1) {
                callback &&
                    callback(
                        JSON.stringify(this.webviewList[index]._shareInfo)
                    );
            }
        },
        //链上打卡，文字转发
        goToshareTextContentToContacts({ args: jsonData }) {
            let { textContent } = JSON.parse(jsonData);
            console.log(textContent);
            let message = new Message(
                null,
                new TextMessageContent(textContent)
            );
            // 可以分享到匿名群
            this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
                isCallBack: true,
            }).then((params) => {
                if (params !== "cancel") {
                    store.forwardAnonymousGroupMessage(params, true);
                    this.$Message.success(this.$t("friend_request.sent"));
                }
            });
        },
    },
    beforeUnmount() {
        this.$eventBus.$off("sendOpenWeb3");
        this.$eventBus.$off("openThisWeb3");
        this.$eventBus.$off("markSearchUrl");
    },
};
</script>
<style lang="less">
@import "../../../node_modules/electron-tabs/electron-tabs.css";

.etabs-tabgroup {
    height: 42px;
    padding: 10px 10px 0 10px;
    box-sizing: border-box;
    background: #dedede;
    position: relative;
    z-index: 99;
    display: flex;
    justify-content: flex-start;

    .etabs-tabs {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        max-width: calc(100% - 38px);
        overflow: hidden;

        .etabs-tab {
            max-width: 200px;
            min-width: 10px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            height: 32px;
            line-height: 32px;
            border: none;
            color: #fff;
            font-size: 12px;
            position: relative;
            background: #dedede;
            overflow: hidden;

            &::after {
                position: absolute;
                top: 6px;
                right: 0;
                width: 1px;
                height: 20px;
                content: "";
                background: #f5f5f5;
                transform: scaleX(0.5);
            }

            .etabs-tab-icon {
                max-width: 16px;
                max-height: 16px;

                img {
                    display: block;
                }
            }

            .etabs-tab-title {
                flex: 1;
                font-family: "PingFang SC";
                font-style: normal;
                font-weight: 500;
                display: inline-block;
                font-size: 12px;
                line-height: 20px;
                text-align: left;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                vertical-align: middle;
                color: #222222;
                margin-left: 4px;
            }

            .etabs-tab-buttons {
                margin-left: 0;
                vertical-align: middle;

                button {
                    vertical-align: middle;
                    line-height: 22px;
                    height: 20px;
                    overflow: hidden;
                    border-radius: 50%;
                    color: #686868;
                    font-size: 16px;

                    &:hover {
                        color: #333;
                    }
                }
            }

            &.active {
                color: #292a2c;
                background: #f8f8f8;
                border-radius: 8px 8px 0 0;

                .etabs-tab-buttons {
                    button {
                        color: #333;
                    }
                }
            }

            &:last-child {
                min-width: 60px;
            }
        }
    }

    .etabs-buttons {
        min-width: 38px;
        width: 38px;
        height: 32px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #686868;
        position: relative;
    }

    &.win-style {
        padding-right: 140px;
    }

    &.visible {
        display: flex;
    }
}

.etabs-tabgroup.has-left {
    padding-left: 68px;

    .etabs-tab:first-child.active {
        border-radius: 8px 8px 0 0;
    }
}

.etabs-views {
    margin-top: 36px;
    height: calc(100% - 76px);
    border-top: none;
}

// 重置样式
.bar {
    li {
        .ivu-tooltip-rel {
            display: block;
            width: 100%;
            height: 100%;
        }
    }

    .disabled {
        opacity: 0.6;
    }
}

.workspace-container {
    width: 100%;
    height: 100%;
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #f8f8f8;

    .app-main-content-container {
        width: 100%;
        height: 36px;
        padding: 0 20px;
        position: absolute;
        top: 42px;
        left: 0;
        display: flex;
        z-index: 998;
        justify-content: space-between;
        align-items: center;
        background: #ffffff;
        box-shadow: 0px 0.5px 0px rgba(0, 0, 0, 0.15),
            inset 0px -0.5px 0px rgba(0, 0, 0, 0.05);

        .bar {
            display: flex;
            align-items: center;

            li {
                width: 20px;
                height: 20px;
                margin: 0 7px;
                font-size: 20px;
                cursor: pointer;

                .ivu-tooltip {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }

                i {
                    width: 24px;
                    height: 24px;
                    display: block;
                    color: #7c7c7c;
                }
            }

            li.copy-btn {
                background: url(../../assets/images/copy-icon.png) no-repeat
                    center center;
                background-size: 100%;

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }
            }

            li.refresh-btn {
                background: url(../../assets/images/refresh-icon.png) no-repeat
                    center center;
                background-size: 100%;

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }
            }

            li.star-btn {
                background: url(../../assets/images/star.png) no-repeat center
                    center;
                background-size: 100%;

                &.full-star {
                    background: url(../../assets/images/star-selected.png)
                        no-repeat center center;
                    background-size: 100%;
                }

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }
            }

            li.browser-btn {
                background: url(../../assets/images/browser-icon.png) no-repeat
                    center center;
                background-size: 100%;

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }
            }

            li.forward-btn {
                // opacity: 0.6;
                background: url(../../assets/images/forward-icon.png) no-repeat
                    center center;
                background-size: 100%;

                &.allow-forward {
                    opacity: 1;
                }

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }
            }

            li.status-btn {
                // opacity: 0.6;
                background: url(../../assets/images/status-icon.png) no-repeat
                    center center;
                background-size: 100%;

                &.allow-forward {
                    opacity: 1;
                }

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }
            }

            li.home-btn {
                background: url(../../assets/images/home-icon.png) no-repeat
                    center center;
                background-size: 18px auto;

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }
            }

            li.more-btn {
                background: url(../../assets/images/more-icon.png) no-repeat
                    center center;
                background-size: 18px auto;

                &:hover {
                    background-color: #eeeeee;
                    border-radius: 4px;
                }
            }
        }

        .clear-btn {
            width: 24px;
            height: 24px;
            display: block;
            background: url(../../assets/images/clear-icon.png) no-repeat center
                center;
            background-size: 100%;

            &:hover {
                background-color: #eeeeee;
                border-radius: 4px;
            }
        }

        .toogle-menu-btn {
            position: absolute;
            left: 6px;
            top: 6px;
            width: 24px;
            height: 24px;
            background: url(../../assets/images/show-btn.png) no-repeat center
                center;
            background-size: 24px auto;

            &.hide {
                background: url(../../assets/images/hide-btn.png) no-repeat
                    center center;
                background-size: 24px auto;
            }

            .ivu-tooltip,
            .ivu-tooltip-rel {
                display: block;
                width: 100%;
                height: 100%;
            }
        }
    }

    .more-wrap {
        width: 156px;
        top: 74px;
        position: absolute;
        right: 0;
        z-index: 999;
        background: #fff;
        border-radius: 5px;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.16);
        padding: 10px 0;

        & > div {
            padding: 8px 30px;
            color: #333333;

            &:hover {
                background: #f5f5f5;
            }
        }

        .proxy-wrap {
            display: flex;
            align-items: center;
            font-size: 14px;

            .proxy-text {
                font-family: Alibaba PuHuiTi;
                font-style: normal;
                font-size: 14px;
                line-height: 22px;
            }

            .proxy-btn {
                margin-left: 10px;
                width: 30px;
                height: 18px;
                background: #e5e5e5;
                border-radius: 12px;
                position: relative;
                padding: 2px 0;
                box-sizing: border-box;
                transition: all 0.4s;

                &::after {
                    position: absolute;
                    left: 2px;
                    content: "";
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 0.1px solid rgba(0, 0, 0, 0.03);
                    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15);
                    transition: all 0.4s ease-in-out;
                }

                &.active {
                    position: relative;
                    background: #1dbb88;
                    border-radius: 12px;

                    &::after {
                        left: calc(100% - 16px);
                    }
                }
            }
        }

        .btn {
            position: relative;

            &::after {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                content: "";
                widows: 0;
                height: 0;
                border: 4px solid transparent;
                border-left-color: #666;
            }
        }

        .show-content {
            width: 300px;
            max-height: 500px;
            overflow-x: hidden;
            overflow-y: auto;
            position: absolute;
            right: 156px;
            top: 0;
            padding: 10px 0;
            background: #fff;
            border-radius: 5px;
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.16);

            .title {
                border-bottom: 1px solid #eee;
            }

            .title,
            .empty {
                &:hover {
                    background: #fff;
                }
            }

            .empty {
                justify-content: center;
                opacity: 0.5;
            }

            li {
                padding: 10px 20px;
                display: flex;
                align-items: center;

                img {
                    width: 20px;
                    height: auto;
                }

                p {
                    font-size: 12px;
                    margin-left: 10px;
                }

                &:hover {
                    background: #f5f5f5;
                }
            }
        }
    }

    //   .d-login-wrap {
    //     width: 100%;
    //     height: 100%;
    //     position: fixed;
    //     top: 0;
    //     left: 0;
    //     bottom: 0;
    //     right: 0;
    //     z-index: 999;
    //     background: rgba(0, 0, 0, 0.5);
    //     .d-login {
    //       width: 300px;
    //       min-height: 200px;
    //       position: fixed;
    //       left: 50%;
    //       top: 50%;
    //       transform: translate(-50%, -50%);
    //       z-index: 100;
    //       background: #fff;
    //       border-radius: 10px;
    //       overflow: hidden;
    //       padding: 20px;
    //       h5 {
    //         font-size: 16px;
    //         color: #1dbb88;
    //         text-align: center;
    //         position: relative;
    //         span {
    //           position: absolute;
    //           right: 0;
    //           top: 0;
    //           font-size: 16px;
    //           color: #1dbb88;
    //           cursor: pointer;
    //         }
    //       }
    //       .apply-info {
    //         margin-top: 10px;
    //         font-size: 16px;
    //         display: flex;
    //         align-items: center;
    //         figure {
    //           width: 30px;
    //           height: 30px;
    //           margin-right: 8px;
    //         }
    //         img {
    //           width: 100%;
    //           height: 100%;
    //           object-fit: cover;
    //         }
    //       }
    //       .tip {
    //         line-height: 30px;
    //         margin: 10px 0;
    //         font-size: 14px;
    //       }
    //       .tel {
    //         height: 50px;
    //         line-height: 50px;
    //         border-top: 1px solid #ccc;
    //         border-bottom: 1px solid #ccc;
    //         color: #1dbb88;
    //         font-size: 16px;
    //       }
    //       .footer-wrap {
    //         display: flex;
    //         justify-content: center;
    //         button {
    //           width: 80px;
    //           height: 30px;
    //           display: block;
    //           margin: 20px 8px 0;
    //           padding: 8px 10px;
    //           border: none;
    //           border-radius: 3px;
    //           cursor: pointer;
    //           &.cancel {
    //             background: #f5f5f5;
    //             color: #1dbb88;
    //           }
    //           &.confirm {
    //             background: #1dbb88;
    //             color: #fff;
    //           }
    //         }
    //       }
    //     }
    //   }
}

// .gu-mirror {
//   border-radius: 8px 8px 0 0;
//   box-sizing: border-box;
//   line-height: 20px;
//   border: 1px solid #eee;
//   position: relative;
//   z-index: 999999;
//   .etabs-tab-icon {
//     display: inline-block;
//     width: 20px;
//     height: 20px;
//     vertical-align: middle;
//     img {
//       vertical-align: middle;
//     }
//   }
//   .etabs-tab-title {
//     text-overflow: ellipsis;
//     overflow: hidden;
//     white-space: nowrap;
//     vertical-align: middle;
//     width: calc(100% - 70px);
//     height: 20px;
//     text-align: left;
//     overflow: hidden;
//   }
//   .etabs-tab-buttons {
//     display: inline;
//   }
// }
.etabs-views {
    position: relative;
    z-index: 99;
}
</style>
