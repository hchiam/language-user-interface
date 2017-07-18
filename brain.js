/*
Trying to understand this code?
The function converse() would be a good place to start.
*/

// automatically notify of internet connection
window.addEventListener('offline', function(e) { say("You've lost your internet connection."); });
window.addEventListener('online', function(e) { say("We're back online now."); });

function welcome() {
  var today = new Date()
  var currentHour = today.getHours()
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

var unfamiliarUser = setTimeout(function(){
  introSelf();
}, 7000);

function introSelf() {
  say("You seem unfamiliar with this interface. \
       You can type a question in the textbox. \
       Or, if you have speech recognition software, such as Mac Dictation, \
       you can enter text verbally into the textbox. \
       For example, you can ask me: 'Where are the closest restaurants?'.");
}

var delayedAction;

function converse() {
  clearTimeout(unfamiliarUser); // user is using the interface
  say(' '); // let user interrupt
  clearTimeout(delayedAction); // let user continue what they're saying
  delayedAction = setTimeout(function(){
    var heard = listen();
    if (heard) speak(heard);
    clearMessageHeardAlready();
  }, 5000);
}

function say(sentence) {
  responsiveVoice.speak(sentence, 'UK English Male');
}

function listen() {
  var heard = document.getElementById("input").value;
  // remove trailing/leading spaces, set to lowercase, and remove punctuation
  heard = heard.trim().toLowerCase();
  heard = heard.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/i,'');
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

function speak(heard) {
  // TODO: add more functionality
  // TODO: make more modular

  var heardRecognized = false;

  heardRecognized |= heardInterrupt(heard);
  heardRecognized |= heardPleasantries(heard);
  heardRecognized |= heardSearch(heard);

  if (!heardRecognized) {
    var sentence = "You said: " + heard + '...' + "Sorry, I currently don't have a pre-programmed response to that.";
    // need '...' to make an audible pause
    say(sentence);
  }
}

function clearMessageHeardAlready() {
  document.getElementById("input").value = '';
}

function didHear(heard, listOfChecks=[], checkType='exact match') {
  // using separate for-loops instead of checking checkType every time
  if (checkType === 'exact match') {
    for (var i in listOfChecks) {
      if (heard === listOfChecks[i]) return true;
    }
  } else if (checkType === 'starts with') {
    for (var i in listOfChecks) {
      if (heard.startsWith(listOfChecks[i])) { return true; }
    }
  } else if (checkType === 'ends with') {
    for (var i in listOfChecks) {
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
    say(heard);
    return true;
  } else if (heard === 'hi there') {
    say('right back at you');
    return true;
  } else if (didHear(heard,['hello world','anyone home','anyone there','anyone listening'])) {
    say('hi there');
    return true;
  } else if (didHear(heard,["is this thing on",'can you hear me',"does this thing work",'are you on right now'],'starts with')) {
    say('yes');
    return true;
  } else if (didHear(heard,["let's begin","let's start","let's get started"])) {
    say('Okay. What would you like to do?');
    return true;
  } else if (didHear(heard,['thanks','thank you'])) {
    say("you're welcome");
    return true;
  } else if (didHear(heard,['thank you so much','thank you very much'])) {
    say("you're very welcome");
    return true;
  } else if (didHear(heard,['goodbye','bye','byebye','see you','see you later'])) {
    say('farewell'); //  + '...Would you like me to shut down?'
    return true;
  }
  // otherwise
  return false;
}

function heardSearch(heard) {

  // first check special cases before more general cases
  if (askingWhoAreYou(heard)) return true;
  if (askingMyLocation(heard)) return true;
  if (askingTime(heard)) return true;
  if (askingMath(heard)) return true;
  if (askingWeather(heard)) return true;
  if (askingDirections(heard)) return true;
  if (askingReminder(heard)) return true;

  if (didHear(heard, ['where is ', "where's ", 'where are ', 'find '], 'starts with')) {
    searchLocation(heard);
    return true;
  }

  // check definition search (more slightly more general)
  const signalPhrases = ["what's ", 'what is ', 'what are ', 'what was ', 'what were ',
                        "who's ", 'who is ', 'who are ', 'who was ', 'who were ',
                        'search for ', 'tell me about '];
  if (didHear(heard, signalPhrases, 'starts with')) {
    var words = removeSignalPhrases(heard,signalPhrases);
    searchDefinition(words);
    return true;
  }

  // otherwise put the whole question into search engine (most general search)
  const signalGenericQuestion = ['what ', 'who ', 'where ', 'when ', 'why ', 'how ', 'which '];
  if (didHear(heard, signalGenericQuestion, 'starts with')) {
    searchQuestion(heard);
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
    // $.getJSON("http://ipinfo.io", function(response) {
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
                     'what time is it now',
                     'what is the time', 'what is the time right now',
                     "what's the time", "what's the time right now"])) {
    var d = new Date();
    var t = d.toLocaleTimeString();
    say('It is ' + t);
    return true;
  }
  // check date
  if (didHear(heard,["what's today's date", "what's the date today",
                     'what is the date today','what day is it today'])) {
    var d = new Date();
    var t = d.toDateString();
    say('It is ' + t);
    return true;
  }
  // otherwise
  return false;
}

function getLocation(func) { // e.g.: getLocation passes myLocation to getWeather(myLocation)

  var locationFull;

  if (navigator.geolocation === undefined) {
    alert("Sorry, I'm unable to use geolocation in this browser. Try another browser.")
  } else {
    say('please authorize geolocation');

    // get location latitude and longitude
    navigator.geolocation.getCurrentPosition(function(position) {
        var lat = position.coords.latitude;
        var long = position.coords.longitude;

        // get location address
        var urlAPICall = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + long;
        $.getJSON(urlAPICall, function(response){

            if (response.status != 'OK') {
              say("Sorry, I couldn't locate our current position.");
            } else {

                // set up for getting the parts we want
                var resultObject = response.results[0].address_components;
                var locationFull = '';
                var city, adminAreaLvl1, country;

                // get the parts we want
                for (var i in resultObject) {
                  // put together full location description
                  locationFull += resultObject[i].long_name + ',';
                  // check location component types
                  var types = resultObject[i].types;
                  for (var j in types) {
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
                  say("we're in " + myLocation);
                  // say("we're at " + locationFull);
                }

            }

        });

    });

  }

}

function askingWeather(heard) {
  if (didHear(heard,["how's the weather","how's the weather today","what's the weather like today","what is the weather like today"])) {
    // getLocation will pass myLocation to the function getWeather(myLocation)
    getLocation(getWeather);
    return true;
  }
  return false;
}

function getWeather(myLocation) {
  // get weather statement for that location
  var urlAPICall = "https://query.yahooapis.com/v1/public/yql?q=select item.condition.text from weather.forecast where woeid in (select woeid from geo.places(1) where text='" + myLocation + "')&format=json";
  $.getJSON(urlAPICall, function(data) {
    // respond with weather statement for that location
    var weatherDescription = data.query.results.channel.item.condition.text;
    say("it's " + weatherDescription + ' around ' + myLocation);
    // var wind = data.query.results.channel.wind;
    // alert(data.query);
    // say(wind.chill);
  });
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
  var matchFound = [];
  var searchFor;
  for (var i in regex) {
    matchFound[i] = heard.match(regex[i])
    if (matchFound[i]) {
      searchFor = matchFound[i][matchFound[i].length-1];
      // go to map
      // https://www.google.com/maps/dir/here/{searchFor}
      var urlAPICall = 'https://www.google.com/maps/dir/here/';
      urlAPICall += searchFor.replace(' ','+');
      say("I'm now opening a Google maps results page for the closest " + searchFor);
      window.open(urlAPICall);
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
    var regex = new RegExp("^(.+) in (.+) (minutes?|hours?|seconds?)$");
    // TODO: add "^(.+) at (.+) (o'clock)?$"
    matches = regex.test(heard);
    var remindWhat, remindWhen, timeUnits;
    if (matches) {
      remindWhat = heard.match(regex)[1].replace(/^to /g,'');
      remindWhen = heard.match(regex)[2];
      timeUnits  = heard.match(regex)[3];

      if (timeUnits != 'seconds' && timeUnits != 'second') {
        // confirm reminder (but not if user specified in seconds)
        say("I'll remind you to " + remindWhat + ' in ' + remindWhen + ' ' + timeUnits);
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
  var unfamiliarUser = setTimeout(function(){
    say(remindWhat)
  }, remindWhen);
}

function swapWords(sentence, dictionary) {
  var words = sentence.split(' ');
  for (var i in words) {
    var word = words[i];
    if (word in dictionary) words[i] = dictionary[word];
  }
  return words.join(' ');
}

function askingMath(heard) {
  var possibleExpression = heard.replace('what is ').replace("what's ");
  possibleExpression = possibleExpression.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/i,''); // make safer
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
  for (var key in mathWords) {
    var toReplaceAllInstances = new RegExp(key, "g");
    possibleExpression = possibleExpression.replace(toReplaceAllInstances, mathWords[key]);
  }
  // TODO: split by spaces and check if pairs of current-adjacent words are integers or one of them equals 'and', then combine
  // TODO: if the second of the adjacent words is 'and', then add if the one after 'and' is also integer
  // TODO: if '#0' numbers then check if next word is also integer, then add values
  possibleExpression = possibleExpression.replace(/ /g,'');
  if (safeForMath(possibleExpression)) {
    possibleExpression = eval(possibleExpression);
    say('the answer is: ' + possibleExpression.toString());
    return true;
  }
  return false;
}

function safeForMath(expression) {
  const mathy = '1234567890+-*/^';
  for (var i in expression) {
    var letter = expression[i];
    if (!mathy.includes(letter)) {
      return false;
    }
  }
  return true;
}

function removeSignalPhrases(heard, signalPhrases) {
  // find first match for start of sentence, remove, and stop checking
  for (var i in signalPhrases) {
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

  var searchWords, regex, matches, searchFor, searchIn;

  // note: TRICKY!: check more restrictive first! (otherwise capture too much)

  // where is/are (there) ... in ...
  // https://www.google.com/maps/search/?api=1&query=pizza+seattle
  regex = new RegExp("^where (is|are) (there )?(.+) in (.+)");
  matches = regex.test(heard);
  if (matches) {
    searchFor = heard.match(regex)[3];
    searchIn = heard.match(regex)[4];
    // going to put this into the url:
    searchWords = searchFor + ' ' + searchIn;
  } else {

    // where is/are (the nearest) ...
    // https://www.google.com/maps/search/?api=1&query=seattle
    regex = new RegExp('^(find|where (is|are))( a|the nearest|the closest)? (.+)');
    matches = regex.test(heard);
    if (matches) {
      searchFor = heard.match(regex)[4];
      // going to put this into the url:
      searchWords = searchFor;
    }

  }

  // either way:
  if (matches) {
    // https://www.google.com/maps/search/?api=1&query={searchWords}
    var urlAPICall = 'https://www.google.com/maps/search/?api=1&query=';
    urlAPICall += searchWords;
    say("I'm now opening a Google maps results page for: " + searchFor);
    window.open(urlAPICall);
    return true;
  }
  // otherwise
  return false;
}

function searchDefinition(words) {
  // search wikipedia

  // var urlAPICall = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&exsentences=1&callback=?&titles=';
  var urlAPICall = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=1&exintro&explaintext=&indexpageids=true&format=json&generator=search&gsrlimit=1&callback=?&gsrsearch=';
  urlAPICall += words;
  // window.open(urlAPICall);
  $.getJSON(urlAPICall, function(data) {
    // wikipedia returns pages with page id's, so try to get the extract of the first one
    var pageInfo = Object.values(data.query.pages)[0];
    var summary = pageInfo.extract;
    var title = pageInfo.title;
    if (summary) {
      if (title.toLowerCase() != words) say("I'm not sure if you're looking for this, but here's what I found.")
      say(summary); // alert(Object.values(data.query.pages)[0].extract)
    }
  });
}

function searchQuestion(heard) {
  // search duckduckgo

  // var urlAPICall = 'https://api.duckduckgo.com/?format=json&pretty=1&q=';
  var urlAPICall = 'https://api.duckduckgo.com/?q=';
  urlAPICall += heard;
  say("I'm now opening a search results page.");
  window.open(urlAPICall);

  // var urlAPICall = 'http://api.duckduckgo.com/?format=jsonp&pretty=1&q=';
  // urlAPICall += words;
  // // window.open(urlAPICall);
  // alert('right above getJSON')
  // $.getJSON(urlAPICall, function(data) {
  //   alert('got in')
  //   alert(data);
  //   // wikipedia returns pages with page id's, so try to get the extract of the first one
  //   // var page = Object.values(data.RelatedTopics)[0];
  //   // var summary = page.text;
  //   // var title = page.FirstURL.replace('https://duckduckgo.com/','').replace('_',' ');
  //   // if (title.toLowerCase() != words) say("I'm not sure this is what you're looking for, but here's what I found.")
  //   // say("duck duck go says: " + summary); // alert(Object.values(data.query.pages)[0].extract)
  // });
}
