<template>
    <div :class="fromType" ref="search">
        <div class="search-history-wrap" ref="searchHistory">
            <div class="search-input-container">
                <i class="search-icon"></i>
                <input
                    id="searchInput"
                    ref="input"
                    autocomplete="off"
                    v-model="appUrl"
                    @input="handlerInput"
                    @focus="handlerFocus(1)"
                    @keydown.esc="cancel"
                    @keypress.enter="handlerSearch"
                    @contextmenu.prevent="openMenu"
                    type="text"
                    :placeholder="$t('web3.search_url')"
                />
                <div class="action-icon">
                    <em class="enter-icon" @click="handlerSearch"></em>
                    <Icon
                        type="ios-close"
                        v-if="isFocus"
                        @click="handlerFocus(0)"
                        class="hide-history"
                    />
                </div>
            </div>
            <div class="history-wrap" v-if="isFocus">
                <h5>
                    <strong>{{ $t("web3.search_history") }}</strong>
                    <span
                        v-if="historyList.length"
                        :class="
                            !showDeleteIcon
                                ? 'delete-all-btn-normal'
                                : 'delete-all-btn'
                        "
                        @click="deleteAllAction"
                        ref="deleteAllSelected"
                    >
                        {{ !showDeleteIcon ? "" : $t("web3.delete_all") }}</span
                    >
                </h5>
                <ul>
                    <li
                        v-for="(historyItem, index) in historyList"
                        :key="index"
                    >
                        <p
                            @click="go2NewWin(historyItem, 1)"
                            class="single-line"
                        >
                            {{ getHost(historyItem) }}
                        </p>
                        <em @click="handlerDeleteItem(historyItem)">
                            <Icon type="ios-close" />
                        </em>
                    </li>
                </ul>
            </div>
        </div>
        <!-- 搜索框 右击更多~ -->
        <right-click-menu
            ref="menuComponent"
            :inputText="appUrl"
            @resetInputText="resetInputText"
        ></right-click-menu>
        <div
            class="focus-mask"
            v-show="fromType === 'web3-view' && isFocus"
        ></div>
    </div>
</template>

<script>
import RightClickMenu from "@/ui/common/rightClick/RightClickMenu";
import wfc from "@/wfc/client/wfc";
import {
    getSearchHistory,
    delAllSearchHistory,
    delSearchHistory,
} from "@/axios";

export default {
    props: {
        fromType: {
            type: String,
            default: "",
        },
        fromUrl: {
            type: Object,
            default: () => {
                return {
                    showWeb3Url: "",
                    web3ViewId: 0,
                };
            },
        },
    },
    components: { RightClickMenu },
    data() {
        return {
            showDeleteIcon: false,
            isFocus: false,
            historyList: [],
            appUrl: "",
        };
    },
    computed: {
        getHost() {
            return (item) => {
                try {
                    return new URL(item.url).host;
                } catch (error) {
                    console.log(error);
                    return item.url;
                }
            };
        },
    },
    watch: {
        fromUrl: {
            handler(n) {
                this.appUrl = n.showWeb3Url;
            },
            deep: true,
            immediate: true,
        },
    },
    created() {
        this.appUrl = this.fromUrl.showWeb3Url;
    },
    mounted() {
        let dom = this.$refs.searchHistory;
        dom && dom.addEventListener("click", this.clickRemoveDeleteAll);
        document.addEventListener("click", this.clickRemoveHistory);
    },
    methods: {
        //点击enter-icon 或者键盘enter
        handlerSearch() {
            let url = this.appUrl.replace(/\s/g, "");
            if (!url) return;
            if (!(url.startsWith("http") || url.startsWith("https"))) {
                url = `https://${url}`;
            }
            // 打开链接
            this.go2NewWin({
                lightAppName: "",
                lightAppIconUrl: "",
                lightAppUrl: url,
            });
            // 置空
            this.$nextTick(() => {
                this.appUrl = "";
            });
        },
        // 点击图标打开链接
        go2NewWin(item) {
            this.$eventBus.$emit("openThisWeb3", item);
            this.isFocus = false;
        },
        cancel() {
            this.$refs["input"].blur();
        },
        deleteAllAction() {
            if (!this.showDeleteIcon) {
                this.showDeleteIcon = true;
            } else {
                this.handlerDeleteAll();
            }
        },
        // 点击删除所有历史记录
        async handlerDeleteAll() {
            try {
                let res = await delAllSearchHistory({
                    userId: wfc.getUserId(),
                });
                let { message, code } = res.data;
                if (code === "000000") {
                    this.getSearchHistoryList();
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 点击删除单个历史记录
        async handlerDeleteItem(item) {
            if (this.lock) return;
            this.lock = true;
            try {
                let { iconUrl, title, url, userId } = item;
                let res = await delSearchHistory({
                    iconUrl,
                    title,
                    url,
                    userId: userId || wfc.getUserId(),
                });
                this.lock = false;
                let { code, message } = res.data;
                if (code === "000000") {
                    this.getSearchHistoryList();
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.lock = false;
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 获取预览历史列表
        async getSearchHistoryList() {
            try {
                let res = await getSearchHistory({});
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.historyList = data.map((item) => {
                        return {
                            ...item,
                            lightAppUrl: item.url,
                            lightAppIconUrl: item.iconUrl,
                            lightAppName: item.title,
                        };
                    });
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 显示历史记录模块
        handlerFocus(type) {
            let isTrue = type && !this.isFocus;
            if (this.fromType === "web3-home") {
                isTrue && this.getSearchHistoryList();
                this.isFocus = true;
            } else {
                !this.appUrl && isTrue && this.getSearchHistoryList();
                this.isFocus = !this.appUrl && isTrue;
            }
        },
        // view 页面获取焦点，输入框为空的时候线索历史记录
        handlerInput() {
            if (
                this.fromType === "web3-view" &&
                !this.appUrl &&
                !this.isFocus
            ) {
                // 获取历史搜索
                this.getSearchHistoryList();
                this.isFocus = true;
            } else {
                this.isFocus = false;
            }
            if (this.fromUrl.showWeb3Url.indexOf("web3home") === -1) {
                this.$eventBus.$emit("markSearchUrl", this.appUrl);
            }
        },
        // 点击其他地方恢复默认删除按钮
        clickRemoveDeleteAll(e) {
            let currentDom = e.target;
            let selected = this.$refs.deleteAllSelected;
            if (selected) {
                if (!selected.contains(currentDom)) {
                    this.showDeleteIcon = false;
                }
            }
        },
        // 点击其他地方历史模块隐藏
        clickRemoveHistory(e) {
            let currentDom = e.target;
            let historyDom = this.$refs.searchHistory;
            if (historyDom) {
                if (!historyDom.contains(currentDom)) {
                    this.isFocus = false;
                }
            }
        },
        resetInputText() {
            this.appUrl = "";
        },
        openMenu($event) {
            this.$refs.menuComponent.$refs.menu.open($event);
        },
    },
    beforeUnmount() {
        let dom = this.$refs.searchHistory;
        dom && dom.removeEventListener("click", this.clickRemoveDeleteAll);
        document.removeEventListener("click", this.clickRemoveHistory);
    },
};
</script>
<style lang="less" scoped>
.web3-view,
.web3-page {
    flex: 1;
    position: relative;
}
.web3-view {
    margin: 0 20px;
}
.search-history-wrap {
    display: flex;
    flex-direction: column;
    .search-input-container {
        display: flex;
        align-items: center;
        height: 36px;
        border-radius: 20px;
        position: relative;
        input {
            width: 100%;
            height: 100%;
            padding: 0 50px 0 30px;
            border-radius: 30px;
            text-align: left;
            flex: 1;
            border: none;
            outline: none;
            border: 1px solid rgba(0, 0, 0, 0.18);
            font-size: 14px;
            line-height: 22px;
            color: #4c4c4c;
            transition: 1s;
            background: transparent;
        }

        .search-icon {
            position: absolute;
            top: 50%;
            left: 10px;
            transform: translate(0, -50%);
            width: 16px;
            height: 16px;
            z-index: 9;
            font-size: 14px;
            &::before {
                content: "";
                width: 16px;
                height: 16px;
                display: block;
                background: url(../../assets/images/search-icon.png);
                background-size: 100% auto;
            }
        }

        .action-icon {
            width: 50px;
            height: 22px;
            position: absolute;
            top: 50%;
            transform: translate(0, -50%);
            z-index: 9;
            right: 5px;
            display: flex;
            justify-content: flex-end;
            .enter-icon,
            .hide-history {
                width: 24px;
                height: 24px;
                overflow: hidden;
                font-size: 25px;
            }
            .enter-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                &::before {
                    width: 16px;
                    height: 16px;
                    display: block;
                    content: "";
                    background: url(../../assets/images/enter-icon.png);
                    background-size: contain;
                }
            }
        }
    }
    .history-wrap {
        position: absolute;
        top: 38px;
        z-index: 90;
        width: 100%;
        background: #ffffff;
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.16);
        border-radius: 4px;
        h5 {
            display: flex;
            justify-content: space-between;
            line-height: 20px;
            padding: 12px 16px 8px 16px;
            box-sizing: border-box;
            height: 45px;
            strong {
                font-family: "PingFang SC";
                font-style: normal;
                font-weight: 500;
                font-size: 14px;
                line-height: 24px;
                color: #000000;
            }
            .delete-all-btn {
                font-family: "PingFang SC";
                font-style: normal;
                font-weight: 500;
                font-size: 12px;
                line-height: 17px;
                color: #ec4646;
                vertical-align: middle;
                background: #e9e9e9;
                border-radius: 12px;
                padding: 4px 6px 4px 25px;
                position: relative;
                &::before {
                    position: absolute;
                    top: 50%;
                    left: 6px;
                    transform: translateY(-50%);
                    content: "";
                    width: 20px;
                    height: 20px;
                    background: url(../../assets/images/delete-all-selected.png)
                        no-repeat center center;
                    background-size: contain;
                }
            }
            .delete-all-btn-normal {
                width: 20px;
                height: 20px;
                &::before {
                    content: "";
                    width: 100%;
                    height: 100%;
                    display: block;
                    background: url(../../assets/images/delete-all.png)
                        no-repeat center center;
                    background-size: 20px auto;
                }
            }
        }
        ul {
            min-height: 100px;
            max-height: 200px;
            overflow-y: auto;
            li {
                height: 40px;
                line-height: 40px;
                padding: 8px 16px;
                display: flex;
                justify-content: space-between;
                &:hover {
                    background: #f2f2f2;
                }
                p {
                    font-family: "PingFang SC";
                    font-style: normal;
                    font-weight: 400;
                    font-size: 14px;
                    line-height: 24px;
                    color: #222222;
                    flex: 1;
                    text-align: left;
                }
                em {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    font-size: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    &:hover {
                        background: #dddddd;
                    }
                }
            }
        }
    }
}
.web3-view .search-input-container {
    height: 24px;
    input {
        border: 1px solid #eee;
        font-size: 12px;
        border-radius: 20px;
        &:active {
            width: 100%;
            border: 1px solid #1dbb88;
        }
        &:focus {
            width: 100%;
            border: 1px solid #1dbb88;
        }
    }
}
.web3-view .search-history-wrap .history-wrap {
    top: 30px;
}
.focus-mask {
    position: fixed;
    top: 78px;
    left: 68px;
    right: 0;
    bottom: 0;
    width: calc(100vw - 68px);
    height: calc(100vw - 78px);
}
</style>
