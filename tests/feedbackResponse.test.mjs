import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedbackResponse } from '../worker/feedback.ts';

test('detects Telugu script and responds in Telugu', () => {
  const result = createFeedbackResponse('మీ సర్వీస్ సూపర్ గా ఉంది', 5);
  assert.equal(result.language, 'te');
  assert.equal(result.type, 'positive');
  assert.match(result.reply, /ధన్యవాదాలు/);
  assert.equal(result.publishable, true);
});

test('detects romanized Telugu and responds in romanized Telugu', () => {
  const result = createFeedbackResponse('Mee service super undhi', 5);
  assert.equal(result.language, 'te-latn');
  assert.equal(result.type, 'positive');
  assert.match(result.reply, /chala thanks/i);
});

test('routes enquiries to contact without publishing them as reviews', () => {
  const result = createFeedbackResponse('Wedding trailer ki entha charge chestharu?', 5);
  assert.equal(result.type, 'enquiry');
  assert.equal(result.publishable, false);
  assert.match(result.reply, /WhatsApp/i);
});

test('responds to suggestions in the detected language', () => {
  const result = createFeedbackResponse('Website lo animations add cheyochu', 3);
  assert.equal(result.type, 'suggestion');
  assert.equal(result.language, 'te-latn');
  assert.match(result.reply, /suggestion/i);
});

test('responds to low-rating complaints with an apology', () => {
  const result = createFeedbackResponse('Delivery was delayed', 1);
  assert.equal(result.type, 'complaint');
  assert.match(result.reply, /sorry/i);
});

test('uses a neutral reply when sentiment is unclear', () => {
  const result = createFeedbackResponse('I visited the website yesterday', 3);
  assert.equal(result.type, 'general');
  assert.equal(result.publishable, true);
});
