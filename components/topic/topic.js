// index.jsconst 
const util = require('../../utils/util.js');
const createRecycleContext = require('miniprogram-recycle-view');
const rpx2px = (rpx) => (rpx / 750) * wx.getSystemInfoSync().windowWidth;

Component({
  properties: {
    recycleId: String,
    openid: String,
  },
  options: {
    pureDataPattern: /^_/ // 指定所有 _ 开头的数据字段为纯数据字段
  },
	data: {
    recycleList: true,
    height: undefined,
    cangotop: false,
    scrollTop: null,
    triggered: true,
    _fullScreen: false,
    _topic: [],
    _limit: 10,      //显示的条数
    _skip: 0,        //指定查询返回结果时从指定序列后的结果开始返回
    _loading: true,  //防止scrolltolower方法的连续触发
    _ctx: undefined, //接口createRecycleContext函数
    _num: 0,         //新创建的微博话题数量
  },
  // pageLifetimes: {
    attached: function() {
      this.showTopic(this._render);
      this.watchNum();
    },
  // },
  methods: {
    showTopic(e) {
      let skip = this.data._skip;
      if (skip != 0 && this.data._num != 0) {
        skip = skip + this.data._num;
      }
      const user = this.data.openid;
      let openid;
      typeof user == "undefined" ? openid = "" : openid = user;
      const that = this;
      wx.cloud.callFunction({
        name: "lookupFunction",
        data: { skip, openid },
        success(res) {
          let _topic = res.result.list;
          if (!_topic) {
            wx.showToast({
              title: "网络错误",
              icon: "error",
            })
            that.setData({ _loading: true });
            return;
          }
          _topic.forEach(data => {
            const created_at = util.formatTime(new Date(data.created_at));
            return data.created_at = created_at;
          });
          if (typeof e === 'function') {
            const _skip = that.data._limit;
            that.setData({ _skip, _topic });
            e(that);
          } else if (e == "add" && _topic.length > 0) {
            that.data._ctx.append(_topic);
            const _skip = that.data._skip + _topic.length;
            that.setData({ _skip, _loading: true });
          } else if (e == "add" && _topic.length == 0) {
            wx.showToast({
              title: "数据已到底",
              icon: "none"
            });
            that.setData({ _loading: true });
          } else if (e == "refresh" && skip == 0) {
            const _skip = that.data._limit;
            that.setData({ _skip, triggered: false  });
            that.data._ctx.splice(0, 999999);
            that.data._ctx.append(_topic);
            wx.showToast({
              title: "刷新成功",
              mask: true
            });
          }
        },
        fail() {
          wx.showToast({
            title: "网络错误",
            icon: "error",
          })
        }
      });
    },
    _render(that) {
      const _topic = that.data._topic;
      let dataKey;
      typeof that.data.openid == "undefined" ? dataKey = "indexTopicList" : dataKey = "myTopicList";
      dataKey == "indexTopicList" ? that.setData({ recycleList: true }) : that.setData({ recycleList: false });
      that.setData({
        _ctx: createRecycleContext({
          id: that.data.recycleId,
          dataKey,
          page: that,
          itemSize: that.itemSizeFunc
        })
      })
      that.data._ctx.append(_topic);
      const height = wx.getSystemInfoSync().windowHeight;
      typeof that.data.openid == "undefined" ? that.setData({ height: undefined }): that.setData({ height }) ;
    },
    itemSizeFunc(item, idx) {
      return {
        width: rpx2px(750),
        height: item.imageList > 3 || item.videoList > 0 ? rpx2px(800) : rpx2px(300)
      }
    },
    watchNum() {
      const db = wx.cloud.database();
      const _ = db.command;
      const date = new Date();
      const that = this;
      db.collection("topic").where({ created_at: _.gt(date) }).watch({
        onChange: function(snapshot) {
          const _num = snapshot.docChanges.length + that.data._num;
          that.setData({ _num })
        },
        onError: function(err) {
          console.error('the watch closed because of error', err)
        }
      })
    },
    previewImage(e) {
      const current = e.currentTarget.dataset.src;
      wx.previewImage({
        current,
        urls: [current]
      })
    },
    previewVideo(e) {
      const id = e.currentTarget.dataset.id;
      const videoCtx = wx.createVideoContext(id, this);
      const fullScreen = this.data.fullScreen;
      if (fullScreen) {
        videoCtx.pause();
        videoCtx.exitFullScreen();
        this.setData({ fullScreen: false });
      } else {
        videoCtx.requestFullScreen();
        videoCtx.play();
        this.setData({ fullScreen: true });
      }
    },
    onRefresh() {
      this.setData({ _skip: 0, _num: 0 });
      this.showTopic("refresh");
    },
    scrolltolower() {
      if (!this.data._loading) {
        return;
      }
      this.setData({ _loading: false });
      this.showTopic("add");
    },
    pageScroll(event) {
      if (this.data._skip > this.data._limit && event.detail.scrollTop > 500) {
        this.setData({ cangotop: true })
      } else {
        this.setData({ cangotop: false })
      }
    },
    handletoTop() {
      const _skip = this.data._limit;
      this.setData({ scrollTop: 0, _skip });
      this.data._ctx.splice(_skip, 999999);
    },
  },
})
