// pages/user/user.js
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' } // 提示信息
  },
  onLoad: function() {
    // 当前页面不予许分享
    wx.hideShareMenu()
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
