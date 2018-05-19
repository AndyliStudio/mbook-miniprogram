// pages/setting/charge.js
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    currentPageNum: 1,
    payNum: 0,
    willGetYuebiNum: 0,
    url: '',
    localIp: '0.0.0.0',
    prises: [],
    chargeResult: {
      type: '',
      mainText: '',
      desText: '',
      mainBtnText: '',
      subBtnText: '',
      mainCallback: null,
      subCallback: null
    }
  },
  onShow: function(options) {
    this.getChargeGood()
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  },
  select: function(event) {
    let num = parseInt(event.currentTarget.dataset.num)
    let key = 'prises[' + num + '].selected'
    this.setData({ [key]: !this.data.prises[num].selected })
    let payNum = 0
    let willGetYuebiNum = 0
    this.data.prises.forEach(item => {
      if (item.selected) {
        payNum += item.prise
        willGetYuebiNum += item.yuebi
      }
    })
    this.setData({ payNum: payNum, willGetYuebiNum: willGetYuebiNum })
  },
  changePage: function(event) {
    let page = parseInt(event.currentTarget.dataset.page)
    this.setData({ currentPageNum: page })
  },
  getChargeGood: function() {
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/charge',
      success: res => {
        if (res.data.ok) {
          let prises = res.data.list.map(item => {
            item.selected = false
            return item
          })
          self.setData({ prises: prises })
        } else {
          self.showToast('获取充值商品失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取充值商品失败', 'bottom')
      }
    })
  },
  doPay: function() {
    let self = this
    // 向后端请求支付参数
    let selectPrise = self.data.prises.filter(item => {
      return item.selected
    })
    wx.showLoading({
      title: '支付中...'
    })
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/pay',
      header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
      data: {
        chargeids: selectPrise.map(item => {
          return item.id
        }),
        pay_money: self.data.payNum,
        yuebi_num: self.data.willGetYuebiNum,
        spbill_create_ip: self.data.localIp || '0.0.0.0'
      },
      success: res => {
        if (res.data.ok) {
          let pay_id = res.data.pay_id
          wx.requestPayment({
            timeStamp: res.data.params.timeStamp,
            nonceStr: res.data.params.nonceStr,
            package: res.data.params.package,
            signType: res.data.params.signType,
            paySign: res.data.params.paySign,
            success: res => {
              wx.hideLoading()
              // 前往支付成功页面
              self.setData({
                chargeResult: {
                  type: 'success',
                  mainText: '支付成功',
                  desText: '获得' + self.data.willGetYuebiNum + '阅币，快去阅读吧~',
                  mainBtnText: '去阅读',
                  subBtnText: '再来一单',
                  mainCallback: () => {
                    wx.switchTab({
                      url: '../booklist/booklist'
                    })
                  },
                  subCallback: () => {
                    self.setData({
                      chargeResult: {
                        type: '',
                        mainText: '',
                        desText: '',
                        mainBtnText: '',
                        subBtnText: '',
                        mainCallback: null,
                        subCallback: null
                      }
                    })
                  }
                }
              })
            },
            fail: err => {
              wx.hideLoading()
              let errorMsg = ''
              if (err && err.errMsg) {
                if (err.errMsg.indexOf('cancel') > -1) {
                  errorMsg = '取消订单'
                  // 向后端发送支付取消请求
                  wx.request({
                    method: 'GET',
                    url: config.base_url + '/api/pay/cancel?pay_id=' + pay_id,
                    header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
                    success: res => {}
                  })
                }
                if (err.errMsg.indexOf('servicewechat.com:443') > -1) {
                  errorMsg = '请检查您的网络'
                }
              }
              // 前往支付失败页面
              self.setData({
                chargeResult: {
                  type: 'warn',
                  mainText: '支付失败',
                  desText: errorMsg,
                  mainBtnText: '重新下单',
                  subBtnText: '去阅读',
                  mainCallback: () => {
                    self.setData({
                      chargeResult: {
                        type: '',
                        mainText: '',
                        desText: '',
                        mainBtnText: '',
                        subBtnText: '',
                        mainCallback: null,
                        subCallback: null
                      }
                    })
                  },
                  subCallback: () => {
                    wx.switchTab({
                      url: '../booklist/booklist'
                    })
                  }
                }
              })
            }
          })
        } else if (res.data.authfail) {
          wx.navigateTo({
            url: '../authfail/authfail'
          })
        } else {
          wx.hideLoading()
          self.showToast('请求支付参数失败', 'bottom')
        }
      },
      fail: err => {
        wx.hideLoading()
        self.showToast('请求支付参数失败', 'bottom')
      }
    })
  },
  // 处理支付页面点击事件
  btnClick: function(event) {
    let type = event.currentTarget.dataset.type
    if (type === 'main') {
      if (typeof this.data.chargeResult.mainCallback === 'function') {
        this.data.chargeResult.mainCallback()
      }
    } else if (type === 'sub') {
      if (typeof this.data.chargeResult.subCallback === 'function') {
        this.data.chargeResult.subCallback()
      }
    }
  }
})
