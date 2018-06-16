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
    clientHeight: '',
    banner_urls: [],
    is_show_banner: true,
    themes: [],
    click_times: {}, // 换一批点击次数
    loaded: false,
    shutCheck: false
  },
  onLoad: function() {
    let self = this
    // 获取屏幕高度
    wx.getSystemInfo({
      success: function(res) {
        self.setData({
          clientHeight: res.windowHeight
        })
      }
    })
    // 获取banner和栏目信息，使用promise来控制两个请求的同步
    let bannerP = self.getBanner()
    bannerP
      .then(res => {
        self.setData({ banner_urls: res.data.list })
      })
      .catch(err => {
        self.setData({ is_show_banner: false })
        self.showToast('获取banner信息失败', 'bottom')
        utils.debug('获取banner信息失败', JSON.stringify(err))
      })
    let themeP = self.getTheme()
    themeP
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
        self.showToast('获取栏目信息失败', 'bottom')
        utils.debug('获取栏目信息失败', JSON.stringify(err))
      })
    // 当两个请求完成之后隐藏loading
    Promise.all([bannerP, themeP])
      .then(results => {
        self.setData({ loaded: true })
      })
      .catch(err => {
        utils.debug('获取栏目或者banner信息失败', JSON.stringify(err))
      })
    const globalSetting = wx.getStorageSync('global_setting')
    const dialog = globalSetting ? JSON.parse(globalSetting.index_dialog) : ''
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
            confirmText: '确认'
          }
        }
      })
    }
  },
  // 设置分享
  onShareAppMessage: function(res) {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = wx.getStorageSync('share_params')
    const now = new Date()
    const code = wx.getStorageSync('share_code') + '_' + now.getTime()
    if (shareParams) {
      return {
        title: shareParams.title,
        path: shareParams.page + '?code=' + code,
        imageUrl: shareParams.imageUrl,
        success: function(res) {
          // 转发成功
          // wx.showToast({ title: '分享成功', icon: 'success' })
        },
        fail: function(res) {
          // 取消分享
        }
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
  handleModalConfirm: function() {}
})
