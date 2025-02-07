<template>
    <div class="ligth-app">
        <div
            :class="['toogle-menu-btn', toggleMenubar ? '' : 'hide']"
            @click="handleToogleMenu"
            :title="toggleMenubar ? $t('web3.expand') : $t('web3.collapse')"
        ></div>
        <header class="header-wrap">
            <!-- 搜索框 -->
            <web3-search fromType="web3-page" :fromUrl="fromUrl"></web3-search>
            <div
                class="proxy-wrap"
                v-if="
                    permissionList.vipLevel >=
                    permissionList.proxySwitchVipLevel
                "
            >
                <Tooltip placement="left">
                    <template #content>
                        <p>{{ $t("web3.wifi_tip_1") }}</p>
                        <p style="word-wrap: break-word">
                            {{ $t("web3.wifi_tip_2") }}
                        </p>
                    </template>
                    <span class="proxy-text"> {{ $t("web3.cdnm") }} </span>
                </Tooltip>
                <span
                    :class="['proxy-btn', { active: isProxy }]"
                    @click="changeSetProxy"
                ></span>
            </div>
        </header>
        <div class="list-wrap">
            <!-- ai -->
            <div class="ai-wrap" v-if="aiList.length">
                <ul>
                    <li
                        v-for="(aiItem, index) in aiList"
                        :key="index"
                        @click="go2NewWin(aiItem)"
                    >
                        <figure>
                            <img
                                :src="appIconUrl(aiItem)"
                                :default-img="defaultImage"
                                v-real-img="appIconUrl(aiItem)"
                                draggable="false"
                            />
                        </figure>
                        <h6 class="name">
                            {{ aiItem.lightAppName || aiItem.lightAppUrl }}
                        </h6>
                    </li>
                </ul>
            </div>
            <!-- 我的收藏 -->
            <div class="collection-wrap" v-if="collectionList.length">
                <h5 class="title">
                    <span>{{ title3 }}</span>
                </h5>
                <ul>
                    <li
                        v-for="(collectionItem, index) in collectionList"
                        :key="index"
                        @contextmenu.prevent="
                            $refs.menu.open($event, collectionItem)
                        "
                        @click="go2NewWin(collectionItem)"
                    >
                        <figure>
                            <img
                                :src="appIconUrl(collectionItem)"
                                v-real-img="appIconUrl(collectionItem)"
                                draggable="false"
                                :default-img="defaultImage"
                            />
                        </figure>
                        <h6 class="name">
                            {{
                                collectionItem.lightAppName ||
                                collectionItem.lightAppUrl
                            }}
                        </h6>
                    </li>
                </ul>
            </div>
            <!-- 我的插件 -->
            <div class="app-list" v-if="appList.length">
                <h5 class="title plugin-title">
                    <span>
                        {{ title1 }}
                    </span>
                </h5>
                <ul>
                    <li
                        v-for="item in appList"
                        :key="item.id"
                        v-show="item.linkUrl"
                        @click="go2NewWin({ lightAppUrl: item.linkUrl })"
                        :style="{
                            backgroundImage: `url(${item.backgroundImageUrl})`,
                        }"
                    >
                        <figure>
                            <img :src="item.logoUrl" draggable="false" />
                            <figcaption>
                                <strong>{{ item.title }}</strong>
                                <span>{{ item.subTitle }}</span>
                            </figcaption>
                        </figure>
                    </li>
                </ul>
            </div>
            <!-- 热门插件 -->
            <!-- <div class="product-list" v-if="productList.length">
                <h5 class="title">
                    <span>{{ title2 }}</span>
                </h5>
                <ul>
                    <li
                        v-for="item in productList"
                        @click="go2NewWin({ lightAppUrl: item.linkUrl })"
                        :key="item.id"
                    >
                        <img :src="item.imageUrlPc" draggable="false" />
                    </li>
                </ul>
            </div> -->
        </div>
        <vue-context
            ref="menu"
            v-slot="{ data: currentItem }"
            :close-on-scroll="true"
        >
            <li>
                <a @click.prevent="go2NewWin(currentItem)">{{
                    $t("common.open")
                }}</a>
            </li>
            <li>
                <a @click.prevent="remove(currentItem)">{{
                    $t("common.remove")
                }}</a>
            </li>
        </vue-context>
    </div>
</template>

<script>
import Web3Search from "./Web3Search";
import {
    getWeb3Favorites,
    delWeb3Favorite,
    getBannerAppList,
    getRecommendAppListV2,
} from "@/axios";
import wfc from "@/wfc/client/wfc";
import { toRaw } from "vue";
export default {
    name: "Web3List",
    props: {
        isProxy: {
            type: Boolean,
            default: false,
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
    data() {
        return {
            appList: [], // 应用推荐
            productList: [], // 热门插件
            collectionList: [], // 个人收藏
            aiList: [], // ai插件列表
            defaultImage: require("../../assets/images/ic_us_logo.png"),
            removeLock: false,
            title1: this.$t("web3.plugin_title"),
            title2: this.$t("web3.plugin_hot"),
            title3: this.$t("web3.my_fav"),
        };
    },
    components: {
        Web3Search,
    },
    computed: {
        toggleMenubar() {
            return this.$store.state.toggleMenubar;
        },
        permissionList() {
            return this.$store.state.permissionList;
        },
        // 轻应用图标
        appIconUrl() {
            return (item) => {
                return item.lightAppIconUrl || this.defaultImage;
            };
        },
    },
    methods: {
        // 获取个人收藏列表
        async getCollectionList() {
            try {
                let res = await getWeb3Favorites({ userId: wfc.getUserId() });
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.collectionList = data.map((item) => {
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
        // 获取ai列表
        async getAiList() {
            try {
                let res = await getRecommendAppListV2({
                    userId: wfc.getUserId(),
                    type: "ai",
                });
                let { code, message, data } = res.data;
                if (code === "000000") {
                    this.aiList = data;
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 获取banner图 父组件调用
        async getBannerList(type) {
            try {
                let res = await getBannerAppList({ type });
                let { data, message, code } = res.data;
                if (code === "000000") {
                    type ? (this.productList = data) : (this.appList = data);
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                console.log(error);
            }
        },
        // 点击图标打开链接
        go2NewWin(item) {
            this.$parent.addTab({ ...item, _isOpen: 1 });
        },
        // 移除个人收藏
        async remove(item) {
            if (this.removeLock) return;
            this.removeLock = true;
            try {
                let res = await delWeb3Favorite({
                    lightAppFavoriteId: item.lightAppFavoriteId,
                });
                this.removeLock = false;
                let { code, message } = res.data;
                if (code === "000000") {
                    this.$Message.success(this.$t("web3.remove_success"));
                    // 更新列表
                    this.getCollectionList();
                } else {
                    this.$Message.error(message);
                }
            } catch (error) {
                this.removeLock = false;
                console.log(error);
                this.$Message.error(this.$t("common.error_later"));
            }
        },
        // 切换跨域
        changeSetProxy() {
            this.$emit("handlerOpenProxy");
        },
        handleToogleMenu() {
            this.$store.dispatch("UpdateToogleMenuBar", !this.toggleMenubar);
        },
    },
};
</script>
<style>
.ligth-app .ivu-tooltip-inner {
    white-space: normal;
}
</style>
<style lang="less" scoped>
.ligth-app {
    width: 100%;
    position: relative;
    height: calc(100% - 62px);
    overflow: hidden;
    box-sizing: border-box;
    .toogle-menu-btn {
        position: absolute;
        left: 6px;
        top: 6px;
        width: 24px;
        height: 24px;
        font-size: 12px;
        background: url(../../assets/images/show-btn.png) no-repeat center
            center;
        background-size: 24px auto;

        &.hide {
            background: url(../../assets/images/hide-btn.png) no-repeat center
                center;
            background-size: 24px auto;
        }

        .ivu-tooltip,
        .ivu-tooltip-rel {
            display: block;
            width: 100%;
            height: 100%;
        }
    }

    .header-wrap {
        width: 100%;
        display: flex;
        text-align: center;
        align-items: flex-start;
        padding: 0 70px;
        box-sizing: border-box;
        margin: 40px auto 0;
        max-width: 1000px;

        .proxy-wrap {
            margin-left: 50px;
            height: 36px;
            display: flex;
            align-items: center;
            font-size: 18px;

            .proxy-text {
                font-family: Alibaba PuHuiTi;
                font-style: normal;
                font-weight: 500;
                font-size: 16px;
                line-height: 22px;
                color: #333333;
            }

            .proxy-btn {
                margin: 3px 0 0 20px;
                width: 40px;
                height: 24px;
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
                    width: 20px;
                    height: 20px;
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
                        left: calc(100% - 22px);
                    }
                }
            }
        }
    }

    .list-wrap {
        width: 100%;
        height: calc(100% - 76px);
        padding: 0 24px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-y: auto;
        overflow-x: hidden;

        .title {
            font-family: "PingFang SC";
            font-style: normal;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            color: rgba(131, 144, 174, 1);
            &.plugin-title {
                font-size: 16px;
                color: rgba(7, 25, 67, 1);
            }
            span {
                position: relative;
                &::after {
                    content: "";
                    width: 100%;
                    height: 8px;
                    background: linear-gradient(
                        90deg,
                        rgba(29, 187, 136, 0.32) 0%,
                        rgba(29, 187, 136, 0) 100%
                    );
                    border-radius: 4px;
                    position: absolute;
                    left: 0;
                    bottom: -2px;
                }
            }
        }
        .app-list {
            margin-top: 32px;
            border-radius: 24px;
            background: rgba(255, 255, 255, 1);
            width: 100%;
            max-width: 1000px;
            padding: 16px;
            box-sizing: border-box;
            ul {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
                margin-top: 24px;
                li {
                    width: 100%;
                    box-sizing: border-box;
                    border: 1px solid rgba(243, 243, 243, 1);
                    box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.04);
                    border-radius: 24px;
                    display: flex;
                    background-size: auto 100%;
                    background-repeat: no-repeat;
                    background-position: 101% center;
                    justify-content: space-between;
                    padding: 8px;

                    figure {
                        display: flex;
                        align-items: center;
                        img {
                            width: 48px;
                            height: 48px;
                        }
                        figcaption {
                            display: flex;
                            flex-direction: column;
                            margin-left: 6px;
                            strong {
                                font-size: 14px;
                                font-weight: bold;
                                line-height: 20px;
                                color: #000;
                            }
                            span {
                                font-size: 12px;
                                color: rgba(119, 119, 119, 1);
                            }
                        }
                    }
                }
            }
        }

        .product-list {
            width: 100%;
            max-width: 1000px;
            padding: 16px;
            margin-top: 8px;
            box-sizing: border-box;
            ul {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
                li {
                    width: 100%;
                    box-sizing: border-box;
                    margin-top: 14px;
                    img {
                        width: 100%;
                        height: auto;
                        max-height: 100%;
                        display: block;
                        object-fit: contain;
                    }
                }
            }
        }

        .collection-wrap,
        .ai-wrap {
            width: 100%;
            max-width: 1000px;
            min-width: 750px;
            padding: 16px;
            box-sizing: border-box;

            ul {
                margin-top: 14px;
                display: grid;
                grid-template-columns: repeat(7, 1fr);

                li {
                    width: 90px;
                    height: 70px;
                    margin: 0 2px 20px;

                    figure {
                        width: 48px;
                        height: 48px;
                        margin: 0 auto;
                        border-radius: 12px;
                        overflow: hidden;

                        img {
                            width: 100%;
                            height: 100%;
                        }
                    }

                    .name {
                        margin-top: 6px;
                        padding: 0 6px;
                        font-family: "PingFang SC";
                        font-size: 12px;
                        line-height: 18px;
                        text-align: center;
                        word-break: keep-all;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        color: #344057;
                    }
                }

                li.empty {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    margin-top: 0;

                    img {
                        width: 153px;
                        height: 110px;
                    }
                }
            }
        }
    }
}
</style>
