# Alexa API Server
A local server to proxy API commands to Amazon Alexa

## Important

This package was written strictly for educational purposes. The package is not
affiliated with or approved by Amazon.com, Inc. or any of its affiliates.

Please do not use this package in a production environment. It will change
drastically in the future, including the current endpoints that are exposed
via the server.

## Dependencies

* [PhantomJS] (tested with PhantomJS v2.1 on macOS Sierra)
* [CasperJS] (tested with CasperJS v1.1.4 on macOS Sierra)

Or if using NodeJS

* [NodeJS](https://nodejs.org/)

## Installation not using NodeJS

1. Clone this repository to your computer
1. Download and install [PhantomJS]
1. Download and install [CasperJS]
1. Browse to the cloned repository on your computer
1. Copy/rename `config.sample.json` to `config.json`
1. Open `config.json` and set enter your Amazon username and password
1. From the repo directory, run: `$ casperjs --cookies-file=cookies.txt alexa.js`
1. Open your browser and navigate to <http://127.0.0.1:2539/> to see the JSON
   dump of your Alexa devices

## Installation using NodeJS

1. Clone this repository to your computer
1. Browse to the cloned repository on your computer
1. Copy/rename `config.sample.json` to `config.json`
1. Open `config.json` and set enter your Amazon username and password
1. From the repo directory, run: `npm install` and then `npm run server`
1. Open your browser and navigate to <http://127.0.0.1:2539/> to see the JSON
   dump of your Alexa devices


## Donations

If you find yourself enjoying this package, please consider making a small
donation of $7 to help support the developer.

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QMN7ED7745TQJ">
  <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" width="147" height="47" alt="Donate with PayPal" border="0">
</a>

## Endpoints

*The API endpoints are not yet documented. Please see the code in `alexa.js`
for a list of available endpoints.*

## Feature Requests

Please create a new [issue](https://github.com/dale3h/alexa-api/issues) for any
features that you would like to request.

## Bugs and Issues

Please report any bugs or issues to the [Issues](https://github.com/dale3h/alexa-api/issues) page.

## Notice

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[PhantomJS]: http://phantomjs.org/
[CasperJS]: http://casperjs.org/
