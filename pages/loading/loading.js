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
    loginAgain: false,
    params: {},
    text: '欢迎回来'
  },
  onLoad: function(options) {
    let self = this
    // 检测是否需要尝试自动登录
    if (options.need_login_again) {
      self.setData({ buttonType: 'reLogin', loginAgain: true, loading: false })
      return
    } else {
      self.setData({ params: options })
      self.doLogin()
    }
    // 当前页面不予许分享
    wx.hideShareMenu()
    utils.debug('asdasdas')
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
      .then(function(res) {
        self.setData({ loading: false, success: true, buttonType: '' })
        // 根据是否shut_check字段来决定跳转到哪个页面
        if (app.globalData.globalSetting) {
          if (app.globalData.globalSetting.shut_check) {
            // 跳转到屏蔽审核页面
            wx.redirectTo({ url: '../search2/search2' })
          } else {
            // 正常跳转到首页
            if (!self.data.loginAgain) {
              const reg = /^[A-Za-z0-9-_]+\|\d+$/
              const reg2 = /^[A-Za-z0-9-_]+$/
              if (self.data.params && self.data.params.code && reg.test(self.data.params.code)) {
                console.log('开始更新邀请奖励', self.data.params.code)
                // wx.redirectTo({ url: '../activities/share/share?code=' + self.data.params.code })
                // 不在跳转分享活动页面，直接在首页领奖
                self.updateShareLog(self.data.params.code)
              } else if (self.data.params && self.data.params.fhcode && reg2.test(self.data.params.fhcode)) {
                wx.redirectTo({ url: '../invite/invite?fhcode=' + self.data.params.fhcode })
              } else if (self.data.params && self.data.params.bookid) {
                wx.redirectTo({ url: '../bookdetail/bookdetail?id=' + self.data.params.bookid })
              } else {
                wx.switchTab({ url: '../index/index' })
              }
            } else {
              // 重新登录后返回上一页
              wx.navigateBack({
                delta: 1
              })
            }
          }
        } else {
          utils.debug('获取全局变量格式错误，' + JSON.stringify(app.globalData))
          self.setData({ buttonType: 'reLogin', text: '', success: false })
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
                self.showToast('登录失败，请检查您的网络', 'bottom')
                self.setData({ buttonType: 'reLogin' })
                reject(false)
              }
            },
            fail: function(err) {
              utils.debug('调用接口失败--/api/user/login，' + JSON.stringify(err))
              self.showToast('登录失败，请检查你的网络', 'bottom')
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
  // 首页也能发送接受邀请的请求
  updateShareLog: function(share_id) {
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/share/update?share_id=' + share_id,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        console.log(res)
        if (res.data.ok) {
          wx.showToast({ title: '获得15书币的奖励', icon: 'success' })
          setTimeout(function() {
            wx.hideToast()
          }, 2000)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          utils.debug('调用接口失败--/api/share/update' + JSON.stringify(res))
          if (!res.data.inviteself) {
            self.showToast(res.data.msg || '接收邀请失败', 'bottom')
          }
        }
        setTimeout(function() {
          wx.switchTab({ url: '../index/index' })
        }, 1000)
      },
      fail: err => {
        utils.debug('调用接口失败--/api/share/update' + JSON.stringify(err))
        self.showToast('接收邀请失败', 'bottom')
        wx.switchTab({ url: '../index/index' })
        // 自动重新尝试
        setTimeout(function() {
          wx.switchTab({ url: '../index/index' })
        }, 1000)
      }
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
