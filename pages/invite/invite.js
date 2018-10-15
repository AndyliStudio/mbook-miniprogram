// pages/user/user.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    fhcode: '', // 好友助力分享ID
    info: {
      success: false,
      has_finished: 0,
      create_time: new Date(),
      left_time: '00 天 00 小时 00 分',
      book: {
        need_num: 0,
        limit_time: 1,
        name: '',
        author: '',
        img_url: ''
      },
      user: {
        username: '某某',
        avatar: ''
      }
    }
  },
  onLoad: function(options) {
    this.setData({
      fhcode: options.fhcode || '',
      currentUserId: app.globalData.userInfo._id
    })
    this.getFriendHelpInfo()
  },
  getFriendHelpInfo: function() {
    let self = this
    // 获取当前书籍的助力ID
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help/info',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhcode: self.data.fhcode
      },
      success: function(res) {
        if (res.data.ok) {
          res.data.data.half_num = Math.ceil(res.data.data.book.need_num / 2)
          res.data.data.present = parseInt((res.data.data.has_finished * 100) / res.data.data.book.need_num) + '%'
          if (res.data.data.success) {
            res.data.data.status = 1
          } else {
            let now = new Date()
            let limitTime = res.data.data.book.limit_time > 0 ? parseInt(res.data.data.book.limit_time) : 0
            let endDate = new Date(res.data.data.create_time + limitTime * 24 * 60 * 60 * 1000)
            if (now.getTime() > endDate.getTime()) {
              res.data.data.status = 2
            } else {
              res.data.data.status = 3
            }
          }
          self.setData({ info: res.data.data })
        } else {
          self.showToast('获取好友助力信息失败', 'bottom')
        }
      },
      fail: function(err) {
        console.warn(err)
        self.showToast('获取好友助力信息失败', 'bottom')
      }
    })
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
