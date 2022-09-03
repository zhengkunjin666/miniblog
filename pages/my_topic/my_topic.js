// pages/my_topic/my_topic.js
const App = getApp();

Page({
  data: {
    hasUser: false,
    openid: undefined,
  },
  onLoad() {
    const openid = App.globalData.openid;
    !openid ? "" : this.setData({ hasUser: true });
    this.setData({ openid });
  }
})