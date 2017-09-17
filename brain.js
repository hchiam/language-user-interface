/*
Trying to understand this code?
The function converse() would be a good place to start.
*/

// TODO: track conversation topic and type to make things more two-way conversational
let currentConversationTopic = ''; // example: location (weather at a location)
let currentConversationType = ''; // example: weather, time, reminders related to that location

// automatically notify of internet connection
window.addEventListener('offline', function(e) { say("You've lost your internet connection."); });
window.addEventListener('online', function(e) { say("We're back online now."); });

function welcome() {
  let today = new Date()
  let currentHour = today.getHours()
  if (currentHour < 12) {
    // 00:00 - 11:59
    say('Good morning. How may I help you?');
  } else if (currentHour < 18) {
    // 12:00 - 17:59
    say('Good afternoon. How may I help you?');
  } else {
    // 18:00 - 23:59
    say('Good evening. How may I help you?');
  }
}

let unfamiliarUser = setTimeout(function(){
  introSelf();
}, 7000);

function introSelf() {
  say('You seem unfamiliar with this interface. \
       You can type a question in the textbox, like: "what can you do?" \
       Or use speech recognition software, such as Mac Dictation, \
       to enter text verbally into the textbox.');
  // delay re-prompt with unfamiliarUser timer too so it can be cancelled too
  unfamiliarUser = setTimeout(function() {
    say('Still unsure? Just ask me: "what can you do".');
  }, 20000);
}

let delayedAction;

function converse() {
  clearTimeout(unfamiliarUser); // user is using the interface
  say(' '); // let user interrupt
  clearTimeout(delayedAction); // let user continue what they're saying
  resetCountDownWaiting(); // let user continue what they're saying
  delayedAction = setInterval(countDownWaiting, 1000);
}

function resetCountDownWaiting() {
  document.getElementById('countDownWaiting').value = 0;
}

function userWantsAnswerNow(event, kd) {
  if (event.keyCode == 13) { // key code for "enter"
    document.getElementById('countDownWaiting').value = 100;
  }
}

function countDownWaiting() {
  document.getElementById('countDownWaiting').value += 20;
  let percent = document.getElementById('countDownWaiting').value;
  if (percent >= 100) {
    let heard = listen();
    if (heard) {
      updateMessageLog(heard, 'user');
      reply(heard);
    }
    clearMessageHeardAlready();
  }
  // stop repeating timer if nothing in input box
  if (document.getElementById("input").value === '') {
    resetCountDownWaiting();
  }
}

function updateMessageLog(message, who) {
  // ignore the interrupt say(' ')
  if (message != ' ') {
    // set up style based on LUI/user speaking
    let id = ' id="log-' + who + '"';
    let idTimeStamp = ' id="log-time-stamp"';
    // create message
    let timeStamp = '<br><small' + idTimeStamp + '>' + ' - ' + getTime() + '</small>';
    let nextMessage = '<p' + id + '>' + message + timeStamp + '</p>';
    let logSoFar = document.getElementById('messageLog').innerHTML;
    // show message
    document.getElementById('messageLog').innerHTML = nextMessage + logSoFar;
  }
}

function clearMessageHeardAlready() {
  document.getElementById("input").value = '';
  document.getElementById("input").focus(); // put cursor back
  resetCountDownWaiting();
}

function tryOpeningWindow(url) { // notice and tell user to unblock if can't open window
  let newWindow = window.open(url);
  if(!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    say('Sorry... Please authorize me to open new windows for you... You may be using an ad blocker.');
  } else {
    try {
      newWindow.focus();
    } catch (e) {
      say('Sorry... Please authorize me to open new windows for you... You may be using an ad blocker.');
    }
  }
}

function say(sentence) {
  if (sentence != '') {
    responsiveVoice.speak(sentence, 'UK English Male');
    updateMessageLog(sentence, 'LUI');
    document.getElementById("input").focus(); // put cursor back
  }
}

function listen() {
  let heard = document.getElementById("input").value;
  // shortcut for showWhatICanDo():
  if (heard === '?') showWhatICanDo();
  // remove trailing/leading spaces, set to lowercase, and remove some punctuation
  heard = heard.trim().toLowerCase();
  heard = heard.replace(/[,\\\/#!?$%\^&\*;:{}<>+=_`"~()]/g,''); // make safer
  heard = heard.replace(/  +/g,' '); // remove multiple consecutive spaces in typing
  heard = removeOKLouis(heard);
  // TODO: ? make heard into an object indicating which topic to speak about?
  return heard;
}

function removeOKLouis(heard) {
  heard = heard.replace(' louis ', ' lui ');
  const toReplace = ['okay lui ', 'ok lui ', 'hi lui ', 'hey lui ', 'hello lui ', 'alright lui '];
  heard = removeSignalPhrases(heard, toReplace);
  return heard;
}

function removeSignalPhrases(heard, signalPhrases) {
  // find first match for start of sentence, remove, and stop checking
  for (let i in signalPhrases) {
    if (heard.startsWith(signalPhrases[i])) {
      heard = heard.replace(signalPhrases[i],'');
      break;
    }
  }
  // remove initial 'a' or 'an' from the rest of the remaining sentence
  heard = heard.replace(/^an? /,'');
  return heard;
}

function reply(heard) {
  // TODO: add more functionality
  // TODO: make more modular

  let heardRecognized = false;

  heardRecognized |= heardConfirm(heard);
  if (heardRecognized) {
    handleConfirm();
    return;
  }

  // check different cases and if match recognized then return to escape function early:
  heardRecognized |= heardInterrupt(heard); if (heardRecognized) return;
  heardRecognized |= heardPleasantries(heard); if (heardRecognized) return;
  heardRecognized |= heardScheduler(heard); if (heardRecognized) return;
  heardRecognized |= heardOpen(heard); if (heardRecognized) return;
  heardRecognized |= heardSearch(heard); if (heardRecognized) return;
  // otherwise
  if (!heardRecognized) notUnderstood();
}

function notUnderstood() {
  let sentence = "Sorry, I didn't understand that. Would you like to suggest a feature or comment on a bug?";
  say(sentence);
  currentConversationType = 'feedback';
  currentConversationTopic = 'feedback';
}

function giveFeedback() {
  let suggestFeature = "Alright. Here's a page to suggest features or to comment on bugs. \
                        Click on the \"new issue\" button.";
  say(suggestFeature);
  tryOpeningWindow('https://github.com/hchiam/language-user-interface/issues');
}

function didHear(heard, listOfChecks=[], checkType='exact match') {
  // using separate for-loops instead of checking checkType every time
  if (checkType === 'exact match') {
    for (let i in listOfChecks) {
      if (heard === listOfChecks[i]) return true;
    }
  } else if (checkType === 'starts with') {
    for (let i in listOfChecks) {
      if (heard.startsWith(listOfChecks[i])) { return true; }
    }
  } else if (checkType === 'ends with') {
    for (let i in listOfChecks) {
      if (heard.endsWith(listOfChecks[i])) { return true; }
    }
  }
  // otherwise
  return false;
}

function heardConfirm(heard) {
  // immediately escape if no topic yet // TODO: maybe not for more complex conversations, but leave this for now
  if (currentConversationTopic === '' || currentConversationType === '') return false;

  let yes = ['y','yes','yeah','yep','yap','yup','ya','yah','aye','ahunh','affirmative','correct','positive'];
  let no = ['n','no','nah','nope','na','nay','negative','incorrect'];

  if (didHear(heard,yes)) {
    if (currentConversationType === 'feedback') {
      currentConversationTopic = 'give feedback';
    }
    return true;
  } else if (didHear(heard,no)) {
    if (currentConversationType === 'feedback') {
      currentConversationTopic = 'no feedback';
      say("Okay. Maybe try rephrasing your question. If you're wondering what I can do, just ask me.");
    }
    return true;
  } else {
    return false;
  }
}

function handleConfirm() {
  if (currentConversationType === 'feedback') {
    if (currentConversationTopic === 'give feedback') {
      giveFeedback();
    }
  }
  // // reset // TODO: maybe not for more complex conversations
  // currentConversationTopic = '';
  // currentConversationType = '';
}

function heardInterrupt(heard) {
  if (didHear(heard,['okay','ok','stop',"that's enough",'enough','alright','thats enough',''])) { // '' in case just spaces entered
    say(' ');
    return true;
  }
  return false;
}

function heardPleasantries(heard) {
  if (didHear(heard,['hi','hey','hello'])) {
    say(capitalizeFirstLetter(heard) + '.');
    return true;
  } else if (heard === 'hi there') {
    say('Right back at you.');
    return true;
  } else if (didHear(heard,['hello world','anyone home','anyone there','anyone listening'])) {
    say('Hi there.');
    return true;
  } else if (didHear(heard,["is this thing on",'can you hear me',"does this thing work",'are you on right now'],'starts with')) {
    say('Yes.');
    return true;
  } else if (didHear(heard,['what can you do','what can i ask','what can i ask you','how can you help me','what can you do for me','what can i do'])) {
    // add custom message with buttons of showcase example questions
    showWhatICanDo();
    return true;
  } else if (didHear(heard,['how are you',"how's it going",'hows it going'])) {
    say("I'm doing good, thanks.");
    return true;
  } else if (didHear(heard,["let's begin","let's start","let's get started",'lets begin','lets start','lets get started'])) {
    say('Okay. What would you like to do?');
    return true;
  } else if (didHear(heard,['thanks','thank you'])) {
    say("You're welcome.");
    return true;
  } else if (didHear(heard,['thank you so much','thank you very much'])) {
    say("You're very welcome.");
    return true;
  } else if (didHear(heard,['goodbye','bye','byebye','see you','see you later'])) {
    say('Farewell.'); //  + '...Would you like me to shut down?'
    return true;
  }
  // otherwise
  return false;
}

function capitalizeFirstLetter(sentence) {
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function showWhatICanDo() {
  // make custom message log with buttons for quick use

  // set up examples to both say aloud and show buttons for
  let examples = [
    "who are you",
    "who was albert einstein",
    "what is special relativity",
    "what time is it",
    "remind me to take a break in 30 minutes",
    'what does business casual look like',
    "where are we",
    "how's the weather today",
    "what's today's temperature",
    "find analogies for an atom",
    "how do i get to the nearest hotel",
    "where are the closest restaurants",
    "where is there tim hortons in toronto",
    "open gmail dot com, facebook dot com, and habitica dot com",
    "how do i learn to learn",
    "show me how to draw",
    "explain philosophy",
    "schedule a meeting",
  ];

  // set up what to say aloud
  let sentenceToSay = 'You can ask me things like: ' + examples.join('. ');

  // set up what buttons to show
  let sentenceToShow = 'You can ask me things like: ';
  for (var i in examples) {
    sentenceToShow += '<button class="w3-card w3-hover-shadow" onclick="useExample(\'' + examples[i].replace(/\'/g,'') + '\')">' + examples[i] + '</button>';
  }

  // say aloud
  responsiveVoice.speak(sentenceToSay, 'UK English Male');

  // set up style for LUI speaking
  let id = ' id="log-LUI"';
  let idTimeStamp = ' id="log-time-stamp"';
  // create message with buttons
  let timeStamp = '<br><small' + idTimeStamp + '>' + ' - ' + getTime() + '</small>';
  let nextMessage = '<p' + id + '>' + sentenceToShow + timeStamp + '</p>';
  let logSoFar = document.getElementById('messageLog').innerHTML;
  // show message with buttons
  document.getElementById('messageLog').innerHTML = nextMessage + logSoFar;
}

function useExample(whatToSay) {
  document.getElementById("input").value = whatToSay;
  document.getElementById('countDownWaiting').value = 100;
}

function heardScheduler(heard) { // https://doodle.com/create?title=
  let regex = new RegExp("^(let'?s )?(plan|schedule) (a )?(.+)");
  let matches = heard.match(regex);
  if (matches) {
    let title = matches[4];
    say("I'm starting a scheduler for you on Doodle.com.");
    tryOpeningWindow('https://doodle.com/create?title=' + title);
    return true;
  }
  return false;
}

function heardOpen(heard) {
  // example: "open up google.com, gmail.com, and wikipedia.org"
  // example: "open up google dot COM and gmail dot COM and wikipedia dot ORG"
  let regex = new RegExp('^open( up)? (.+)');
  let matches = heard.replace(/ dot /g,'.').match(regex);
  if (matches) {
    let what = matches[2];
    let websites = what.replace(/ and /g,' ').split(' ');
    // refuse if user tries to open too many at a time
    if (websites.length > 5) {
      say("Sorry, that's a little too many websites to open at the same time. Please open at most 5 at a time.");
      return true; // avoid opening windows
    }
    say("I'm now trying to open those websites.");
    for (var i in websites) {
      tryOpeningWindow('https://' + websites[i]);
    }
    return true;
  }
  // otherwise
  return false;
}

function heardSearch(heard) {

  // first check special cases before more general cases
  if (askingWhoAreYou(heard)) return true;
  if (askingMyLocation(heard)) return true; // maps.googleapis.com (ipinfo.io)
  if (askingTime(heard)) return true;
  if (askingWeather(heard)) return true; // query.yahooapis.com and maps.googleapis.com
  if (askingDirections(heard)) return true; // google.com/maps/dir
  if (askingReminder(heard)) return true;
  if (askingAnalogy(heard)) return true; // metamia.com
  if (askingHowDoI(heard)) return true; // youtube.com
  if (askingLocation(heard)) return true; // google.com/maps/search
  if (askingMath(heard)) return true;
  if (askingShowMePicture(heard)) return true; // google.com/search?tbm=isch&q=

  // check definition search (more slightly more general)
  if (askingDefinition(heard)) return true; // wikipedia.org

  // otherwise put the whole question into search engine (most general search)
  if (askingQuestion(heard)) return true; // api.duckduckgo.com

  // otherwise prolly not a question
  return false;
}

function askingWhoAreYou(heard) {
  if (didHear(heard,['who are you','what are you'])) {
    say("My name is LUI. That's short for Language User Interface.");
    currentConversationTopic = '';
    currentConversationType = '';
    return true;
  } else if (heard === 'are you jarvis') {
    say("Not exactly. My name is LUI. But I am a Language User Interface.");
    currentConversationTopic = '';
    currentConversationType = '';
    return true;
  } else if (heard === 'are you like jarvis') {
    say("Sort of. My name is LUI. A Language User Interface.");
    currentConversationTopic = '';
    currentConversationType = '';
    return true;
  }
  return false;
}

function askingMyLocation(heard) {
  if (didHear(heard,['where am i','where are we'])) {
    currentConversationType = 'location';
    // // keep for reference:
    // $.getJSON("https://ipinfo.io", function(response) {
    //   say("I am detecting that we're around " + response.city);
    // });
    getLocation();
    return true;
  }
  return false;
}

function getLocation(func) { // e.g.: getLocation passes myLocation to getWeather(myLocation)

  let locationFull;

  if (navigator.geolocation === undefined) {
    alert("Sorry, I'm unable to use geolocation in this browser. Try another browser.")
  } else {
    say('Please authorize geolocation.');

    // get location latitude and longitude
    navigator.geolocation.getCurrentPosition(function(position) {
        let lat = position.coords.latitude;
        let long = position.coords.longitude;

        // get location address
        let urlAPICall = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + long;
        $.getJSON(urlAPICall, function(response){

            if (response.status != 'OK') {
              say("Sorry, I couldn't locate our current position.");
            } else {

                // set up for getting the parts we want
                let resultObject = response.results[0].address_components;
                let locationFull = '';
                let city, adminAreaLvl1, country;

                // get the parts we want
                for (let i in resultObject) {
                  // put together full location description
                  locationFull += resultObject[i].long_name + ',';
                  // check location component types
                  let types = resultObject[i].types;
                  for (let j in types) {
                    // get specific location components
                    if (types[j] === 'locality') {
                      city = resultObject[i].long_name;
                    } else if (types[j] === 'administrative_area_level_1') {
                      adminAreaLvl1 = resultObject[i].long_name;
                    } else if (types[j] === 'country') {
                      country = resultObject[i].long_name;
                    }
                  }
                }
                // put the pieces together
                myLocation = city + ' ' + adminAreaLvl1; // + ' ' + country;
                currentConversationTopic = myLocation;
                // myLocation = locationFull; // TODO could ask for this

                // just say location, or pass location to another function (i.e. callback)
                if (func) {
                  func(myLocation); // e.g.: pass myLocation to function getWeather(myLocation)
                } else {
                  say("We're in " + myLocation + '.');
                  // say("we're at " + locationFull);
                }

            }

        });

    });

  }

}

function askingTime(heard) {
  // check time
  if (didHear(heard,['what time is it', 'what time is it right now',
                     'what time is it now', "what time's it",
                     'what is the time', 'what is the time right now',
                     "what's the time", "what's the time right now"])) {
    say('It is ' + getTime());
    currentConversationType = 'time';
    return true;
  }
  // check date
  if (didHear(heard,["what's today's date", "what's the date today",
                     'what is the date today', 'what day is it today',
                     'what is the date', "what's the date", "what is today's date"])) {
    say('It is ' + getDate());
    currentConversationType = 'date';
    return true;
  }
  // otherwise
  return false;
}

function getTime() {
  let d = new Date();
  let t = d.toLocaleTimeString();
  return t;
}

function getDate() {
  let d = new Date();
  let t = d.toDateString();
  return t;
}

function askingWeather(heard) {
  // general weather description
  let regexHow = new RegExp("^how('?s| is)? (the |today'?s )?(weather|forecast)( like)?( today)?( like)?");
  let regexWhat = new RegExp("^what('?s| is)? (the |today'?s )?(weather|forecast)( like( today)?| today( like)?)");
  // TODO: add "^(.+) at (.+) (o'clock)?$"
  matches = regexHow.test(heard) || regexWhat.test(heard);
  if (matches) {
    currentConversationType = 'weather';
    // getLocation will pass myLocation to the function getWeather(myLocation)
    getLocation(getWeather); // see getWeather(myLocation)
    return true;
  }

  // temperature
  let regexTemp = new RegExp("^(how|what)('?s| is) (the |today'?s )?temperature( like)?( today)?( like)?");
  // TODO: add "^(.+) at (.+) (o'clock)?$"
  matches = regexTemp.test(heard);
  if (matches) {
    currentConversationType = 'temperature';
    // getLocation will pass myLocation to the function getTemperature(myLocation)
    getLocation(getTemperature); // see getTemperature(myLocation)
    return true;
  }

  return false;
}

function getWeather(myLocation) {
  // get weather statement for that location (text)
  let urlAPICall = "https://query.yahooapis.com/v1/public/yql?q=select item.condition.text from weather.forecast where woeid in (select woeid from geo.places(1) where text='" + myLocation + "')&format=json";
  $.getJSON(urlAPICall, function(data) {
    // text
    let weatherInfo = data.query.results.channel.item.condition.text;
    say("It's " + weatherInfo.toLowerCase() + ' around ' + myLocation + '.');
    currentConversationTopic = myLocation;
    // let wind = data.query.results.channel.wind;
    // alert(data.query);
    // say(wind.chill);
  });
}

function getTemperature(myLocation) {
  // get temperature for that location (temp)
  let urlAPICall = "https://query.yahooapis.com/v1/public/yql?q=select item.condition.temp from weather.forecast where woeid in (select woeid from geo.places(1) where text='" + myLocation + "') and u='c'&format=json";
  $.getJSON(urlAPICall, function(data) {
    // temp
    let temp = data.query.results.channel.item.condition.temp;
    let tempRefPt = getTemperatureRefPt(temp);
    say("It's " + temp + ' degrees Celsius around ' + myLocation + '. ' + tempRefPt);
    currentConversationTopic = myLocation;
  });
}

function getTemperatureRefPt(temp) {
  // inspiration: https://imgs.xkcd.com/comics/converting_to_metric.png
  if (temp >= 33) return "Sounds like a heat wave. Keep hydrated.";
  if (temp >= 28 && temp <= 32) return "That around beach weather temperature.";
  if (temp >= 23 && temp <= 27) return "That's like a warm room.";
  if (temp >= 18 && temp <= 22) return "That's around room temperature.";
  if (temp >= 8 && temp <= 12) return "You may want a jacket.";
  if (temp >= -1 && temp <= 0) return "Snow can start forming at this temperature.";
  if (temp >= -10 && temp <= -5) return "It might be a cold day, depending on where you're from.";
  // otherwise cold
  if (temp <= 0) return "That's below freezing.";
  // otherwise failsafe just in case:
  return '';
}

function askingDirections(heard) {
  /* example: how do i get to the nearest pizza shop
   * goes to: https://www.google.com/maps/dir/here/pizza+shop
   */

  // check and format
  const regex = [
                  /^get directions (to|for) (a |the nearest |the closest )?(.+)/,
                  /^how (can|do) (i|we) (get|go) to (a |the nearest |the closest )?(.+)/
                ];
  let matchFound = [];
  let searchFor;
  for (let i in regex) {
    matchFound[i] = heard.match(regex[i])
    if (matchFound[i]) {
      searchFor = matchFound[i][matchFound[i].length-1];
      currentConversationTopic = searchFor;
      currentConversationType = 'directions';
      // go to map
      // https://www.google.com/maps/dir/here/{searchFor}
      let urlAPICall = 'https://www.google.com/maps/dir/here/';
      urlAPICall += searchFor.replace(/ /g,'+');
      say("I'm now opening a Google maps results page for the closest " + searchFor + '.');
      tryOpeningWindow(urlAPICall);
      return true;
    }
  }
  // otherwise
  return false;
}

function askingReminder(heard) {
  // check if asking for a reminder
  const signalPhrases = ['remind me ', 'tell me '];
  if (didHear(heard,signalPhrases),'starts with') {
    heard = removeSignalPhrases(heard, signalPhrases);

    // swap pronouns in reminder
    const pronounSwaps = {'me':'you', 'you':'me',
                          'my':'your', 'your':'my',
                          'myself':'yourself', 'yourself':'myself'};
    heard = swapWords(heard, pronounSwaps);

    // swap words for for '1' and '0.5'
    const numberSwaps = {' an ':' 1 ', ' a ':' 1 ', ' one ':' 1 ',
                         ' half an ':' 0.5 ', ' half a ':' 0.5 '};
    heard = swapWords(heard, numberSwaps);

    // get what and when to remind
    let regex = new RegExp("^(.+) (in|after) (.+) (minutes?|hours?|seconds?)$");
    // TODO: add "^(.+) at (.+) (o'clock)?$"
    let matches = heard.match(regex);
    let remindWhat, remindWhen, timeUnits;
    if (matches) {
      remindWhat = matches[1].replace(/^to /g,'');
      remindWhen = matches[3];
      timeUnits  = matches[4];

      if (timeUnits != 'seconds' && timeUnits != 'second') {
        // confirm reminder (but not if user specified in seconds)
        say("I'll remind you to " + remindWhat + ' in ' + remindWhen + ' ' + timeUnits + '.');
      }

      // set reminder time
      reminderTimer(remindWhat, remindWhen, timeUnits);

      currentConversationTopic = remindWhat;
      currentConversationType = 'reminder';

      return true;
    } else {
      return false;
    }
  }
  return false;
}

function reminderTimer(remindWhat, remindWhen, timeUnits) {
  // expecting: timeUnits = minute(s), hour(s), second(s)
  switch (timeUnits) {
    case 'minutes':
    case 'minute':
      remindWhen *= 60 * 1000;
      break;
    case 'hours':
    case 'hour':
      remindWhen *= 3600 * 1000;
      break;
    case 'seconds':
    case 'second':
      remindWhen *= 1000;
      break;
    default:
      remindWhen = 60000; // default to one minute
      break;
  }
  let unfamiliarUser = setTimeout(function(){
    say(remindWhat);
    // open Duck Duck Go timer (so user has to stop it)
    let duckduckgoURL = 'https://duckduckgo.com/?q=timer+1+s';
    tryOpeningWindow(duckduckgoURL);
  }, remindWhen);
}

function swapWords(sentence, dictionary) {
  let words = sentence.split(' ');
  for (let i in words) {
    let word = words[i];
    if (word in dictionary) words[i] = dictionary[word];
  }
  return words.join(' ');
}

function askingAnalogy(heard) {
  const regex1 = new RegExp("^what('?s| is| are) (an? |the )?(.+)( like)+?");
  const regex2 = new RegExp("^what('?s| is| are) (an? )?analog(y|ies) for (an? |the )?(.+)");
  const regex3 = new RegExp("^find (an? )?analog(y|ies) for (an? |the )?(.+)");
  let matches, words;
  matches = heard.match(regex1);
  if (matches) {
    words = matches[3];
    searchAnalogy(words);
    currentConversationTopic = words;
    currentConversationType = 'analogy';
    return true;
  }
  matches = heard.match(regex2);
  if (matches) {
    words = matches[5];
    searchAnalogy(words);
    currentConversationTopic = words;
    currentConversationType = 'analogy';
    return true;
  }
  matches = heard.match(regex3);
  if (matches) {
    words = matches[4];
    searchAnalogy(words);
    currentConversationTopic = words;
    currentConversationType = 'analogy';
    return true;
  }
  // otherwise
  return false;
}

function searchAnalogy(words) {
  say("I'm opening metamia.com for " + words + ' analogies.');
  tryOpeningWindow('http://www.metamia.com/analogize.php?q=' + words);
}

function askingHowDoI(heard) {
  if (didHear(heard,['how do ', 'show me how ', 'explain ', 'how can '],'starts with')) {
    topic = heard.replace(/^show me (a (youtube )?video (for|of) )?/,'');
    currentConversationTopic = topic;
    currentConversationType = 'how do i';
    say("I'm opening youtube for " + topic);
    tryOpeningWindow('https://www.youtube.com/results?search_query=' + topic);
    return true;
  }
  return false;
}

function askingLocation(heard) {
  if (didHear(heard, ['where is ', "where's ", 'wheres', 'where are ', 'find '], 'starts with')) {
    currentConversationType = 'location';
    searchLocation(heard);
    return true;
  }
  return false;
}

function searchLocation(heard) {

  let searchWords, regex, matches, searchFor, searchIn;

  // note: TRICKY!: check more restrictive first! (otherwise capture too much)

  // where is/are (there) ... in ...
  // https://www.google.com/maps/search/?api=1&query=pizza+seattle
  regex = new RegExp("^where (is|are) (there )?(.+) in (.+)");
  matches = heard.match(regex);
  if (matches) {
    searchFor = matches[3];
    searchIn = matches[4];
    // going to put this into the url:
    searchWords = searchFor + ' ' + searchIn;
  } else {

    // where is/are (the nearest) ...
    // https://www.google.com/maps/search/?api=1&query=seattle
    regex = new RegExp('^(find|where (is|are))( a|the nearest|the closest)? (.+)');
    matches = heard.match(regex);
    if (matches) {
      searchFor = matches[4];
      // going to put this into the url:
      searchWords = searchFor;
    }

  }

  // either way:
  if (matches) {
    currentConversationTopic = searchWords;
    // https://www.google.com/maps/search/?api=1&query={searchWords}
    let urlAPICall = 'https://www.google.com/maps/search/?api=1&query=';
    urlAPICall += searchWords;
    say("I'm now opening a Google maps results page for: " + searchFor + '.');
    tryOpeningWindow(urlAPICall);
    return true;
  }
  // otherwise
  return false;
}

function askingMath(heard) {
  let possibleExpression = heard.replace('what is ').replace("what's ").replace('whats');
  possibleExpression = possibleExpression.replace(/[,\\\/#!?$%\^&\*;:{}<>+=_`"~()]/g,''); // make safer
  const mathWords = {'one':'1','two':'2','three':'3','four':'4','five':'5',
                    'six':'6','seven':'7','eight':'8','nine':'9','zero':'0',
                    'ten':'10',
                    'eleven':'11','twelve':'12','thirteen':'13','fourteen':'14',
                    'fifteen':'15','sixteen':'16','seventeen':'17','eighteen':'18',
                    'nineteen':'19','twenty':'20','thirty':'30','fourty':'40',
                    'fifty':'50','sixty':'60','eighty':'80','ninety':'90',
                    //'hundred':'00','thousand':'000','million':'000000',
                    'and':'',
                    'point':'.','decimal':'.',
                    'plus':'+', 'minus':'-', 'divided by':'/', 'times':'*', 'multiplied by':'*', 'to the power of':'^'};
  for (let key in mathWords) {
    let toReplaceAllInstances = new RegExp(key, "g");
    possibleExpression = possibleExpression.replace(toReplaceAllInstances, mathWords[key]);
  }
  // TODO: split by spaces and check if pairs of current-adjacent words are integers or one of them equals 'and', then combine
  // TODO: if the second of the adjacent words is 'and', then add if the one after 'and' is also integer
  // TODO: if '#0' numbers then check if next word is also integer, then add values
  possibleExpression = possibleExpression.replace(/ /g,'');
  if (safeForMath(possibleExpression)) {
    currentConversationTopic = possibleExpression;
    currentConversationType = 'math';

    possibleExpression = eval(possibleExpression);
    say('The answer is: ' + possibleExpression.toString());
    return true;
  }
  return false;
}

function safeForMath(expression) {
  const mathy = '1234567890+-*/^';
  for (let i in expression) {
    let letter = expression[i];
    if (!mathy.includes(letter)) {
      return false;
    }
  }
  return true;
}

function askingShowMePicture(heard) { // make sure to check this AFTER checking "show me how"
  const signalPhrases = ['show ', 'what does ', 'what do '];
  if (didHear(heard,signalPhrases,'starts with')) {
    let regex, matches, what;

    // example: show me ... pictures
    // example: show me what a ... looks like
    // example: what does the ... look like
    regex = new RegExp('^(show (me )?(what )?|what (do |does )?)(an? |the )?(.+)( pictures?| images?| looks? like)$');
    // need $ to detect "show me pictures OF ..."
    matches = heard.match(regex);
    if (matches) {
      what = matches[6];
      searchPictures(what);
      return true;
    } else { // otherwise check more alternate phrasings

      // example: show me pictures of ...
      // example: show an example of ...
      regex = new RegExp('^show (me )?(an? )?((example|picture|image)s? )(of )?(.+)');
      matches = heard.match(regex);
      if (matches) {
        what = matches[matches.length-1]; // get last 'bracketed' item
        searchPictures(what);
        return true;
      }
    }

    return false;
  }
  return false;
}

function searchPictures(what) { // https://www.google.com/search?tbm=isch&safe=active&q=
  say("Here are some " + what.replace(/^the /,'') + " pictures.");
  let url = 'https://www.google.com/search?tbm=isch&safe=active&q=' + what;
  tryOpeningWindow(url);
}

function askingDefinition(heard) {
  const signalPhrases = ["what's ", 'whats', 'what is ', 'what are ', 'what was ', 'what were ',
                        "who's ", 'whos', 'who is ', 'who are ', 'who was ', 'who were ',
                        'tell me about ', 'define '];
  if (didHear(heard, signalPhrases, 'starts with')) {
    let words = removeSignalPhrases(heard,signalPhrases);
    // special case for name
    if (words === 'lui') {
      say("I am LUI. That's short for Language User Interface.");
      return true;
    }
    currentConversationType = 'definition';
    currentConversationTopic = words;
    searchDefinition(words);
    return true;
  }
  return false;
}

function searchDefinition(words) {
  // search wikipedia

  // let urlAPICall = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&exsentences=2&callback=?&titles=';
  let urlAPICall = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=2&exintro&explaintext=&indexpageids=true&format=json&generator=search&gsrlimit=1&callback=?&gsrsearch=';
  urlAPICall += words;
  // tryOpeningWindow(urlAPICall);
  $.getJSON(urlAPICall, function(data) {
    try {
      // wikipedia returns pages with page id's, so try to get the extract of the first one
      let pageInfo = Object.values(data.query.pages)[0];
      let summary = pageInfo.extract;
      let title = pageInfo.title;
      summary = summary.match(/\w.*? [a-z]+[.?!]/g)[0]; // get first sentence, but ignore abbreviation periods
      if (isSubstring(summary,'may refer to')) {
        say('"' + capitalizeFirstLetter(words) + '"' + " can mean a few different things. I'm opening the Wikipedia disambiguation page.")
        tryOpeningWindow('https://www.wikipedia.org/wiki/' + words);
      } else if (summary) {
        if (title.toLowerCase() != words) {
          summary = "I'm not sure if you're looking for this, but here's what I found: " + summary;
        }
        say(summary); // alert(Object.values(data.query.pages)[0].extract)
      }
    } catch(err) { // data.query, i.e. ['query'] not found
      // say("Sorry, I couldn't find anything on " + words);
      searchQuestion(words); // can't find definition --> generic search instead
    }
  });
}

function isSubstring(string, substring) {
  return string.indexOf(substring) !== -1;
}

function askingQuestion(heard) {
  const signalGenericQuestion = ['what ', 'who ', 'where ', 'when ', 'why ', 'how ', 'which ', 'search for '];
  if (didHear(heard, signalGenericQuestion, 'starts with')) {
    currentConversationType = 'question';
    currentConversationTopic = heard;
    searchQuestion(heard);
    return true;
  }
  return false;
}

function searchQuestion(heard) {
  // search duckduckgo

  // let urlAPICall = 'https://api.duckduckgo.com/?format=json&pretty=1&q=';
  let urlAPICall = 'https://api.duckduckgo.com/?q=';
  urlAPICall += heard;
  say("I'm now opening a search results page.");
  tryOpeningWindow(urlAPICall);

  // let urlAPICall = 'https://api.duckduckgo.com/?format=jsonp&pretty=1&q=';
  // urlAPICall += words;
  // // tryOpeningWindow(urlAPICall);
  // alert('right above getJSON')
  // $.getJSON(urlAPICall, function(data) {
  //   alert('got in')
  //   alert(data);
  //   // wikipedia returns pages with page id's, so try to get the extract of the first one
  //   // let page = Object.values(data.RelatedTopics)[0];
  //   // let summary = page.text;
  //   // let title = page.FirstURL.replace('https://duckduckgo.com/','').replace('_',' ');
  //   // if (title.toLowerCase() != words) say("I'm not sure this is what you're looking for, but here's what I found.")
  //   // say("duck duck go says: " + summary); // alert(Object.values(data.query.pages)[0].extract)
  // });
}
