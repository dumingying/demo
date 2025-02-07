<template>
  <section class="articles-container">
    <div
      v-if="
        !message.messageContent.subArticles || !message.messageContent.subArticles.length
      "
      class="top-article"
      @click="openArticle(message.messageContent.topArticle)"
    >
      <figure class="img-wrap">
        <img :src="message.messageContent.topArticle.cover" />
      </figure>
      <div class="info">
        <p class="title">{{ message.messageContent.topArticle.title }}</p>
        <p class="digest">{{ message.messageContent.topArticle.digest }}</p>
      </div>
    </div>
    <div
      v-else
      class="top-article sub"
      @click="openArticle(message.messageContent.topArticle)"
    >
      <figure class="img-wrap">
        <img :src="message.messageContent.topArticle.cover" draggable="false" />
      </figure>
      <p class="title">{{ message.messageContent.topArticle.title }}</p>
    </div>
    <template v-if="message.messageContent.subArticles">
      <div
        v-for="(sa, si) in message.messageContent.subArticles"
        :key="si"
        class="sub-article"
        @click="openArticle(message.messageContent.topArticle)"
      >
        <div class="sub-info">
          <p class="title">{{ sa.title }}</p>
          <p class="digest">{{ message.messageContent.topArticle.digest }}</p>
        </div>
        <figure class="img-wrap">
          <img :src="sa.cover" draggable="false" />
        </figure>
      </div>
    </template>
  </section>
</template>

<script>
import Message from "../../../../wfc/messages/message";

export default {
  name: "ArticlesMessageContentView",
  props: {
    message: {
      type: Message,
      required: true,
    },
  },
  created() {},
  methods: {
    openArticle(article) {
      article.url && this.mixinGo2Web3View(article.url);
    },
  },
};
</script>

<style scoped>
.articles-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
  justify-content: center;
}

.top-article {
  position: relative;
  width: 400px;
  background: #fff;
  border-radius: 5px;
  margin: 5px 0;
  overflow: hidden;
}
.top-article:hover {
  background: #e0e0e0e5;
}
.top-article .info {
  padding: 10px;
  background: #fff;
}
.top-article .info .title,
.top-article .info .digest {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  margin-top: 10px;
}
.top-article .info .digest {
  font-size: 12px;
  line-height: 18px;
  color: #999;
}
.top-article .img-wrap {
  width: 100%;
  height: 150px;
  background: #fff;
}
.top-article .img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.top-article.sub {
  margin: 0;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}

.top-article.sub .title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  position: absolute;
  bottom: 10px;
  left: 0;
  color: white;
  padding: 0 20px;
  transform: translateY(-50%);
}

.sub-article {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  position: relative;
  width: 400px;
  height: 80px;
  background: white;
  padding: 0 10px;
}

.sub-article:hover {
  background: #e0e0e0e5;
}

.articles-container .sub-article:last-of-type {
  border-bottom-right-radius: 5px;
  border-bottom-left-radius: 5px;
  border-bottom: none;
}

.sub-article .sub-info {
  flex: 1;
}
.sub-article .sub-info .title,
.sub-article .sub-info .digest {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  line-height: 20px;
}
.sub-article .sub-info .title {
  font-size: 14px;
  color: #333;
  line-height: 24px;
}
.sub-article .sub-info .digest {
  color: #999;
}

.sub-article .img-wrap {
  width: 60px;
  height: 60px;
  margin-left: 10px;
  border-radius: 3px;
  overflow: hidden;
}
.sub-article .img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
