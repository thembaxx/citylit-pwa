import assert from 'node:assert/strict';
import test from 'node:test';
import { condenseHistoryText, splitSentences } from './historyText.ts';

test('splitSentences collapses whitespace and splits on sentence boundaries', () => {
  assert.deepEqual(splitSentences('  One.   Two!\nThree?  '), ['One.', 'Two!', 'Three?']);
  assert.deepEqual(splitSentences(''), []);
});

test('condenseHistoryText keeps at most the requested number of sentences', () => {
  const extract =
    'It is a tall sandstone massif. It was protected as a national park in 1998. The cableway carries visitors.';
  assert.equal(
    condenseHistoryText(extract, 2),
    'It is a tall sandstone massif. It was protected as a national park in 1998.'
  );
  assert.equal(condenseHistoryText(extract, 1), 'It is a tall sandstone massif.');
});

test('condenseHistoryText prefers history-cued sentences but preserves reading order', () => {
  const extract =
    'The mountain is flat-topped and steep. It was commissioned in 1910 to mark the Union of South Africa. A later statue was unveiled in 2013.';
  assert.equal(
    condenseHistoryText(extract),
    'It was commissioned in 1910 to mark the Union of South Africa. A later statue was unveiled in 2013.'
  );
});

test('condenseHistoryText returns an empty string for empty or unusable input', () => {
  assert.equal(condenseHistoryText(''), '');
  assert.equal(condenseHistoryText('   '), '');
  assert.equal(condenseHistoryText('A short description.', 0), '');
});
