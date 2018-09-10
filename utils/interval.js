/**
 * Interval.js
 *
 * @constructor
 * @param {function} func - The function you want to be called repeatly
 * @param {int} delay - milliseconds that should wait before each call
 * @param {int} lifetime - if set, clearInterval will be called after `lifetime` milliseconds
 */
function Interval(func, options) {
  this.func = func
  this.delay = options.delay || 16
  this.lifetime = options.lifetime
  this.interval = null
  this.gcTimeout = null
}

var interval = Interval.prototype

/**
 * clearInterval without touching lifetime
 *
 * @method Interval#pause
 */
Interval.prototype.pause = function() {
  if (this.interval) {
    clearInterval(this.interval)
    this.interval = null
  }
}

/**
 * setInterval if not set
 *
 * @method Interval#resume
 */
interval.resume = function() {
  if (this.interval === null) {
    this.start()
  }
}

/**
 * setInterval & setTimeout for clearInterval if lifetime set
 *
 * @method Interval#start
 * @param {int} delay - milliseconds that should wait before each call, defaults to this.delay
 * @param {int} lifetime - if set, clearInterval will be called after `lifetime` milliseconds, defaults to this.lifetime
 */
interval.start = function(delay, lifetime) {
  var self = this
  this.stop()
  delay = delay || this.delay
  lifetime = lifetime || this.lifetime

  this.interval = setInterval(this.func, this.delay)
  if (lifetime) {
    var that = this
    this.gcTimeout = setTimeout(function() {
      that.gcTimeout = null
      that.stop()
    }, lifetime)
  }
}

/**
 * clearInterval and clearTimeout for lifetime
 *
 * @method Interval#stop
 */
interval.stop = function() {
  this.pause()
  if (this.gcTimeout) {
    clearTimeout(this.gcTimeout)
    this.gcTimeout = null
  }
}

/**
 * Run func once
 *
 * @method Interval#once
 */
interval.once = function() {
  this.func()
}

interval.status = function() {
  return this.interval
}

interval.restart = interval.start

module.exports = Interval
