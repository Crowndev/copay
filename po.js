'use strict';

let cp = require('child_process');
let fs = require('fs');
let assert = require('assert');

let sourceText = fs.readFileSync('i18n/po/template.pot', {encoding: 'utf8'});
let sourceLines = sourceText.split(/\n|\r\n/);

fs.readdirSync('i18n/po').filter(m => m.endsWith('.po')).forEach(filename => {
  let targetFile = 'i18n/po/' + filename;
  let targetText = fs.readFileSync(targetFile, {encoding: 'utf8'});
  let targetLines = targetText.split(/\n|\r\n/);

  assert(sourceLines[0] === 'msgid ""');
  assert(targetLines[0] === 'msgid ""');
  assert(sourceLines[sourceLines.length - 1] === '' && sourceLines[sourceLines.length - 2].trim() !== '');
  assert(targetLines[sourceLines.length - 1] === '' && targetLines[targetLines.length - 2].trim() !== '');

  let sourceLinesBodyStartIndex = sourceLines.indexOf('');
  let targetLinesBodyStartIndex = targetLines.indexOf('');

  assert(1 <= sourceLinesBodyStartIndex && sourceLinesBodyStartIndex <= 19);
  assert(1 <= targetLinesBodyStartIndex && targetLinesBodyStartIndex <= 19);
  assert(sourceLines.length - sourceLinesBodyStartIndex === targetLines.length - targetLinesBodyStartIndex);

  for (let i = 0; i < sourceLines.length - sourceLinesBodyStartIndex; i++) {
    let sourceLine = sourceLines[sourceLinesBodyStartIndex + i];
    let targetLine = targetLines[targetLinesBodyStartIndex + i];
    if (sourceLine.startsWith('msgid ')) {
      assert(targetLine.startsWith('msgid '));
      targetLines[targetLinesBodyStartIndex + i] = sourceLine;
    }
    else if (sourceLine.startsWith('msgstr ')) {
      assert(targetLine.startsWith('msgstr '));
    }
    else {
      assert(targetLine === sourceLine);
    }
  }

  targetText = targetLines.join('\n');
  fs.writeFileSync(targetFile, targetText);
});
