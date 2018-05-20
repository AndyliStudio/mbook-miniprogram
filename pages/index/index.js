//index.js
const config = require('../../config')

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
    isBannerOk: false,
    isThemeOk: false,
    loaded: false
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
    // 获取banner和栏目信息
    ;(function() {
      let timer = setInterval(function() {
        if (self.data.isBannerOk && self.data.isThemeOk) {
          clearInterval(timer)
          self.setData({ loaded: true })
        }
      }, 500)
    })()
    self.getBanner()
    self.getTheme()
    const dialogLocal = wx.getStorageSync('index_dialog')
    if (dialogLocal) {
      const dialog = JSON.parse(dialogLocal)
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
  showToast: function(content, position) {
    let self = this
    self.setData({ toast: { show: true, content: content, position: position } })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  },
  getBanner: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/banner/list',
      success: function(res) {
        if (res.data.ok) {
          self.setData({ banner_urls: res.data.list })
        } else {
          // 隐藏banner
          self.setData({ is_show_banner: false })
          self.showToast('获取banner信息失败', 'bottom')
        }
      },
      fail: function(err) {
        self.setData({ is_show_banner: false })
        self.showToast('获取banner信息失败', 'bottom')
      },
      complete: function() {
        self.setData({ isBannerOk: true })
      }
    })
  },
  getTheme: function() {
    let self = this
    wx.request({
      url: config.base_url + '/api/theme/index_list',
      success: function(res) {
        if (res.data.ok) {
          self.setData({ themes: res.data.list })
          // 初始化换一批的点击次数
          res.data.list.forEach(item => {
            if (item.flush) {
              let tmpObj = {}
              tmpObj[item._id] = 2
              self.setData({ click_times: Object.assign(self.data.click_times, tmpObj) })
            }
          })
        } else {
          // 隐藏banner
          self.showToast('获取栏目信息失败', 'bottom')
        }
      },
      fail: function(err) {
        self.showToast('获取栏目信息失败', 'bottom')
      },
      complete: function() {
        self.setData({ isThemeOk: true })
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
