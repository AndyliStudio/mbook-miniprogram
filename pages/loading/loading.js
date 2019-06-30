// pages/user/user.js
const config = require('../../config')
const utils = require('../../utils/util')
const app = getApp()

Page({
  data: {
    loading: true,
    success: false,
    buttonType: '',
    loginAgain: false,
    params: {},
    text: '欢迎回来'
  },
  onLoad: function(options) {
    // 检测是否需要尝试自动登录
    if (options.need_login_again) {
      this.setData({ buttonType: 'reLogin', loginAgain: true, loading: false })
      return
    } else {
      this.setData({ params: options })
      this.doLogin()
    }
    // 当前页面不予许分享
    wx.hideShareMenu()
  },
  // 微信登录函数
  wxLogin: function() {
    return new Promise((resolve, reject) => {
      // 微信登录
      wx.login({
        success: res => {
          if (res.code) {
            resolve(res.code)
          } else {
            this.setData({ buttonType: 'reLogin' })
            reject(false)
          }
        },
        fail: err => {
          this.setData({ buttonType: 'reLogin' })
          reject(false)
        }
      })
    })
  },
  // 获取用户信息
  wxUserInfo: function() {
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success: res => {
          if (res.userInfo) {
            resolve(res.userInfo)
          } else {
            this.setData({ buttonType: 'getUserInfo' })
            reject(false)
          }
        },
        fail: err => {
          this.setData({ buttonType: 'getUserInfo' })
          reject(false)
        }
      })
    })
  },
  doLogin: function() {
    this.setData({ loading: true, text: '', success: false, buttonType: '' })
    this
      .requestLogin()
      .then(res => {
        this.setData({ loading: false, success: true, buttonType: '' })
        // 正常跳转到首页
        if (!this.data.loginAgain) {
          const reg = /^[A-Za-z0-9-_]+\|\d+$/
          const reg2 = /^[A-Za-z0-9-_]+$/
          if (this.data.params && this.data.params.code && reg.test(this.data.params.code)) {
            // 不在跳转分享活动页面，直接在首页领奖
            this.updateShareLog(this.data.params.code)
          } else if (this.data.params && this.data.params.fhcode && reg2.test(this.data.params.fhcode)) {
            wx.redirectTo({ url: '../invite/invite?fhcode=' + this.data.params.fhcode })
          } else if (this.data.params && this.data.params.bookid) {
            // 跳转书籍详情页
            wx.redirectTo({ url: '../bookdetail/bookdetail?id=' + this.data.params.bookid + '&indexbtn=1' + (this.data.params.auto_secret ? ('&auto_secret=' + this.data.params.auto_secret) : '') })
          } else if (this.data.params && this.data.params.goto) {
            // 跳转其他页面
            if (this.data.params.goto === 'share') {
              wx.redirectTo({ url: '../activities/share/share' })
            } else {
              wx.switchTab({ url: '../index/index' })
            }
          } else {
            wx.switchTab({ url: '../index/index' })
          }
        } else {
          // 重新登录后返回上一页
          wx.reLaunch({ url: '../index/index' })
          // wx.navigateBack({ delta: 1 })
        }
      })
      .catch(err => {
        wx.showToast({ title: '当前阅读人数可能过多\n请点击下方登录按钮尝试重新登录', icon: 'none', duration: 2000 })
        this.setData({ loading: false, text: '', success: false })
      })
  },
  // 用户登录
  requestLogin: function() {
    return new Promise((resolve, reject) => {
      // 判断本地是否有缓存的登录数据，重新登录情况下不管是否存在缓存都重新发送登录接口
      let cacheLoginData = wx.getStorageSync('cacheLoginData')
      if (cacheLoginData && cacheLoginData.expised >= Date.now() && !this.data.loginAgain) {
        app.globalData.token = cacheLoginData.token // 登录token
        app.globalData.userInfo = cacheLoginData.userinfo // 用户信息
        this.getAppSetting()
        this.setData({ text: '欢迎回来！' + cacheLoginData.userinfo.username })
        resolve(true)
      } else {
        this
        .wxLogin()
        .then(code => {
          // 发送登录凭证到后台换取 openId, sessionKey, unionId
          wx.request({
            method: 'POST',
            url: config.base_url + '/api/user/login',
            data: {
              identity: 1,
              code: code
            },
            success: res => {
              if (res.data.ok) {
                // 将token存入缓存，在每次发送需要认证的请求时在header里带上token
                app.globalData.token = res.data.token // 登录token
                app.globalData.userInfo = res.data.userinfo // 用户信息
                wx.setStorage({
                  key: 'cacheLoginData',
                  data: {
                    token: res.data.token,
                    userinfo: res.data.userinfo,
                    expised: Date.now() + 24 * 60 * 60 * 1000
                  }
                })
                // 获取app全局配置
                this.getAppSetting()
                this.setData({ text: '欢迎回来！' + res.data.userinfo.username })
                resolve(true)
              } else if (!res.data.ok && res.data.registe === false) {
                // 未注册，自动注册
                wx.clearStorage()
                this
                  .doRegiste()
                  .then(() => {
                    resolve(true)
                  })
                  .catch(() => {
                    reject(false)
                  })
              } else {
                wx.showToast({ title: '登录失败' + (res.data.msg ? '，' + res.data.msg : ''), icon: 'none', duration: 2000 })
                this.setData({ buttonType: 'reLogin' })
                reject(false)
              }
            },
            fail: err => {
              wx.showToast({ title: '当前阅读人数可能过多\n请点击下方登录按钮尝试重新登录', icon: 'none', duration: 2000 })
              this.setData({ buttonType: 'reLogin' })
              reject(false)
            }
          })
        })
        .catch(err => {
          reject(false)
        })
      }
    })
  },
  // 用户注册
  doRegiste() {
    return new Promise((resolve, reject) => {
      this
        .wxLogin()
        .then(code => {
          this.wxUserInfo().then(userInfo => {
            // 发送注册接口
            wx.request({
              method: 'POST',
              url: config.base_url + '/api/user/registe',
              data: Object.assign({ identity: 'appuser', code }, userInfo),
              success: res => {
                if (res.data.ok) {
                  app.globalData.token = res.data.token // 登录token
                  app.globalData.userInfo = res.data.userinfo // 用户详情
                  wx.setStorage({
                    key: 'cacheLoginData',
                    data: {
                      token: res.data.token,
                      userinfo: res.data.userinfo,
                      expised: Date.now() + 24 * 60 * 60 * 1000
                    }
                  })
                  this.getAppSetting()
                  this.setData({ text: '遇见你，真高兴~' })
                  resolve(true)
                } else {
                  wx.showToast({ title: '注册失败' + (res.data.msg ? '，' + res.data.msg : ''), icon: 'none', duration: 2000 })
                  this.setData({ buttonType: 'reLogin' })
                  reject(false)
                }
              },
              fail: err => {
                wx.showToast({ title: '当前阅读人数可能过多\n请点击下方登录按钮尝试重新登录', icon: 'none', duration: 2000 })
                this.setData({ buttonType: 'reLogin' })
                reject(false)
              }
            })
          })
        })
        .catch(err => {
          reject(false)
        })
    })
  },
  // 首页也能发送接受邀请的请求
  updateShareLog: function(share_id) {
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/share/update?share_id=' + share_id,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          wx.showToast({ title: '获得15书币的奖励', icon: 'success' })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          if (!res.data.inviteself) {
            wx.showToast({ title: '接收邀请失败' + (res.data.msg ? '，' + res.data.msg : ''), icon: 'none', duration: 2000 })
          }
        }
        // 领完分享奖励跳转首页
        setTimeout(() => {
          wx.switchTab({ url: '../index/index' })
        }, 1000)
      },
      fail: err => {
        wx.showToast({ title: '接收邀请失败', icon: 'none', duration: 2000 })
        setTimeout(function() {
          wx.switchTab({ url: '../index/index' })
        }, 1000)
      }
    })
  },
  // 获取应用设置
  getAppSetting: function() {
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/user/setting',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          for (let i in res.data.data.setting) {
            if (utils.isJsonString(res.data.data.setting[i])) {
              res.data.data.setting[i] = JSON.parse(res.data.data.setting[i])
            }
          }
          app.globalData.globalSetting = res.data.data.setting // 系统全局设置
          app.globalData.shareCode = res.data.data.share.code // 用户分享码
          app.globalData.shareWhiteList = res.data.data.share_white_list // 是否是分享白名单用户
          // 获取最新通知数量
          const hasReadMessages = wx.getStorageSync('hasReadMessages') || []
          app.globalData.unReadMessages = res.data.notices instanceof Array ? res.data.notices.filter(item => hasReadMessages.indexOf(item) < 0) : []
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          wx.showToast({ title: '获取应用设置失败' + (res.data.msg ? '，' + res.data.msg : ''), icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        wx.showToast({ title: '获取应用设置失败', icon: 'none', duration: 2000 })
        setTimeout(() => {
          wx.switchTab({ url: '../index/index' })
        }, 1000)
      }
    })
  },
  // 重新授权之后执行
  afterGetUserInfo() {
    this.doLogin()
  }
})
