const WIDTH_COUNTDOWN = 90; // in %
const HEIGHT_COUNTDOWN = 175; // in px

// If injecting into an app that was already running at the time
// the app was enabled, simply initialize it.
if (document.documentElement) {
  initialize();
}

// Otherwise, we need to wait for the DOM to be ready before
// starting initialization since add-ons are injected
// *before* `document.documentElement` is defined.
else {
  window.addEventListener('DOMContentLoaded', initialize);
}

function initialize() {
  var user_language = select_language(window.navigator.language);
  var countdownConfiguration = {
    name: "Firefox OS",
    date: "2016-03-12",
    time: "00:00:00",
    display: false,
    language: user_language
  };
  
  //Overwrite default configuration with user config
  var lock    = navigator.mozSettings.createLock();
  var setting = lock.get('countdown.name');
  setting.onsuccess = function () {
    countdownConfiguration.name = setting.result['countdown.name'];
  };
  var setting2 = lock.get('countdown.display');
  setting2.onsuccess = function () {
    countdownConfiguration.display = setting2.result['countdown.display'];
  };
  var setting3 = lock.get('countdown.time');
  setting3.onsuccess = function () {
    console.log(setting3.result['countdown.time']);
    countdownConfiguration.time = setting3.result['countdown.time'];
  };
  var setting4 = lock.get('countdown.date');
  setting4.onsuccess = function () {
    console.log(setting4.result['countdown.date']);
    countdownConfiguration.date = setting4.result['countdown.date'];
  };
  var setting5 = lock.get('countdown.time');
  setting5.onsuccess = function () {
    console.log(setting5.result['countdown.time']);
    countdownConfiguration.time = setting5.result['countdown.time'];
  };
  //The background is not done the same way because we do not want to apply the CSS property everytime
  
  countdown_homescreen(countdownConfiguration);
  countdown_settings(countdownConfiguration);
  
  navigator.mozSettings.addObserver('countdown.name', handleCountdownNameChanged);
  function handleCountdownNameChanged(event) {
    countdownConfiguration.name = event.settingValue
  }

  //Add listeners to the settings to make changes when user modify
  navigator.mozSettings.addObserver('countdown.display', handleCountdownDisplayChanged);
  function handleCountdownDisplayChanged(event) {
    countdownConfiguration.display = event.settingValue
  }
  
  navigator.mozSettings.addObserver('countdown.date', handleCountdownDateChanged);
  function handleCountdownDateChanged(event) {
    countdownConfiguration.date = event.settingValue
  }
  
  navigator.mozSettings.addObserver('countdown.time', handleCountdownTimeChanged);
  function handleCountdownTimeChanged(event) {
    countdownConfiguration.time = event.settingValue
  }
  
  navigator.mozSettings.addObserver('countdown.background', handleCountdownBackgroundChanged);
  function handleCountdownBackgroundChanged(event) {
    var bannerImage = document.getElementById('banner-countdown');
    var blobUrl = URL.createObjectURL(event.settingValue);
    bannerImage.style.backgroundImage = "url('"+blobUrl+"')";
  }
}

/*
** Function to add the countdown on the homescreen
*/
function countdown_homescreen(config) {
  var url = get_app_url_without_tag();
  if(url == "app://verticalhome.gaiamobile.org/index.html") {
    if (document.querySelector('.addon-countdown')) {
      // Already injected, abort.
      return;
    } else {

      var user_language = select_language(window.navigator.language);
      var imageBackgroundBase64 = get_image_base64();

      var body = document.getElementById('icons');
      var coundownAddonContainer = document.createElement('div');
      coundownAddonContainer.classList.add('addon-countdown');
      var margeSize = (100 - WIDTH_COUNTDOWN) / 2;
      coundownAddonContainer.setAttribute('style', 'font-size: 14px; font-weight: bold; background-color: rgba(0,0,0,0.7); position: relative; width: '+WIDTH_COUNTDOWN+'%; height: '+HEIGHT_COUNTDOWN+'px; margin-left: '+margeSize+'%; margin-right: '+margeSize+'%; border: 1px solid black; color: white;');
      var bannerPicture = document.createElement('div');
      //bannerPicture.src="css/timagin.jpg";
      bannerPicture.id="banner-countdown";
      bannerPicture.setAttribute('style', 'background-image: '+imageBackgroundBase64+'; background-repeat: no-repeat; background-size: cover; min-height: 100px; width: 100%; border-bottom: 1px solid black;');
      var countdownText = document.createElement('div');
      countdownText.id="addon-countdown";
      var closeBtn = document.createElement('button');

      countdownText.setAttribute('style', 'float: left; padding-top: 0.5em; width: 75%; line-height: 16px; left: 1em; margin: 0; margin-left: 5%;');
      closeBtn.setAttribute('style', 'width: 20%; padding-top: 0.5em; font-size: 18px; line-height: 2em; right: 0.33em; border: none; background: none; display: block; color: white;');

      coundownAddonContainer.appendChild(bannerPicture);
      coundownAddonContainer.appendChild(countdownText);
      coundownAddonContainer.appendChild(closeBtn);
      body.insertBefore(coundownAddonContainer, body.firstChild);

      apply_countdown_image();
      compte_a_rebours(config);

      closeBtn.textContent = 'X';

      closeBtn.onclick = function() {
        coundownAddonContainer.parentNode.removeChild(coundownAddonContainer);
      }
    }
  }
}

/*
** Function to add the settings page into the Settings App
*/
function countdown_settings(config) {
  var url = get_app_url_without_tag();
  if(url == "app://settings.gaiamobile.org/index.html") {
    if (document.querySelector('.countdown-addon-settings')) {
      // Already injected, abort.
      return;
    } else {
      var insertPlace = document.querySelector('header h2[data-l10n-id="personalization"]');
      insertPlace = insertPlace.parentNode.nextElementSibling;
      if(insertPlace.nodeName.toLowerCase() == "ul") {
        var wordsSettings = get_all_countdown_words()[config.language]['settings'];
        
        //Create the page for the countdown settings
        var countdownSettingsPage = document.createElement('section');
        countdownSettingsPage.setAttribute('id', 'countdown-addon');
        countdownSettingsPage.setAttribute('role', 'region');
        countdownSettingsPage.setAttribute('data-rendered', 'true');
        
        var countdownSettingsPageString = '<gaia-header action="back" data-href="#root">';
        countdownSettingsPageString += '<h1>'+wordsSettings[0]+'</h1>';
        countdownSettingsPageString += '</gaia-header>';

        countdownSettingsPageString += '<div>';
        countdownSettingsPageString += '<section data-type="list">';
        countdownSettingsPageString += '<header>';
        countdownSettingsPageString += '<h2>'+wordsSettings[1]+'</h2>';
        countdownSettingsPageString += '</header>';
        countdownSettingsPageString += '<div class="wallpaper" style="height:9rem;">';
        countdownSettingsPageString += '<img class="countdown-wallpaper" alt="wallpaper preview" style="position: absolute; width: 100%;" />';
        countdownSettingsPageString += '<button class="wallpaper-button countdown-background-button">';
        countdownSettingsPageString += '<span data-icon="change-wallpaper" data-l10n-id="changeWallpaperButton"></span>';
        countdownSettingsPageString += '</button>';
        countdownSettingsPageString += '</div>';
        
        //@todo Search why the countdown.name input is automatically saved into the Settings
        countdownSettingsPageString += '<header>';
        countdownSettingsPageString += '<h2>'+wordsSettings[2]+'</h2>';
        countdownSettingsPageString += '</header>';
        countdownSettingsPageString += '<ul>';
        countdownSettingsPageString += '<li>';
        countdownSettingsPageString += '<p>'+wordsSettings[2]+'</p>';
        countdownSettingsPageString += '<div class="button icon icon-dialog">';
        countdownSettingsPageString += '<input type="text" name="countdown.name" />';
        countdownSettingsPageString += '</div>';
        countdownSettingsPageString += '</li>';
        countdownSettingsPageString += '</ul>';
        
        countdownSettingsPageString += '<header>';
        countdownSettingsPageString += '<h2 data-l10n-id="dateMessage"></h2>';
        countdownSettingsPageString += '</header>';
        countdownSettingsPageString += '<ul class="time-manual">';
        countdownSettingsPageString += '<li>';
        countdownSettingsPageString += '<p data-l10n-id="dateMessage"></p>';
        countdownSettingsPageString += '<input class="countdown-date-input date-picker" type="date" name="countdown.date" value="" min="1970-1-1" max="2035-12-31"/>';
        countdownSettingsPageString += '</li>';
        countdownSettingsPageString += '<li>';
        countdownSettingsPageString += '<p data-l10n-id="timeMessage"></p>';
        countdownSettingsPageString += '<input type="time" name="countdown.time" class="countdown-time-input time-picker"/>';
        countdownSettingsPageString += '</li>';
        countdownSettingsPageString += '</ul>';

        //@todo Search why the countdown.display input is automatically saved into the Settings
        countdownSettingsPageString += '<header>';
        countdownSettingsPageString += '<h2>'+wordsSettings[3]+'</h2>';
        countdownSettingsPageString += '</header>';
        countdownSettingsPageString += '<ul>';
        countdownSettingsPageString += '<li>';
        countdownSettingsPageString += '<p>'+wordsSettings[3]+'</p>';
        countdownSettingsPageString += '<div class="button icon icon-dialog">';
        countdownSettingsPageString += '<select class="countdown-display-input" name="countdown.display">';
        countdownSettingsPageString += '<option value="full">'+wordsSettings[4]+'</option>';
        countdownSettingsPageString += '<option value="min">'+wordsSettings[5]+'</option>';
        countdownSettingsPageString += '</select>';
        countdownSettingsPageString += '</div>';
        countdownSettingsPageString += '</li>';
        countdownSettingsPageString += '</ul>';

        countdownSettingsPageString += '</section>';
        countdownSettingsPageString += '</div>';

        countdownSettingsPage.innerHTML = countdownSettingsPageString;
        
        var body = document.querySelector('body');
        body.appendChild(countdownSettingsPage);
        
        var inputCountdownDate = document.querySelector('.countdown-date-input');
        get_input_mozSettings('countdown.date');
        inputCountdownDate.addEventListener("input", function(){
          set_onchange_input_mozSettings(this);
        }, false);
        
        var inputCountdownTime = document.querySelector('.countdown-time-input');
        get_input_mozSettings('countdown.time');
        inputCountdownTime.addEventListener("input", function(){
          set_onchange_input_mozSettings(this);
        }, false);
        
        var buttonCountdownBackground = document.querySelector('.countdown-background-button');
        get_input_mozSettings('countdown.background');
        buttonCountdownBackground.addEventListener("click", function(){
          select_countdown_background();
        }, false);
        
        //Create the link into the root page of the settings app
        var countdownSettingsElement = document.createElement('li');
        countdownSettingsElement.classList.add('countdown-addon-settings');
        var countdownSettingsElementLink = document.createElement('a');
        countdownSettingsElementLink.classList.add('menu-item');
        countdownSettingsElementLink.setAttribute('aria-label', wordsSettings[0]);
        countdownSettingsElementLink.setAttribute('aria-describedby', 'countdown-addon-desc');
        countdownSettingsElementLink.setAttribute('href', '#countdown-addon');
        countdownSettingsElementLink.setAttribute('data-icon', '⌛');
        
        var countdownSettingsElementSpan = document.createElement('span');
        countdownSettingsElementSpan.appendChild(document.createTextNode(wordsSettings[0]));
        var countdownSettingsElementSmall = document.createElement('small');
        countdownSettingsElementSmall.setAttribute('id', 'countdown-addon-desc');
        countdownSettingsElementSmall.classList.add('menu-item-desc');
        countdownSettingsElementLink.appendChild(countdownSettingsElementSpan);
        countdownSettingsElementLink.appendChild(countdownSettingsElementSmall);
        
        countdownSettingsElement.appendChild(countdownSettingsElementLink);
        insertPlace.appendChild(countdownSettingsElement);
        
      }
    }
  }
}

/*
** Function to select an image in the settings page for the countdown background
*/
function select_countdown_background() {
  var widthCountdown = (window.screen.width) * (WIDTH_COUNTDOWN / 100); 
  var heightCountdown = HEIGHT_COUNTDOWN; 
  var mozActivity = new MozActivity({
    name: 'pick',
    data: {
      type: ['image/*'],
      // XXX: This will not work with Desktop Fx / Simulator.
      width: Math.ceil(widthCountdown * window.devicePixelRatio),
      height: Math.ceil(heightCountdown)
    }
  });
  mozActivity.onsuccess = function() {
    if (!this.result.blob) {
      return;
    }
    var obj = {};
    obj['countdown.background'] = this.result.blob;
    var lock = navigator.mozSettings.createLock();
    var result = lock.set(obj);
    result.onsuccess = function () {
      console.log("the settings has been changed");
    }
    var backgroundCountdownImage = document.querySelector('.countdown-wallpaper');
    var blobUrl = URL.createObjectURL(this.result.blob);
    backgroundCountdownImage.setAttribute('src', blobUrl);
  };

  mozActivity.onerror = function() {
    console.log("The pick mozActivity has failed");
  }
}

/*
** Function to set setting variables when the date and the time input change
*/
function set_onchange_input_mozSettings(input) {
  var name = input.getAttribute("name");
  var obj = {};
  obj[name] = input.value;
  var lock = navigator.mozSettings.createLock();
  var result = lock.set(obj);
  result.onsuccess = function () {
    console.log("the settings has been changed");
  }
  result.onerror = function () {
    console.log("An error occure, the settings remain unchanged");
  }
}

/*
** Function to get a saved setting value and set the field in the settings app
*/
function get_input_mozSettings(name) {
  var lock    = navigator.mozSettings.createLock();
  var setting = lock.get(name);
  setting.onsuccess = function () {
    if(name == "countdown.background") {
      var backgroundCountdownImage = document.querySelector('.countdown-wallpaper');
      var blobUrl = URL.createObjectURL(this.result[name]);
      backgroundCountdownImage.setAttribute('src', blobUrl);
    }
    else {
      var inputElement = document.querySelector('*[name="'+name+'"]');
      inputElement.setAttribute('value', setting.result[name]);
    }
  }

  setting.onerror = function () {
    console.warn('An error occured: ' + setting.error);
  }
}

/*
** Function to update the configuration to automatically apply the new conf in case the user has made changes
*/
function update_countdown_configuration(config) {
  var user_language = select_language(window.navigator.language);
  config.language = user_language;
}

/*
** Return the proper vocabulary which depends on the addon configuration (display mode and user language)
*/
function get_vocabulary_language(display, language) {
  var all_words = get_all_countdown_words()[language];
  if(display == 'full') {
	  all_words = all_words['full'];
  }
  else {
	  all_words = all_words['min'];
  }
  return all_words;
}

/*
** Main function which create the countdown using setInterval
*/
function compte_a_rebours(config) {
  var all_words;
  var nIntervId = setInterval(function() {
    update_countdown_configuration(config);
    all_words = get_vocabulary_language(config.display, config.language);
    var dateCountdown = create_date_from_string_date_time(config.date, config.time);
    compte_a_rebours_task(config.name, config.date, all_words);
  }, 1000);
}

/*
** Function to return a Dtae object with the string date and the string time
*/
function create_date_from_string_date_time(date, time) {
  var completeDate = date+"T"+time+":00";
  return(new Date(completeDate));
}

/*
** The task which update the countdown
*/
function compte_a_rebours_task(nom_evenement, date_fin, all_words)
{
	var compte_a_rebours = document.getElementById("addon-countdown");
	var compte_a_rebours_p = document.querySelector("#addon-countdown p");
	if(compte_a_rebours_p !== null) {
	  compte_a_rebours_p.parentNode.removeChild(compte_a_rebours_p);
	}
	var compte_a_rebours_p = document.createElement('p');

	var date_actuelle = new Date();
	var date_evenement = new Date(date_fin);
	var total_secondes = (date_evenement - date_actuelle) / 1000;
  
	var prefixe = nom_evenement+all_words[5];
	if (total_secondes < 0)
	{
		prefixe = "Compte à rebours terminé il y a "; // On modifie le préfixe si la différence est négatif

		total_secondes = Math.abs(total_secondes); // On ne garde que la valeur absolue

	}

	if (total_secondes > 0)
	{
		var jours = Math.floor(total_secondes / (60 * 60 * 24));
		var heures = Math.floor((total_secondes - (jours * 60 * 60 * 24)) / (60 * 60));
		minutes = Math.floor((total_secondes - ((jours * 60 * 60 * 24 + heures * 60 * 60))) / 60);
		secondes = Math.floor(total_secondes - ((jours * 60 * 60 * 24 + heures * 60 * 60 + minutes * 60)));

		compte_a_rebours_p.appendChild(document.createTextNode(prefixe + jours + ' ' + all_words[0] + ' ' + heures + ' ' + all_words[1] + ' ' + minutes + ' ' + all_words[2] + ' ' + all_words[4] + ' ' + secondes + ' ' + all_words[3]));
		
	}
	else
	{
		compte_a_rebours_p.appendChild(document.createTextNode(nom_evenement+all_words[6]));
	}
  compte_a_rebours.appendChild(compte_a_rebours_p);
}

/*
** Define all words used into the app for all supported languages
*/
function get_all_countdown_words() {
  return ({
    'en' : {
      'min' : ["d", "h", "m", "s", "", " in ", "Finished"],
      'full': ["days", "hours", "minutes", "seconds", "and", " in ", " has already begun!"],
      'settings': ['Countdown', 'Background image', 'Event name', 'Display mode', 'Full words', 'Abbreviations']
    },
    'fr' : {
      'min' : ["j", "h", "m", "s", "", " dans ", "Terminé"],
      'full': ["jours", "heures", "minutes", "secondes", "et", " dans ", " a déjà commencé!"],
      'settings': ['Compte à rebours', 'Image de fond', 'Nom de l\'événement', 'Mode d\'affichage', 'Mots complets', 'Abréviations']
    },
  });
}

/*
** Convert standard language code (User language of the device) into a language avaiable in the addon 
*/
function select_language(language_code) {
  var lang = 'en';
  if(language_code == 'fr' || language_code.indexOf('fr-') > -1) {
    lang = 'fr';
  }
  return lang;
}

function apply_countdown_image() {
  var lock = navigator.mozSettings.createLock();
  var setting = lock.get('countdown.background');
  setting.onsuccess = function () {
    var bannerImage = document.getElementById('banner-countdown');
    var blobUrl = URL.createObjectURL(setting.result['countdown.background']);
    bannerImage.style.backgroundImage = "url('"+blobUrl+"')";
  };
}

/*
** Function to get the default image of the addon
** Use an image file and CSS to do this when bug 1179536 is resolved
*/
function get_image_base64() {
  return ('url(\'data:image/jpeg;base64,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\')');
}

function get_app_url_without_tag() {
  var url = window.location.href;
  var returnUrl = "";
  if(url.indexOf('#') > -1) {
    //Remove hash
    var arrayUrl = url.split("#");
    var index;
    for (index = 0; index < arrayUrl.length-1; ++index) {
        returnUrl += arrayUrl[index];
    }
  }
  else {
    returnUrl = url;
  }
  return returnUrl;
}
