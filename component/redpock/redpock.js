Component({
  properties: {
    toast: {
      type: Object,
      value: { show: false, content: 'hello', position: 'bottom' }
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
