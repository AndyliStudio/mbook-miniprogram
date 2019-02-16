const app = getApp()
const utils = require('../../utils/util')
Component({
  data: {
    showFixedBtn: '', // 是否展示悬浮按钮
    imgUrl: '' // 图片地址
  },
  attached: function() {
    let showFixedBtn = false
    let imgUrl = ''
    const setting = app.globalData.dialogSetting['fixed-btn']
    if (setting && setting.img_url) {
      if (setting.only_index) {
        if (utils.getCurrentPageUrlWithArgs().indexOf('/index/index') > -1) {
          showFixedBtn = true
        }
      } else {
        showFixedBtn = true
      }
      imgUrl = setting.img_url || ''
    }
    this.setData({
      showFixedBtn: showFixedBtn,
      imgUrl: imgUrl
    })
  },
  methods: {
    handleClick: function(event) {
      // wx.navigateTo({ url: '/pages/loading/loading?code=_94IVfPQ4_1539963531582' })
      const setting = app.globalData.dialogSetting['fixed-btn']
      if (!setting || !setting.img_url) {
        return false
      }
      // 自定义微信统计事件--click_fixed_button
      wx.reportAnalytics('click_fixed_button', { time: +new Date() })
      if (setting.jump_type !== 'none') wx.navigateTo({ url: setting.jump_url  })
    }
  }
})
