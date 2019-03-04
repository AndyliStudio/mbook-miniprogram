const config = require('../../config')
const app = getApp()

Page({
  data: {
    banner_urls: [],
    is_show_banner: true,
    themes: [],
    loaded: false,
    shutChargeTips: false,
    redpock: {
      show: false,
      text: ''
    },
    imgDialog: {
      show: false,
      src: ''
    },
    showFixedBtn: false
  },
  other: {
    click_times: {}, // 换一批点击次数
  },
  onLoad: function() {
    this.setData({ shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false })
    // 获取banner和栏目信息，使用promise来控制两个请求的同步
    let bannerP = this.getBanner()
    let themeP = this.getTheme()
    this.getDialogSetting()

    // 当两个请求完成之后隐藏loading
    Promise.all([bannerP, themeP])
      .then(results => {
        this.setData({ loaded: true })
          // 图片懒加载
          for(let i=0; i<this.data.themes.length; i++) {
            for(let j=0; j<this.data.themes[i].books.length; j++) {
              this.observe = wx.createIntersectionObserver(this);
              this.observe.relativeToViewport().observe(`.img-${i}-${j}`, (res) => {
                if (res.intersectionRatio > 0){
                  let indexArr = res.dataset.index.split('-')
                  //如果图片进入可视区，将其设置为 show
                  let key1 = 'themes[' + indexArr[0] + '].books[' + indexArr[1] + '].show'
                  this.setData({ [key1]: true })
                }
              })
            }
          }
      })
  },
  onUnload: function onUnload() {
    if (this.observe) this.observe.disconnect();
  },
  // 设置分享
  onShareAppMessage: function(res) {
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
      wx.showToast({ title: '获取分享参数失败', icon: 'none', duration: 2000 })
      return false
    }
  },
  getBanner: function() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: config.base_url + '/api/banner/list',
        success: res => {
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
        this.setData({ banner_urls: res.data.list })
      })
      .catch(err => {
        this.setData({ is_show_banner: false })
        // 自动重新尝试
        setTimeout(() => {
          this.getBanner()
        }, 2000)
      })
  },
  getTheme: function() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: config.base_url + '/api/theme/index_list',
        success: res => {
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
        // 初始化换一批的点击次数
        res.data.list = res.data.list.map(item => {
          if (item.flush) {
            let tmpObj = {}
            tmpObj[item._id] = 2
            this.other.click_times = Object.assign(this.other.click_times, tmpObj)
          }
          item.books = item.books.map(item2 => {
            item2.show = false
            return item2
          })
          return item
        })
        this.setData({ themes: res.data.list })
      })
      .catch(err => {
        setTimeout(() => {
          this.getTheme()
        }, 2000)
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
            wx.showModal({
              title: dialog.title || '温馨提示',
              content: dialog.content,
              success: res => {
                if (res.confirm) {
                  wx.setClipboardData({
                    data: dialog.copy,
                    success: () => {
                      wx.showToast({ title: '复制成功', icon: 'success' })
                    }
                  })
                }
              }
            })
          } else if (dialog && dialog.type === 'copy-text') {
            wx.showModal({
              title: dialog.title || '温馨提示',
              content: dialog.content,
              success: res => {
                if (res.confirm) {
                  if (dialog.jump_type !== 'none') wx.navigateTo({ url: dialog.jump_url  })
                }
              }
            })
          } else if (dialog && dialog.type === 'img') {
            // TODO
            this.setData({
              'imgDialog.show': true,
              'imgDialog.src': dialog.img_url
            })
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
          wx.showToast({ title: '获取弹窗设置失败' + (res.data.msg ? '，' + res.data.msg : ''), icon: 'none', duration: 2000 })
        }
      },
      fail: err => {
        wx.showToast({ title: '获取弹窗设置失败', icon: 'none', duration: 2000 })
        setTimeout(function() {
          wx.switchTab({ url: '../index/index' })
        }, 1000)
      }
    })
  },
  changeList: function(event) {
    let theme_id = event.currentTarget.dataset.themeid
    let page = parseInt(this.other.click_times[theme_id])
    if (theme_id) {
      wx.request({
        url: config.base_url + '/api/theme/change_list?page=' + page + '&theme_id=' + theme_id,
        success: res => {
          if (res.data.ok) {
            if (res.data.list.length > 0) {
              // 局部更新
              let thisIndex = -1
              this.data.themes.forEach((item, index) => {
                if (item._id == theme_id) {
                  thisIndex = index
                }
              })
              if (thisIndex > -1) {
                let key1 = 'themes[' + thisIndex + '].books'
                this.other.click_times[theme_id] = page + 1
                this.setData({ [key1]: res.data.list })
              }
            } else {
              wx.showToast({ title: '暂无更多', icon: 'none', duration: 2000 })
            }
          } else {
            // 隐藏banner
            wx.showToast({ title: '更新栏目失败', icon: 'none', duration: 2000 })
          }
        },
        fail: function(err) {
          wx.showToast({ title: '更新栏目失败', icon: 'none', duration: 2000 })
        }
      })
    }
  },
  gotoDetail: function(event) {
    let bookid = event.currentTarget.dataset.bookid
    let name = event.currentTarget.dataset.name
    wx.navigateTo({ url: '../bookdetail/bookdetail?id=' + bookid + '&name=' + name })
  },
  openRedPock: function() {
    this.setData({
      'redpock.show': false
    })
    const redpock = app.globalData.dialogSetting ? app.globalData.dialogSetting['redpock'] : ''
    if (redpock.jump_type !== 'none') wx.navigateTo({ url: redpock.jump_url  })
  },
  clickImgDialog: function() {
    const dialog = app.globalData.dialogSetting ? app.globalData.dialogSetting['index-dialog'] : ''
    if (dialog.jump_type === 'erweima') {
      wx.showToast({ title: '长按即可识别二维码', icon: 'none', duration: 2000 })
      wx.previewImage({
        current: this.data.imgDialog.src,
        urls: [this.data.imgDialog.src]
      })
    } else if (dialog.jump_type !== 'none') {
      wx.navigateTo({ url: dialog.jump_url  })
    }
  },
  closeImgDialog: function() {
    this.setData({
      'imgDialog.show': false
    })
  }
})
