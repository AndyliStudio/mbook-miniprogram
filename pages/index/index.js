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
        confirmText: ''
      }
    },
    banner_urls: [],
    is_show_banner: true,
    themes: [],
    click_times: {}, // 换一批点击次数
    loaded: false,
    shutChargeTips: false
  },
  onLoad: function() {
    let self = this
    self.setData({ shutChargeTips: app.globalData.globalSetting.shut_charge_tips })
    // 获取banner和栏目信息，使用promise来控制两个请求的同步
    let bannerP = self.getBanner()
    let themeP = self.getTheme()

    // 当两个请求完成之后隐藏loading
    Promise.all([bannerP, themeP])
      .then(results => {
        self.setData({ loaded: true })
      })
      .catch(err => {
        utils.debug('获取栏目或者banner信息失败', JSON.stringify(err))
      })

    // 展示全局弹窗
    const dialog = app.globalData.globalSetting ? app.globalData.globalSetting.index_dialog : ''
    if (dialog && dialog.show === 'true') {
      self.setData({
        modal: {
          show: true,
          title: dialog.title,
          content: dialog.content,
          opacity: 0.6,
          position: 'center',
          width: '80%',
          options: {
            fullscreen: false,
            showclose: true,
            showfooter: true,
            closeonclickmodal: true,
            confirmText: dialog.confirmText || '确认'
          }
        }
      })
    }
  },
  // 设置分享
  onShareAppMessage: function(res) {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = app.globalData.globalSetting.share
    const now = new Date()
    const code = app.globalData.shareCode + '|' + now.getTime()
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
        utils.debug('调用接口失败--/api/banner/list', JSON.stringify(err))
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
        utils.debug('获取栏目信息失败', JSON.stringify(err))
        setTimeout(function() {
          self.getTheme()
        }, 1000)
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
            self.showToast('更新栏目失败', 'bottom')
          }
        },
        fail: function(err) {
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
    const dialog = app.globalData.globalSetting ? app.globalData.globalSetting.index_dialog : ''
    if (dialog && dialog.show === 'true' && dialog.copyText) {
      wx.setClipboardData({
        data: dialog.copyText,
        success: function(res) {
          wx.showToast({ title: '复制成功', icon: 'success' })
        }
      })
    }
  }
})
