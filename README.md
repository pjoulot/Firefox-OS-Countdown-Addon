# Firefox-OS-Countdown-Addon
An addon for Firefox OS devices (using Gaia) which add a countdown on the homescreen.

## Branches

### Master
- v1.0: static countdown (For the sci-fi convention T'imagin 2 in Paris)
- v1.1: still static. Support Multilanguage: (english and french). Static full/min display: (Set by default to min now)
- v1.2: Now dynamic! A linked settings page is added in the settings App to configure the countdown.
- v1.3: Correct bug on the countdown calculation and change default settings.
- v1.4: Compatibility with the new homescreen
- v1.5: Disable/Enable, Uninstall support (Clean what the addon has done)

** The dev branch can be not totally stable and sometimes broken. Use it only for tests.  **

### Dev (future evolutions)
- Use localization.js
- Support more languages 
- Remove special case on background and use it in the config object (Just test if the old is the same to avoid repaint)
- Optimize performances

-------------------------------------------------------------------------------------------------------------------
/ ! \ DEVELOPMENT ARE STOPPED FOR A WHILE. It is stable for FirefoxOS 2.5 and 2.6.
The transition branch of BootToGecko will change a lot of API and this addon will be broken during the transition.
That's why I stop development until the transition branch is almost stable again.
But you can use this addon on Firefox 2.5 and 2.6, there is almost no bugs in it.
-------------------------------------------------------------------------------------------------------------------

##Informations

For now, this addon works only on smartphones. Compatibilty for others devices like Firefox OS TVs is maybe for the future.

Due to bug 1179536 (Add-ons: Injecting stylesheets doesn't work), all the CSS is added in javascript but normally the manifest authorize to add CSS files. Moreover, this bug is also the cause why images used in CSS rules are stored in the javascript file.
https://bugzilla.mozilla.org/show_bug.cgi?id=1179536
