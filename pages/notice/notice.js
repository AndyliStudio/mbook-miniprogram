// pages/notice/notice.js
const config = require('../../config')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    comments: [],
    allCommentList: [],
    picCommentList: [],
    typeId: 0,
    valueId: 0,
    showType: 0,
    systemNoticeCount: 0,
    replyCommentCount: 0,
    allPage: 1,
    picPage: 1,
    size: 20
  },
  getCommentList: function() {
    // 写死系统消息
    if (this.data.showType === 0) {
      const registeTime = app.globalData.userInfo.create_time
      let registeStr = ''
      if (registeTime) {
        registeStr = util.formatTime(new Date(registeTime))
      } else {
        registeStr = util.formatTime(new Date())
      }
      this.setData({
        allCommentList: [],
        allPage: 1,
        systemNoticeCount: 1,
        comments: [
          {
            commentid: 1,
            avatar: 'https://fs.andylistudio.com/1526117366025.jpeg',
            name: '美景小助手',
            time: registeStr,
            content: '欢迎来到美景阅读，在这里开启您的阅读之旅吧~'
          }
        ]
      })
    } else {
      wx.request({
        url: config.base_url + '/api/comment/my',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        method: 'GET',
        success: res => {
          if (res.data.ok) {
            this.setData({
              allCommentList: [],
              allPage: 1,
              replyCommentCount: res.data.reply.length,
              comments: res.data.reply.map(item => {
                item.time = util.formatTime(new Date(item.time))
                return item
              })
            })
          } else if (res.data.authfail) {
            wx.navigateTo({ url: '../loading/loading?need_login_again=1' })
          } else {
            wx.showToast({ title: '获取评论失败', icon: 'none', duration: 2000 })
          }
        },
        fail: err => {
          wx.showToast({ title: '获取评论失败', icon: 'none', duration: 2000 })
        }
      })
    }
  },
  onShow: function(options) {
    this.getCommentList()
    // 当前页面不予许分享
    wx.hideShareMenu()
  },
  switchTab: function() {
    this.setData({
      showType: this.data.showType == 1 ? 0 : 1
    })

    this.getCommentList()
  },
  gotoBookDetail: function(event) {
    const bookid = event.currentTarget.dataset.bookid
    if (bookid) {
      wx.navigateTo({
        url: '../bookdetail/bookdetail?id=' + bookid
      })
    }
  },
  onReachBottom: function() {
    if (this.data.showType == 0) {
      if (this.data.systemNoticeCount / this.data.size < this.data.allPage) {
        return false
      }

      this.setData({
        allPage: this.data.allPage + 1
      })
    } else {
      if (this.data.replyCommentCount / this.data.size < this.data.picPage) {
        return false
      }

      this.setData({
        picPage: this.data.picPage + 1
      })
    }
    this.getCommentList()
  }
})
