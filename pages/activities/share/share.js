// pages/setting/webpage.js
const config = require('../../../config')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    url: '',
    loaded: false
  },
  onLoad: function (options) {
    let self = this
    // 如果url中存在share_id，调用更新分享记录的接口
    if (options.share_id) {
      app.updateShareLog(options.share_id)
    }
    self.setData({ 'loaded': true })
    self.getShareInfo()
    app.fetchShareId()
  },
  // 分享逻辑
  onShareAppMessage: function (res) {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = wx.getStorageSync('share_params')
    const shareId = wx.getStorageSync('share_id')
    if (shareParams) {
      return {
        title: shareParams.title,
        path: shareParams.path + '?share_id' + shareId,
        imageUrl: shareParams.imageUrl,
        success: function(res) {
          console.log(res)
          // 转发成功
          wx.showToast({title: '分享成功', icon: 'success'})
        },
        fail: function(res) {
          // 取消分享
        }
      }
    } else {
      self.showToast('获取分享参数失败', 'bottom')
      return false
    }   
  },
  // 接收来自h5页面的消息
  getShareInfo: function() {
    
  },
  gotoIndex: function() {
    wx.navigateTo({
      url: '/pages/index/index'
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
