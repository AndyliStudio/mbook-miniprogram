const app = getApp()
const utils = require('../../utils/util')
Component({
  data: {
    showFixedBtn: '', // 是否展示悬浮按钮
    imgUrl: '' // 图片地址
  },
  attached: function() {
    let showFixedBtn = false
    let setting = app.globalData.globalSetting.fixed_button
    if (setting && setting.show === 'true') {
      if (setting.only_index === 'true') {
        if (utils.getCurrentPageUrlWithArgs().indexOf('/index/index') > -1) {
          showFixedBtn = true
        }
      } else {
        showFixedBtn = true
      }
    }
    this.setData({
      showFixedBtn: showFixedBtn,
      imgUrl: app.globalData.globalSetting.fixed_button.img
    })
  },
  methods: {
    handleClick: function(event) {
      // wx.navigateTo({ url: '/pages/loading/loading?code=_94IVfPQ4_1539963531582' })
      const setting = app.globalData.globalSetting.fixed_button
      if (!setting || setting.show !== 'true') {
        return false
      }
      if (setting.function === 'gotoH5Page') {
        wx.navigateTo({ url: '/pages/webpage/webpage?url=' + setting.url })
      } else if (setting.function === 'gotoXcxPage') {
        wx.navigateTo({ url: setting.url })
      }
    }
  }
})
