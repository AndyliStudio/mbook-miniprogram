// pages/user/user.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    minute: 0,
    num: 0
  },
  onShow: function() {
    this.getInfo()
    // 当前页面不予许分享
    wx.hideShareMenu()
  },
  getInfo: function() {
    wx.request({
      url: config.base_url + '/api/read_time/my',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          this.setData({ minute: res.data.minute, num: res.data.num })
        } else {
          wx.showToast({ title: '获取阅读时长失败', icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        wx.showToast({ title: '获取阅读时长失败', icon: 'none', duration: 2000 })
      }
    })
  },
  getAward: function() {
    if (this.data.num > 0) {
      wx.request({
        url: config.base_url + '/api/read_time/exchange',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        success: res => {
          if (res.data.ok) {
            wx.showToast({ title: '兑换成功', icon: 'success' })
            setTimeout(function() {
              wx.hideLoading()
            }, 2000)
            this.setData({ minute: 0, num: 0 })
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            wx.showToast({ title: '时长兑换书币失败', icon: 'none', duration: 2000 })
          }
        },
        fail: err => {
          wx.showToast({ title: '时长兑换书币失败', icon: 'none', duration: 2000 })
        }
      })
    } else {
      wx.showToast({ title: '当前阅读时长不足以兑换书币', icon: 'none', duration: 2000 })
    }
  }
})
