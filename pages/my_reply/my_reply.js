// pages/my_reply/my_reply.js
const util = require('../../utils/util.js');
const App = getApp();
const db = wx.cloud.database();
const createRecycleContext = require('miniprogram-recycle-view');
const rpx2px = (rpx) => (rpx / 750) * wx.getSystemInfoSync().windowWidth;

Page({
  data: {
    height: null,
    triggered: true,
    scrollTop: null,
    cangotop: false,
  },
  ctx: undefined,
  skip: 0,
  loading: true, 
  onLoad() {
    const height = wx.getSystemInfoSync().windowHeight;
    this.setData({ height });
    this.render();
    this.showReply(0);
  },
  render() {
    this.ctx = createRecycleContext({
      id: "replyId",
      dataKey: "replyList",
      page: this,
      itemSize: {
        width: rpx2px(750),
        height: rpx2px(200),
      }
    });
  },
  showReply(skip, event) {
    const commenter = App.globalData.openid;
    const that = this;
    db.collection("reply").where({ commenter }).skip(skip).limit(20).orderBy("created_at", "desc").get({
      success(res) {
        const reply = res.data;
        reply.forEach(data => {
          data.created_at = util.formatTime(new Date(data.created_at));
        })
        that.skip += reply.length;
        if (event == "refresh") {
          that.ctx.splice(0, 999999);
          that.ctx.append(reply);
          that.setData({ triggered: false });
          wx.showToast({
            title: "刷新成功",
            mask: true
          });
        } else if (event == "add" && reply.length > 0) {
          that.ctx.append(reply);
          that.loading = true;
        } else if (event == "add" && reply.length == 0) {
          wx.showToast({
            title: "数据已到底",
            icon: "none"
          });
          that.loading = true;
        } else {
          that.ctx.append(reply);
        }
      },
      fail() {
        wx.showToast({
          title: "网络错误",
          icon: none
        })
      }
    })
  },
  onRefresh() {
    this.skip = 0;
    this.showReply(0, "refresh");
  },
  scrolltolower() {
    if (!this.loading) {
      return;
    }
    this.loading = false;
    const skip = this.skip;
    this.showReply(skip,"add");
  },
  pageScroll(event) {
    if (this.skip > 20 && event.detail.scrollTop > 500) {
      this.setData({ cangotop: true })
    } else {
      this.setData({ cangotop: false })
    }
  },
  handletoTop() {
    this.setData({ scrollTop: 0 });
    this.ctx.splice(20, this.skip);
    this.skip = 20;
  },
})