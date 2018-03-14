// pages/user/user.js
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    userInfo: null,
    amount: 0,
    text: ''
  },
  onShow: function(){
    this.getInfo()
  },
  onLoad: function () {
    // 获取屏幕高度
    this.setData({ 'userInfo': wx.getStorageSync('userinfo') })
  },
  getInfo: function(){
    let self = this
    wx.request({
      url: config.base_url + '/api/user/amount',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if(res.data.ok){
          self.setData({ 'text': res.data.data.text, amount: res.data.data.amount })
        }else{
          self.showToast('获取个人信息失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取个人信息失败', 'bottom')
      }
    })
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
