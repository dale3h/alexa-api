/**
 * Alexa API Implementation
 *
 * @author Dale Higgs <@dale3h>
 * @copyright Dale Higgs 2017
 * @see {@link https://github.com/dale3h/alexa-api}
 * @license MIT
 */

'use strict'

// Global variables
var casper, utils

// Log wrapper functions
function debug(message) {
  casper.log(message, 'debug', 'alexa-api')
}

function info(message) {
  casper.log(message, 'info', 'alexa-api')
}

function warning(message) {
  casper.log(message, 'warning', 'alexa-api')
}

function error(message) {
  casper.log(message, 'error', 'alexa-api')
}

// String manipulation functions
function slugify(string) {
  return string.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9\-]/g, '')
}

function render(string, vars) {
  if (typeof vars !== 'object')
    return string

  return string.replace(/\{\{\s*(.+?)\s*\}\}/g, function(_, name) {
    return vars[name]
  })
}

// AlexaApi class implementation
var AlexaApi = (function() {
  // Constructor
  function AlexaApi(_casper, _utils, options) {
    // Set global variables
    casper = _casper
    utils = _utils

    // Default options
    var defaults = {
      apiUrl: 'https://pitangui.amazon.com',
      cacheLifetime: (30 * 60 * 1000)
    }

    // Merge defaults with provided options
    var opts = utils.mergeObjects(defaults, options || {})

    this.apiUrl = opts.apiUrl
    this.cacheLifetime = opts.cacheLifetime

    this._devices = {}
    this._deviceCount = 0
    this._deviceCacheTimestamp = 0
  }

  // AlexaApi transport functions
  AlexaApi.prototype.request = function(settings, vars) {
    // Set request method to GET if it's missing
    settings.type = settings.type || 'get'

    // Automatically append apiUrl if it's a relative URL
    if (!/^https?:\/\//.test(settings.url)) {
      settings.url = this.apiUrl + settings.url
    }

    // Render the URL as a template
    if (vars)
      settings.url = render(settings.url, vars)

    // Output request method and URL to debug log
    debug(settings.type.toUpperCase() + ' ' + settings.url)

    // Convert payload object to JSON string
    if ('data' in settings && typeof settings.data === 'object')
      settings.data = JSON.stringify(settings.data)

    return casper.evaluate(function(settings) {
      var result = {}

      settings.async = false
      settings.complete = function(xhr, status) {
        var contentType
        var props = [
          'readyState', 'status', 'statusText',
          'responseText', 'responseJSON', 'responseXML'
        ]

        if (contentType = xhr.getResponseHeader('Content-Type'))
          result.contentType = contentType

        props.forEach(function(prop) {
          if (prop in xhr)
            result[prop] = xhr[prop]
        })
      }

      $.ajax(settings)

      return result
    }, settings)
  }

  AlexaApi.prototype.get = function(url, vars) {
    return this.request({
      type: 'get',
      url: this.apiUrl + url
    }, vars)
  }

  AlexaApi.prototype.post = function(url, payload, vars) {
    return this.request({
      type: 'post',
      url: this.apiUrl + url,
      data: payload
    }, vars)
  }

  // Feature implementation functions
  AlexaApi.prototype.devices = function(forceUpdate) {
    if (forceUpdate)
      this._deviceCacheTimestamp = 0

    var cacheTimeLeft = this.cacheLifetime - (Date.now() - this._deviceCacheTimestamp)

    if (!this._deviceCount || cacheTimeLeft <= 0) {
      var devices = this.get('/api/devices/device').responseJSON.devices

      this._devices = {}
      this._deviceCount = 0

      devices.forEach(function(device) {
        var deviceSlug = slugify(device.accountName)
        this._devices[deviceSlug] = device
      }, this)

      this._deviceCount = Object.keys(this._devices).length
      this._deviceCacheTimestamp = Date.now()
    } else {
      debug('Using device cache. Device cache expires in ' + cacheTimeLeft / 1000 + ' seconds.')
    }

    return this._devices
  }

  AlexaApi.prototype.device = function(deviceId, forceUpdate) {
    return this.devices(forceUpdate)[deviceId]
  }

  AlexaApi.prototype.player = function(deviceId) {
    var device = this.device(deviceId)
    var result = this.get(
      '/api/np/player?deviceSerialNumber={{serialNumber}}&deviceType={{deviceType}}',
      device
    )

    return result.responseJSON.playerInfo
  }

  AlexaApi.prototype.command = function(deviceId, payload) {
    var device = this.device(deviceId)

    return this.post(
      '/api/np/command?deviceSerialNumber={{serialNumber}}&deviceType={{deviceType}}',
      payload, device
    )
  }

  AlexaApi.prototype.play = function(deviceId) {
    return this.command(deviceId, {
      type: 'PlayCommand'
    })
  }

  AlexaApi.prototype.pause = function(deviceId) {
    return this.command(deviceId, {
      type: 'PauseCommand'
    })
  }

  AlexaApi.prototype.volume = function(deviceId, volume) {
    // Get volume
    if (volume === undefined)
      return this.player(deviceId).volume

    // Set volume
    return this.command(deviceId, {
      type: 'VolumeLevelCommand',
      volumeLevel: parseInt(volume)
    })
  }

  return AlexaApi
})()

module.exports = AlexaApi
