// pages/user/user.js
const config = require('../../config')
const util = require('../../utils/util')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    modal: { show: false, title: '温馨提示', showBtn: true, btnText: '复制微信号' },
    currentPageNum: 1,
    amount: 0,
    awards: [],
    buys: [],
    showBuyLoadmore: false,
    showAwardLoadmore: false,
    awardPage: 1,
    buyPage: 1
  },
  onShow: function() {
    this.getInfo()
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
      header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
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
          self.showToast('获取奖励和充值记录失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取奖励和充值记录失败', 'bottom')
      }
    })
  },
  getAward: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/award/list?page=' + self.data.buyPage,
      header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
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
          self.showToast('获取奖励和充值记录失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取奖励和充值记录失败', 'bottom')
      }
    })
  },
  getAmount: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/user/amount',
      header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if (res.data.ok) {
          self.setData({ amount: res.data.data.amount })
          wx.setStorageSync('amount', res.data.data.amount)
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          self.showToast('获取书币数量失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取书币数量失败', 'bottom')
      }
    })
  },
  gotoCharge: function() {
    this.setData({ 'modal.show': true })
  },
  pasteWxCode: function() {
    let self = this
    wx.setClipboardData({
      data: 'dreamldk',
      success: function(res) {
        self.setData({ 'modal.show': false })
        wx.showToast({ title: '复制成功', icon: 'success' })
        setTimeout(function() {
          wx.hideToast()
        }, 2000)
      }
    })
  },
  closeModal: function() {
    this.setData({ 'modal.show': false })
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
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
