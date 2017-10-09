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
let variableList = {};
function heardProgram(heard) {
  if (didHear(heard,["let's program",'program'],'starts with')) {
    currentConversationType = 'program';
    $('#programming-area').css('visibility','visible');
    say('What would you like to program in JavaScript?');
    return true;
  } else if (heard.includes("edit your code") || heard.includes("modify your code")) {
    currentConversationType = 'program';
    showAddOnCode();
    $('#programming-area').css('visibility','visible');
    say("Here you go.");
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

function showAddOnCode() {
  var client = new XMLHttpRequest();
  client.open('GET', 'add-on.js');
  client.onreadystatechange = function() {
    programString = client.responseText;
    updateProgrammingAreaDisplay();
  }
  client.send();
}

function makeSaferForHTML(string) {
  return string.replace(/[,\\\/#!?$%\^&\*;:{}<>=`"~()]/g,'');
}

function updateProgrammingAreaDisplay() {
  // to avoid managing <br/> in strings and for easier use of a pointer
  $('#programming-area').html(programString.replace(/\n/g, "<br/>"));
}

function programInsert(what, where) {
  // for easier use of a pointer
  let before = programString.substr(0,where);
  let after = programString.substr(where);
  programString = before + what + after;
  updateProgrammingAreaDisplay();
}

function userEditedCode() {
  // .text() removes new lines, so have to do this instead:
  programString = $('#programming-area').html()
    .replace("<br>", '\n')
    .replace('<span id="programming-area" style="visibility: visible;" contenteditable="true">')
    .replace("<br></span>");
}

// affect interface.html and
// say('...');
function program(heard) {
  loop(heard);
  comment(heard);
  notify(heard); // -> alert(...)
  variableCreate(heard); // create variable --> "let "
  variableUse(heard); // variable ... ... --> "..._... "
  // TODO: ifStatement(heard); // if --> "if(" (for composing statements)
  // TODO: functionCreate(heard); // create function ... --> "function ...(*) {\n\n}" (* = pointer)
  // TODO: functionUse(heard); // function ... --> "...(" (for composing statements)
  newLine(heard);
  specialCharacters(heard);
  escapeNextBrace(heard);
  runProgram(heard);
}

function loop(heard) {
  let matches = heard.match(RegExp("loop( backwards?)? through (.+)( backwards?)?"));
  if (matches) {
    currentConversationTopic = matches[0];
    let what = matches[2];
    let loop = "for (";
    // check if looping backwards/forwards
    if (matches[1] || matches[3]) {
      // backwards
      loop += "let i=" + makeSaferForHTML(what.replace(/ /g,'_')) + ".length-1; i&gt;=0; i++) {\n\n}";
    } else {
      // forwards
      loop += "let i=0; i&lt;" + makeSaferForHTML(what.replace(/ /g,'_')) + ".length; i++) {\n\n}";
    }
    programInsert(loop,pointer);
    pointer += loop.length - 2; // stay a line inside last brace
  } else if (heard.includes('loop')) {
    say("Please say something like: 'loop through object', or simply 'for'.");
  } else if (heard === 'for') {
    let forStart = "for (";
    programInsert(forStart,pointer);
    pointer += forStart.length;
  }
}

function comment(heard) {
  let matches = heard.match(RegExp("comment (.+)"));
  if (matches) {
    currentConversationTopic = 'comment';
    let comment = "// " + makeSaferForHTML(matches[1]);
    programInsert(comment,pointer);
    pointer += comment.length;
  } else if (heard === 'comment') {
    let comment = "// ";
    programInsert(comment,pointer);
    pointer += comment.length;
  }
}

function notify(heard) {
  let matches = heard.match(RegExp("alert (.+)"));
  if (matches) {
    currentConversationTopic = matches[0];
    let alert = "alert(" + makeSaferForHTML(matches[1]) + ");";
    programInsert(alert,pointer);
    pointer += alert.length;
  } else if (heard === 'alert') {
    let alert = "alert(";
    programInsert(alert,pointer);
    pointer += alert.length;
  }
}

function variableCreate(heard) {
  let matches = heard.match(RegExp("^(create variable|let) (.+)")); // ^ to disambiguate from variableUse(heard)
  if (matches) {
    let variable_Expression = handleMathOperators(makeSaferForHTML(matches[2].replace(/ /g,'_')));
    currentConversationTopic = 'create variable ' + variable_Expression;
    let letVariable = "let " + variable_Expression;
    programInsert(letVariable,pointer);
    pointer += letVariable.length;
    // get and track variable name
    let variableName = getJustVariableName(variable_Expression);
    trackVariable(variableName);
  }
}

function variableUse(heard) {
  let matches = heard.match(RegExp("^variable (.+)")); // ^ to disambiguate from variableCreate(heard)
  if (matches) {
    let variable_Expression = handleMathOperators(makeSaferForHTML(matches[1].replace(/ /g,'_')));
    currentConversationTopic = 'variable ' + variable_Expression;
    // get just the variable name
    let variableName = getJustVariableName(variable_Expression);
    // check if did not create/initialize variable name already
    if (!variableExistsAlready(variableName)) {
      say("Create that variable first: say 'create variable ...'.");
    } else {
      programInsert(variable_Expression,pointer);
      pointer += variable_Expression.length;
    }
  }
}

function getJustVariableName(letVar) {
  // to ensure put name (not expression) in variableList
  // e.g.: "create variable a b c equals 1 plus 2" --> "a_b_c"" (not "a_b_c = 1 + 2")
  let variableName = letVar.replace(/^variable /,'').replace(/^let /,'');
  if (variableName.includes(' ')) variableName = variableName.substring(0,variableName.indexOf(' '));
  return variableName;
}

function trackVariable(varName) {
	variableList[varName] = true; // TODO: future: = line number, to check scope
}

function variableExistsAlready(varName) {
	return varName in variableList;
}

function newLine(heard) {
  if (heard === 'new line' || heard === 'carriage return') {
    programInsert('\n',pointer);
    pointer += 1;
  }
}

function specialCharacters(heard) {
  let s = '';
  if (heard === 'semicolon') {
    s = '; ';
  } else if (heard === 'colon') {
    s = ': ';
  } else if (heard === 'dot' || heard === 'period') {
    s = '.';
  } else if (heard === 'dash') {
    s = '-';
  } else if (heard === 'underscore') {
    s = '_';
  } else if (heard === 'apostrophe') {
    s = "'";
  } else if (heard === 'double apostrophe') {
    s = '""';
  } else if (heard === 'bracket' || heard === 'opening bracket') {
    s = '(';
  } else if (heard === 'close bracket' || heard === 'closing bracket') {
    s = ')';
  } else if (heard === 'curly brace' || heard === 'curly bracket' || heard === 'opening brace' || heard === 'opening curly bracket') {
    s = '{';
  } else if (heard === 'close curly brace' || heard === 'closing curly brace' || heard === 'closing curly bracket' || heard === 'closing brace') {
    s = '}';
  } else if (heard === 'square bracket' || heard === 'opening square bracket') {
    s = '[';
  } else if (heard === 'close square bracket' || heard === 'closing square bracket') {
    s = ']';
  }
  programInsert(s,pointer);
  pointer += s.length;
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

function handleMathOperators(str) {
  // '_' because must handle after makeSaferForHTML()
  let modified = str;
  modified = modified.replace(/_greater_than_or_equal_to_/g,' >= ')
                     .replace(/_less_than_or_equal_to_/g,' <= ')
                     .replace(/_equals_/g,' = ')
                     .replace(/_equal_to_/g,' = ')
                     .replace(/_equal_/g,' = ')
                     .replace(/_greater_than_/g,' > ')
                     .replace(/_less_than_/g,' < ')
                     .replace(/_plus_plus_/g,'++ ')
                     .replace(/_plus_/g,' + ')
                     .replace(/_minus_minus_/g,'-- ')
                     .replace(/_minus_/g,' - ')
                     .replace(/_divided_by_/g,' / ')
                     .replace(/_multiplied_by_/g,' * ')
                     .replace(/_modulus_/g,' % ')
                     .replace(/_and_/g,' && ')
                     .replace(/_or_/g,' || ')
                     .replace(/_not_/g,' ~');
  return modified;
}
