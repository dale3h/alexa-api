/**
 * Alexa API Server
 * @version 0.1.0
 *
 * @author Dale Higgs <@dale3h>
 * @copyright Dale Higgs 2017
 * @see {@link https://github.com/dale3h/alexa-api}
 *
 * @license
 * MIT License
 *
 * Copyright (c) 2017 Dale Higgs <@dale3h>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict'

var fs = require('fs')
var sys = require('system')
var utils = require('utils')
var casper = require('casper').create()
var server = require('webserver').create()
var AlexaApi = require('./lib/alexa-api')
var Router = require('./lib/router')
var config = require('./config.json')

var defaults = {
  amazon: {},
  server: {
    host: '0.0.0.0',
    port: 2539,
    screenshot: 'captcha.png'
  },
  casper: {
    verbose: true,
    logLevel: 'debug',
    pageSettings: {
      loadImages: true,
      loadPlugins: false,
      javascriptEnabled: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
    },
    viewportSize: {
      width: 1280,
      height: 720
    }
  }
}

// Merge the default options into config
config = utils.mergeObjects(defaults, config)

// Make sure we have the Amazon credentials
if (!config.amazon.username || !config.amazon.password)
  throw 'Amazon credentials not set'

// Set CasperJS' options
casper.options = utils.mergeObjects(casper.options, config.casper)

// Log wrappers
function debug(message, space) {
  casper.log(message, 'debug', space)
}

function info(message, space) {
  casper.log(message, 'info', space)
}

function warning(message, space) {
  casper.log(message, 'warning', space)
}

function error(message, space) {
  casper.log(message, 'error', space)
}

// Casper event handlers
casper.on('remote.message', function(msg) {
  debug(msg, 'alexa')
})

casper.on('load.finished', function(status) {
  var url = this.getCurrentUrl()

  if (status != 'success')
    return error('Load failed: ' + status)

  if (url.indexOf('www.amazon.com/ap/signin') > -1)
    this.emit('amazon.login')
  else if (url.indexOf('www.amazon.com/spa/index.html') > -1)
    this.emit('amazon.spa')
})

casper.on('amazon.login', function() {
  var requiresCaptcha = this.evaluate(function() {
    return !!document.getElementById('auth-captcha-guess')
  })

  if (requiresCaptcha)
    return casper.emit('amazon.captcha')

  casper.emit('amazon.login.submit')
})

casper.on('amazon.captcha', function() {
  warning('Anti-robot feature has been detected on the login form.')
  warning('Please open this URL in your browser to enter the captcha code:')
  warning('  http://' + config.server.host + ':' + config.server.port + '/human')

  this.captureSelector(config.server.screenshot, '#auth-captcha-image')
})

casper.on('amazon.login.submit', function(guess) {
  var fields = {
    email: config.amazon.username,
    password: config.amazon.password,
    rememberMe: true
  }

  if (guess)
    fields.guess = guess

  this.fill('form[name="signIn"]', fields, true)
})

casper.on('amazon.spa', function() {
  this.open('https://alexa.amazon.com/')
})

casper.start('https://alexa.amazon.com/').run(function() {
  info('Casper is running')
})

// Instantiate the AlexaApi object
var alexa = new AlexaApi(casper, utils)

// REST API server
var app = new Router()

app.get('/', function(req, res, next) {
  res.redirect('/devices')
})

app.get('/devices', function(req, res, next) {
  // Get devices from Alexa and list them to the user
  var devices = alexa.devices()

  /*
  var output = ''

  devices.forEach(function(device, index) {
    output += '\
      <div class="device">\
        <span class="device-name">' + device.accountName + '</span>\
        <span class="device-serial">' + device.serialNumber + '</span>\
        <span class="device-type">' + device.deviceType + '</span>\
      </div>\
    '
  })
  */

  res.send(devices)
})

app.get('/human', function(req, res, next) {
  var output = ''

  output += '<form method="post" action="/human">'
  output += '<div><img src="/captcha.png"></div>'
  output += '<div><input type="text" autocomplete="off" placeholder="Type the characters above" name="guess" autocorrect="off" autocapitalize="off" size="35"></div>'
  output += '<div><input type="submit" value="Submit"></div>'
  output += '</form>'

  res.header('Content-Length', output.length)
  res.header('Content-Type', 'text/html')

  res.send(output)
})

app.post('/human', function(req, res, next) {
  fs.remove(config.server.screenshot)

  casper.emit('amazon.login.submit', req.post.guess)

  res.send('Thanks! You can close this window now.')
})

app.get('/captcha.png', function(req, res, next) {
  var img = config.server.screenshot

  if (!img || !fs.isFile(img) || !fs.isReadable(img))
    return res.send(404)

  var content = fs.read(img, 'b')

  res.header('Content-Length', content.length)
  res.header('Content-Type', 'image/png')
  res.encoding('binary')

  res.send(content)
})

// Feature implementation routes
app.get('/device/([a-z0-9-]+)', function(req, res, next) {
  var params = {deviceId: req.params[0]}
  var device = alexa.device(params.deviceId)

  res.send(device)
})

app.get('/device/([a-z0-9-]+)/status', function(req, res, next) {
  var params = {deviceId: req.params[0]}

  res.send(alexa.player(params.deviceId))
})

app.get('/device/([a-z0-9-]+)/play', function(req, res, next) {
  var params = {deviceId: req.params[0]}

  alexa.play(params.deviceId)
  res.send(alexa.player(params.deviceId))
})

app.get('/device/([a-z0-9-]+)/pause', function(req, res, next) {
  var params = {deviceId: req.params[0]}

  alexa.pause(params.deviceId)
  res.send(alexa.player(params.deviceId))
})

app.get('/device/([a-z0-9-]+)/volume', function(req, res, next) {
  var params = {deviceId: req.params[0]}

  res.send(alexa.volume(params.deviceId))
})

app.get('/device/([a-z0-9-]+)/volume/([0-9]+)', function(req, res, next) {
  var params = {
    deviceId: req.params[0],
    volume: req.params[1]
  }

  alexa.volume(params.deviceId, params.volume)
  res.send(alexa.player(params.deviceId).volume)
})

// Fallback route
app.use(function(req, res) {
  debug(req.method + ' ' + req.url, 'rest-api')

  var result = alexa.request({
    type: req.method,
    url: req.url,
    data: req.post
  })

  if ('contentType' in result)
    res.header('Content-Type', result.contentType)

  if ('responseJSON' in result)
    res.send(result.responseJSON, result.status)
  else
    res.send(result.responseText, result.status)
})

info('Starting webserver at http://' + config.server.host + ':' + config.server.port + '/', 'rest-api')
app.listen(config.server.host + ':' + config.server.port)
