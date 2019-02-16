const config = require('../../config')
const Promise = require('../../utils/bluebird.min')
const utils = require('../../utils/util')
const app = getApp()

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    modal: {
      show: false,
      name: '',
      inputValue: '',
      title: '温馨提示',
      opacity: 0.6,
      position: 'center',
      width: '80%',
      options: {
        fullscreen: false,
        showclose: true,
        showfooter: true,
        closeonclickmodal: true,
        confirmText: '确认'
      }
    },
    banner_urls: [],
    is_show_banner: true,
    themes: [],
    click_times: {}, // 换一批点击次数
    loaded: false,
    shutChargeTips: false,
    redpock: {
      show: false,
      text: ''
    },
    showFixedBtn: false
  },
  onLoad: function() {
    let self = this
    self.setData({ shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false })
    // 获取banner和栏目信息，使用promise来控制两个请求的同步
    let bannerP = self.getBanner()
    let themeP = self.getTheme()
    self.getDialogSetting()

    // 当两个请求完成之后隐藏loading
    Promise.all([bannerP, themeP])
      .then(results => {
        self.setData({ loaded: true })
      })
      .catch(err => {
        utils.debug('获取栏目或者banner信息失败', JSON.stringify(err))
      })
  },
  // 设置分享
  onShareAppMessage: function(res) {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = app.globalData.globalSetting.share
    const code = app.globalData.shareCode + '|' + Date.now()
    if (shareParams && app.globalData.shareCode) {
      return {
        title: shareParams.title,
        path: shareParams.page + '?code=' + code,
        imageUrl: shareParams.imageUrl
      }
    } else {
      self.showToast('获取分享参数失败', 'bottom')
      return false
    }
  },
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  },
  getBanner: function() {
    let self = this
    return new Promise((resolve, reject) => {
      wx.request({
        url: config.base_url + '/api/banner/list',
        success: function(res) {
          if (res.data.ok) {
            resolve(res)
          } else {
            // 隐藏banner
            reject(res)
          }
        },
        fail: function(err) {
          reject(err)
        }
      })
    })
      .then(res => {
        self.setData({ banner_urls: res.data.list })
      })
      .catch(err => {
        self.setData({ is_show_banner: false })
        utils.debug('获取banner失败', err)
        // 自动重新尝试
        setTimeout(function() {
          self.getBanner()
        }, 1000)
      })
  },
  getTheme: function() {
    let self = this
    return new Promise((resolve, reject) => {
      wx.request({
        url: config.base_url + '/api/theme/index_list',
        success: function(res) {
          if (res.data.ok) {
            resolve(res)
          } else {
            // 隐藏banner
            reject(res)
          }
        },
        fail: function(err) {
          reject(err)
        }
      })
    })
      .then(res => {
        self.setData({ themes: res.data.list })
        // 初始化换一批的点击次数
        res.data.list.forEach(item => {
          if (item.flush) {
            let tmpObj = {}
            tmpObj[item._id] = 2
            self.setData({ click_times: Object.assign(self.data.click_times, tmpObj) })
          }
        })
      })
      .catch(err => {
        utils.debug('获取栏目信息失败', err)
        setTimeout(function() {
          self.getTheme()
        }, 1000)
      })
  },
  // 获取弹窗设置
  getDialogSetting: function() {
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/wxapp/dialog',
      success: res => {
        if (res.data.ok) {
          app.globalData.dialogSetting = res.data.dialog
          // 展示首页弹窗
          const dialog = res.data.dialog['index-dialog']
          if (dialog && dialog.type === 'normal-text') {
            this.setData({
              'modal.show': true,
              'modal.title': dialog.title || '温馨提示',
              'modal.content': dialog.content
            })
          } else if (dialog && dialog.type === 'copy-text') {
            this.setData({
              'modal.show': true,
              'modal.title': dialog.title || '温馨提示',
              'modal.content': dialog.content
            })
          } else if (dialog && dialog.type === 'img') {
            // TODO
          }

          // 红包
          const redpock = res.data.dialog['redpock']
          if (redpock && redpock.redpock_des) {
            this.setData({
              'redpock.show': true,
              'redpock.text': redpock.redpock_des || '送你一个大红包！'
            })
          }

          // 悬浮框
          const fixedBtn = res.data.dialog['fixed-btn']
          if (fixedBtn && fixedBtn.img_url) {
            this.setData({
              'showFixedBtn': true
            })
          }
        } else {
          utils.debug('获取弹窗设置失败', res)
          wx.showToast({ title: '获取弹窗设置失败' + (res.data.msg ? '，' + res.data.msg : ''), icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        utils.debug('获取弹窗设置失败', err)
        wx.showToast({ title: '获取弹窗设置失败', icon: 'none', duration: 2000 })
        setTimeout(function() {
          wx.switchTab({ url: '../index/index' })
        }, 1000)
      }
    })
  },
  changeList: function(event) {
    let self = this
    let theme_id = event.currentTarget.dataset.themeid
    let page = parseInt(self.data.click_times[theme_id])
    if (theme_id) {
      wx.request({
        url: config.base_url + '/api/theme/change_list?page=' + page + '&theme_id=' + theme_id,
        success: function(res) {
          if (res.data.ok) {
            if (res.data.list.length > 0) {
              // 局部更新
              let thisIndex = -1
              self.data.themes.forEach((item, index) => {
                if (item._id == theme_id) {
                  thisIndex = index
                }
              })
              if (thisIndex > -1) {
                let key1 = 'themes[' + thisIndex + '].books'
                let key2 = 'click_times.' + theme_id
                self.setData({ [key1]: res.data.list, [key2]: page + 1 })
              }
            } else {
              self.showToast('暂无更多', 'bottom')
            }
          } else {
            // 隐藏banner
            utils.debug('更新栏目失败', res)
            self.showToast('更新栏目失败', 'bottom')
          }
        },
        fail: function(err) {
          utils.debug('更新栏目失败', err)
          self.showToast('更新栏目失败', 'bottom')
        }
      })
    }
  },
  gotoDetail: function(event) {
    let bookid = event.currentTarget.dataset.bookid
    let name = event.currentTarget.dataset.name
    wx.navigateTo({ url: '../bookdetail/bookdetail?id=' + bookid + '&name=' + name })
  },
  handleModalConfirm: function() {
    const dialog = app.globalData.dialogSetting ? app.globalData.dialogSetting['index-dialog'] : ''
    if (dialog && dialog.type === 'copy-text' && dialog.copy) {
      wx.setClipboardData({
        data: dialog.copy,
        success: function(res) {
          wx.showToast({ title: '复制成功', icon: 'success' })
        }
      })
    } else if (dialog && dialog.type === 'normal-text') {
      if (dialog.jump_type !== 'none') wx.navigateTo({ url: dialog.jump_url  })
    }
  },
  openRedPock: function() {
    this.setData({
      'redpock.show': false
    })
    const redpock = app.globalData.dialogSetting ? app.globalData.dialogSetting['redpock'] : ''
    if (redpock.jump_type !== 'none') wx.navigateTo({ url: redpock.jump_url  })
  }
})
