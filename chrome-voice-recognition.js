// ----------------------------

////////// WEBKIT SPEECH RECOGNITION API:

/* for reference:
 * https://codepen.io/hchiam/pen/gGamzv
 */

// set up

var language = 'en-US';

var final_transcript = '';
var recognizing = false;
var ignore_onend;

var recognition;

setUp_webkitSpeechRecognition();

function setUp_webkitSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    // alert('Web Speech API is not supported by this browser. Try Chrome version 25 or later.');
  } else {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;

    recognition.onstart = function() {
      recognizing = true;
    };

    recognition.onerror = function(event) {
      if (event.error == 'no-speech' || event.error == 'audio-capture' || event.error == 'not-allowed') {
        ignore_onend = true;
      }
    };

    recognition.onend = function() {
      recognizing = false;
      if (ignore_onend || !final_transcript) {
        return;
      }
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
        var range = document.createRange();
        range.selectNode(document.getElementById('input'));
        window.getSelection().addRange(range);
      }
    };

    recognition.onresult = function(event) {
      if (typeof(event.results) == 'undefined') {
        recognition.onend = null;
        recognition.stop();
        return;
      }
      final_transcript = ''; // reset to remove previous input
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        }
      }
      document.getElementById("input").value = final_transcript;
      converse(); // trigger LUI action
    };
  }
}

// start listening right away, so it's completely hands-free
toggleStart_webkitSpeechRecognition();

function toggleStart_webkitSpeechRecognition() {
  if (recognizing) {
    recognition.stop();
    return;
  }
  final_transcript = '';
  recognition.lang = language;
  recognition.start();
  ignore_onend = false;
  document.getElementById("input").value = '';
}

// edit function from https://github.com/hchiam/language-user-interface/blob/master/brain.js
function say(sentence) {
  if (sentence != '') {

    if (recognizing) {
      clicked();
      recognition.stop();
    }
    responsiveVoice.speak(sentence, 'UK English Male', {onend: listenAgain});

    updateMessageLog(sentence, 'LUI');
    document.getElementById("input").focus(); // put cursor back
  }
}

function listenAgain() {
  recognition.start();
  final_transcript = '';
}
