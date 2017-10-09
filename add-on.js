function heardAddOns(heard) {
  // this should overwrite the function in brain.js
  let heardRecognized = false;
  heardRecognized |= heardNumberGuessGame(heard); if (heardRecognized) return true;
  heardRecognized |= heardTranslator(heard); if (heardRecognized) return true;
  heardRecognized |= heardProgram(heard); if (heardRecognized) return true;
  return false;
}

let numberToGuess;
function heardNumberGuessGame(heard) {
  if (heard.includes("number guessing game")) {
    currentConversationType = "number guessing game";
    numberToGuess = Math.floor(Math.random()*100 + 1);
    say("I'm thinking of a number between 1 and 100. Guess my number.");
    return true;
  } else if (currentConversationType === "number guessing game") {
    if (didHear(heard,['no',"let's stop playing","never mind"])) {
      // "turn off" the game
      currentConversationType = '';
      say('Okay. What would you like to do instead?');
      createSuggestionMessage(["What can you do?"]);
    } else if (isNaN(heard)) {
      say('Please give me a number.');
    } else {
      if (parseInt(heard) === numberToGuess) {
        say("You got it! My number was " + numberToGuess + '. What would you like to do now?');
        // "turn off" the game
        currentConversationType = '';
      } else if (parseInt(heard) < numberToGuess) {
        say("It's higher than " + heard + '.');
      } else if (parseInt(heard) > numberToGuess) {
        say("It's lower than " + heard + '.');
      }
    }
    return true;
  }
  // otherwise
  return false;
}

function heardTranslator(heard) {
  if (heard.startsWith('translate ')) {
    let english = heard.replace('translate ', '');
    // allow for context
    if (currentConversationTopic !== '' && english === "that") {
      english = currentConversationTopic;
    }
    currentConversationType = "translate";
    currentConversationTopic = english;
    let url = "https://coglang-translator.glitch.me/" + english;
    $.getJSON(url, function(translations) {
      if (translations.long) {
        var long = translations.long;
        var short = translations.short;
        sayWithEsp(short);
      } else {
        say("Sorry, I couldn't find a translation for that.");
      }
    });
    return true; // did hear, just need to wait for web API response
  }
  // otherwise
  return false;
}

function spellLikeEsp(sentence) {
  let converted = '';
  let letter = '';
  for (var i in sentence) {
    letter = sentence[i];
    if (letter === 'c') {
      converted += 'sx';
    } else if (letter === 'j') {
      converted += 'jx';
    } else if (letter === 'y') {
      converted += 'j';
    } else if (letter === 'h') {
      converted += 'hx';
    } else {
      converted += letter;
    }
  }
  return converted;
}

function sayWithEsp(sentence) {
  if (sentence != '') {

    if (!('webkitSpeechRecognition' in window)) {
      // in case not using chrome
      responsiveVoice.speak(spellLikeEsp(sentence), 'Esperanto Male');
    } else {
      clicked();
      recognition.stop();
      responsiveVoice.speak(spellLikeEsp(sentence), 'Esperanto Male', {onend: listenAgain});
    }

    updateMessageLog(sentence, 'LUI');
    document.getElementById("input").focus(); // put cursor back
  }
}

let pointer = 0;
let programString = "";
function heardProgram(heard) {
  if (didHear(heard,["let's program",'program'],'starts with')) {
    currentConversationType = 'program';
    $('#programming-area').css('visibility','visible');
    say('What would you like to program in JavaScript?');
    return true;
  } else if (currentConversationType === 'program') {
    if (didHear(heard,['stop',"let's stop","never mind"],'starts with')) {
      // exit from programming
      currentConversationType = '';
      $('#programming-area').css('visibility','collapse');
      say('Okay. What would you like to do instead?');
      createSuggestionMessage(["What can you do?"]);
    } else if (didHear(heard,['clear everything','delete everything'])) {
      // clear and
      // exit from programming
      currentConversationType = '';
      programString = "";
      $('#programming-area').text('');
      $('#programming-area').css('visibility','collapse');
      say('Okay. What would you like to do instead?');
      createSuggestionMessage(["What can you do?"]);
    } else {
      // TODO: program different things
      program(heard);
    }
    return true;
  }
  // otherwise
  return false;
}

function makeSaferForHTML(string) {
  return string.replace(/[,\\\/#!?$%\^&\*;:{}<>=`"~()]/g,'');
}

function updateProgrammingAreaDisplay() {
  // to avoid managing <br/> in strings and for easier use of a pointer
  $('#programming-area').html(programString.replace(/\n/g,"<br/>"));
}

function programInsert(what, where) {
  // for easier use of a pointer
  let before = programString.substr(0,where);
  let after = programString.substr(where);
  programString = before + what + after;
  updateProgrammingAreaDisplay();
}

function userEditedCode() {
  programString = $('#programming-area').text();
}

// affect interface.html and
// say('...');
function program(heard) {
  loop(heard);
  comment(heard);
  notify(heard); // -> alert(...)
  variable(heard);
  // if
  // define function
  // use function
  escapeNextBrace(heard);
  runProgram(heard);
}

function loop(heard) {
  let matches = heard.match(RegExp("loop through (.+)"));
  if (matches) {
    currentConversationTopic = matches[0];
    var loop = "for (let i=0; i&lt;" + makeSaferForHTML(matches[1].replace(/ /g,'_')) + ".length; i++) {\n\n}\n";
    programInsert(loop,pointer);
    pointer += loop.length - 3; // stay inside braces
  } else if (heard.includes('loop')) {
    say("Please say something like: 'loop through object'.");
  }
}

function comment(heard) {
  let matches = heard.match(RegExp("comment (.+)"));
  if (matches) {
    currentConversationTopic = 'comment';
    var comment = "// " + makeSaferForHTML(matches[1]) + "\n";
    programInsert(comment,pointer);
    pointer += comment.length;
  }
}

function notify(heard) {
  let matches = heard.match(RegExp("alert (.+)"));
  if (matches) {
    currentConversationTopic = matches[0];
    var alert = "alert(" + makeSaferForHTML(matches[1]) + ");\n";
    programInsert(alert,pointer);
    pointer += alert.length;
    // TODO: string? variables?
  }
}

function variable(heard) {
  let matches = heard.match(RegExp("(assign|let)( to)? (.+) (equals?|the value( of)?) (.+)"));
  if (matches) {
    var assignTo = makeSaferForHTML(matches[3].replace(/ /g,'_'));
    var assignWhat = makeSaferForHTML(matches[matches.length-1].replace(/ /g,'_'));
    currentConversationTopic = 'assign ' + assignTo;
    var assign = "let " + assignTo + " = " + assignWhat + ";\n";
    programInsert(assign,pointer);
    pointer += assign.length;
  } else {
    // did not pass previous check
    let matches = heard.match(RegExp("(variable|let) (.+)$"));
    if (matches) {
      currentConversationTopic = matches[0];
      var variable = "let " + makeSaferForHTML(matches[2].replace(/ /g,'_')) + ";\n";
      programInsert(variable,pointer);
      pointer += variable.length;
    }
  }
}

function escapeNextBrace(heard) {
  if (heard.startsWith('escape brace')) {
    pointer = programString.substring(0,pointer).length + programString.substring(pointer).indexOf("}\n") + 2;
    say("Escaped a brace.");
  }
}

function runProgram(heard) {
  if (heard === 'run program') {
    say("Running program.");
    eval(programString);
  }
}
