import assert from 'node:assert/strict';
import test from 'node:test';
import { createFeedbackResponse } from '../worker/feedback.ts';

test('automated positive feedback replies remain professional and emoji-free in every supported language', () => {
  const samples = [
    { message: 'మీ పని చాలా బాగుంది', language: 'te' },
    { message: 'Mee work super undhi', language: 'te-latn' },
    { message: 'आपका काम बहुत अच्छा है', language: 'hi' },
    { message: 'Your work is excellent', language: 'en' },
  ];
  for (const sample of samples) {
    const result = createFeedbackResponse(sample.message, 5);
    assert.equal(result.language, sample.language);
    assert.equal(result.type, 'positive');
    assert.doesNotMatch(result.reply, /\p{Extended_Pictographic}/u);
  }
});
