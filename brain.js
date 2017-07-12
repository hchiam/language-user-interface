var delayedAction;

function converse() {
  clearTimeout(delayedAction); // reset if still typing
  delayedAction = setTimeout(function(){
    var heard = listen();
    if (heard) speak(heard);
  }, 2000);
}

function listen() {
  var heard = document.getElementById("input").value;
  return heard;
}

function speak(heard) {
  // TODO: add more functionality
  var say = "You said: " + heard;
  responsiveVoice.speak(say, 'UK English Male');
}
