# ekill

It's like [**xkill**](https://en.wikipedia.org/wiki/Xkill), but for annoying web pages instead.

Chrome and Firefox plugin for quickly getting rid of elements on a web page.

## Installation

- [Chrome web store](https://chrome.google.com/webstore/detail/ekill/lcgdpfaiipaelnpepigdafiogebaeedg?hl=en)
- [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/ekill/)

![Example](https://raw.githubusercontent.com/rhardih/ekill/master/example.gif)

## Keyboard shortcut

By default **ekill** is toggled with *ctrl+k*, but this can be modified at will.

Go to [chrome://extensions/shortcuts](chrome://extensions/shortcuts), find the item labeled "ekill" and set it to whatever is most convenient.


## Options

### Grudge (Experimental)

Turning this feature on, will let ekill hold a grudge against offending
elements.

By keeping a record of killed of elements on a per page basis, ekill will try
it's best to remove these elements on subsequent visits to the same page.

A rudimentary ui for toggling *Grudge*, as well as  listing and editing the hit
list, is included in the options page.

## License

MIT: http://rhardih.mit-license.org

## Changelog

**1.7**

- Adds a kill count badge to the extension icon.

**1.6**

- Adds the Grudge feature
- Adds options page to control Grudge
- Adds changelog notifications on version upgrades

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
