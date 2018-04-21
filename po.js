'use strict';

let cp = require('child_process');
let fs = require('fs');
let assert = require('assert');

let sourceText = fs.readFileSync('i18n/po/template.pot', {encoding: 'utf8'});
let sourceLines = sourceText.split(/\n|\r\n/);
let sourceLinesBodyStartIndex = sourceLines.indexOf('');

assert(sourceLines[0] === 'msgid ""');
assert(sourceLines[sourceLines.length - 1] === '' && sourceLines[sourceLines.length - 2].trim() !== '');
assert(1 <= sourceLinesBodyStartIndex && sourceLinesBodyStartIndex <= 19);

fs.readdirSync('i18n/po').filter(m => m.endsWith('.po')).forEach(filename => {
  console.log('Merging ' + filename);

  let targetFile = 'i18n/po/' + filename;
  let targetText = fs.readFileSync(targetFile, {encoding: 'utf8'});
  let targetLines = targetText.split(/\n|\r\n/);

  assert(targetLines[0] === 'msgid ""');
  assert(targetLines[targetLines.length - 1] === '' && targetLines[targetLines.length - 2].trim() !== '');

  let targetLinesBodyStartIndex = targetLines.indexOf('');

  assert(1 <= targetLinesBodyStartIndex && targetLinesBodyStartIndex <= 19);

  for (let i = 0; i < sourceLines.length - sourceLinesBodyStartIndex; i++) {
    let sourceLine = sourceLines[sourceLinesBodyStartIndex + i];
    let targetLine = targetLines[targetLinesBodyStartIndex + i];
    let errorMessage = `Target po file line number: ${targetLinesBodyStartIndex + i}`;
    if (sourceLine.startsWith('msgid ')) {
      assert(targetLine.startsWith('msgid '), errorMessage);
      targetLines[targetLinesBodyStartIndex + i] = sourceLine;
    }
    else if (sourceLine.startsWith('msgstr ')) {
      assert(targetLine.startsWith('msgstr '), errorMessage);
    }
    else {
      assert(targetLine === sourceLine, errorMessage);
    }
  }

  // This check is placed at the end because it should first check and display the accurate line
  // for the possible error. If this check is done beforehand, the performance will be faster, but we
  // won't know which area in the po file causes the error.
  // Maybe this check is useless if it's placed here.
  assert(sourceLines.length - sourceLinesBodyStartIndex === targetLines.length - targetLinesBodyStartIndex);

  targetText = targetLines.join('\n');
  fs.writeFileSync(targetFile, targetText);
});
