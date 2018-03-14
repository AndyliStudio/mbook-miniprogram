// pages/setting/webpage.js
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    url: ''
  },
  onLoad: function (options) {
    let self = this
    // 获取屏幕高度
    if(options.url){
      self.setData({ 'url': options.url })
    }else{
      self.showToast('地址为空', 'bottom')
    }
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
