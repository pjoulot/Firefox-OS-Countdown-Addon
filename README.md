# Firefox-OS-Countdown-Addon
An addon for Firefox OS devices (using Gaia) which add a countdown on the homescreen.

## Branches

### Master
- v1.0: static countdown (For the sci-fi convention T'imagin 2 in Paris)
- v1.1: still static. Support Multilanguage: (english and french). Static full/min display: (Set by default to min now)

### Dev (future evolutions)
- Change the display of the time decreasing (Done, just need to create a parameter to let user choose ) [Marketplace]
- Parameter the countdown: event name, date, image [Marketplace]
- Support more languages [Marketplace]
- Make the addon working on the new homescreen. For now, it's working only with the old. [Marketplace]
- Optimize performances

The tag [Marketplace] means that the evolution is required to put the addon on the Firefox marketplace.

##Informations

For now, this addon works only on smartphones. Compatibilty for others devices like Firefox OS TVs is maybe for the future.

Due to bug 1179536 (Add-ons: Injecting stylesheets doesn't work), all the CSS is added in javascript but normally the manifest authorize to add CSS files. Moreover, this bug is also the cause why images used in CSS rules are stored in the javascript file.
https://bugzilla.mozilla.org/show_bug.cgi?id=1179536
