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
    shareScene: '',
    text: '欢迎回来'
  },
  onLoad: function(options) {
    let self = this
    // 尝试自动登录
    self.doLogin()
    console.log('首页options', options)
    if (options.code) {
      self.setData({ shareScene: options.code })
      return
    }
    if (options.scene) {
      self.setData({ shareScene: decodeURIComponent(options.scene) })
      return
    }
  },
  // 微信登录函数
  wxLogin: function() {
    let self = this
    return new Promise(function(resolve, reject) {
      // 微信登录
      wx.login({
        success: function(res) {
          if (res.code) {
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
    self.setData({ loading: true, text: '', success: false, buttonType: '' })
    self
      .requestLogin()
      .then(res => {
        self.setData({ loading: false, success: true, buttonType: '' })
        // 根据是否shut_check字段来决定跳转到哪个页面
        if (app.globalData.globalSetting && app.globalData.globalSetting.shut_check) {
          // 跳转到屏蔽审核页面
          wx.redirectTo({ url: '../search2/search2' })
        } else {
          // 正常跳转到首页
          const reg = /^[A-Za-z0-9-]+_\d+$/
          if (self.data.shareScene && reg.test(self.data.shareScene)) {
            wx.redirectTo({ url: '../activities/share/share?code=' + self.data.shareScene })
          } else {
            wx.switchTab({ url: '../index/index' })
          }
        }
      })
      .catch(function() {
        self.setData({ loading: false, text: '', success: false })
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
                app.globalData.token = res.data.token // 登录token
                app.globalData.userInfo = res.data.userinfo // 用户详情
                app.globalData.allbooks = res.data.allbooks // 用户书籍列表
                app.globalData.shareInfo = res.data.shareInfo // 用户分享信息
                app.globalData.awardRecords = res.data.award_records.reverse() // 分享奖励
                for (let i in res.data.globalSetting) {
                  if (utils.isJsonString(res.data.globalSetting[i])) {
                    res.data.globalSetting[i] = JSON.parse(res.data.globalSetting[i])
                  }
                }
                app.globalData.globalSetting = res.data.globalSetting // 系统全局设置
                app.globalData.shareCode = res.data.code // 用户分享码
                self.setData({ text: '欢迎回来' })
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
                  app.globalData.token = res.data.token // 登录token
                  app.globalData.userInfo = res.data.userinfo // 用户详情
                  app.globalData.allbooks = res.data.allbooks // 用户书籍列表
                  app.globalData.shareInfo = res.data.shareInfo // 用户分享信息
                  app.globalData.awardRecords = res.data.award_records.reverse() // 分享奖励
                  for (let i in res.data.globalSetting) {
                    if (utils.isJsonString(res.data.globalSetting[i])) {
                      res.data.globalSetting[i] = JSON.parse(res.data.globalSetting[i])
                    }
                  }
                  app.globalData.globalSetting = res.data.globalSetting // 系统全局设置
                  app.globalData.shareCode = res.data.code // 用户分享码
                  self.setData({ text: '遇见你，真高兴~' })
                  resolve(true)
                } else {
                  utils.debug('调用接口失败--/api/user/registe，' + JSON.stringify(res))
                  self.showToast('注册失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
                  self.setData({ buttonType: 'reLogin' })
                  reject(false)
                }
              },
              fail: function(err) {
                utils.debug('调用接口失败--/api/user/registe，' + JSON.stringify(err))
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
  afterGetUserInfo() {
    this.doLogin()
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
