/*
Trying to understand this code?
The function converse() would be a good place to start.
*/

// TODO: track conversation topic and type to make things more two-way conversational
let currentConversationTopic, currentConversationType;

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
  say("You seem unfamiliar with this interface. \
       You can type a question in the textbox. \
       For example, you can ask me: 'Where are the closest restaurants?' \
       Alternatively, if you have speech recognition software, \
       such as Mac Dictation, \
       you can enter text verbally into the textbox.");
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
    // create message
    let nextMessage = '<p' + id + '>' + message + '</p>';
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

function say(sentence) {
  responsiveVoice.speak(sentence, 'UK English Male');
  updateMessageLog(sentence, 'LUI');
  document.getElementById("input").focus(); // put cursor back
}

function listen() {
  let heard = document.getElementById("input").value;
  // remove trailing/leading spaces, set to lowercase, and remove punctuation
  heard = heard.trim().toLowerCase();
  heard = heard.replace(/[.,\/#!?$%\^&\*;:{}<>+=\-_`"~()]/g,'');
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

function reply(heard) {
  // TODO: add more functionality
  // TODO: make more modular

  let heardRecognized = false;

  heardRecognized |= heardInterrupt(heard);
  heardRecognized |= heardPleasantries(heard);
  heardRecognized |= heardScheduler(heard);
  heardRecognized |= heardSearch(heard);

  if (!heardRecognized) {
    let sentence = "Sorry, I didn't understand that.";
    // need '...' to make an audible pause
    say(sentence);
    setTimeout(function(){
      let suggestFeature = "Here's a page to suggest features or comment on bugs. \
                            Click on the \"new issue\" button.";
      say(suggestFeature);
      tryOpeningWindow('https://github.com/hchiam/language-user-interface/issues');
    },2000);
  }
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

function heardInterrupt(heard) {
  if (didHear(heard,['okay','ok','stop',"that's enough",'enough','alright',''])) { // '' in case just spaces entered
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
  } else if (didHear(heard,["let's begin","let's start","let's get started"])) {
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

function heardScheduler(heard) { // https://doodle.com/create?title=
  let regex = new RegExp("^(let's )?(plan|schedule) (a )?(.+)");
  let matches = heard.match(regex);
  if (matches) {
    let title = matches[4];
    say("I'm starting a scheduler for you on Doodle.com.");
    tryOpeningWindow('https://doodle.com/create?title=' + title);
    return true;
  }
  return false;
}

function heardSearch(heard) {

  // first check special cases before more general cases
  if (askingWhoAreYou(heard)) return true;
  if (askingMyLocation(heard)) return true; // maps.googleapis.com (ipinfo.io)
  if (askingTime(heard)) return true;
  if (askingMath(heard)) return true;
  if (askingWeather(heard)) return true; // query.yahooapis.com and maps.googleapis.com
  if (askingDirections(heard)) return true; // google.com/maps/dir
  if (askingReminder(heard)) return true;
  if (askingAnalogy(heard)) return true; // metamia.com
  if (askingHowDoI(heard)) return true; // youtube.com

  if (didHear(heard, ['where is ', "where's ", 'where are ', 'find '], 'starts with')) {
    searchLocation(heard); // google.com/maps/search
    return true;
  }

  // check definition search (more slightly more general)
  const signalPhrases = ["what's ", 'what is ', 'what are ', 'what was ', 'what were ',
                        "who's ", 'who is ', 'who are ', 'who was ', 'who were ',
                        'search for ', 'tell me about '];
  if (didHear(heard, signalPhrases, 'starts with')) {
    let words = removeSignalPhrases(heard,signalPhrases);
    searchDefinition(words); // wikipedia.org
    return true;
  }

  // otherwise put the whole question into search engine (most general search)
  const signalGenericQuestion = ['what ', 'who ', 'where ', 'when ', 'why ', 'how ', 'which ', 'show me '];
  if (didHear(heard, signalGenericQuestion, 'starts with')) {
    searchQuestion(heard); // api.duckduckgo.com
    return true;
  }

  // otherwise prolly not a question
  return false;
}

function askingWhoAreYou(heard) {
  if (didHear(heard,['who are you','what are you'])) {
    say("My name is LUI. That's short for Language User Interface.");
    return true;
  } else if (heard === 'are you jarvis') {
    say("Not exactly. My name is LUI. But I am a Language User Interface.");
    return true;
  } else if (heard === 'are you like jarvis') {
    say("Sort of. My name is LUI. A Language User Interface.");
    return true;
  }
  return false;
}

function askingMyLocation(heard) {
  if (didHear(heard,['where am i','where are we'])) {
    // // keep for reference:
    // $.getJSON("https://ipinfo.io", function(response) {
    //   say("I am detecting that we're around " + response.city);
    // });
    getLocation();
    return true;
  }
  return false;
}

function askingTime(heard) {
  // check time
  if (didHear(heard,['what time is it', 'what time is it right now',
                     'what time is it now', "what time's it",
                     'what is the time', 'what is the time right now',
                     "what's the time", "what's the time right now"])) {
    let d = new Date();
    let t = d.toLocaleTimeString();
    say('It is ' + t);
    return true;
  }
  // check date
  if (didHear(heard,["what's today's date", "what's the date today",
                     'what is the date today','what day is it today'])) {
    let d = new Date();
    let t = d.toDateString();
    say('It is ' + t);
    return true;
  }
  // otherwise
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

function askingWeather(heard) {
  // general weather description
  let regexHow = new RegExp("^how('s| is)? (the )?(weather|forecast)( like)?( today)?( like)?");
  let regexWhat = new RegExp("^what('s| is)? (the )?(weather|forecast)( like( today)?| today( like)?)");
  // TODO: add "^(.+) at (.+) (o'clock)?$"
  matches = regexHow.test(heard) || regexWhat.test(heard);
  if (matches) {
    // getLocation will pass myLocation to the function getWeather(myLocation)
    getLocation(getWeather);
    return true;
  }

  // temperature
  let regexTemp = new RegExp("^(how|what)('s| is) (the )?temperature( like)?( today)?( like)?");
  // TODO: add "^(.+) at (.+) (o'clock)?$"
  matches = regexTemp.test(heard);
  if (matches) {
    // getLocation will pass myLocation to the function getWeather(myLocation)
    getLocation(getTemperature);
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
      // go to map
      // https://www.google.com/maps/dir/here/{searchFor}
      let urlAPICall = 'https://www.google.com/maps/dir/here/';
      urlAPICall += searchFor.replace(' ','+');
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

    // get what and when to remind
    let regex = new RegExp("^(.+) in (.+) (minutes?|hours?|seconds?)$");
    // TODO: add "^(.+) at (.+) (o'clock)?$"
    let matches = heard.match(regex);
    let remindWhat, remindWhen, timeUnits;
    if (matches) {
      remindWhat = matches[1].replace(/^to /g,'');
      remindWhen = matches[2];
      timeUnits  = matches[3];

      if (timeUnits != 'seconds' && timeUnits != 'second') {
        // confirm reminder (but not if user specified in seconds)
        say("I'll remind you to " + remindWhat + ' in ' + remindWhen + ' ' + timeUnits + '.');
      }

      // set reminder time
      reminderTimer(remindWhat, remindWhen, timeUnits);

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
      remindWhen *= 60 * 1000;
      break;
    case 'hours':
      remindWhen *= 3600 * 1000;
      break;
    case 'seconds':
      remindWhen *= 1000;
      break;
    default:
      remindWhen = 60000; // default to one minute
      break;
  }
  let unfamiliarUser = setTimeout(function(){
    say(remindWhat)
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

function askingMath(heard) {
  let possibleExpression = heard.replace('what is ').replace("what's ");
  possibleExpression = possibleExpression.replace(/[.,\/#!?$%\^&\*;:{}<>+=\-_`"~()]/g,''); // make safer
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

function askingAnalogy(heard) {
  const regex1 = new RegExp("^what('s| is) (an? |the )?(.+)( like)+?");
  const regex2 = new RegExp("^what('s| is) (an? )?analogy for (an? )?(.+)");
  const regex3 = new RegExp("^find (an? )?analogy for (an? )?(.+)");
  let matches, words;
  matches = heard.match(regex1);
  if (matches) {
    searchAnalogy(matches[3]);
    return true;
  }
  matches = heard.match(regex2);
  if (matches) {
    searchAnalogy(matches[4]);
    return true;
  }
  matches = heard.match(regex3);
  if (matches) {
    searchAnalogy(matches[3]);
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
  if (didHear(heard,['how do ', 'show me ', 'explain '],'starts with')) {
    heard = heard.replace('show me ','');
    say("I'm opening youtube for " + heard);
    tryOpeningWindow('https://www.youtube.com/results?search_query=' + heard);
    return true;
  }
  return false;
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

function searchDefinition(words) {
  // search wikipedia

  // let urlAPICall = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&exsentences=1&callback=?&titles=';
  let urlAPICall = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=1&exintro&explaintext=&indexpageids=true&format=json&generator=search&gsrlimit=1&callback=?&gsrsearch=';
  urlAPICall += words;
  // tryOpeningWindow(urlAPICall);
  $.getJSON(urlAPICall, function(data) {
    try {
      // wikipedia returns pages with page id's, so try to get the extract of the first one
      let pageInfo = Object.values(data.query.pages)[0];
      let summary = pageInfo.extract;
      let title = pageInfo.title;
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
      say("Sorry, I couldn't find anything on " + words);
    }
  });
}

function isSubstring(string, substring) {
  return string.indexOf(substring) !== -1;
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
