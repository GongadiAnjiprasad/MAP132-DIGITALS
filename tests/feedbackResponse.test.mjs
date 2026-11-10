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
  assert.match(result.reply, /wedding mariyu special event videos/i);
});

test('responds to suggestions in the detected language and acknowledges the topic', () => {
  const result = createFeedbackResponse('Website lo animations add cheyochu', 3);
  assert.equal(result.type, 'suggestion');
  assert.equal(result.language, 'te-latn');
  assert.match(result.reply, /suggestion/i);
  assert.match(result.reply, /website experience/i);
});

test('responds to low-rating complaints with an apology and the relevant topic', () => {
  const result = createFeedbackResponse('The delivery was delayed', 1);
  assert.equal(result.type, 'complaint');
  assert.match(result.reply, /sorry/i);
  assert.match(result.reply, /delivery timing/i);
});

test('uses a neutral reply when sentiment is unclear', () => {
  const result = createFeedbackResponse('I visited the website yesterday', 3);
  assert.equal(result.type, 'general');
  assert.equal(result.publishable, true);
  assert.match(result.reply, /website experience/i);
});

test('different feedback topics receive meaningfully different replies', () => {
  const editing = createFeedbackResponse('Your video editing is excellent', 5);
  const audio = createFeedbackResponse('Your audio and music are excellent', 5);
  assert.equal(editing.type, 'positive');
  assert.equal(audio.type, 'positive');
  assert.notEqual(editing.reply, audio.reply);
  assert.match(editing.reply, /video editing/i);
  assert.match(audio.reply, /audio and music/i);
});

test('keeps the detected language when adding topic-specific context', () => {
  const telugu = createFeedbackResponse('మీ వీడియో ఎడిటింగ్ చాలా బాగుంది', 5);
  const hindi = createFeedbackResponse('आपकी वीडियो एडिटिंग बहुत अच्छी है', 5);
  assert.equal(telugu.language, 'te');
  assert.match(telugu.reply, /వీడియో ఎడిటింగ్/);
  assert.equal(hindi.language, 'hi');
  assert.match(hindi.reply, /वीडियो एडिटिंग/);
});
