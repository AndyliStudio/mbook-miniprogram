// pages/user/user.js
const config = require('../../config')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    modal: {
      show: false,
      title: '温馨提示',
      opacity: 0.6,
      position: 'center',
      width: '80%',
      options: {
        fullscreen: false,
        showclose: true,
        showfooter: true,
        closeonclickmodal: true,
        confirmText: ''
      }
    },
    wxcode: '',
    currentPageNum: 1,
    amount: 0,
    awards: [],
    buys: [],
    showBuyLoadmore: false,
    showAwardLoadmore: false,
    awardPage: 1,
    buyPage: 1,
    chargeTips: ''
  },
  onShow: function() {
    this.getInfo()
  },
  onLoad: function() {
    let globalSetting = wx.getStorageSync('global_setting')
    let chargeTips = globalSetting.charge_tips || '暂不支持微信支付，请加客服(haitianyise_hl)为好友，按照1元兑换10书币的价格转账之后，客服人员会为您充值书币。'
    this.setData({ wxcode: globalSetting.wxcode || 'haitianyise_hl', chargeTips: chargeTips })
  },
  changePage: function(event) {
    let page = parseInt(event.currentTarget.dataset.page)
    this.setData({ currentPageNum: page })
  },
  getInfo: function() {
    let self = this
    const amount = wx.getStorageSync('amount')
    if (amount || amount === 0) {
      self.setData({ amount: amount })
      wx.setStorageSync('amount', amount)
    } else {
      self.getAmount()
    }
    self.getAward()
    self.getBuys()
  },
  getBuys: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/buy/list?page=' + self.data.awardPage,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({
            buys: self.data.buys.concat(
              res.data.list.map(item => {
                item.create_time = util.formatTime(new Date(item.create_time))
                return item
              })
            )
          })
          self.setData({
            showBuyLoadmore: self.data.buys.length >= res.data.total ? false : true
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          util.debug('获取奖励和充值记录失败：' + JSON.stringify(res))
          self.showToast('获取奖励和充值记录失败', 'bottom')
        }
      },
      fail: err => {
        util.debug('获取奖励和充值记录失败：' + JSON.stringify(err))
        self.showToast('获取奖励和充值记录失败', 'bottom')
      }
    })
  },
  getAward: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/award/list?page=' + self.data.buyPage,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({
            awards: self.data.awards.concat(
              res.data.list.map(item => {
                item.create_time = util.formatTime(new Date(item.create_time))
                return item
              })
            )
          })
          self.setData({
            showAwardLoadmore: self.data.awards.length >= res.data.total ? false : true
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          util.debug('获取奖励和充值记录失败：' + JSON.stringify(res))
          self.showToast('获取奖励和充值记录失败', 'bottom')
        }
      },
      fail: err => {
        util.debug('获取奖励和充值记录失败：' + JSON.stringify(err))
        self.showToast('获取奖励和充值记录失败', 'bottom')
      }
    })
  },
  getAmount: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/user/amount',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({ amount: res.data.data.amount })
          wx.setStorageSync('amount', res.data.data.amount)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          util.debug('获取书币数量失败：' + JSON.stringify(res))
          self.showToast('获取书币数量失败', 'bottom')
        }
      },
      fail: err => {
        util.debug('获取书币数量失败：' + JSON.stringify(err))
        self.showToast('获取书币数量失败', 'bottom')
      }
    })
  },
  // 复制微信号
  copyWxcode: function() {
    let self = this
    wx.setClipboardData({
      data: self.data.wxcode,
      success: function(res) {
        wx.showToast({ title: '复制成功', icon: 'success' })
        self.setData({
          'modal.show': false
        })
        setTimeout(function() {
          wx.hideToast()
        }, 2000)
      }
    })
  },
  loadMore: function(event) {
    let page = parseInt(event.currentTarget.dataset.page)
    if (page === 1) {
      this.setData({ awardPage: this.data.awardPage + 1 })
      this.getAward()
    } else if (page === 2) {
      this.setData({ buyPage: this.data.buyPage + 1 })
      this.getBuys()
    }
  },
  // modal相关的方法
  gotoCharge: function() {
    this.setData({
      modal: {
        show: true,
        title: '温馨提示',
        opacity: 0.6,
        position: 'center',
        width: '80%',
        options: {
          fullscreen: false,
          showclose: true,
          showfooter: false,
          closeonclickmodal: true,
          confirmText: ''
        }
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
