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

var delayedAction;

function converse() {
  say(' '); // let user interrupt
  clearTimeout(delayedAction); // let user continue what they're saying
  delayedAction = setTimeout(function(){
    var heard = listen();
    if (heard) {
      speak(heard);
      clearMessageHeardAlready();
    }
  }, 2000);
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
  return heard;
}

function removeOKLouis(heard) {
  heard = heard.replace(' louis ', ' lui ');
  const toReplace = ['okay lui ', 'ok lui ', 'hi lui ', 'hey lui ', 'hello lui ', 'alright lui '];
  for (var i in toReplace) {
    if (heard.startsWith(toReplace[i])) return heard.replace(toReplace[i],'');
  }
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
  if (askingLocation(heard)) return true;
  if (askingTime(heard)) return true;
  if (askingMath(heard)) return true;

  // check definition search (more slightly more general)
  const signalPhrases = ["what's ", 'what is ', 'what are ', 'what was ', 'what were ',
                        "who's ", 'who is ', 'who are ', 'who was ', 'who were ',
                        'search for ', 'tell me about '];
  if (didHear(heard, signalPhrases, 'starts with')) {
    var words = removeSignalPhrase(heard,signalPhrases);
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
    say("I am LUI. That's short for Language User Interface.");
    return true;
  } else if (heard === 'are you jarvis') {
    say("Not exactly. I'm LUI. But I am a Language User Interface.");
    return true;
  } else if (heard === 'are you like jarvis') {
    say("Sort of. I'm LUI. A Language User Interface.");
    return true;
  }
  return false;
}

function askingLocation(heard) {
  if (didHear(heard,['where am i','where are we'])) {
    $.getJSON("http://ipinfo.io", function(response) {
      say("My sensors are detecting that we're around " + response.city);
    });
    return true;
  }
  return false;
}

function askingTime(heard) {
  // check time
  if (didHear(heard,['what time is it','what time is it right now'])) {
    var d = new Date();
    var t = d.toLocaleTimeString();
    say('It is ' + t);
    return true;
  }
  // check date
  if (didHear(heard,["what's today's date", "what's the date today",'what is the date today','what day is it today'])) {
    var d = new Date();
    var t = d.toDateString();
    say('It is ' + t);
    return true;
  }
  // otherwise
  return false;
}

function askingMath(heard) {
  var possibleExpression = heard.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/i,''); // make safer
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

function removeSignalPhrase(heard, signalPhrases) {
  var words = heard;
  for (var i in signalPhrases) {
    var toRemove = new RegExp('^'+signalPhrases[i]+'+');
    words = words.replace(toRemove,'');
    // remove initial 'a'
    words = words.replace(/^a +/,'');
  }
  return words;
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
  // TODO: search duckduckgo

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
