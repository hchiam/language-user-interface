var delayedAction;

// automatically notify of internet connection
window.addEventListener('offline', function(e) { say("You've lost your internet connection."); });
window.addEventListener('online', function(e) { say("We're back online now."); });

function converse() {
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

  if (didHear(heard,['hi','hey','hello'])) {
    say(heard);
  } else if (didHear(heard,['hello world','anyone home','anyone there','anyone listening'])) {
    say('hi there');
  } else if (didHear(heard,["hi there",'hey there'])) {
    say('right back at you');
  } else if (didHear(heard,["is this thing on",'can you hear me',"does this thing work",'are you on right now'])) {
    say('yes');
  } else if (didHear(heard,['thanks','thank you'])) {
    say("you're welcome")
  } else if (didHear(heard,['thank you so much','thank you very much'])) {
    say("you're very welcome")
  } else {
    var sentence = "You said: " + heard + '...' + "Sorry, I currently don't have a pre-programmed response to that.";
    // need '...' to make an audible pause
    say(sentence);
  }
}
