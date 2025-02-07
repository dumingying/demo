<template>
    <section class="conversation-list-panel-container">
        <!-- 顶部操作 -->
        <div class="header-wrap">
            <p @click="goBack" class="back">
                <img
                    src="../../assets/images/back.png"
                    draggable="false"
                    class="back-img"
                />
                <label>{{ $t("voip.message") }}</label>
            </p>
            <figure class="contact" @click="goPage">
                <img
                    src="../../assets/images/contact-btn.svg"
                    draggable="false"
                    :title="$t('contact.address_book')"
                />
            </figure>
        </div>
        <SearchView />
        <div class="panel">
            <SearchResultView
                v-bind:query="sharedSearchState.query"
                v-if="sharedSearchState.show"
                class="search-result-container"
            />
            <ConversationListView class="conversation-list-container" />
        </div>
    </section>
</template>

<script>
import ConversationListView from "@/ui/main/conversationList/ConversationListView";
import store from "@/store";
import SearchResultView from "@/ui/main/search/SearchResultView";
import SearchView from "@/ui/main/search/SearchView";

export default {
    name: "ConversationListPanel",
    data() {
        return {
            sharedSearchState: store.state.search,
        };
    },
    computed: {
        currentPage() {
            return this.$router.currentRoute.value.name;
        },
    },
    methods: {
        goBack() {
            if (this.currentPage === "conversation") {
                this.$router.replace("/home");
            }
        },
        goPage() {
            if (this.currentPage === "conversation") {
                this.$router.replace("/home/contact");
            }
        },
    },
    components: {
        SearchResultView,
        ConversationListView,
        SearchView,
    },
};
</script>

<style lang="css" scoped>
.conversation-list-panel-container {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e6e6e6;
}
.header-wrap {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    padding: 0 12px;
}
.header-wrap .back {
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: center;
}
.header-wrap .back img {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    overflow: hidden;
}
.header-wrap .back label {
    margin-left: 8px;
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    color: #000000;
}
.header-wrap .contact {
    width: 40px;
    height: 20px;
    text-align: right;
}
.header-wrap .contact img {
    width: 20px;
    height: auto;
}
.panel {
    height: calc(100% - 60px);
    max-height: calc(100% - 60px);
    position: relative;
    background-color: #f3f3f3;
    overflow-y: auto;
    flex: 1;
}

.search-result-container {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
}
</style>
