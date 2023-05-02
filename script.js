let intervalID;

// all sounds are sequentially id'd, so we can avoid repeating ourselves
// by just creating an array of numbers and mapping it.
const sounds = new Array(5).fill(0).map((dummy, index) => `SMS Alert ${index + 1}`);

// add "none sms" options such as no sound here
const noSoundID = (sounds.push("No sound, please")) - 1;
console.log(noSoundID)

const biomes = ['alpine', 'coast', 'desert', 'forest', 'jungle', 'volcano']
    .map((name, index) => ({
        id: index + 1,
        // capitalise the first letter
        name: ucFirst(name)
    }));

/**
 * capitalises first letter of a string
 * @param {string} str 
 * @returns {string}
 */
function ucFirst(str) {
    return str.charAt(0).toUpperCase + str.slice(1);
}

// dom
const pausePlay = document.getElementById('pause-play');
const minuteDisplay = document.getElementById('minutes');
const secondDisplay = document.getElementById('seconds');

const delayInput = document.getElementById('delay-input');
const soundSelect = document.getElementById('sound-select');
const volumeInput = document.getElementById('volume-input');
const biomeInput = document.getElementById('biome-select');

const notificationStatus = document.getElementById('notification-status');
const testVolume = document.getElementById('test-volume');
const biomeToggle = document.getElementById('biome-toggle');
const popupSelect = document.getElementById('popup-select');
const closeToggle = document.getElementById('close-toggle');

const form = document.getElementById('form');

// local storage and preferences
const getPreferance = (keyname, defaultValue) => {
    return localStorage.getItem(keyname) ?? defaultValue;
}
const savePreferance = (keyname, value) => localStorage.setItem(keyname, value);

// Not only do we try to fetch local storage values, we
// use this time to set the values if they don't already exist.
let delay = storedOrDefault('delay', 12); // int
let soundChoice = storedOrDefault('soundChoice', 0); // int
let biomeChoice = storedOrDefault('biomeChoice', 0); // int
let soundVolume = storedOrDefault('soundVolume', 1); // float
let isNotifyOn = storedOrDefault('isNotifyOn', 'no'); // string
let popupType = storedOrDefault('popupType', 'tab') // string
let closeAutomatically = storedOrDefault('closeAutomatically', 'no'); // string

/*
tbh I would create an object with all your user-settable preferances
and refer to that. then I would add a change listener to each
element to a) save the pref to localstorage b) update our code
this would however save 'invalid' values

const prefs = { soundChoice: x, popupType: y, ... }; in the global scope

then this in the setup function
form.elements.forEach(el => el.addEventListener('change', function(){
    const pref = this.id;
    savePreferance(pref, this.value)
    prefs[pref] = this.value;
}));
*/

/**
 * Sets up the DOM with our biomes and sounds automated.
 */
function setup() {
    const soundOptions = document.createDocumentFragment();
    sounds.forEach((soundName, index) => {
        const option = soundOptions.appendChild(document.createElement('option'));
        option.innerHTML = soundName;
        option.value = index;
        console.log(option)
    });

    soundSelect.appendChild(soundOptions);

    // insert our preferences
    form.elements.forEach(el => {
        const value = getPreferance(this.id);

        // skip if no ls value set
        if (value === null) return;

        // otherwise set it
        this.value = value;
    });
}

// add dom extras
setup();

// input wiring
delayInput.addEventListener('change', function () {
    delay = this.value;
    savePreferance('delay', delay);
});

soundSelect.addEventListener('change', function () {
    choice = parseInt(this.value);
    savePreferance('soundChoice', choice);
    // If the selected option value matches the id of
    // our 'no sound' option, it means... they want no sound
    if (choice === noSoundID) {
        console.log("no sound!")
        volumeInput.disabled = true;
        testVolume.disabled = true;
    }
    else {
        volumeInput.disabled = false;
        testVolume.disabled = false;
    }
});

volumeInput.value = soundVolume * 100;

if (soundChoice === noSoundID) {
    volumeInput.disabled = true;
    testVolume.disabled = true;
}

volumeInput.addEventListener('input', e => {
    soundVolume = e.target.value / 100;
    savePreferance('soundVolume', soundVolume);
});

if (biomeToggle.value) biomeInput.value = biomeChoice;
else {

}
else biomeInput.value = 1;

biomeInput.addEventListener('change', e => {
    biomeChoice = e.target.value;
    localStorage.setItem('biomeChoice', biomeChoice);
})

testVolume.addEventListener('click', () => {
    if (sounds[soundChoice]) {
        sounds[soundChoice].currentTime = 0;
        sounds[soundChoice].play();
    }
})

/* if (biomes[biomeChoice]) biomeToggle.checked = true;
else {
    biomeInput.disabled = true;
    popupSelect.disabled = true;
} */

biomeToggle.addEventListener('click', () => {
    if (biomes[biomeChoice]) {
        biomeChoice = 0;
        localStorage.setItem('biomeChoice', biomeChoice);
        biomeInput.value = 1;
        biomeInput.disabled = true;
        popupSelect.disabled = true;
    } else {
        biomeChoice = 1;
        localStorage.setItem('biomeChoice', biomeChoice);
        biomeInput.disabled = false;
        popupSelect.disabled = false;
    }
})

popupSelect.addEventListener('change', e => {
    switch (e.target.value) {
        case 'window':
            popupType = 'window';
            savePreferance('popupType', 'window');
            break;
        case 'tab':
            popupType = 'tab';
            savePreferance('popupType', 'tab');
            break;
    }
})

if (closeAutomatically == 'yes') closeToggle.checked = true;
else closeToggle.checked = false;
closeToggle.addEventListener('click', () => {
    if (closeAutomatically == 'yes') {
        closeAutomatically = 'no';
        localStorage.setItem('closeAutomatically', 'no');
    } else {
        closeAutomatically = 'yes';
        localStorage.setItem('closeAutomatically', 'yes');
    }
    console.log(closeAutomatically);
})

// clock functions

function countTime() {
    const now = new Date();
    const minute = parseInt(now.getMinutes());
    const second = parseInt(now.getSeconds());
    checkTime(minute, second);
    displayTime(minute, second);
}

function checkTime(minute, second) {
    // if (second % 10 == 0) { // for quick debugging
    if ((minute + 1) % 5 === 0 && 60 - delay == second) {
        if (Notification.permission === 'granted' && isNotifyOn == 'yes') notify(minute);
        if (sounds[soundChoice]) {
            sounds[soundChoice].currentTime = 0;
            sounds[soundChoice].play();
        }
        pausePlay.classList.add('shuffling');
        pausePlay.innerHTML = '<img src="./assets/shuffle.svg" class="icon_play spin">';
        setTimeout(() => {
            pausePlay.classList.remove('shuffling');
            pausePlay.innerHTML = '<img src="./assets/pause.svg" class="icon_play">';
        }, 2000);
    }
}

function displayTime(minute, second) {
    if (minute < 10) minute = "0" + minute;
    if (second < 10) second = "0" + second;
    minuteDisplay.textContent = minute;
    secondDisplay.textContent = second;
}

function start() {
    if (!intervalID) {
        countTime();
        intervalID = setInterval(countTime, 999);
    }
}

function stop() {
    if (intervalID) {
        clearInterval(intervalID);
        intervalID = null;
    }
}

pausePlay.classList.add('pausing');
pausePlay.innerHTML = '<img src="./assets/play.svg" class="icon_play">';

// notification functions

function notify(minute) {
    let notifText;
    if (minute == 59) notifText = `The hourly cave refresh will occur in about ${delay} seconds.`;
    else notifText = `The next cave shuffle will occur in ${delay} seconds.`;
    const notif = new Notification('Cave Shuffle Clock', { body: notifText, });
    if (biomes[biomeChoice]) notif.addEventListener('click', e => {
        e.preventDefault();
        if (popupType === 'tab') {
            window.open(biomes[biomeChoice], '_blank');
        }
        else if (popupType === 'window') {
            window.open(biomes[biomeChoice], '', 'width=900,height=500');
        }
    });
    console.log(`Notification should be sent at minute :${minute}`);
    if (closeAutomatically == 'yes') setTimeout(() => {
        notif.close()
    }, delay * 1000);
}

function ask() {
    Notification.requestPermission().then(permission => handle(permission));
}

function handle(permission) {
    switch (permission) {
        case 'denied':
            notificationStatus.textContent = 'Notifications blocked';
            notificationStatus.removeEventListener('click', ask);
            notificationStatus.disabled = 'true';
            biomeToggle.disabled = true;
            biomeInput.disabled = true;
            closeToggle.disabled = true;
            break;
        case 'granted':
            biomeToggle.disabled = false;
            closeToggle.disabled = false;
            notificationStatus.removeEventListener('click', ask);
            if (isNotifyOn == 'yes') {
                notificationStatus.classList.add('notify-on')
                notificationStatus.textContent = 'Notifying is ON, click to turn OFF';
            } else {
                notificationStatus.classList.add('notify-off');
                notificationStatus.textContent = 'Notifying is OFF, click to turn ON';
            }
            notificationStatus.addEventListener('click', () => {
                if (isNotifyOn == 'yes') {
                    isNotifyOn = 'no';
                    localStorage.setItem('isNotifyOn', 'no');
                    notificationStatus.classList.replace('notify-on', 'notify-off');
                    notificationStatus.textContent = 'Notifying is OFF, click to turn ON';
                } else {
                    isNotifyOn = 'yes';
                    localStorage.setItem('isNotifyOn', 'yes');
                    notificationStatus.classList.replace('notify-off', 'notify-on');
                    notificationStatus.textContent = 'Notifying is ON, click to turn OFF';
                }
            });
            break;
        default:
            notificationStatus.textContent = 'Request notification permission';
            notificationStatus.addEventListener('click', ask);
            biomeToggle.disabled = true;
            biomeInput.disabled = true;
            closeToggle.disabled = true;
    }
}

if (!typeof Notification) {
    notificationStatus.textContent = 'Notifications not supported';
    notificationStatus.disabled = true;
    biomeToggle.disabled = true;
    biomeInput.disabled = true;
    closeToggle.disabled = true;
} else handle(Notification.permission);

form.addEventListener('submit', function (e) {
    // prevent the form submitting and avoid the page
    // refresh. Also, we've assigned the pause-play
    // as our 'submit' button
    e.preventDefault();

    if (intervalID) {
        stop();
        pausePlay.classList.replace('playing', 'pausing');
        pausePlay.innerHTML = '<img src="./assets/play.svg" class="icon_play">';
    } else if (!intervalID) {
        start();
        pausePlay.classList.replace('pausing', 'playing');
        pausePlay.innerHTML = '<img src="./assets/pause.svg" class="icon_play">';
    }
});