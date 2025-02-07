<template>
  <div
    :class="[
      'meeting-report',
      messageContent.reportType === 1
        ? 'week-report'
        : messageContent.reportType === 2
        ? 'month-report'
        : '',
    ]"
    @click="handle"
  >
    <div class="header">
      {{ title }}
    </div>
    <div class="content" v-if="messageContent.joinCount">
      <p>
        <i18n-t keypath="message.attend_meeting">
          <template v-slot:action>
            <em>{{ messageContent.joinCount }}</em>
          </template>
        </i18n-t>
        <span v-if="messageContent.reportType === 2">
          <i18n-t keypath="message.month_total_time">
            <template v-slot:action>
              <em>{{ messageContent.joinTime }}</em>
            </template>
          </i18n-t>
        </span>
      </p>
      <template v-if="messageContent.reportType === 1">
        <p>
          <i18n-t keypath="message.week_total_time">
            <template v-slot:action>
              <em>{{ messageContent.joinTime }}</em>
            </template>
          </i18n-t>
        </p>
        <p>
          <template v-if="messageContent.createCycleMeetingCount">
            <i18n-t keypath="message.periodic_meeting">
              <template v-slot:action>
                <em>{{ messageContent.createCycleMeetingCount }}</em>
              </template>
            </i18n-t>
          </template>
          <template v-if="messageContent.createReserveMeetingCount">
            <i18n-t keypath="message.book_meeting">
              <template v-slot:action>
                <em>{{ messageContent.createReserveMeetingCount }}</em>
              </template>
            </i18n-t>
          </template>
        </p>
      </template>
      <template v-if="messageContent.reportType === 2">
        <p>
          <i18n-t keypath="message.maximum_meeting">
            <template v-slot:action>
              <em>{{ messageContent.maxMeetingTime }}</em>
            </template>
          </i18n-t>
        </p>
        <p class="no-left">
          <i18n-t keypath="message.busy_day">
            <template v-slot:action>
              <em>{{ busyDay }}</em>
            </template>
            <template v-slot:count>
              <em>{{ messageContent.maxMeetingCount }}</em>
            </template>
          </i18n-t>
        </p>
      </template>
    </div>
    <div class="content" v-else>
      {{ $t("message.year", [messageContent.year]) }}
      <span v-if="messageContent.reportType === 1">
        {{ $t("message.week", [messageContent.weekInYear]) }}
      </span>
      <span v-if="messageContent.reportType === 2">
        {{ $t("message.month", [messageContent.monthOfYear]) }}
      </span>
      <p>{{ $t("message.mysterious") }}</p>
    </div>
  </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import ReportPoster from "./ReportPoster";

import dayjs from "dayjs";
export default {
  name: "MeetingReportContentView",
  props: {
    message: {
      type: Message,
      required: true,
    },
  },
  data() {
    return {};
  },
  computed: {
    messageContent() {
      return this.message.messageContent.content;
    },
    title() {
      let time = `${this.messageContent.startTime}-${this.messageContent.endTime}`;
      if (this.messageContent.reportType === 1) {
        return `${this.$t("message.week_summary")}  |  ${time}`;
      } else {
        return `${this.$t("message.monthly_summary")}  |  ${time}`;
      }
    },
    busyDay() {
      return dayjs(this.messageContent.mostBusyDate).format("MM.DD");
    },
  },
  created() {
    // console.log(this.message.messageContent)
  },
  methods: {
    handle() {
      this.$modal.show(
        ReportPoster,
        {
          message: this.message,
        },
        null,
        {
          name: "reportPoster-modal",
          width: 375,
          height: 580,
        },
        {}
      );
    },
  },
};
</script>

<style lang="less" scoped>
.meeting-report {
  margin: 0 10px;
  width: 250px;
  display: flex;
  flex-direction: column;
  min-height: 140px;
  border-radius: 5px;
  overflow: hidden;
  background: #fff;
  .header {
    height: 40px;
    font-family: PingFang SC;
    color: #fff;
    text-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.25);
    font-family: PingFang SC;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px;
    padding: 10px 14px;
  }
  &.month-report {
    .header {
      background: linear-gradient(271.14deg, #0956ec 0%, #18a7e4 100.12%);
    }
  }
  &.week-report {
    .header {
      background: linear-gradient(271.14deg, #0ac3ec 0%, #13bade 100.12%);
    }
  }
  .content {
    padding: 16px;
    flex: 1;
    color: #777;
    font-family: PingFang SC;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
    background: url(../../../../../assets/images/report-card-bg.png) no-repeat right
      bottom;
    background-size: 120px 80px;
    .no-left {
      em {
        padding-right: 3px;
        padding-left: 0;
      }
    }
    em {
      color: #222;
      font-size: 16px;
      font-style: normal;
      padding: 0 3px;
    }
  }
}
</style>
