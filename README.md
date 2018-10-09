ekill
=============

It's like [**xkill**](https://en.wikipedia.org/wiki/Xkill), but for annoying web pages instead.

Chrome and Firefox plugin for quickly getting rid of elements on a web page.

## Installation

- [Chrome web store](https://chrome.google.com/webstore/detail/ekill/lcgdpfaiipaelnpepigdafiogebaeedg?hl=en)
- [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/ekill/)

![Example](https://raw.githubusercontent.com/rhardih/ekill/master/example.gif)

## options
- You can make ekill remember your removed elemts by right clicking on the icon and going to 'options'
- Here you can also reset the pages default settings

## Keyboard shortcut

By default **ekill** is toggled with *ctrl+k*, but this can be modified at will.

Go to [chrome://extensions/shortcuts](chrome://extensions/shortcuts), find the item labeled "ekill" and set it to whatever is most convenient.

# License

MIT: http://rhardih.mit-license.org

# Changelog

**1.6**

- Added an options page 
- made it possible to store elements a user has removed
- added permission to access chrome.storage
- fixed a few issues with the options page not displaying urls nicely
- made the code smaller
- fixed issue with ekill breaking pages like youtube or facebook
- moved from replacing the whole HTML document to the built in remove()
- added checking for delayed items
- changed autoremove-script to work on the entire website instead of just sub-routes
- started using bootstrap to style elements in options page
- made some design pages to the options page to make it work better on firefox
- fixed sync issues with firefox

**1.5**

- Adds light icons for Firefox dark theme.

**1.4**

- Adds support for Firefox

**1.1 - 1.3**

- Introduces ability to toggle on/off, as well as dismiss with Esc key
- Permissions narrowed to *activeTab* only
- Targets anything with *role=button*

**1.0**

- Initial version
