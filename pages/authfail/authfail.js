// pages/user/user.js
const config = require('../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' } // 提示信息
  },
  doLogin: function() {
    let self = this
    app.doLogin().then(res => {
      if (res === true) {
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 0
        })
        // 返回上一页
        wx.navigateBack({
          delta: 1
        })
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
