// pages/detail/detail.js
const util = require('../../utils/util.js');
const App = getApp();
const db = wx.cloud.database();
const createRecycleContext = require('miniprogram-recycle-view');
const rpx2px = (rpx) => (rpx / 750) * wx.getSystemInfoSync().windowWidth;

Page({
  data: {
    topic: [],
    num: "",
    hasUser: false,
    inputValue: "",
    triggered: true,
    scrollTop: null,
    cangotop: false,
  },
  userInfo: undefined,
  topic_id: undefined,
  ctx: undefined,
  skip: 0,
  loading: true, 
  onLoad(options) {
    this.showTopic(options.id);
    this.render();
    this.showReply(options.id, 0);
    this.hasUserInfo();
    this.topic_id = options.id;
  },
  showTopic(id) {
    const db = wx.cloud.database();
    const that = this;
    db.collection("topic").doc(id).get({
      success(res) {
        let topic = that.data.topic;
        res.data.created_at = util.formatTime(new Date(res.data.created_at));
        topic.push(res.data);
        that.setData({ topic });
        if (res.data.imageList.length == 1) {
          const num = "one";
          that.setData({ num });
        } else if (res.data.imageList.length == 2) {
          const num = "two";
          that.setData({ num });
        }
        db.collection("user").where({ _openid: res.data._openid }).get({
          success(res) {
            let topic = that.data.topic;
            topic[0].userInfo = res.data;
            that.setData({ topic });
          },
          fail() {
            wx.showToast({
              title: "网络错误",
              icon: none
            })
          }
        })
      },
      fail() {
        wx.showToast({
          title: "网络错误",
          icon: none
        })
      }
    });
  },
  render() {
    this.ctx = createRecycleContext({
      id: "recycleReplyId",
      dataKey: "recycleReplyList",
      page: this,
      itemSize: {
        width: rpx2px(750),
        height: rpx2px(150),
      }
    });
  },
  showReply(id, skip, event, callback) {
    const that = this;
    db.collection("reply").where({ topic_id: id }).skip(skip).limit(10).orderBy("created_at", "desc").get({
      success(res) {
        const reply = res.data;
        reply.forEach(data => {
          data.created_at = util.formatTime(new Date(data.created_at));
        })
        that.skip += reply.length;
        if (event == "update") {
          that.ctx.splice(0, 999999);
          that.ctx.append(reply);
          callback();
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
  hasUserInfo() {
    const userInfo = App.globalData.userInfo;
    if (userInfo.nickName) {
      this.setData({ hasUser: true });
      this.userInfo = userInfo;
    }
  },
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    wx.previewImage({
      current,
      urls: [current]
    })
  },
  getUserInfo() {
    const that = this;
    wx.getUserProfile({
      desc: "用于获取用户头像和昵称",
      success(res) {
        let userInfo = res.userInfo;
        const name = userInfo.nickName;
        const avatar = userInfo.avatarUrl;
        const db = wx.cloud.database();
        const created_at = db.serverDate();
        db.collection("user").add({
          data: {
            name,
            avatar,
            created_at,
            isManager: false,
          }
        })
        .then(() => {
          that.setData({
            hasUser: true,
          });
          userInfo.created_at = util.formatTime(new Date());
          that.userInfo = userInfo;
          App.globalData.userInfo = userInfo;
          wx.showToast({
            title: "登录成功",
            icon: "success",
            mask: true
          });
        })
        .catch(() => {
          wx.showToast({
            title: '网络错误',
            icon: error,
            mask: true
          })
        })
      }
    })
  },
  handleChange(event) {
    const inputValue = event.detail.value;
    this.setData({ inputValue });
  },
  handleSubmit() {
    const content = this.data.inputValue.trim();
    const commenter = "{openid}";
    const userInfo = this.userInfo;
    const topic_id = this.topic_id;
    const created_at = db.serverDate();
    if (!content) {
      wx.showToast({ title: "评论不能为空" });
      return;
    }
    wx.showLoading({
      title: "上传中",
      mask: true,
    });
    const that = this;
    db.collection("reply").add({
      data: { content, commenter, userInfo, topic_id, created_at },
      success() {
        const inputValue = "";
        that.setData({ inputValue });
        wx.showToast({
          title: "评论成功",
          mask: true
        });
        that.skip = 0;
        const id = that.topic_id;
        that.showReply(id, 0, "update");
        that.incReply(id);
      },
      fail() {
        wx.showToast({
          title: '网络错误',
          icon: error,
          mask: true
        })
      },
      complete() {
        wx.hideLoading();
      }
    })
  },
  incReply(id) {
    wx.cloud.callFunction({
      name: "incReply",
      data: { topic_id: id },
      success(res) {
        console.log('[云函数] [addReply] user openid: ', res.result);
      },
      fail(err) {
        console.error('[云函数] [addReply] 调用失败', err);
      }
    })
  },
  onRefresh() {
    this.skip = 0;
    const id = this.topic_id;
    this.showReply(id, 0, "update", callback);
    const that = this;
    function callback() {
      that.setData({ triggered: false });
      wx.showToast({
        title: "刷新成功",
        mask: true
      });
    }
  },
  scrolltolower() {
    if (!this.loading) {
      return;
    }
    this.loading = false;
    const id = this.topic_id;
    const skip = this.skip;
    this.showReply(id, skip, "add");
  },
  pageScroll(event) {
    if (this.skip > 10 && event.detail.scrollTop > 500) {
      this.setData({ cangotop: true })
    } else {
      this.setData({ cangotop: false })
    }
  },
  handletoTop() {
    this.setData({ scrollTop: 0 });
    this.ctx.splice(10, this.skip);
    this.skip = 10;
  },
})