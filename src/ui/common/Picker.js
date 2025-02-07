import PickUserView from "../main/pick/PickUserView";
import store from "../../store";
export default {
    install(app, options) {
        app.config.globalProperties.$pickContact = function(options) {
            let beforeClose = event => {
                if (!event.params) return;
                if (event.params.confirm) {
                    let users = event.params.users;
                    options.successCB && options.successCB(users);
                } else {
                    options.failCB && options.failCB(-1);
                }
            };
            this.$modal.show(
                PickUserView,
                {
                    users: options.users
                        ? options.users
                        : store.state.contact.favContactList.concat(
                            store.state.contact.friendList
                        ),
                    initialCheckedUsers: options.initialCheckedUsers,
                    initEditUsers: options.initEditUsers || false,
                    uncheckableUsers: options.uncheckableUsers,
                    showCategoryLabel: options.showCategoryLabel !== false,
                    confirmTitle: options.confirmTitle
                        ? options.confirmTitle
                        : this.$t('common.confirm'),
                    confirmCallback: options.confirmCallback
                }, null,
                {
                    name: "pick-user-modal",
                    width: 600,
                    height: 480,
                    clickToClose: false,
                    escToClose: true,
                },
                {
                    // 'before-open': this.beforeOpen,
                    "before-close": beforeClose
                    // 'closed': this.closed,
                }
            );
        };
    }
};
