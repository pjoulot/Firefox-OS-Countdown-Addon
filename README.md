# Firefox-OS-Countdown-Addon
An addon for Firefox OS devices (using Gaia) which add a countdown on the homescreen.

For now, this addon works only on smartphones. Compatibilty for others devices like Firefox OS TVs is maybe for the future.

Due to bug 1179536 (Add-ons: Injecting stylesheets doesn't work), all the CSS is added in javascript but normally the manifest authorize to add CSS files. Moreover, this bug is also the cause why images used in CSS rules are stored in the javascript file.
https://bugzilla.mozilla.org/show_bug.cgi?id=1179536
