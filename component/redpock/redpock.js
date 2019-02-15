Component({
  properties: {
    text: {
      type: String,
      value: '送你一个红包'
    }
  },
  data: {
    opened: false,
    closed: false
  },
  methods: {
    openIt: function() {
      this.setData({ opened: true })
      this.triggerEvent('open')
    },
    closeIt: function() {
      this.setData({ opened: false, closed: true })
    }
  }
})
