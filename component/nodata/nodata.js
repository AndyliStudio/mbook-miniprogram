Component({
  properties: {
    text: {
      type: String,
      value: '暂无数据'
    },
    subText: {
      type: String,
      value: ''
    },
    btnText: {
      type: String,
      value: '重新加载'
    },
    showBtn: {
      type: Boolean,
      value: false
    }
  },
  data: {
    animation: ''
  },
  methods: {
    buttonClick: function() {
      var btnClickDetail = {} // detail对象，提供给事件监听函数
      var btnClickOption = {} // 触发事件的选项
      this.triggerEvent('btnclick', btnClickDetail, btnClickOption)
    }
  }
})
