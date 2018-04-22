'use strict';

// This script is idempotent, meaning the generated po files will be the same regardless of
// whether you run it once or many times.

let cp = require('child_process');
let fs = require('fs');
let assert = require('assert');

let ensureSingleTrailingBlankLine = lines => {
  if (lines[lines.length - 1] !== '') {
    lines.push('');
  }
  else {
    while (lines[lines.length - 2] === '') {
      lines.pop();
    }
  }
};

let sourceText = fs.readFileSync('i18n/po/template.pot', {encoding: 'utf8'});
let sourceLines = sourceText.split(/\n|\r\n/);
let sourceLinesBodyStartIndex = sourceLines.indexOf('');

assert(sourceLines[0] === 'msgid ""');
ensureSingleTrailingBlankLine(sourceLines);
assert(1 <= sourceLinesBodyStartIndex && sourceLinesBodyStartIndex <= 19);

fs.readdirSync('i18n/po').filter(m => m.endsWith('.po')).forEach(filename => {
  console.log('Merging ' + filename);

  let targetFile = 'i18n/po/' + filename;
  let targetText = fs.readFileSync(targetFile, {encoding: 'utf8'});
  let targetLines = targetText.split(/\n|\r\n/);

  assert(targetLines[0] === 'msgid ""');
  ensureSingleTrailingBlankLine(targetLines);
  let targetLinesBodyStartIndex = targetLines.indexOf('');
  assert(1 <= targetLinesBodyStartIndex && targetLinesBodyStartIndex <= 19);

  let sourceCursor = sourceLinesBodyStartIndex;
  let targetCursor = targetLinesBodyStartIndex;
  let inMsgstr = false;
  while (true) {
    let sourceLine = sourceLines[sourceCursor];
    let targetLine = targetLines[targetCursor];
    let errorMessage = `Target po file line number: ${targetCursor}`;
    if (inMsgstr) {
      if (sourceLine.startsWith('"')) {
        sourceCursor++;
      }
      else if (targetLine.startsWith('"')) {
        targetCursor++;
      }
      else {
        inMsgstr = false;
      }
    }
    else {
      if (sourceLine === '') {
        if (sourceCursor < sourceLines.length - 1) {
          sourceCursor++;
        }
        else {
          assert(targetLine === '' && targetCursor === targetLines.length - 1, errorMessage);
          break;
        }
      }
      else if (targetLine === '') {
        if (targetCursor < targetLines.length - 1) {
          targetCursor++;
        }
        else {
          assert(sourceLine === '' && sourceCursor === sourceLines.length - 1, errorMessage);
          break;
        }
      }
      else if (sourceLine.startsWith('msgid ')) {
        assert(targetLine.startsWith('msgid '), errorMessage);
        if (targetLine !== sourceLine) {
          targetLines[targetCursor] = sourceLine + '<MSGID-CHANGED>';
        }
        sourceCursor++;
        targetCursor++;
      }
      else if (sourceLine.startsWith('msgstr ')) {
        assert(inMsgstr === false, errorMessage);
        inMsgstr = true;
        assert(targetLine.startsWith('msgstr '), errorMessage);
        sourceCursor++;
        targetCursor++;
      }
      else {
        // Note that "msgid" can also be multiline, but if it is, this mechanism also works,
        // because "msgid" contents should be the same between the source and the target, including
        // whether it's multiline and the content of each line.
        assert(targetLine === sourceLine, errorMessage);
        sourceCursor++;
        targetCursor++;
      }
    }
  }

  targetText = targetLines.join('\n');
  fs.writeFileSync(targetFile, targetText);
});
