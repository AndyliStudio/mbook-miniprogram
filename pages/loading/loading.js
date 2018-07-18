// pages/user/user.js
const config = require('../../config')
const utils = require('../../utils/util')
const Promise = require('../../utils/bluebird.min')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    loading: true,
    success: false,
    buttonType: '',
    text: ''
  },
  onLoad: function() {
    let self = this
    // 获取当前时间信息
    // 尝试自动登录
    self.doLogin()
  },
  // 微信登录函数
  wxLogin: function() {
    let self = this
    return new Promise(function(resolve, reject) {
      // 微信登录
      wx.login({
        success: function(res) {
          if (res.code) {
            app.globalData.code = res.code
            resolve(res.code)
          } else {
            utils.debug('调用wx.login失败，' + JSON.stringify(res))
            self.setData({ buttonType: 'reLogin' })
            reject(false)
          }
        },
        fail: function(err) {
          utils.debug('调用wx.login失败，' + JSON.stringify(err))
          self.setData({ buttonType: 'reLogin' })
          reject(false)
        }
      })
    })
  },
  // 获取用户信息
  wxUserInfo: function() {
    let self = this
    return new Promise(function(resolve, reject) {
      wx.getUserInfo({
        success: function(res) {
          if (res.userInfo) {
            resolve(res.userInfo)
          } else {
            utils.debug('调用wx.getUserInfo失败，' + JSON.stringify(res))
            self.setData({ buttonType: 'getUserInfo' })
            reject(false)
          }
        },
        fail: function(err) {
          utils.debug('调用wx.getUserInfo失败，' + JSON.stringify(err))
          self.setData({ buttonType: 'getUserInfo' })
          reject(false)
        }
      })
    })
  },
  doLogin: function() {
    let self = this
    self.setData({ loading: true, success: false, buttonType: '' })
    self
      .requestLogin()
      .then(res => {
        self.setData({ loading: false, success: true, buttonType: '' })
      })
      .catch(function() {
        self.setData({ loading: false, success: false })
      })
  },
  // 用户登录
  requestLogin: function() {
    let self = this
    return new Promise(function(resolve, reject) {
      self
        .wxLogin()
        .then(function(code) {
          // 发送登录凭证到后台换取 openId, sessionKey, unionId
          wx.request({
            method: 'POST',
            url: config.base_url + '/api/user/login',
            data: {
              identity: 1,
              code: code
            },
            success: function(res) {
              if (res.data.ok) {
                // 将token存入缓存，在每次发送需要认证的请求时在header里带上token
                app.globalData.token = res.data.token
                app.globalData.userInfo = res.data.userinfo
                app.globalData.allbooks = res.data.allbooks
                resolve(true)
              } else if (!res.data.ok && res.data.registe === false) {
                // 未注册，自动注册
                self
                  .doRegiste()
                  .then(function() {
                    resolve(true)
                  })
                  .catch(function() {
                    reject(false)
                  })
              } else {
                utils.debug('调用接口失败--/api/user/login，' + JSON.stringify(res))
                self.showToast(res.data.msg ? res.data.msg : '登录失败', 'bottom')
                self.setData({ buttonType: 'reLogin' })
                reject(false)
              }
            },
            fail: function(err) {
              utils.debug('调用接口失败--/api/user/login，' + JSON.stringify(err))
              self.showToast(res.data.msg ? res.data.msg : '登录失败', 'bottom')
              self.setData({ buttonType: 'reLogin' })
              reject(false)
            }
          })
        })
        .catch(function(err) {
          reject(false)
        })
    })
  },
  // 用户注册
  doRegiste() {
    let self = this
    return new Promise(function(resolve, reject) {
      self
        .wxLogin()
        .then(function(code) {
          self.wxUserInfo().then(function(userInfo) {
            // 发送注册接口
            wx.request({
              method: 'POST',
              url: config.base_url + '/api/user/registe',
              data: Object.assign({ identity: 'appuser', code }, userInfo),
              success: function(res) {
                if (res.data.ok) {
                  app.globalData.token = res.data.token
                  app.globalData.userInfo = res.data.userinfo
                  app.globalData.allbooks = []
                  resolve(true)
                } else {
                  utils.debug('调用接口失败--/api/user/registe，' + JSON.stringify(res))
                  self.showToast('注册失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
                  self.setData({ buttonType: 'reLogin' })
                  reject(false)
                }
              },
              fail: function(err) {
                utils.debug('调用注册接口失败--/api/user/registe，' + JSON.stringify(err))
                self.showToast('注册失败', 'bottom')
                self.setData({ buttonType: 'reLogin' })
                reject(false)
              }
            })
          })
        })
        .catch(function() {
          reject(false)
        })
    })
  },
  // 重新授权之后执行
  afterGetUserInfo() {},
  // 获取分享配置、奖励信息、以及分享码
  getShareInfo: function() {
    return new Promise((resolve, reject) => {
      wx.request({
        method: 'GET',
        url: config.base_url + '/api/share/info',
        header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
        success: res => {
          if (res.data.ok) {
            wx.setStorageSync('share_info', res.data.shareInfo)
            wx.setStorageSync('share_code', res.data.code)
            resolve(true)
          } else {
            resolve(false)
          }
        },
        fail: err => {
          utils.debug('获取分享信息失败：' + JSON.stringify(err))
          // 自动重新尝试
          this.getShareInfo()
        }
      })
    })
  },
  getGlobalSetting: function() {
    wx.showLoading()
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/get_setting_items?items=share|wxcode|index_dialog|charge_tips|secret_tips|shut_check',
      success: res => {
        if (res.data.ok) {
          wx.setStorageSync('share_params', JSON.parse(res.data.items.share))
          wx.setStorageSync('global_setting', {
            wxcode: res.data.items.wxcode,
            index_dialog: res.data.items.index_dialog,
            charge_tips: res.data.items.charge_tips,
            secret_tips: res.data.items.secret_tips,
            shut_check: res.data.items.shut_check === 'true'
          })
          if (res.data.items.shut_check === 'true') {
            // wx.reLaunch({ url: '../shutcheck/shutcheck' })
          } else {
            setTimeout(function() {
              wx.reLaunch({ url: '/pages/index/index' })
            }, 300)
          }
        } else {
          wx.showToast({ title: res.data.msg || '获取应用设置失败', image: './static/img/close.png' })
        }
        wx.hideLoading()
      },
      fail: err => {
        utils.debug('获取全局设置失败：' + JSON.stringify(err))
        wx.hideLoading()
        // 自动重新尝试
        this.getGlobalSetting()
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
