Component({
  properties: {
    toast: {
      type: Object,
      value: { show: false, content: 'hello', position: 'bottom' }
    }
  },
  data: {
    animation: ''
  },
  ready: function(){
    let animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'linear'
    })
    animation.opacity(.96).step()
    animation.opacity(0).step()
    this.setData({ 'animation': animation.export() })
  }
})
