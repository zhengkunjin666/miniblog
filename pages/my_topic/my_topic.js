// pages/my_topic/my_topic.js
const App = getApp();

Page({
  data: {
    openid: undefined,
  },
	onLoad() {
    const openid = App.globalData.openid;
    this.setData({ openid });
  },
})