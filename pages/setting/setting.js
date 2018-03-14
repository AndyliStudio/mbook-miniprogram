// pages/setting/setting.js

const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    userSetting: {
      updateNotice : true,
      reader : {
          fontSize : 14,
          fontFamily : "使用系统字体",
          mode : '默认'
      }
    },
    allFontFamily: ['使用系统字体', '微软雅黑', '黑体', 'Arial', '楷体', '等线'],
    allFontSize: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    allStyleMode: [ '默认', '淡黄', '护眼', '夜间'],
    previewBg: '#ffffff'
  },
  onLoad: function () {
    let self = this
    // 获取屏幕高度
    // self.setData({ 'userInfo': wx.getStorageSync('userinfo') })
    self.getUserSetting()
  },
  bindPickerChange: function(event){
    let self = this
    let pickerid = event.currentTarget.dataset.pickerid
    console.log(pickerid)
    if(pickerid === 'fontSize'){
      console.log(event.detail.value)
      self.setData({ 'userSetting.reader.fontSize': self.data.allFontSize[event.detail.value] })
      // 更新缓存
      wx.setStorageSync('user_setting', self.data.userSetting)
    }else if(pickerid === 'fontFamily'){
      self.setData({ 'userSetting.reader.fontFamily': self.data.allFontFamily[event.detail.value] })
      wx.setStorageSync('user_setting', self.data.userSetting)
    }else if(pickerid === 'mode'){
      self.setData({ 'userSetting.reader.mode': self.data.allStyleMode[event.detail.value], 'previewBg': self.getBackGround(self.data.allStyleMode[event.detail.value]) })
      wx.setStorageSync('user_setting', self.data.userSetting)
    }
  },
  switchChange: function(event){
    let self = this
    self.setData({ 'userSetting.updateNotice':event.detail.value })
    wx.setStorageSync('user_setting', self.data.userSetting)
  },
  getBackGround: function(color){
    if(color == '默认'){
      return '#f8f7fc'
    }else if(color == '淡黄'){
      return '#f6f0da'
    }else if(color == '护眼'){
      return '#c0edc6'
    }else if(color == '夜间'){
      return '#1d1c21'
    }
  },
  getUserSetting: function(){
    let self = this
    // 判断本地缓存中是否存在设置缓存
    let localSetting = wx.getStorageSync('user_setting')
    if(localSetting){
      // 存在
      self.setData({ 'userSetting': localSetting, 'previewBg': self.getBackGround(localSetting.reader.mode) })
    }else{
      wx.request({
        url: config.base_url + '/api/user/get_user_setting',
        header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
        success: res => {
          if(res.data.ok){
            self.setData({ 'userSetting': res.data.data, 'previewBg': self.getBackGround(res.data.data.reader.mode) })
            wx.setStorageSync('user_setting', self.data.userSetting)
          }else{
            self.showToast('获取设置失败', 'bottom')
          }
        },
        fail: err => {
          self.showToast('获取设置失败', 'bottom')
        }       
      })
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
