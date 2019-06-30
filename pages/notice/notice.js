// pages/notice/notice.js
const config = require('../../config')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    notices: [],
    curNoticePage: 1,
    noticeTotal: 0,
    showEndLine: false,
    comments: [],
    showType: 0,
    systemNoticeCount: 0,
    replyCommentCount: 0,
  },
  getData: function(num) {
    wx.showLoading({ title: '数据加载中' })
    if (this.data.showType === 0) {
      // 获取通知
      const page = num || this.data.curNoticePage
      const hasReadMessages = wx.getStorageSync('hasReadMessages') || []
      wx.request({
        url: config.base_url + '/api/wxapp/notice?page=' + page,
        header: { Authorization: 'Bearer ' + app.globalData.token },
        method: 'GET',
        success: res => {
          wx.hideLoading()
          if (res.data.ok) {
            const notices = this.data.notices.slice()
            let newNotices = notices.concat(res.data.list.map(item => {
              item.time = util.formatTime(new Date(item.create_time))
              item.name = ''
              switch(item.type) {
                case 'update':
                  item.name = '书籍更新通知'
                  break
                case 'system':
                  item.name = '系统消息'
                  break
                default:
                  break
              }
              item.hasRead = hasReadMessages.indexOf(item._id) > -1
              return item
            }))
            if (!num) {
              newNotices = newNotices.sort((item1, item2) => item1.hasRead - item2.hasRead)
            }
            this.setData({
              curNoticePage: page,
              noticeTotal: res.data.total,
              systemNoticeCount: res.data.total,
              notices: newNotices,
            })
          } else if (res.data.authfail) {
            wx.navigateTo({ url: '../loading/loading?need_login_again=1' })
          } else {
            wx.showToast({ title: '获取消息失败', icon: 'none', duration: 2000 })
          }
        },
        fail: err => {
          wx.hideLoading()
          wx.showToast({ title: '获取消息失败', icon: 'none', duration: 2000 })
        }
      })
    } else {
      // 获取评论回复
      wx.request({
        url: config.base_url + '/api/comment/my',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        method: 'GET',
        success: res => {
          wx.hideLoading()
          if (res.data.ok) {
            this.setData({
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
          wx.hideLoading()
          wx.showToast({ title: '获取评论失败', icon: 'none', duration: 2000 })
        }
      })
    }
  },
  getNextPage: function() {
    if (this.data.curNoticePage * 10 >= this.data.noticeTotal) {
      if (!this.data.showEndLine) {
        // wx.showToast({ title: '没有更多消息了~', icon: 'none', duration: 2000 })
        this.setData({ showEndLine: true })
      }
      return
    }
    const num = this.data.curNoticePage + 1;
    this.getData(num)
  },
  onShow: function(options) {
    this.getData()
    // 当前页面不予许分享
    wx.hideShareMenu()
  },
  switchTab: function() {
    this.setData({
      showType: this.data.showType == 1 ? 0 : 1
    })
    this.getData()
  },
  gotoBookDetail: function(event) {
    const bookid = event.currentTarget.dataset.bookid
    if (bookid) {
      wx.navigateTo({
        url: '../bookdetail/bookdetail?id=' + bookid
      })
    }
  },
  clickNotice: function(event) {
    const id = event.currentTarget.dataset.id
    const notice = this.data.notices.filter(item => item._id === id)[0]
    // 已阅读
    const hasReadMessages = wx.getStorageSync('hasReadMessages') || []
    if (hasReadMessages.indexOf(id) < 0) {
      hasReadMessages.push(id)
      wx.setStorageSync('hasReadMessages', hasReadMessages)
    }
    if (notice.type === 'system') {
      wx.navigateTo({
        url: '../webpage/webpage?url=https://mbook.andylistudio.com/notice-detail?id=' + id
      })
    } else if (notice.type === 'update') {
      wx.navigateTo({
        url: '../bookdetail/bookdetail?id=' + notice.bookid
      })
    }
  }
})
