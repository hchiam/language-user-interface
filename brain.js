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
  say(' '); // stop talking, so user can interrupt
  clearTimeout(delayedAction); // reset if still typing
  delayedAction = setTimeout(function(){
    var heard = listen();
    if (heard) {
      speak(heard);
      clearMessageHeardAlready();
    }
  }, 2000);
}

function listen() {
  var heard = document.getElementById("input").value;
  return heard;
}

function clearMessageHeardAlready() {
  document.getElementById("input").value = '';
}

function say(sentence) {
  responsiveVoice.speak(sentence, 'UK English Male');
}

function didHear(heard, listOfChecks=[], checkType='exactly') {
  for (var i in listOfChecks) {
    if (checkType === 'exactly' && heard === listOfChecks[i]) { return true; }
    else if (checkType === 'starts with' && heard.startsWith(listOfChecks[i])) { return true; }
    else if (checkType === 'ends with' && heard.endsWith(listOfChecks[i])) { return true; }
  }
  return false;
}

function speak(heard) {
  // TODO: add more functionality
  // TODO: make more modular

  // remove trailing/leading spaces, set to lowercase, and remove punctuation
  heard = heard.trim().toLowerCase();
  heard = heard.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/i,"");

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

function heardInterrupt(heard) {
  if (didHear(heard,['okay','ok','stop',"that's enough",'enough'])) {
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
  } else if (didHear(heard,["hi there",'hey there'])) {
    say('right back at you');
    return true;
  } else if (didHear(heard,["is this thing on",'can you hear me',"does this thing work",'are you on right now'])) {
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
  const signalPhrases = ["what's ", 'what is ', 'what are ', 'what was ', 'what were ',
                        "who's ", 'who is ', 'who are ', 'who was ', 'who were ',
                        'search for ']
  if (didHear(heard, signalPhrases, 'starts with')) {
    var words = removeSignalPhrase(heard,signalPhrases);
    search(words);
    return true;
  }
  // otherwise
  return false;
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

function search(words) {

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
    if (title.toLowerCase() != words) say("I'm not sure this is what you're looking for, but here's what I found.")
    say(summary); // alert(Object.values(data.query.pages)[0].extract)
  });

  // TODO: search duckduckgo

}
