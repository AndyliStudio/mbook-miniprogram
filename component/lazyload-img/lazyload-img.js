Component({
  properties: {
    class: {
      type: String,
      value: ''
    },
    mode: {
      type: String,
      value: 'scaleToFill'
    },
    src: {
      type: String,
      value: 'https://fs.andylistudio.com/mbook/book-loading.svg' // 默认加载loading图片
    }
  },
  data: {
    loaded: false
  },
  methods: {
    imgLoad: function(event) {
      // 图片加载完成,将地址改成真实地址
      this.data.loaded = true
    },
    imgError: function(event) {}
  }
})
