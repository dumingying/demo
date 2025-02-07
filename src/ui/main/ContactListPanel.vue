<template>
    <section class="contact-list-panel-container">
        <div class="header-wrap">
            <figure @click="goBack" class="back">
                <img src="../../assets/images/back.png" draggable="false" />
                <label>{{ $t("voip.message") }}/</label>
            </figure>
            <span>{{ $t("contact.address_book") }}</span>
        </div>
        <SearchView />
        <div class="panel">
            <SearchResultView
                v-bind:query="sharedSearchState.query"
                v-if="sharedSearchState.show"
                class="search-result-container"
            />
            <ContactListView class="contact-list-container" />
        </div>
    </section>
</template>

<script>
import SearchView from "@/ui/main/search/SearchView";
import ContactListView from "@/ui/main/contact/ContactListView";
import store from "@/store";
import SearchResultView from "@/ui/main/search/SearchResultView";

export default {
    name: "ContactListPanel",
    data() {
        return {
            sharedSearchState: store.state.search,
        };
    },

    methods: {
        goBack() {
            if (this.$router.currentRoute.value.name === "contact") {
                this.$router.replace("/home/conversation");
            }
        },
    },
    components: {
        SearchResultView,
        ContactListView,
        SearchView,
    },
};
</script>

<style lang="css" scoped>
.contact-list-panel-container {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e6e6e6;
}
.header-wrap {
    display: flex;
    align-items: center;
    margin-top: 30px;
    padding: 0 12px;
}
.header-wrap .back {
    display: flex;
    align-items: center;
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    color: #999999;
}
.header-wrap .back img {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    overflow: hidden;
    margin-right: 8px;
}
.header-wrap span {
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    color: #000000;
}
.panel {
    position: relative;
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
