import assert from 'node:assert/strict';
import test from 'node:test';
import { getFeedbackHighlights } from '../src/modules/feedback/feedbackHighlights.ts';

test('video feedback highlights only explicit high-value editing phrases', () => {
  assert.deepEqual(
    getFeedbackHighlights('Cinematic editing, smooth transitions and colour grading were excellent.', 'Work feedback'),
    ['Cinematic Editing', 'Transitions', 'Colour Grading']
  );
});

test('video feedback ignores generic praise and caps highlights at four', () => {
  assert.deepEqual(
    getFeedbackHighlights('Super work. Editing quality, sound design, pacing, motion graphics and on-time delivery.', 'Work feedback'),
    ['Editing Quality', 'Sound Design', 'Pacing', 'Motion Graphics']
  );
});

test('website feedback uses only website-specific keyword highlights', () => {
  assert.deepEqual(
    getFeedbackHighlights('Easy navigation, mobile friendly and responsive design.', 'Website Experience'),
    ['Easy Navigation', 'Mobile Experience', 'Responsive Design']
  );
});

test('unmatched feedback does not receive invented highlights', () => {
  assert.deepEqual(getFeedbackHighlights('Super. Thank you.', 'Work feedback'), []);
});
