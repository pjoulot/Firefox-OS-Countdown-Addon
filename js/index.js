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
  if (document.querySelector('.countdown-addon-injected')) {
      // Already injected, abort.
      return;
  }
  else {
    
    var user_language = select_language(window.navigator.language);
    var countdownConfiguration = {
      name: "Firefox OS",
      date: "2016-03-12",
      time: "00:00:00",
      display: false,
      language: user_language
    };
    
    set_user_countdown_settings(countdownConfiguration);

    //The background is not done the same way because we do not want to apply the CSS property everytime

    countdown_homescreen(countdownConfiguration);
    countdown_settings(countdownConfiguration);
    
    listen_configuration_changes(countdownConfiguration);
    navigator.mozApps.mgmt.addEventListener('enabledstatechange', onEnabledStateChange);
    navigator.mozApps.mgmt.addEventListener('uninstall', onUninstall);
  }
}

function listen_configuration_changes(countdownConfiguration) {
  if(!is_new_configuration_way()) {
    //Add listeners to the settings to make changes when user modify
    navigator.mozSettings.addObserver('countdown.name', handleCountdownNameChanged);
    function handleCountdownNameChanged(event) {
      countdownConfiguration.name = event.settingValue;
    }

    navigator.mozSettings.addObserver('countdown.display', handleCountdownDisplayChanged);
    function handleCountdownDisplayChanged(event) {
      countdownConfiguration.display = event.settingValue;
    }

    navigator.mozSettings.addObserver('countdown.date', handleCountdownDateChanged);
    function handleCountdownDateChanged(event) {
      countdownConfiguration.date = event.settingValue;
    }

    navigator.mozSettings.addObserver('countdown.time', handleCountdownTimeChanged);
    function handleCountdownTimeChanged(event) {
      countdownConfiguration.time = event.settingValue;
    }

    navigator.mozSettings.addObserver('countdown.background', handleCountdownBackgroundChanged);
    function handleCountdownBackgroundChanged(event) {
      var bannerImage = document.getElementById('banner-countdown');
      var blobUrl = URL.createObjectURL(event.settingValue);
      bannerImage.style.backgroundImage = "url('"+blobUrl+"')";
    }
  }
  else {
    navigator.getDataStores('homescreen_settings').then(function(stores) {
      stores[0].onchange = function(e) {
        if (e.operation == 'updated') {
          stores[0].get(e.id).then(function(obj) {
            switch (e.id) {
              case "countdown.name":
                countdownConfiguration.name = obj;
                break;
              case "countdown.display":
                countdownConfiguration.display = obj;
                break;
              case "countdown.date":
                countdownConfiguration.date = obj;
                break;
              case "countdown.time":
                countdownConfiguration.time = obj;
                break;
              case "countdown.background":
                var bannerImage = document.getElementById('banner-countdown');
                var blobUrl = URL.createObjectURL(obj);
                bannerImage.style.backgroundImage = "url('"+blobUrl+"')";
                break;
            }
          });
        }
      }
    });
  }
  
  //Listen for the settings app if the language has changed
  var url = get_app_url_without_tag();
  if(url == "app://settings.gaiamobile.org/index.html") {
    window.onlanguagechange = function(ev) {
      //Relaunch the whole process (remove and set again)
      var user_language = select_language(window.navigator.language);
      countdownConfiguration.language = user_language;
      uninitialize();
      countdown_settings(countdownConfiguration);
    };
  }
}

/*
** Function to initialize the configuration object with the settings defined by the user
*/
function set_user_countdown_settings(configObject) {
    if(!is_new_configuration_way()) {
      // OLD HOMESCREEN
      var lock    = navigator.mozSettings.createLock();
      var setting = lock.get('countdown.name');
      setting.onsuccess = function () {
        configObject.name = setting.result['countdown.name'];
      };
      var setting2 = lock.get('countdown.display');
      setting2.onsuccess = function () {
        configObject.display = setting2.result['countdown.display'];
      };
      var setting3 = lock.get('countdown.time');
      setting3.onsuccess = function () {
        console.log(setting3.result['countdown.time']);
        configObject.time = setting3.result['countdown.time'];
      };
      var setting4 = lock.get('countdown.date');
      setting4.onsuccess = function () {
        console.log(setting4.result['countdown.date']);
        configObject.date = setting4.result['countdown.date'];
      };
    }
    else {
      //NEW HOMESCREEN
      navigator.getDataStores('homescreen_settings').then(function(stores) {
        stores[0].get('countdown.name').then(function(obj) {
          configObject.name = obj;
        });
        stores[0].get('countdown.display').then(function(obj) {
          configObject.display = obj;
        });
        stores[0].get('countdown.time').then(function(obj) {
          configObject.time = obj;
        });
        stores[0].get('countdown.date').then(function(obj) {
          configObject.date = obj;
        });
      });
    }
}

/*
** Function to know if the homescreen used by the user use the old way or the new way for configuration
** @return int (true for the new way and false for the old)
*/
function is_new_configuration_way() {
  var value = true;
  var url = get_app_url_without_tag();
  if(url == "app://verticalhome.gaiamobile.org/index.html") {
    value = false;
  }
  return value;
}

/*
** Function to get the selector to insert the countdown on the homescreen
*/
function get_selector_countdown_homescreen() {
  var url = get_app_url_without_tag();
  var selector = '#apps-panel .scrollable';
  if(url == "app://verticalhome.gaiamobile.org/index.html") {
    selector = '#icons';
  }
  if(url == "app://homescreen.gaiamobile.org/index.html") {
    selector = '#apps-panel .scrollable';
  }
  return selector;
}

/*
** Function to add the countdown on the homescreen
*/
function countdown_homescreen(config) {
  var url = get_app_url_without_tag();
  if(url == "app://verticalhome.gaiamobile.org/index.html" || url == "app://homescreen.gaiamobile.org/index.html") {
    var user_language = select_language(window.navigator.language);
    var imageBackgroundBase64 = get_image_base64();
    
    var selector = get_selector_countdown_homescreen();
    var body = document.querySelector(selector);
    var coundownAddonContainer = document.createElement('div');
    coundownAddonContainer.classList.add('addon-countdown');
    coundownAddonContainer.classList.add('countdown-addon-injected');
    var margeSize = (100 - WIDTH_COUNTDOWN) / 2;
    coundownAddonContainer.setAttribute('style', 'font-size: 14px; font-weight: bold; background-color: rgba(0,0,0,0.7); position: relative; z-index: 100; width: '+WIDTH_COUNTDOWN+'%; height: '+HEIGHT_COUNTDOWN+'px; margin-left: '+margeSize+'%; margin-right: '+margeSize+'%; border: 1px solid black; color: white;');
    var bannerPicture = document.createElement('div');
    //bannerPicture.src="css/timagin.jpg";
    bannerPicture.id="banner-countdown";
    bannerPicture.setAttribute('style', 'background-image: '+imageBackgroundBase64+'; background-repeat: no-repeat; background-size: cover; min-height: 100px; width: 100%; border-bottom: 1px solid black;');
    var countdownText = document.createElement('div');
    countdownText.id="addon-countdown";
    var closeBtn = document.createElement('button');

    countdownText.setAttribute('style', 'float: left; padding-top: 0.5em; width: 75%; height: 65px; line-height: 16px; left: 1em; margin: 0; margin-left: 5%;');
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

/*
** Function to add the settings page into the Settings App
*/
function countdown_settings(config) {
  var url = get_app_url_without_tag();
  if(url == "app://settings.gaiamobile.org/index.html") {
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

      countdownSettingsPageString += '<div class="countdown-addon-injected">';
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
      countdownSettingsPageString += '<input class="countdown-name-input" type="text" name="countdown.name" />';
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
      
      var inputCountdownName = document.querySelector('.countdown-name-input');
      get_input_mozSettings('countdown.name');
      inputCountdownName.addEventListener("input", function(){
        set_onchange_input_mozSettings(this);
      }, false);

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
      
      var selectCountdownDisplay = document.querySelector('.countdown-display-input');
      get_input_mozSettings('countdown.display');
      selectCountdownDisplay.addEventListener("change", function(){
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

/*
** Function to select an image in the settings page for the countdown background
*/
function select_countdown_background() {
  var widthCountdown = (window.screen.width) * (WIDTH_COUNTDOWN / 100); 
  var heightCountdown = HEIGHT_COUNTDOWN - 75;
  var mozActivity = new MozActivity({
    name: 'pick',
    data: {
      type: ['image/*'],
      // XXX: This will not work with Desktop Fx / Simulator.
      width: Math.ceil(widthCountdown * window.devicePixelRatio),
      height: Math.ceil(heightCountdown * window.devicePixelRatio)
    }
  });
  mozActivity.onsuccess = function() {
    if (!this.result.blob) {
      return;
    }
    var blobUrl;
    if(!is_new_configuration_way()) {
      var obj = {};
      obj['countdown.background'] = this.result.blob;
      var lock = navigator.mozSettings.createLock();
      var result = lock.set(obj);
      result.onsuccess = function () {
        console.log("the settings has been changed");
      }
      var backgroundCountdownImage = document.querySelector('.countdown-wallpaper');
      blobUrl = URL.createObjectURL(this.result.blob);
      backgroundCountdownImage.setAttribute('src', blobUrl);
    }
    else {
      var blobResult = this.result.blob;
      navigator.getDataStores('homescreen_settings').then(function(stores) {
        stores[0].put(blobResult,'countdown.background').then(function(id) {
          var backgroundCountdownImage = document.querySelector('.countdown-wallpaper');
          blobUrl = URL.createObjectURL(blobResult);
          backgroundCountdownImage.setAttribute('src', blobUrl);
        });
      });
    }
  };

  mozActivity.onerror = function() {
    console.log("The pick mozActivity has failed");
  }
}

/*
** Function to set setting variables when the date and the time input change
*/
function set_onchange_input_mozSettings(tag) {
  var name = tag.getAttribute("name");
  var elementValue = '';
  if(tag.tagName.toLowerCase() === 'select') {
    elementValue = tag.options[tag.selectedIndex].value;
  }
  else {
    elementValue = tag.value;
  }
  //For homescreens using the old way
  if(!is_new_configuration_way()) {
    var obj = {};
    obj[name] = elementValue;
    var lock = navigator.mozSettings.createLock();
    var result = lock.set(obj);
    result.onsuccess = function () {
      console.log("the settings has been changed");
    }
    result.onerror = function () {
      console.log("An error occure, the settings remain unchanged");
    }
  }
  //For homescreens using the new way
  else {
    navigator.getDataStores('homescreen_settings').then(function(stores) {
      stores[0].put(elementValue, name).then(function(id) {
      // object successfully updated
      });
    });
  }
}

/*
** Function to get a saved setting value and set the field in the settings app
*/
function get_input_mozSettings(name) {
  //For homescreens using the old way
  if(!is_new_configuration_way()) {
    var lock    = navigator.mozSettings.createLock();
    var setting = lock.get(name);
    setting.onsuccess = function () {
      if(name == "countdown.background") {
        var backgroundCountdownImage = document.querySelector('.countdown-wallpaper');
        var blobUrl = URL.createObjectURL(this.result[name]);
        backgroundCountdownImage.setAttribute('src', blobUrl);
      }
      else if (name == "countdown.display") {
        var selectElement = document.querySelector('*[name="'+name+'"]');
        selectElement.querySelector('option[value="'+this.result[name]+'"]').setAttribute('selected', 'selected');
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
  //For homescreens using the new way
  else {
    navigator.getDataStores('homescreen_settings').then(function(stores) {
      stores[0].get(name).then(function(obj) {
        if(name == "countdown.background") {
          var backgroundCountdownImage = document.querySelector('.countdown-wallpaper');
          var blobUrl = URL.createObjectURL(obj);
          backgroundCountdownImage.setAttribute('src', blobUrl);
        }
        else if (name == "countdown.display") {
          var selectElement = document.querySelector('*[name="'+name+'"]');
          selectElement.querySelector('option[value="'+obj+'"]').setAttribute('selected', 'selected');
        }
        else {
          var inputElement = document.querySelector('*[name="'+name+'"]');
          inputElement.setAttribute('value', obj);
        }
      });
    });
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
    compte_a_rebours_task(config.name, dateCountdown, all_words);
  }, 1000);
}

/*
** Function to return a Dtae object with the string date and the string time
*/
function create_date_from_string_date_time(date, time) {
  var completeDate = date+"T"+time+":00";
  var dateSplit = date.split("-");
  var hourSplit = time.split(":");
  var utcDate = new Date(Date.UTC(parseInt(dateSplit[0]), (parseInt(dateSplit[1]) - 1), parseInt(dateSplit[2]), parseInt(hourSplit[0]), parseInt(hourSplit[1]), 0));

  return(utcDate);
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
  compte_a_rebours_p.setAttribute('style', 'white-space: normal;');
  
  var now = new Date;
  var utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());

	var date_actuelle = new Date(utc_timestamp);
	var date_evenement = date_fin;
  var timezoneDifference = now.getTimezoneOffset() * 60;

	var total_secondes = ((date_evenement.getTime() - date_actuelle.getTime()) / 1000) + timezoneDifference;
  
	var prefixe = nom_evenement+all_words[5];

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
      'min' : ["d", "h", "m", "s", "", " in ", " Finished"],
      'full': ["days", "hours", "minutes", "seconds", "and", " in ", " has already begun!"],
      'settings': ['Countdown', 'Background image', 'Event name', 'Display mode', 'Full words', 'Abbreviations']
    },
    'fr' : {
      'min' : ["j", "h", "m", "s", "", " dans ", " Terminé"],
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
  if(!is_new_configuration_way()) {
    var lock = navigator.mozSettings.createLock();
    var setting = lock.get('countdown.background');
    setting.onsuccess = function () {
      var bannerImage = document.getElementById('banner-countdown');
      var blobUrl = URL.createObjectURL(setting.result['countdown.background']);
      bannerImage.style.backgroundImage = "url('"+blobUrl+"')";
    };
  }
  else {
    navigator.getDataStores('homescreen_settings').then(function(stores) {
      stores[0].get('countdown.background').then(function(obj) {
        var bannerImage = document.getElementById('banner-countdown');
        var blobUrl = URL.createObjectURL(obj);
        bannerImage.style.backgroundImage = "url('"+blobUrl+"')";
      });
    });    
  }
}

/*
** Function to get the default image of the addon
** Use an image file and CSS to do this when bug 1179536 is resolved
*/
function get_image_base64() {
  return ("url('data:image/jpeg;base64,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ebK84WgJRZWrtyygi4ZqayitW0+hBoA2ZWYRlYqU3gc9oFcFzMbzEC114CEIQFO0VMoSsV/ppgcsOHvzl36U/wA9P81P8lMlOg4fFby5v/e//9oADAMBAAIAAwAAABDbbZZuRtbbYY/hdQwbZbUk0kk1Sa8RaPjbbbbbbbbbbffbbZ7fbbbbbb77bbPb7bfbbkzfb7b/AHCWTcsSmQltttNtl2Yi0qO23/3+2/3/ANvvt9tv99t/v/t99vtt/vtttsUkdt9tvtMeW7JlshSSTWWW+lKOTkdttvv/ALf7/wC3/wBtttvv9v8Af/b/AO22233+22yqNm2+23232iX022RNJJJJJIeB5JaO2222+22232++222332222+332222++2+2/7n2323/wBsF9fJttbWW2S22TzYK7kdtvv9/t/v/t99v9tvv9v9/wDb77f7bff7bEwDb7b7bfbbYcGHba0klkkklxmyFCA7bbfb7b7ffb77bbbffbfb77ffbbbb77bbaf7bbfbb7bb7dCbZW1lk74MsaWgLBHbbbbfbb7f7ffbbbb77bfb/AG++222333//APv/AP8A3/8A/wD/AP8A/wC6TbK0lk291ll5eboO/wD/AP8A/wD/AP8Af/7/AP3/AP8A/wD/AP8A7/8A3/8Av/8A/wD/ANvtt/ttt9tvttvthJtlaSz6kAyT0seXsNtttv8Abf7/AO332+22++2/3/2++322333/AP8A/wD/AP8A/wD/AP8A/tfkgTba2s/n2fsnjIkvN0//AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AG+23+32322+2wTnRm2Vrp//AHFiSa5JejNZtvt9t/v/ALffb7bb77b/AH/2++322332222/2+2+2323V8a+2ytLYoQWxJLJgkXWj232+2+332++22233232++332222++2223232322+2DyEGj+VpJPbNGBJ1rhC7XW2+320/8APt99tijvvtv9tUPuWdtt99//AP8A/wD/AP8A/wD/AP8A/Bfk/wCW7SyelGASSz2VFDnP/wD/AP6In7n/AP8A+Yr/AP8A/wD/AIP84RB//wD/APbbbf7fbfbb7aD7ah+4Ku+HwzIYkpQY6a3/AG+/2R37Q7p2Chdb5GkyO31n1u2332/2y/2/2+2/+0m+qyTmpPzwqAeQLyEBRJDP32/yodGkeSKzIMTi8OE2zwF/32+/2223+32322+wmr2y0Ue0RvRqfX5J97mJuy2+32R9UyZwRK3S3iFBxm20mim2332322/2+2+2/wDlGn2o3PrQUwv9Oxizq7NZ2bt9/siPZk/x+tuZzBpvr9t99J9tvvv/AP8A3/3+3+3+R62AWg/V85LJJJJJJDoB45//AP8A/wCVW8zfoSX2h+ZoN2O6I+0H+/3/AP8A/wC//wD9/wD/AIxfLzULba/+JbJJZNJJOu7MTv8A/wD/ALK3mb2YNHwdq+ue4kS71M//AP8A/wD/AP8Af/8A+3+BcnPdwR0dX1bJJJLJJJN1XpGM/wD/AP8A9m/Zy8k5G0FX/eX/AJ/yaf8A7/8A+322/wDv9vt3DUJIBJJeSg2SWSWSSzZIE+c5/wDf7b/f/b77fbb/AH23+/8At99vtt/vt/vt/wDf7f7oST33vMuRSakukkkkkzo/oeO//wD/APv/AL/7ff7/AH3+/wB/9/8Ab7/f77/f/wD/APv/AP8A3/8A/wCEf/e1iCRLNnlkllkhk0ypXz//AP8A/wD/AH/+/wD9/wD/AP8A/wD/AO//AN//AL//AP8A/wD/AP8A9/8A/wC3+/8A/wDf89KaSLakklkllQtvl0Mv/wD/AP8A/wD+/wD9/wD7/wD3/wD/AP8A3/8Av/8Af/7/AP8At9tv/v8Ab7b/AO27RaLEEeytNt9tp57fvmO23/3+2/3/ANvvt9tv99t/v/t99vtt/vtttttttt9tvttuvRL8Jy5TTWy3D5x3fjltttt9tttvt99tttv/ALbbbfb77bbbf/bfbb/7/b7b/wC21vOHPqxNttttuzJSY8MX23/3+2/3/wBvvt9tv99t/v8A7ffb7bf77/8A/wD/AP8A/wD/AP8A/wD/AMffhbVyL22221vWH4r1af8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP7/AP8A9/8A/wD/AP8AFULzaOUG2222lp+gPtFb/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD2222+22322+22YtiHx3WBJMJoCaS6Scr2222322+3+332222++232/wBvvtttt99tttv9vtvtt9tsy1l3Nv0klbhYmk0kk0Dttt9vtvt99vvtttt99t9vvt99tttvvtttt9ttt9tvttr3LnboMlXuqukkq9EkKdtttt9tttvt99ttvvvtttt9vvttt999/wD/AP8A/wD/AP8A/wD/AP8AiaFkpbi9NuPkm3CXoxdD/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AG222222322+2PpVjiHaGCBeJcAR8XwIh222233222+33222+/8Avttt9vvttt9/9/8A/wC/+/2/2/8ACvZHBp0PTWj94Jp72qwxD9//AP8A/wB/9/8A7/8A3/8Av9/v/v8A/f8A+/8A9/v/AP8A/wD/AP8A/wD/AP8A/f2cDYABs9ahm4hYEZvJUA//AP8A/wD/AP8A/wD/APvv/wD/AP8A/wD/AP8A/wD/AH3/AP8A/wD/AP8A/8QAKxEBAAECBAQGAwEBAQAAAAAAAREAITFBUWEQcYGhIDCRscHwQNHhYPFQ/9oACAEDAQE/EPIhWC7UnR3Fc/bW8heWoZ0lKT2sfU5nD1ZeRegeLxfp3Os1faHF4m5o3OscIqKsGdJFnhNCKdx+jwfV0/CRemsSTwPF4fXy4fSav8PNWsjJefRhu7U9dqxUyED6uQbrYpqZWdgyDYLHrn5LprgRhHZppGSYB+TfFtRcqKisn4MT6X4Pq6fhoAzLeB4NPD6+XD7TV/hjzlADVbFZdK7qrr1eF2xN6IbrY9B5MtkuZ5isnQ+pN3owo2eGT7ZMxuVFRlS7XHE+l+D6un4aYefxTwaaaaeH1cuH0mr/AA1mrEnNg/A6unBVBY71fbMBz1b3dGb516BYnc0dBc3LVM6Bi/RNBZoKKRSDgYn0vwfV0/DKJyoQSU00008fr5cPpNX+Fl1qXa7N3PQ3ioqwQBgBU0HFKj776VL3gOENDPuNqDLz1K4ZPtxzGzVrX0dju6ScAgzp2xKxPpfgwfbL8RBDlb9U000+D6uXD6zV5R5Lxfxni/iHELoCvoXp8fZUH+m7fYb0iYWLj0kr70G9AAbhu9RyqShmBgORY99/wphkoVRwGJPmeoznGh4FXEuJqNXhjTgL8Bg+2X4iRefvTTwfB9nLh9Jq8o8l/Jfx5aeWinslY6eZX3mi1j8YHcW7fVWbuzM6u4xiNk0GXPByaxOGwfbLzQQmLXPlm9KOF2dn5ip8B3H/AJ3rDwORyoQAz4vg+3lw+01eUf5JEGePZyTZtUc0IowbrxlM4Xjh9XSmnyXVggMxbVh26K5FB1VZqPIM41emqN4IZYZYQOJlBGliig9SULuU2bsbk3i5ZuWqJxlgEQuX9QVCeDchb9cXg8Pt5cIJMZ2mZ0maC6HR30TZITn+K/kv/ne+/HD6unlJC7hVqnEJeUt+Yi50RYDKD9ULASzIuYhvAwSRlUwKJLiJskjTZMFTuCSOJkGiMbxyIJpoiGI8/wCmdOPKktSyuaid5485cWmnh9vKivrNFQk7im7qtyf8sEQrgF2pYVuRxRmoTZi9g11oayfU57b+uJXvvxwwfbLymBP+hd0YlzogQIoCjLoQiyVQS6Tj7UmYu7NqUUxJuW5xahIxIPUpMYBTb5vxxRgyoCGdNNNPD7eXD6zRQxyajZtWKoOaMHqQ9aRQn+U5hY+8qQgDrf70ij5jjLLk4nX1pNMDMRPUpiRze5TQSY+/fSpoAllDCXGJiPbSnAwlYPtl5S0ECfYHqnWKiKkqQUgCJREQMYh5DjLSdMZxB6wnpNL3CZOP/Ny1Kg4JPelgHX2oD14DQH2T4OUqaaeP2cuBkPvCmQQ0ZOxl2PVdqjZncynnAuiYwa38R5Lxfxni/gRxio8UeRHhigVQTDybNN3Awlwu6xJ7McYAoCGUW9KsIHQoEwRABsTljMZ0oaOXg/dY7SzRdICGiMDIlyZhythTD5shhOTB6t1OKaW5OjomY3M/JfJgEZyGOsR1pUJM2wnth0rDNK1GdhQ5xlzpWenZB1ceR2oQaQjAL7XmX7rNnoNwxeU2rlFaD/jAGA7q7sZeCx608Hj9nLieOjFrQQrm5MjqvS9NfinVIoAUDHZcHS7rUeE4xUeFoqPJioqOMcYqPC0VHkxUVHGPy7paiJiE7Cw6I8CjV3pJDA+1Iji2yT3tZpYpwqyYZOEyfHs4FOgoReXA87mSNR2ZsSF6S4/qB8kewIqnOb8yb9YKG9jSZNTEmpJ2w7UdUjBVfe1Q0NtigcUYGDwjRLnKByp0ZRV3WXu228AqBiUADPg8fs5cXzdThFqLQCcy43XwK0kd5qHw1IkxXVbsZ6eWISJ6P6r/ALz9V/3n6r/rP1QAr/cack2YemvbyoQbGK4H92qzm8v7SsAMcn5mnzMMa3Xo/qpnwBcCeV/ak7r9H9UI4f8Ahzy+sE7eqpPcrHHg5ORxG48ypUxjmHZx2DI5OVE86RMhb20MQZMC1YQGkdAMTQokTRHGjVMVlc5nE3smaCKRSJCe5iOYmY3HHxiplQytpm6THkvqZ0MI2CMnqUClCWjSoBYMs5MLcyVyKYufFfYyDQLdb+KYeXB4/Zy47m+kHischB9SkOYh5F3ux0ogVinqJUOoMeZj5JjXbqcQ1ulJkyUXPG3qr79qdJAUWEFX1Z8hYFrJYO+dLQLYr7UAcL3jPTv5kHLDF+Df2ol2Nzdflrn+jV/I7E+Si2awfh39+BdBGu/L35VjuNg/WFCNxOn6piEbiyfJUPYfY/8ABtF6ss205+BsuPQZeBpwcjZG4m9Stmy7fRqA3jJJfGjA5UMWdJCphbgQRrYbGnIYzOSnVNhLI7+4kiXFGfBLSpFSbnBeXTDK3GITzJvzovPXfMe6u88h6TFAXQbVdcIXwRRk24PH7eXD7PTTfQynCsMc33W61AW5WwXvvJMa7dSCmXuK2z0raKBWBTcwNZju1M3oGWeke8U4DK0/gBufvgDLR6e8UDLR6+y0UCZGNBfasCnMpOjoUZLHMSgVAloCR9v3R8uHb1JOCKBLtf2ok0HXgdLTYWhpYbicAVBi1EnAS760ga7225H94HGud9uX/aieR/z0pDDMx1mKgkLC3QpSklbvAM8JnSqVxf8AwTHN16Hudg8S7C0zN1oLJQGB4EIjnSouFsp9IHvsnF3LSUllqJiJk/sskJIjwNKRB5IE6lSSkDLGKbBLTvRUlZCXmWAtE3mXK2IiPDpYyq6M+bEXcCkVhxhkG4fE+l6FkuSwdSrJOmMBsUIsUmFBf1unIwobEyFzEYZxEOMhHK9BvOQkmNzLEoJ4yBOAi15UmWt4gThsLMiQEhuSWMZveoWYi7cIVGHkROGWFNBI2FlDRc37vxFGSjE508fs5cPr9FN9WXnQmrXV2kKPqvhPAY126pMmzgLmaFf9B+qxOOYnvXYNds+1OLknx8cAJLqqu7Mcj7eloDKLXti9qAFKwNP77YU7F7Qu9qmy8ZYPo0xKBjv/AH3wpgoEMlwnShkmnDSY2eem9YjjLK7jjofNQUTmc3+bUlck0F9qmbJ9xKBgjMabm2vrrQZW4c8zriddqzAuzk9KsFij7tF+VYCZV3fkc3pgdduEA0Z9D9xTgM0O/gURyU71Ls0dX0ofcBTKj3D98z0pEZEPo/8AhLF2nhTnQR2MW68HoAbY+I1MjuZwxTecMrNPnICOo/emFACyqEDPhlRbhk/0a72TQgEweF4hZRMycQ3kjDRrASsrxBQmwxgMJh3Y0DmiFhwW6TY3bWbUfsWW70MjfB0T6a8ipOhbfhoNIOqTSlLCCWWw3FZ5jmAeDSLQF3NZ9Gg7wgiVmMXw0aBdCIDEx20ZWu51i0FtpBjpPpv4J3T808fo5cPrNFEVaVFplVrmBW/g9VfnwngMa7dWKIrYetTmmz8V2TXbPtWByowpq6EdBn7hQOlpv0vwlJiv6O1EU5hjqxw2MU/XasCu9+CiSyIOt34pMaRbm2rCkPJZ8nz60jwG1IpK49xxoJMCz++v8oK3giru/AZv6o4do/FYXM8Ck/qxQs5PdpOLlk/GlYplvh64VYYHRpYrDo4fs9qRQhP/AALsKm+Vk1DdftwzrnzV0jINVwPuVG3YbM9oO1BSDb2dHZ4YIYV5BPxR28Cq5RjO5memJTNtgGgw6uLu0qJeDpcd54AwK2hwMQnWMsQNjJ33FIWMInMZO5SxBgFiCCYtLq0pIJCxcTCWbl8Lc6tVSGS0IQRjlzG82YpIimykFOap29Ke8cJF8IuzeztURBQgQQc5j1W80dMhnC6zMqbq3bEt9qTMwNrLRmvbG16HbtiJJvDnyTea2MQAORgdZelKQhOz3YUZVXF+y6rm+CL0beD6eXBCkvsI+wtOrYUlTM1DrFh6B70AWPJMa7dTGmXuK2igDCuya7Z9qwOVGFdz8Fdo/HDdO1bp2rb+pTFjCfgrArvfgoXfqxXde44d/wDDwMRaqYtAId9vnbq8FKSYOmXTHrz48+Sep/KWJlD6Pgi1i9gqRNA+eNyJt9v1pV/YGtGVseZh2/Dnyy+FJCcUw/QWxbUEAEAWAMg4JZcBFyFmcJGBjd1OdOsOegAqZiANGV0cTJx4SI19i39RBsNRWlF0y5YKZoThUJ1U+ihd0+eE0JThgpkvmn6+opSaIKJojCdET8C5hUKc+P0cqMDKsBiv39tqxGvHQND5c9i1NJQQVEzaHlBjXbq7R9zj2TXbPtWByowrufgo0MJj1t7xwiRgv87VsVsVYuVYFd78FGPJfh+KYwlifS/BtjL2j5pQJaguNr6sy8iiuGfZp3lwHZifcxpl0nR1pGMJjwMYwz6UzYwPvSLHLPPiVhwS88Wk1B2y7VHFWQAOuP3nRbl3tHz4p/APGwahsdGfJ6irC7dh2Oa+6iVq4W01IXpwHWQHfHkS0DpqIwXcMBqhap4Y2KdIaBw5zDl2Y1I6vL8GgYAYFEJceAE6RACIyZz/ALRoLezObSs+wZFGFGrwSDbsx0x9KONgw87AchLv+Cmby+aeHxTQ1XI39JbVJt0h+AyO7ngcEqKRQUQE+g0jxBh8kxrt1do+5x7Brtn2rA5UYV3PwcBT2477nzpSGFqPnWpdyNg/tNQhYrjzl0yowJM41gV3PwVkAdzM+50CSRpRDOUTHKnWJcX7lStruOx+32vpVgviNP3/ACp9xLH76UKMjf7eiHNg8/tyrZ3MdzXp7cZ+d7P6c/WiBodTPnk0yWHo/ul7A6B91aET7nX+e/Ki5sSv999qCC+59v1p598/SUs5GxHutBDYyM37mvWk+M9jT8trYGK2CfuBep/WcXEycqTmuaRMAADA+2q52FWk0DSYrzfS0y7EpnFMzG25emA+kVPzrLPpp0pWJCUQtTSdzfvUKFmpxKsjdzS71aSYtNZlSyy1dKGQUb8Lnx6scMVc8JZiHx2IzFRMyjrlTuIB5qS8xvf8GB3tTSRHdmPL7sGrhVqMcVumqz9jAKeEU1BvjUvETmB7wUyuZfVX58ojCDC1BFlNo4iUhoJVjsUEWqL+SmOK48EoFko6Ecxf1P1TSw9X9U7KPt6fWkmzQBHtKY4rjwtZfcyhlh9T90NBBsX9aUjiX1r7QoY8pwUWKetTfweBWW5P1hVqPaViW+3oW4pyI7Wq2X8w/lWm3kBSqkl/MuuEhcJJIdMccKRuROzSRGJJmRZsS8rBU6h62vQy+jlUur7CDHmy0pAWx5WAFMr40uTFlW50uZMrU+jmF7jmdBM9aOJoKhozbFXJI+axGket8O/4MoSMUtzCxGl9CqWQHReWPVbagCxT4N0UlDiYQ52VAWPCeS/kv48+KfJfJ7zLk5e21Ti+bo4jPfnxUYRWEF6R7xTl9j91vfU/dQr07p8T7Vabu+HqW9YomSSpUykuXjGAFeeG9AayZR3Eg6oU3haI4iYlLZ8cWlXNTMdktToyAnJJO2O9Oa4UACCafQxXzx6RkS83ADdQ3mgdxhh6DuCMjNFjtgADkHBqeCMEtFqKSl61n5saAnsw8qfwZ8E+CfwZ8E/gHj3o2E9X5qXN61i3qP78AKwUDnWEXZd9QosUibjZmADVu6RjWMAqErE4xMsbTUXzWTf0zOtxcYL0jDFD99HPwoTXbof2eijBeEu/rI+PNwu0WtXRZ2to6WgzNRx5zimqXXOni8L7YU5md+tSUqoMLDeoZLEdbnt+EfyX/wAub2Ug5HI9zlgVNNDxDemxNKNZJDmYB2WMPAt5Z6ghTLwMJ9Z8yC2Pv90MVsURn8S4GjqdMJiyxERammsuDV4JPKaTRKM9OHmSP9q9sKU5AFeResSBV1cOhB0/yolyE92YPu6UjsjgQZoSFTQIG/8AZeknIPCxqF7qnhwAOny/LWCWhv8A7vkcxrPRYvLwaaay4NZCGmf8oGCArMR2/tSxlqC7U8tXlx9WDlP+RPCOaw9CHutAgwVNTUbv4FDXIOan2nhHFvoCFKwqaF5/OvlryCQHBV0auGt+Rp4NZhTLApWtypEXoKCe3tVoUGhwiklglXYqzBkNBgfLuvjPJfOfLfOfz8zkvqqAIOKhal0lTDkfUJ80iVlxipDzQ6SvxUi0JnhTKXk9JHYPKUuJ3dC/QMNxUFAAaBTVoLtYq0eCOM8LqXJerl0Yu8GT/ljGupxVNTU0QZqRznShtz3rZf3HjGdKKgJc7j2cJAWrctnq0BHAt6eUQm/GxMfUZzApQu09uDyJqeAz3tma5ZGbsNJSrK/5Ypz9mKpqeKrgc6Yv9paigRlADVaTgwrM7qeljaKFYWD7HTgD357IHpyGNvKwPcdpRPQnooo4AOQQU628ieL4vFQ1gm+hv0L1Pdx1bLmWA4C2DCcaWWYj/LzbD79T4YGLAv6Vvmr6tRUGbSOfPoLG7OVaJEbEB6rvIpky0/cIXfQN1sc6xw0tpwOQAbE+MZJOMXccemdSTkKlQYeKangcXbm53PfA2LFQzXPgeQw6nM8k/wAfOWlQSNVCFOOJQ9iY6TPcelRWP0vQzXYL0dkDB91cXdqRhwIZTyxsUkb/ACfEUEqCkQiiIiDKG+qt8ARdx4kHK10jDgoJcCoj3PRxHQOflHGWN2QZWbG+uhv5R5LR+Q0f+OeH7CEGhIowuE1magbAPW52gqKnB0tv6X5BrU80sstZCG6Zv8HXBCo4qCSCmA3VPYd1NGgx8MB5tIoNvB1HsFaDcOto9WdgoQMUcHLTDvw9weiHHxDZVLPgjSGXECtvdP77UpR+g+UeS0cHy3y2jg+W/m3B9VsGq9jFyKI6if4HVlp1trkhO0ViNCxqamoE7DPlSNZz0y7UgjM5NOa271YICKwKYESN2MdDOc2BK0hlqpirn8BgABYpQJbFXpffikvNDelBZORHS49QpABH0hfioQEGmXpQqIK4UCnTS6XJjoy3k4SfyAM1+M1yBWxSQy80fBgZAeAAGNAC3BpBSngGAUqsAaq0W184GzLiG67khOD7zV/jDyDgZsi+QPlcBm7DUWE9VzVzX/nBCcAm8geow8ihZUZnpxglukOdntNBNioM8zmyOi3OeD282PHSNAxWRWdzLkBhoBgc1urQoCasJ0HntmFUeV0o3HsCXNoi6X0OhRQmOFNNMHAXVsBquVQ4rDhu007tvAbJhBjz0AzWA52q0w0KYD2epsACrzgcFeLWWVjSgbAVhxcla+jzJNqLWHCYPTNvLUKfXy4fcavKPJaOD5bwjyWjg+W8I8c+KfInwSamAarh9yL1dqxesPIwDIoeOK70ZDhA7VK1gK5tjsT1qYHS3yfLnBnwQhhwLpkGatj1rC5E52QsAGKxK7kGtLMQltjHpGYFD8E5F3kB/wAoQLRwkDEoeXNZi6L7AXVyC7RpJ/0wy0NjU2J7HnD6GdNhdD3fwUxAWK35hd9jIpiBV9bvB4NNYApw8Bm1NbQkPRPQTVKfR2mfRY9VNz6NGr9GhBoNRw+41cZ4T5E1PkPkzU8Z4zU+Q+TNTxnwx4YqOMeCPBFRUUEMy9ipPOMNJaUBQg4+/U0Nxq0bmnFYIORY7ULMEHqBX1fbhhEKAtiFXdmOVtZFRuBVxeb7GFOSxrCN+DTUxhTYmzCbxyowodODRmqAIC1NNNNNJCKxtAzpSW7ZHIw+a3Hq1vPVreerW89WnEJ4fcaqPHHCKio8EcIqKjjHCOMVHhjhFR4I4RUVHGOEcYqPDHCKiv/EACsRAQABAwEHAwUBAQEAAAAAAAERACExQRBRYXGBkaGxwfAgMGDR4UBQ8f/aAAgBAgEBPxD7FglxStBsizybvPLRNi1NA1146xyGeg3/AGLTxwcOupwZKmplbHDwd7g2dFqKiNjI+nH8sbPZ/wASapij7U889Sn8GVeJmGh06rcpilNCWhxu9A1XAL9jWg7g45714rd+yaawRJE4lQRcrqPecVzScUmjUbNb6Mfyxs9n/GmeNH0n0zzz1PwZAYBV3Bdas7is3Cw7XeK7InFqTHHPg5teK2D7hUHefFPBffJTo84fU3jolnbI24/ljZ7NH+KbgUfSfRCvLPU/Bjz6Ctxk688EGuyXdFKQLlcnC0exlvY+7agGDJw4bxs1B6Xh+A8V90mxghpFQ7Mfyxs9n/GgNMMbDafRCvLPU/BY1EfK9h5bUgBCq5VytPDTAJX9HFg41GiVxvxH/wADQm/+AmucPzO5yVcR3PdfBl2CIpEYax/LGz2f8i879h9ieWep+BvHANVg7tDjoSFXMyNxbe0oPlsvMQGgFqcT4XVewPGoXS5dXmt3r/i4VCsZuA73fdxxC0TEJCNkdyaUZ40EB+UbPZ/yJJ7th9LtnlnqfgcNHzA+tWwByA9Kzn/M3tRYl+ANHk0SrV84L8x6jc3ResXwxs9n7q5LUxD3/VFyL9KQRpIs/U7R556n44NZ8j68Hcl6VUM4Tk3J1iM5db7PZ+2VaFpdFe+ZdA1ptMJ6qH5xqWb9DjN9i0Q0aRYmRfYl9Rh0UyxEjJCZ9Q3tVYCfRBPftNrtCICYMN8JjrEUjEmJ+niNn8c9M99ns/aZtUioIw4AhcGSd81kP+GtKyFAGFsXS0xKzOvSmkMWeHRogBlS3GRNBFy1CSN7zmTIWt5ZHEOMbyaEWCF3SXOjJtknu2n0hr4TeqZ3hdDo7h/FnDwGrQcBOG0lmUL9X2p4vvZ5PtXpnvs9mj7JySt8B5Z6VDiy6u91erehL0CsuMm8EJg33IxVlYy8Xf8AP7QGaKuQlOAk/uryMITche16BfAHqr4xtSSGkhh2H1T4TepI4cHMv5w8FrDYB106NqAJH8U0G8qdEPC1KBK4n6/Xai/Bh7NF6D0azholKYInW2+hG5Xs/aD7LB3T2rIq1grvo1KEIC7KOR1bmgTtot+xLR0cZGTv7ZqKoUDiuA469KXKyJHjHRmgWhpevqzWyED9EEt9FH1D4zepEs1NG7h8dA0iXwh4LHIOj+KILmJOZekaGTOXb99t9LpqXWb96Tlrzac6QKYXY1lIUc6YoyV3CrJVl3iTEJjS3OjbR4nJxEsO4c7/ALTACE7kUqGFV0/f6p4VRKzpJL8pS/AvXGM8K/XNaaFBSymWM34UEpTS4pHQLtBTJXvWvHI71k7+PovO6j6x8RuaM3q2UrgZuu6ObFCV/QXrQBJbjJHky4j+J86ZvCdS/RDHTZvKVL5FzmXPNHMgMjHi96ZJCaF9JHL9561mzSZxxY8nJeyIKnEZNEOmpwSfZhXdLex7eQdKylanZKBB4CXvmkpx6CJje5jhUwMLlvX5NRlDBLLoajkwMxrQUQAHIIPoSbNJKH6x8RvbAlsOLvkdAQ90UA916TSPb6Iv6E6/bRYR3K4XufuuF7n7rhe5+6UNb5io6PF9qTK7g1pv0Of8oKkL1+9pw7n0oEqOdqGsDufv/iRwMdtu3rI51om1INCYSyckuVECjGinHTiSI1KdowEd4WvxwnUohuUkZpAF0Iwjwfk6yUsgSxgtwdXBc5haEST60YUrHB2dN3LG6ioOBSzDQMqzpByxANQm5xAGZaLiPAEdeK6rf6oJb9h9I+I3qm1Jo4R5XPWelEgxXz9gNMtdnZJ8TUlxh+15NGAVxVDsSpmgy7RRoJWkcyAePsBLFMpv8aUPZvgKdzLWnT7k9brB80piiXlYParU271a2T0fZrcQZPc2Muod399K304r+6RLI9aI5k4Nx9qjDT8n/hXA1eNLLyVjjLGPpBJCXEsjRQWvvHUdyLTjWzaihJUOxqRomfcfFgoFJpEZEdT6JqHOwiys3LpNaSnl8KTkByCr2F6sbJ+joP0O0fIb1TViO6/a9auqxuAAOx3auuTXH1+H2vJppA6no1xK4lKBLRfAXdHtsRgx5/qgVYChclef62LwU9/SaXgp7esbEiI5sVkoQIxvN7VsJ5M0oJWCkoR5/VW0V+abFBKing1N2xOAHilIwS8E2KBLirfyoOBpQcLHydiTA+ONSDVfO9CaSJ8TUgll6tAEEBscHI0AAMH/AAVXF0qS/cPOKACDaFQbqg+iKSGNly694r1/gyBSIRLiOE2MFkH0aKo7picdSk78gRti/TSN9BtGuLAb93mhF2xIk8l/lQKIQMjWN1PldiYU7/8AtQ5qSG8znF9KSEmDa3epzkQpEtV9ApxEKSIW6VHLNDpR0Bkwn7oFFOpiJeWm3NCSbXaPiN6poHWlnrU5k40UL8R9ryaDyLmUNGuF7lYeeTNeQV5561O+o7H9EAA5Z5tEKCE334KcJZl3/wA9aKmxvwVHJs65KMvKxw/npQqyi6hu30kMUdsniVia662Md2p8oNCiBgO9ioKQ/MNITX0d/B40usmeW+tNqrg4T89KyotWF9g+X2TrhHdqJXQXx9EomoNQTRJ8701dkaBB+g/qhBJc/wCGSmZN0s397dOOwJYoB9SO6APPzPOkYISmTNGGdkRcFnf68yzug6sNs18Zuaf+BcMFo0is817UQm6kusS57FLiMCiTdaYzw30i+UNIZxlzkjriKcNXdZiX4cmnDkYa83PTlGlFQ90M35UIprODMTunjT5JCytyeV+DWdkX7pPX6IOJtdga+M3qYEtK4YKWsFJHK2Obb1rh4OwH2vJrDpriO1Rsi5715BXnnrTlpy0OOZ4inHzFuttkSMB/fNSOaPi9YriUFZq8L3ajPW/bFHj036X2Cmq72aU8xehA0J61Y8mP10pTip/lWl9x3fvbn5nvWXk/QL/D3ay830KOmwa/vfWGw4fqrsK7UNgk3mf7QASR/wCA8sHTW1cXR1wUWtsEFEOtypUHft+6jfsQhlY70iD9t0c/mKIznLz+W5VFHR5Lfrtsb1BSCQ0qyhCdVtzDLkOtAFYbd7UVCLm7Oaxxgi7Thuq+ZjDfNBymLgpDpb1opXVv16UrbveBTs/tIsLGbBiA0tY3FBOmS9u1Ol0YRh7lWSeU3Xm61ezjdLw/tABAW+iR2FOwNMHAXHmPW3OkihKvjBU1kjoP3QdaWb/a8mmkG89Gpb6Vc15BXnnrTlpy14Xu15xs4rzXFea4/s0UNzHvWavC92vB92vGfR2eBsvm3FGClXOHH2/82ALTl++u3l+HzUSdZPH0TBuD3qBd6+22DEnGgPK8O6nY4jk/3/fKIxOfI/8ABqzakjIlW6u9fm4tsvS7EuMkEcyuN7P1TTPvXHKA2NPx6v4UcZZSW4xQtxE8T7bW5sAGSOK0Oh3UEBJG47xw/wCGQmx2IKAEq4D53wXrEc43re+xpxb0lTUFHAphKXbOyft+TXlHo7fIK889actOWvC92o6zE9r7JYZCpd9S76MlZq8L3aROae/7okuJjvbYUvWDz/KBQFS/EH680vzvyKMaspw0+bmjPU4lGHkdhpibUR5yvSgWJxtW+ZYPQrgaf++foFqpnpScCx7/AO0R3EvL2DjAqflxDPkeRBpcoNCjfoBUoi3F35zoRHPy8WJ0v5t9Ea+bv5b+eOdFTgKhBjfWi7QBYQ68opHWYN/1u9eNOaWDZJULEDuvieeDfinn5lW/cXnD/DAm1E/PLuDV4eheseFtvcd58GmtJSVkOaiWjFQC8Tc+15NeUejt8grzz1py05a8L3djE7/HD9UfC+4+1QrE86ADIwaco41cjWavC92tdrw6UhKEoZLd8x3pAwDBQMbGOL+ir5+47/1UYYLv660gkJakbTk5VeGzjn/fXbA0Pn+06lJudOW6iC77lH2g9VpHBwG7++nOmImFqdPs/PSo3pP7KCNTi/qkqvvdD5uodjPPH/WIVdwGX5vbVDS7jI3bltAv0VqrlzvebleLehuaBQXNOLfI6xwmiI6Y93PaOtRuDhSEhpFbjvR6Wp0aBEkpq39a3CrjrQAQUfEKVa2+yz9+NjBsjOBLndTohZ0Wlq5Amc7hADfcswf4JnY4buS44vR5dCr+cYCwbh6uXWopKgvWtEKey+lLdiV5UAuAHYj7T26eLR6MDtThJSQLji7PmWgeE2ICEkpyQeR/dAbj2KEiL171il2fU0Bwmy5FSGRHalZiXH9UCLDavkWmxwbCQMxUf9P0HwT835q9PrawsevfaXAJxrc3ktPyT5q0AIIP9hZzBk16Ui+VMYILDpGl2DtV05Yu923ir5f3t3u1AXPtZtoNYtQsRCDEenvQ8veBrwTR7j4qJzWKfOmdw9lYWAPcH/DDMdB8Bd7RxqNDvGfLQ8p4ilVVZXu8V1eLTQTURshu1FNowroWfFZ/DQ2HEPc19aVg20TDtEZmk5B1/VGsPP6rhuzUq1HAfer3Y4Z7UjBDV52WDSd626ZqCON8j7zQAbqg8G3FuOzo9GkYwjDzKc1E2azssnMt7ffIoGVQf14EtNQbcfoHO7hSZeckr1fTHDZFRshUFZjmkpnDLRlFo3NQ9YH8P4UnIdiodHajAPY+jF2lsOshYu5S3mkiH1YOKG67gtvan1MAmIxvioYFZY+ENC0GJo4RWE+mcGCPUs+218yA/vQj4R7kxydlSjswY8Aeu9aT6b22KF61JRGWpxpJFdOh6kL+LRjEhTUZn0nM2iRtBQ3qaWkxLhlMPBZnRiZ6VM/QbrRTuT7bTn7kpi7VoJgdeHu6dSfPnF1dfqwInlTSJt42CBJo/p+tX+FA5rB2rGuB0I85/FYCSR3gko4ko405jAt22jOxFXwej7PXZO0E7Q+ZPfaiff8AcTWr2PXqHd1dVsGzT6c1okbtf561FggKstz4peVUjU0py2kcS/p1PxZQ2044qz2oSDDatNkosCw9EesfRNWJr6BaV6KkZpe8fttaxXjC+g5PDJmUqAAYprSkFOzXUqL9Gglh8VZ1tuMf2pN2gKJXjAN6/JeF6urQu7zLq+I/Fo8yB0Je9ABBtG9TekAah7I+1DN6nbMBwL6B703aiUZdOenmiAQdkCfP2rwYbG8t1G3Kan7BTevsYOAFNCYpTtjZMYpvmo3VDd2NhDA3LPNgdWv4v2S8PpV6ibg+lcZg9KnZNQfgs+OK7JEJ9QXkDrSyy/aV3a5hWPYdZUsVJjbG2Nl1BGyEFzqbvu0LZaAAEB+LmPgw2TU7DNeE+lWE7j02N0gCV4FQKygdg75pXCz8z1qaUZ7VS+vUD7S2wxcgnzik0vFzWY6Y6fWIqKjba4kG4FLG+GN2W1BSYwXEuJqZTKiYoIImfxcxz36WVSRDLbvYoxbhU0YLdh5NDrF+BxrTxJcxnstxnhsyjUDu3rgJb8taL+CDka9c9ftQCYD3pcG1JH3ChiaEPF14srTpCMk6hzOeK2n4wOYT46bZqaKxKldYPxxqaw+DvuDitinolJfm4LHKlpAS0rRgsS+TXDm4tA/UE2KAwgkl0jK4dwYy1mZJucJ87M2KEznwDcc/Q+7joIXVhdwNN7wp/GPkIH9qKc/QmHW7H8TU1cTe8f4eXeVMbEC8LG705l955p2l2CnhLgT2z4qf3mR5m6cikEz3hPB/Q5UxJa8q492DjNLN9k/cnPS/Qvzj6oaio+l3BZHqO7ycGqfKbz8XsZjYC6bhrx0MrSbcEg9RPYA4tCMNnqCTutFNTsBeLTnp5odBA7US7q5t/IzUurPz5NLSlzD/AHG94XtajHnAGAMFF7FWgHyIx1isuOivT3GhUEPxrmgijd11eblo0ND9vADVcBlbU7BgeA9HPE4bA/jVOAPlt7arcQ5Li4l+K2m0TRv1EbH6H7qgAlXgHzfS2FyMjmauCzWaa+c3n4s0uq2puORldCpAh2DcND1y3qaILNHhFTsk4MUYmnbMmC7p/Yqd9S26OTV6p2jYZsC+l7i0dW2dIet66q6puutTUc3a9WOq/Ct8UZJTjm9IKQyh84tEpzj90aNQBytgLq7g1eFFMmeQ4nR8MCWXYWLMXH9dwXaiEskHLMfAMu5QmgG12LsQClcBdeRl6Vmk8zOGjgo5VncZd3zdDgQbR85vPxWOYlXcGatdG3yLueK2hQzU7DXx2lSfrY6Z8sdKeW9k/uO7psgX3jgargeccRORcKk7xjK4BgsEUhL6IvbwOZGk3tf+7+rQmjRU1leONB5U1LVdMdVcBq+uKHGE6ODd45PAioP/AIj0JfFBKN6z8zcHOsKLAt4Dqy8aFhQfpNLNBUKwGWoc/HCdJ7ivCrEmpovVjpFcB3Kdy7lMQZXZ85vPxVEYIeIBhykJ30gOLQQRtPXtEkaKHqD1btNbq+FD07rsIK5d5MAcD1zpSNZIBg5cd7l1rnDajLq2a00KXKIRgeLV9U0AMhsMgagLFO1pp0riJDGfepsELTq81v0xwqDSoN1Qbq4BQBg2fObz/v8A/8QAKhABAAEDAgQGAwEBAQAAAAAAAREAITFBURBhcYEgMJGhsfBAwdHh8WD/2gAIAQEAAT8QjhFRUVHGJdVfeoYx0HH++fpzhWQ5FOoZOtMMcbDvdW3+Vvr1qKioqKioqbSjKLv48z3rFhJwn9OdMKZdK2KeUqrD90gkESRNaikOStCjpRBJiDfrQek+Kv8AsXVdFGKCoqL1EVFRnhHCOEUFRwUVwLpr7UIQZEkeVG9JRoUb0L0b0c0fs2VdR1aI+s1FRUVHCKioqKjhHCOEVFRUVFRUcIqKio4RwioqKi1RwjhHCKioqKioqOEVFRUcI4RUVFRao8jbhDkQQlYSx0I9aMR9TaBeQHOrcYl3XamTl5ibBoHTg8TwI2dIkI0cyYDDqbPt0xTtvTLgQSLOX64OeHtfzT2D4r7rdWmjFHDXgeVPCUGXl2x7UeA8BoZocP3uSnPBl75/DM+Zpx08oz5mnHTydqScUDVbBVzd6wXX14FfXeN2mFU1ubfp/vLi+TFT6WvR3OXptQMZpEplTKIwjIlDI2tn996c8PZfmnsHxX226sSjFHDWtIox4jxTy5R0f5Phg1k8N819LkrLgC98/hmfyTP5G1SeUCmXD+h34MLcuPtLSKMaF8H3/OL5TiQsuP4edTsQZclLTwXMmibNJDKyOR2eHsvzSPbfFfbbqxKKI4WXhnyiu9JkgUE1ICPKmhTQkrJoW4frcnFC98/hnn6eUefp5JFlaLXk5/HpR+DgFg2ox8K4Z5rz5etMpnKZX7r6eF4nkNgxkoMi2tOj+f8AaaRDNlvm/WjNEs17b80dvk+K+23cJijgZ8+eWUX0ye1OvBq4M3Bqr73JS8EXvn8Mz5mnHTyjPmacdPGWWMKT2KQTHdbH0d+lBlhCj0D90HKSyOA55diOtKs0zBjxPmsB5NP6/v8A2k3DJU1Jd1uZzqGrMO17HnSjoPivst1aaOOtY86cHAOi5+6yoVlQrN4NVH7tlZcAXvn8Mz+SZ/Gmb7mVe1e6CfKggAsbHkPnLR/B0qTs6d6uTm+aezfFP7eqsSjHArWt6PF9NB4l60lPuxd5jd6XIiYlSfTXw4mkO1IBIA6NC/BlRu0KFH6tlC/CV75/D18/TytfP08nb8ZzRBFUjOUmOtD6b4r6fdWmjjrx14iVlE41nW14DZ5VJshA7iIDOp6yyhD/AHG3hbbAzdAsGhQRZtRQRwQxvDRT1TYgU8hZJsnVKCG3sB7SYUAipktDbwRCbnpyUKPBGWhWNGPuwq6rrxIzQal0Ouz+Gefp5R5+nkmnHTwb0+benh9zvT2b4r6fdwlijhrrw2rXhOSwF2ancjI4F07l/Yq2v20PIC1NyTIKVJBTAzrUOgOAGUkQzL0pOW1VjUEO9HAqczCfMwIYQEltANwTEsC6F2wREtPbRKb2lOak854Xq535AufuhxNdCpa17L4KW7U60vCuk6J/T8vlX8nXzNKvw0q/k6+ZpV+GlX8jbjp4XieNYmC+/K2Cv+5FIHjOlfUuWF2QTCCWilHukTDfISZW6lD7nens3xX0+6tNHHXwjdhR5BUeTAd6UOQUDmVaTR5dniVMAswFNKB+ACAVJqt1VFLnAMKXCQ95qObXuRkmSQW3nSoD42WMc6xm1s04YttghenGzuIOpTvyId+Jm0a117b4ay4RDnEipG9K8yqJ3NH0ikcIjA32/BM+Zpx08oz5mnHTydvIfKnB3ENGSBoWJojEhmGMnJk5UYQgKAWME7rtQyHJgj1g9lRBA7mGo8z8+Rbc6WRKYYQ5cmbDKGhbay4I1jyMC5evst1Y0Y4zx58JPUAGtx+/ahOZhj970FRVmziVYzQQPKJ4DM0QzoTvXRUsZ6KB7VZB7pZvDo5Es6UmzZdhiuwYJ3G9MLmWBewf4px6M6NnXDhReCYbgdm5+6wrqpX4ddfc5KyomrJHYHaNtBRJEqAtEuuT9+lKHUEy1+wim2Mfg6+fp5Wvn6eTt5D5SOZ6EKh7lD2gMl7oyCQxhjLeBd6QiiZlwQ6spWFFwIdIKwYCsFuF84R0WpWjiUTgGZglTcXJsp2ZRwop3SIMMLVdgtQ8IgLl8wmin4ZyO1HHXwmSukXDU1O9Pf7p1h9BOw0TCAlOpUBfkojbQHoXGtKomiQ502nt7UQQ61EZRi7d1Vvap0thiaF2SG83DUHsqpAWYoGyEYIbCfJ7+CAbAT65PvOkzWVZNGtdWdL4OD6POjG5EzZ5mzzo+0kTW132kojpJMKj9lE6DXrG/wAj+AM/kmfxIqOO3CK0qOEcI4nCOEcIoXCQIzio1OECyDHpbtUsJNsxXPovp9qRCSPsGR9Qo0H2dEXQJHMKaViGAttQAmGkY3EwGQ0i6Eb0kzTMDBBaf979opWQZwYu+3xstY438N6KC12Fj0LPRTQtbQf35qKICQjhoVmAmL9NqPqYZciHBQkGJJd6hlEKERH9GDSivGBp6pIYXJF24RXLkIJWWDQvY0I8FspBHmViaQoNZNCefD7b4asrDz+Wqu406F6b6DZ949TpWRCyXn/k1kdV6T7ZPao8mKNZch5uJB7eBw4UOCdJImRcDW0zaJpCAnOAlnYuVp8iOCkIBxLosLBeBO8U4243P2Z0xvMBP1kTsZ2GoqK08iKipAFBUA69K5WZ/cWVIoEWwanXbjFPwjJB2C1yFn71aCShIMMMx4NOEVp5O3kPlghBktnT3oQBnI0nXegAAAMBTmprop78Fx6UKdlREmYIN1Ekm6aUGu6AYPW28kNvTnql2EOjrREn1KAIkja9LM5OeD62bbRisSJDi9krWtKPBnESn5syhsd4MdqNmkZZY6mahSrrMvhoJeOtlCM1kXLvC3cvSk3L/RNg0OXim50XRv8A2jWbwaq9h8HBcVToWrSNLS+637ntT20G7kn7DtULJCHKf9rkBZ66+Tg619/zoQQSBpO7X2X908nFYaBO9ALnVRcSXVJRrRCJVYK6rUpq3IhBGlkt5FspkY3tQvUSEIpXNTUFSxCoQiYElXLi1NNIsm8Er6glweYv1ZNK+4eFnYLugku2AyjZh6Ag5V1/i97Jn2qxNWWyasDdbPOmZQi2RzAWIXksBSIThldQDgwsXJ2A0bZWZ5juLQES5ip7exCPoj7UGCoRK5xA6CKVbFCoEsFkElIL4EfP246eF4nj0ajyQ6/z7r0OLwNylMNhRcaRSCchwzWCFyDdBTHmGL1o4J7j59aOyvWjgWmekeT/AHJzLUDSiFaeDnPShkAjMrnBgIO9RQ3aFztrSh6DJ8xPvSIn7kekxRsswBWgOxSIw5oSSDG8eCArAz66fefBrocH0OStVSMJWnNy65IiP2p02rUpJAAyzahoQwF31XdWruZHq/5UZ4B7/Jwda+v50hNkaDFP/J0AyA9NPODKUpewXnpU3cqjGTYUwGy0AAyJI0MLlJwhNoR7TTMQhZ/IX/lJ4tHJJUJ2KUCVg3aFM0iIcpSoMzSKBzkihkkublTMXqwzEgYmGkqorEkJZUDtKfyiQSzjao3QH6iYEEsU6QodfsCV7UMcSSaPYX2pLLUXPuh3eH/GEIBamzJAIFiG+ByacA7coWUskCSUzAkUsuCQEvCO/wCOqAd1CmccW8+qTYdikYSiLOi2MAd8rwdNOXfLODlZLlGlPuSokNvgUOdijmSd7lJM05FoSEdiksCblvk6rwZiU9LXM5MjtTUmhlQqvNVeOnHTyO1beDt4Hw9uHbiJZ2+dP72rGldqRWQaLHvSDH20tWQXvrLPq6Wc368UYCzyUB0QubOpQ07AAf4PL/pzRADCslTyo0eAMDDyRTvUSUJyu2g8R70dlHJLQlkNxXFsZkRIrc4AK5lzYIdBo1hwJW6J6iY6Xq6JmiqUAYtELABFKoWkqzBo32YeVRz1CQchJYbMhHSjnsiljcWRczqxQVE48AN1oMuL94VQeyGWFs4Z2lFKJBTQpsJUIIRpimTKW6fqRvU12oRWEkedCYsTUJeC+a9r8FLehJxkK9G1aa6BE9d3Yq2IUFc9D/b90Cgt+xw7V249uHasHWvv+dD3cUTCoQeTwEEixSuDMQJiTHFJZFcXISQSe00IlrmamK9iHBXCQjVJaXuJ65qG0goAPCZLLKrSLzugvKr/AOoUBgObE00sTQyLmSdSSku+gwi6GgvOyHRJcqI8mwMWFXFzBdkmot4SMCwQbDFE3gWauWAIBfagLOAnJD6A929PyJGkYULSagsVJUcwFTDSMaJepEERrygHRrDgKJaaYc1QCt1dsidRNSj40duVz5gH1rOHNJCfQB5zrUSX3rDK5rK82kv209nzy7uNSu1EOCDqCeync1MII9FUy8JqaMKJxYnpWMq4tiY+nOrxMF5kc8MicqmeNG/QZcC1ydQrLmIT6qErt4Z5cNK7eQacdPBvTxPFikgc69fsHZ4MVA01XYpXyhLH94OKzUVEtAYvyG0m1gKCGEGs0oInQn8dSHWhslzbtWkaSq07NOagi5Ro2/nPq0gEZG48L71pB9gQijFrMUEQcFUhtsbNTQGFte7RN3VzyRiQEt1hHKpOzLSiTPKhooaddkerpa9QEmQmXIMSSy1gdDzDKhQjmE9SWiozy8uVB02HZqPagIVnHC9hxqJmgnvTYIbomAtrutI3LNEVjdZInkaz4JVbyHR/2az4MWva/BVjUW9SLC3Vl0Cc0GFhAbH9aISsBdqSGS1cKQN6p/fk4Otff86B78pKbgpX2P8AdBQnRsoZhtj24pLLfvWKV3l+KmYhC+MGqsJwFstG4IjYCh5MDvUgbBQgmsmxXRAHagiKoSCdyT2FGEAhEslAcQr2H6CvtdnCEQuRHdKdh3atsM+UjHMZdqgLGCxNBJaB6E3UQ7qDOjhIhD80qFZSEJB0ZkUdLEBFiybEnkyaVAhOyMp9wEtivQTaXyl9RXSgAAQFgNOBGXRzr/0oKpgn9KmeK6Gr60CFmR2ovaBxHqFftI6mtOMuZMuUnqiggcwEdBc9aFaSGcot3aVOmaccuFEwib8dOOnkmnHTwb0+TIj6ffvzRilAqwG9IqOif33pk2CRgVu7AK9KGKsEKjdcKdGeVKflpJh1EbjyblRURTRyY7S+k1bRPEbhPU0PWYhoyKLZYRI5FhyFCCOAZafqj6KCaWqaymtOkwJIlgf2k0zURm78oT7wvUd6bsGdJACRrcKJnzW8YF3a026PhqjJZK2agUzSJiAkLAbN5spS9uTESElcmYDtSyzBgMhJoa5c5D4j+Vc5qFjA8kU+UpS5b0Y/gPjLDKRFmcwbUPK3M8AR1Ec5qUxBCgMkbIDN3dpSzBIPHO9zilsgfIMqrdVVV46VfjFz3x70btChmj6PwUaZoosgsg0EHQFbFAsC0rv/AJwbRdDtUQIZ/oHu0AAYCDhHgjhFYOtff7tOTZGgxT/wNBN9zAOKSz6bYr2b4r2CpkuRzrD/AGlgZQKZvvetBI/e68DA66dAbglm819rsr2ioZswdkFchXunAZqhg9RH2oL0JICAOutFJ0EmHlZukG7gcNB1iAeTUbkszxZOEy7xPcKF+VHkAfZaiHi5yFuj5AaB8MhyU/sKiizmm4VMhvWLdCJRiAV8IAaMiJiYTMUdVQnQD1lJ2cdKjhpUeRt5D5E0Kdv7/P8AlRFYmlMDoeg2moojy/olYDLKWk61IX6IxaW4FI4i0KtohJo3ZLFTaiElmgDeZXPUGpEKm2VNmoEDoQZaSIQ4HnE0iJbP5PzKSHLSgpBWIP8AODCWP2D2Qe1XFIBTYRhPU/AFQjAuPOiI3nk68X6HLRGfT48B6uwCqAtRZ1y7KREti+pnBBUXSgErEU0qnGWAo7o8rB1r7/n4bqSqz77Yr2L4r2CorcpMCqgEVxISlBYBNwSu6Xev+dr/AJWgAAAtHSvtdnCASoAy5gYekeun1mHXUI+iphuXNGp1lTiwsKQuWVYASvtVt0cMNvnCXpGUpK2MLu/NKWikxQrrGXEJZ8op0gFlKWH4TUUphqTdDbcbI6iPBoIvrFkDvEd6Yo9KBX55OZQMXGhVA+6I8HLkByiwAaqoBzpzdoZaR2JTtRUoVs4D2NERRISyOnGCsv02H1APZSiCPvhL6jz9vIfEN5CSLr0+xzocPXX79vSJAMrYKlRN7h/aMQtYtPWotEReLCgsc2DnR+fAs0LuybK4pEi0D70QUoggCVWAqQOxiA1Hy5yEzsooE5yrqo3RlVdVahhZb7KNiBMP20pvXFgEAvrqVbrIwWsnFS7KtWIqxHOgUMCLkHDtasWYDvw/A+WK7cO3Gac9of8AeD0UhcioBGUWDK8rC2q5M7QEuo1MuYEtgFwm0aU6xGm9Kxv+wozIRRs+Tg619vu+K6ks++2K9m+K9gq6KO4wnSjryShK0Os6NHklAcHYyWFEQ0cm9DUm59OpB6VEcm1N68FIQxoF6Nn2kBJADcHMNya+12V7RVKeomjC75jZCr2qG610wwjTIpx0u6OCbBmMYq32QEAYJYJWNXK0ajGYa600rRol1Kwv9j3fIVuwaUZLLHKhg2N+qNaMhkTaskt5Jnekm8uyE22EDk1e9ADKeOdv7nY4ihbEFLINXqFxuZaHiLZEBwTeyYmkpIrRh6vmiQSjW6Yt+ZbSKfNLnFrbrrr8MzUvONN7C8KAugtSj0iSBZJYGwYoz2SJDqke1HAhHoSlB6USCRmhys3Vc2udRrAMHegD1VdfFp4YqPDHCOEcI8ARZMWIxOwShKhegnSZLWBADKJbuYlLQvdZqX7ss7/ymwKwkiWgbtCdS40MLfSQdJoSiIV58ozsepo8Z0M26yubNEL+AENkbNSm+psuVab2pNzOpe7OkQgLGWtxdCoMIBBNgKuTcIloCAAaBQpCbyyulKXgWBKuhQPb47qZOxfUpurvVxCJFu5b8FltEiZi8RzJO9ZmAicLLvj2Z82ON9qnqx7t/sUKVLtQLvRr1x1p8STKXTddaKGrtDCWwF1q08lz51ECTLyF+m9K3lF3L+/JLUQAzGBpKS1NQMwCKQL3DhFHTGcICGzbFRi3IyEJMbNQALBBQoMEB/nR54sEwBMFiwcDcmbnaiXHpQaVgSdzy7lMl/Qk7IKk5ezK6IdYnnUkiRIaO0MGMCNqPHFhMAYLFg4J4QWITA8ncTs0DJTJD2EUGMYRY2kU7Q0hgkmEsiNy98tfT/1S65sDNTBYJcuttjg/h3AAQwEklvzoi7QoibNqzYFYYHINDlUcFjTIgfdZXcr6orX/AIqEFmSGvSPZxvZa7x1hv3miAIxPesGn6Zmd9SR2abpksv5qV8UeVt5D4JOrjSEmxlOVxBShMEgrsRm4k40qBdfuR6pCTCptTGSiRmwmHt1KWOpCqt+ahygUYhEkXhYl1rWr1faiYavV71e/BtVnC7F2iUQMTg/tXun7ZDDVlBVZYNqHHgrAJnTbFiUQUcgUymm5tSsSElKCW4XjpWd5OqSfr38k8etOwhgbPzwOl3lSKiCRi9Ne/oUII0pcBrSgKsBq0LUtz9McJK11k0mx7tRFjB55n8kz+QacdPBvTxOBhDWPLiDGHF7DRKQzEYppzcIcaI8q7VtakAoeIZYFexRxD6FPSfajtj3/AGCruhSsJzMPNwRR2uHlmmLEkfMAeir+QQOmSnRGTDeOBcxKxeKVHcey1OgF5VMRsuVIOyVcgTzJotFNCwDIYpX5wB7VYntWSA5SMcop9wBy3PWomoue+oz7r54d0vHeN2bBzUrd1JEPVz0WOTRVHgcAbBWFYUKMVn6AlIsnMz18uXAswQM478tXlSK8lCJ7n6/gGfM046eUZ8zTjp5Jpx08G9PE4iiqqQYVuOlFBXAYPVaKuOz8NCoE5IT1KHGKvOOpf0NEFJ1A5LHQj1KVw23iQoAWGJgsG1PxkYQrmWCbXgmFbVMTStxqckbI3HNOPAC+2+v9gp9AJ4WN0U9j9HDHB8lYF0opBSSFvkdOb2HNa0TUyt1yvNrKjLURWihimA1bIvQ7FJJgYgv7HV5+9ShWquDoN2oQbwci/ZegVELIlfmPt+AM+Zpx08oz5mnHTydvLPKdSnJ/n34rAoQpJN4MMTyNaQAp51tB7ARUHKJEQjZ46UFvpQ2ppQHo/PDF01TwOBwOnHtUzRmwqsQXmph7k7mx3PLBzcCLBwGaMvDRUMrqUepCe9BhEY/WSg51G0RbENj+0Ys0T4d3+UasyZE7/cUYmCSdAy1nXqHSWx2IO34B+SfkGnHTwb08Tx78PtM6ft7UKAtewdaEqt2hVwEaLOEjrzqGpeEJDiUByl69UyeBlGD7/sUYl0PngrOny9QFcUVzZOi7v1GN5oZ4DNGXhB0ASqwBu00ppRf977daV6+USn3SmCsuBBchw5vpWnaQyu66vOmmrau9ZWvsOfVg9fwTPmacdPKM+Zpx08nbjp4XieTLtyYDfT9NK3KAgsAEAelLmoahMuy6PBs9zdWR9fo4DKJVNBIXB7fxqg+pKho2X/RcUeAzHA4HAilRG0W/QJbnLoVYcA3rBMN7CofjFWPuGoj5qcO6UU9ZE96kunAi5LCPVSpkhMp29Owoi0iQUaVxGgVKEThtDB++q/gmfM046eUZ8zTjp5Jpx08G9PE8e/ArAE3KrWdIlinNRXV7Vh/+lqRpCW0rAYh0SfAJgIe1FexKbjRL1b0EGLulaiiBGww9g4Y4PB4a8FPdFyGXroc0oHRQMAYoxQ53fL2r33LtKtRDWuK7UQLFKzehmgjhr+AWujsy9uf4RnzNOOnlGfM046eTt5D5ZmiDDKd5WH74ITTXRyCTQiECHSKhO4+zV9Z97oGKGagqEhpRsByNmYXqpEVB8MoOv+ketAYwAJrTxFRWaEZpT0Lb1ZekUbclgKJI88aUWnPFL096HrRKggtTmgmBKDt1X63e9JSqpZVZV1X8Iz+SZ/I28h8w+jUcqeBDUz5VAPpWp1rITQUToMcBpV7FPhsxH1dOwtEBHGtuXNb1FS6d+w90vZWtdOOuKiteLnQUJpOXsS9qtaAH0DFaeX/gcqioqL1BUU1dQTi/YvoUyjhuXWIJWKBGrBQ+FsDYJ980sqwSvBeOX4Wvn6eVr5+nk7cdPC8TyTPQflTVvqVQ0L+ijHkkN7B7tRrsnQH6oatKioxO71EjaDR2wS9O2hYOstqIiAgKb+Gq5ohYaRM7A7AHbwHAoRJLm5Riikw4BEzaI5gPooIQcjbkeGKCov4AoCpIk0pAl0PIgU0IYEDQKhZTITGF6C4d3b8Mz5mnHTyjPmacdPJNOOng3p4nj34X96gUMJTl+NRwWjv+tANIxS0wd4dGSuJZpFZjg3ducQO9QkqRtLQ5AA5BU8F7Oikib1c65LHsdvmh4QCgBlWApKYgGF0I06rvTMJs1hoWvbgAKsBddinvCpi8v2EHbyHPhAIGplRC6JDUG5tYtp/DM+Zpx08oz5mnHT82DjhHvP7rY0j3VuhB9DTRoU9elqpEdmHZR9+CQFNauiHqFjrsU52rd2NaCggCAqG5hLx+oOfRogIvbnVuATBuLBRZAwiTowHs0e5aMvVgPRokw8PB00OwVpPcwdh6pQAksES5eF2SFdG/uJ6LegAALHgxWXM8r06o9qm4j3oTQprIBxGe15BucpC4uZssJnBEpC6q3VVVbqq17h/8Jtx08LxPHAyd1wdalZN8yemPuasqg8SaKHs0o30/apG3PX/lNIqPhA+pg7qFateNwXd00D2+29xdmxldA1pKWSnKLKrqrdd2hiUcBqFQQiWF15uhv/UpIDJTV+6aWKQCqAZWwUWBda9FJewlYcxQJzUvpFMAWSHqRkj36VKkstK96wVADNbujnOHoix1XUqaQwNnk/rVdAWlkFWOfPYsHIOLqPcDVrA7t2kpfqaKVC2xu1jLu7wKQ8nAN1ozbOs4gjyEUxeS1ABBiV9WV7qs6zU91CafcP4ZnzNOOnlGfM046eTt5D5Iy0L7BRAIOABcgn3/AL7UTrfkBW3jepfgsK4Ku92T0BUSYBQgDKtK5oOkQ36mdhwUqOwZLY+86dgnXYbHI/rlaiTuAGB6nVY5tOpG4yfuPrNR2PwMjq/wCnTKxN6J8iF6xWK9YKxUsaOxvpOXPXpdpzWUGN3Y5tqm7ACwfSXXlYDNIofYOrSMPZlHAqLlMhY+s0AEFigCqAXVqVzIJbno9iXlRiEkzztaub2ivS/gpzw2e4fwzP5Jn8g046eDenieEG5UBzoTyXdYy78JDgm286bEBPSorP4sv37Vr2BeuHUBoiWuthFjoXbykYqBYAOVGTNoBLsS3eVKfOzZqOcFpXLkVGDEoCLyrmN3sFQAoqoRlLg9+VTewMEEE5DcKKETCSQu63S9x/tKDtiID0cPZolslvWWkgDBIHq2cvXYhFRh3vR7q1UlSQ6tlIUC5mXul2rTc4GXoVLXPQ3erwDQ2pVlFQQZ27UVlZF65bVEqNBH00PUoISv9bX7mrBp2+jT9M+aWW4ysittAKHgs9w/hmfM046eUZ8zTjp5O3HTwvE8JoEgI7z/AD3an4xp3n+Uqr6HCKSLSPy0AzQ6oiSjINjB1Yajn+fgv3VqA5ZGFu0AFt1daSpDrQYErVTE6BBEsr69gVK2FksABNilGmJ2BTrTiuAWxPXgYoxXL9KJ6NJN+fsFJWMTi0+lCEAAaBBwhwjtCSpBecqc0qwp0qZhKCKmsyHUagi+tClBaJF7JbNlHmUqlZ5/wp+zfFAP3vSvrH6oBuWYifTgqs9w/hmfM046eUZ8zTjpx//Z')");
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

function onEnabledStateChange(event) {
  var app = event.application;
  if (app.manifest.name === 'CountDown Addon' && !app.enabled) {
    uninitialize();
  }
}

function onUninstall(event) {
  navigator.mozApps.mgmt.removeEventListener('uninstall', onUninstall);
  var app = event.application;
  if (app.manifest.name === 'CountDown Addon') {
    uninitialize();
    //Remove Data from the new way
    if(is_new_configuration_way()) {
      navigator.getDataStores('homescreen_settings').then(function(stores) {
        stores[0].remove('countdown.name').then(function(obj) {});
        stores[0].remove('countdown.display').then(function(obj) {});
        stores[0].remove('countdown.time').then(function(obj) {});
        stores[0].remove('countdown.date').then(function(obj) {});
        stores[0].remove('countdown.background').then(function(obj) {});
      }); 
    }
    //It seems that we can't remove settings with the old way
  }
}

function uninitialize() {
  var url = get_app_url_without_tag();
  if(url == "app://settings.gaiamobile.org/index.html") {
    //Remove the settings page for the countdown
    var countdownSettingsPage = document.querySelector('#countdown-addon');
    countdownSettingsPage.parentNode.removeChild(countdownSettingsPage);
    //Remove the settings link to the page for the countdown
    var countdownSettingLink = document.querySelector('.countdown-addon-settings');
    countdownSettingLink.parentNode.removeChild(countdownSettingLink);
  }
  //The homescreen is the else case
  else {
    var selector = get_selector_countdown_homescreen();
    var countdownContainer = document.querySelector(selector+' .addon-countdown');
    countdownContainer.parentNode.removeChild(countdownContainer);
    //Remove listeners on the homescreen
    if(!is_new_configuration_way()) {
      navigator.mozSettings.removeObserver('countdown.name', handleCountdownNameChanged);
      navigator.mozSettings.removeObserver('countdown.display', handleCountdownDisplayChanged);
      navigator.mozSettings.removeObserver('countdown.date', handleCountdownDateChanged);
      navigator.mozSettings.removeObserver('countdown.time', handleCountdownTimeChanged);
      navigator.mozSettings.removeObserver('countdown.background', handleCountdownBackgroundChanged);
    }
  }
  navigator.mozApps.mgmt.removeEventListener('enabledstatechange', onEnabledStateChange);
}
