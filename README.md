# Firefox-OS-Countdown-Addon
An addon for Firefox OS devices (using Gaia) which add a countdown on the homescreen.

## Branches

### Master
v1.0: static countdown (For the sci-fi convention T'imagin 2 in Paris)

### Dev (future evolutions)
- Change the display of the time decreasing
- Parameter the countdown: event name, date, image
- Support Multilanguage

##Informations

For now, this addon works only on smartphones. Compatibilty for others devices like Firefox OS TVs is maybe for the future.

Due to bug 1179536 (Add-ons: Injecting stylesheets doesn't work), all the CSS is added in javascript but normally the manifest authorize to add CSS files. Moreover, this bug is also the cause why images used in CSS rules are stored in the javascript file.
https://bugzilla.mozilla.org/show_bug.cgi?id=1179536

**Note:** The zip file to install the addon will be added for the v1.0 but you already can install it using WebIDE
