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

function speak(heard) {
  // TODO: add more functionality
  // TODO: make more modular

  // remove trailing/leading spaces, set to lowercase, and remove punctuation
  heard = heard.trim().toLowerCase();
  heard = heard.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/i,"");

  if (heard == "hello" || heard == "hi" || heard == "hey") {
    say(heard);
  } else if (heard == "hello world" || heard == 'anyone home') {
    say('hi there');
  } else if (heard == "hi there") {
    say('right back at you');
  } else if (heard == "is this thing on" || heard == "can you hear me" || heard == "does this thing work") {
    say('yes');
  } else if (heard == 'thanks' || heard == 'thank you') {
    say("you're welcome")
  } else if (heard == 'thank you so much' || heard == 'thank you very much') {
    say("you're very welcome")
  } else {
    var sentence = "You said: " + heard;
    say(sentence);
  }
}
