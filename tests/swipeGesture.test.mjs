import test from 'node:test';
import assert from 'node:assert/strict';
import { getHorizontalSwipeDirection } from '../src/swipeGesture.ts';

test('left swipe navigates to next page', () => {
  assert.equal(getHorizontalSwipeDirection(-90, 8), 1);
});
test('right swipe navigates to previous page', () => {
  assert.equal(getHorizontalSwipeDirection(90, 8), -1);
});
test('short movement is ignored', () => {
  assert.equal(getHorizontalSwipeDirection(-30, 0), 0);
});
test('vertical scroll is not treated as a swipe', () => {
  assert.equal(getHorizontalSwipeDirection(-20, 100), 0);
});
test('diagonal movement that is not predominantly horizontal is ignored', () => {
  assert.equal(getHorizontalSwipeDirection(-80, 75), 0);
});
test('threshold and horizontal ratio are configurable', () => {
  assert.equal(getHorizontalSwipeDirection(-50, 10, 42, 1.15), 1);
  assert.equal(getHorizontalSwipeDirection(-50, 45, 42, 1.15), 0);
});
