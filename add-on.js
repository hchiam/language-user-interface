function heardAddOns(heard) {
  // should overwrite the function in brain.js
  let regex = new RegExp("^(let'?s )?(plan|schedule) (a )?(.+)");
  let matches = heard.match(regex);
  if (matches) {
    let title = matches[4];
    say("I'm starting a scheduler for you on Doodle.com.");
    tryOpeningWindow('https://doodle.com/create?title=' + title);
    return true;
  }
  return false;
}
