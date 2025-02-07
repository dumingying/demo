<template>
    <div class="contact-page">
        <ContactListPanel class="contact-list-panel" />
        <GroupDetailView
            v-if="sharedContactState.currentGroup"
            :group="sharedContactState.currentGroup"
            class="contact-detail-container"
        />
        <ChannelDetailView
            v-else-if="sharedContactState.currentChannel"
            :channel="sharedContactState.currentChannel"
            class="contact-detail-container"
        />
        <UserDetailView
            v-else-if="sharedContactState.currentFriend"
            :user="sharedContactState.currentFriend"
            class="contact-detail-container"
        />
        <FriendRequestDetailView
            v-else-if="sharedContactState.currentFriendRequest"
            class="contact-detail-container"
        />
        <SearchNewUser
            v-else-if="sharedContactState.findNewFriend"
            class="contact-detail-container"
        />
        <figure v-else class="contact-empty-container">
            <img
                src="../../assets/images/default-bg.png"
                width="120"
                draggable="false"
            />
        </figure>
    </div>
</template>

<script>
import ContactListPanel from "@/ui/main/ContactListPanel";
import GroupDetailView from "@/ui/main/contact/GroupDetailView";
import store from "@/store";
import UserDetailView from "@/ui/main/contact/UserDetailView";
import FriendRequestDetailView from "@/ui/main/contact/FriendRequestDetailView";
import SearchNewUser from "@/ui/main/contact/SearchNewUser";
import ChannelListView from "./contact/ChannelListView";
import ChannelDetailView from "./contact/ChannelDetailView";

export default {
    name: "ContactPage",
    data() {
        return {
            sharedContactState: store.state.contact,
        };
    },
    components: {
        FriendRequestDetailView,
        UserDetailView,
        GroupDetailView,
        ChannelDetailView,
        ChannelListView,
        ContactListPanel,
        SearchNewUser,
    },
};
</script>

<style lang="css" scoped>
.contact-page {
    display: flex;
    flex: 1;
    height: 100%;
}

.contact-list-panel {
    background: #fff;
    width: 240px;
    height: 100%;
}

ul {
    list-style: none;
}

.contact-detail-container {
    flex: 1;
    background: #fff;
}
.contact-detail-container.channel-info-container {
    background-color: #f5f6f9;
}

.contact-empty-container {
    flex: 1;
    background-color: #f5f6f9;
    display: flex;
    justify-content: center;
    align-items: center;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
}

.contact-empty-container h1 {
    font-size: 17px;
    font-weight: normal;
}
</style>
