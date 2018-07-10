// pages/user/user.js
const config = require('../../config')

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
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
