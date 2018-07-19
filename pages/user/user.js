// pages/user/user.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    userInfo: null,
    amount: 0,
    text: ''
  },
  onShow: function() {
    this.getInfo()
  },
  onLoad: function() {
    // 获取屏幕高度
    this.setData({ userInfo: wx.getStorageSync('userinfo') })
  },
  getInfo: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/user/amount',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({ text: res.data.data.text, amount: res.data.data.amount })
          wx.setStorageSync('amount', res.data.data.amount)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          self.showToast('获取个人信息失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取个人信息失败', 'bottom')
      }
    })
  },
  // 复制用户ID
  copyUserId() {
    let self = this
    wx.setClipboardData({
      data: self.data.userInfo._id,
      success: function(res) {
        wx.showToast({ title: '复制ID成功', icon: 'success' })
        setTimeout(function() {
          wx.hideToast()
        }, 2000)
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
