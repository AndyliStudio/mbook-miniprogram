// pages/setting/setting.js

const config = require('../../config')
const utils = require('../../utils/util')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    userSetting: {
      updateNotice: true,
      autoBuy: true,
      reader: {
        fontSize: 28,
        fontFamily: '使用系统字体',
        mode: '默认',
        overPage: 0
      }
    },
    initMode: '默认',
    allFontFamily: ['使用系统字体', '微软雅黑', '黑体', 'Arial', '楷体', '等线'],
    allFontSize: [24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48],
    allStyleMode: ['默认', '淡黄', '护眼', '夜间'],
    allOverPage: [{ id: 0, name: '左右翻页' }, { id: 1, name: '上下翻页' }],
    previewBg: '#ffffff'
  },
  onShow: function() {
    let self = this
    // 获取屏幕高度
    // self.setData({ 'userInfo': wx.getStorageSync('userinfo') })
    self.getUserSetting()
  },
  onLoad: function() {
    // 当前页面不予许分享
    wx.hideShareMenu()
  },
  bindPickerChange: function(event) {
    let self = this
    let pickerid = event.currentTarget.dataset.pickerid
    if (pickerid === 'fontSize') {
      self.setData({ 'userSetting.reader.fontSize': self.data.allFontSize[parseInt(event.detail.value)] })
    } else if (pickerid === 'fontFamily') {
      self.setData({ 'userSetting.reader.fontFamily': self.data.allFontFamily[event.detail.value] })
    } else if (pickerid === 'mode') {
      self.setData({ 'userSetting.reader.mode': self.data.allStyleMode[parseInt(event.detail.value)], previewBg: self.getBackGround(self.data.allStyleMode[event.detail.value]) })
    } else if (pickerid === 'overPage') {
      self.setData({ 'userSetting.reader.overPage': self.data.allOverPage[parseInt(event.detail.value)].id })
    }
  },
  switchChange: function(event) {
    let self = this
    self.setData({ 'userSetting.updateNotice': !!event.detail.value })
  },
  autoBuy: function(event) {
    let self = this
    self.setData({ 'userSetting.autoBuy': !!event.detail.value })
  },
  getBackGround: function(color) {
    if (color == '默认') {
      return '#f8f7fc'
    } else if (color == '淡黄') {
      return '#f6f0da'
    } else if (color == '护眼') {
      return '#c0edc6'
    } else if (color == '夜间') {
      return '#1d1c21'
    } else {
      return '#f8f7fc'
    }
  },
  getUserSetting: function() {
    let self = this
    // 判断本地缓存中是否存在设置缓存
    let localSetting = app.globalData.userInfo || {}
    if (localSetting && localSetting.setting) {
      let userSetting = utils.copyObject(self.data.userSetting, localSetting.setting)
      self.setData({ userSetting: userSetting, previewBg: self.getBackGround(userSetting.reader.mode) })
    } else {
      wx.request({
        url: config.base_url + '/api/user/get_user_setting',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        success: res => {
          if (res.data.ok) {
            self.setData({ userSetting: res.data.data, previewBg: self.getBackGround(res.data.data.reader.mode) })
            localSetting.setting = res.data.data
            wx.setStorageSync('userinfo', localSetting)
          } else if (res.data.authfail) {
            wx.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            self.showToast('获取设置失败', 'bottom')
          }
        },
        fail: err => {
          self.showToast('获取设置失败', 'bottom')
        }
      })
    }
  },
  updateSetting: function() {
    let self = this
    // 更新全局用户设置
    app.globalData.userInfo.setting = self.data.userSetting
    wx.request({
      url: config.base_url + '/api/user/put_user_setting',
      method: 'PUT',
      data: {
        setting: self.data.userSetting
      },
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          // self.setData({ userSetting: res.data.data, previewBg: self.getBackGround(res.data.data.reader.mode) })
          // localSetting.setting = res.data.data
          // wx.setStorageSync('userinfo', localSetting)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('更新设置失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('更新设置失败', 'bottom')
      }
    })
  },
  //跳出页面执行函数
  onUnload: function() {
    let localSetting = app.globalData.userInfo || {}
    localSetting.setting = this.data.userSetting
    //onUnload方法在页面被关闭时触发，我们需要将用户的当前设置存下来
    wx.setStorageSync('userinfo', localSetting)
    this.updateSetting()
  },
  //跳出页面执行函数
  onHide: function() {
    let localSetting = app.globalData.userInfo || {}
    localSetting.setting = this.data.userSetting
    //onUnload方法在页面被关闭时触发，我们需要将用户的当前设置存下来
    wx.setStorageSync('userinfo', localSetting)
    this.updateSetting()
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
