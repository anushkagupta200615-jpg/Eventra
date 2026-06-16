import { pushToQueue, getQueue, clearQueue } from './offlineQueue';

describe('offlineQueue', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Silence console warnings/errors during test execution
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('queues items successfully and returns true', async () => {
    const item = { eventId: 101, payload: { name: 'Test User' } };
    const success = await pushToQueue(item);
    
    expect(success).toBe(true);
    const queue = getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].eventId).toBe(101);
  });

  it('limits queue to 15 items and evicts oldest when full', async () => {
    // Fill the queue with 15 items
    for (let i = 0; i < 15; i++) {
      const success = await pushToQueue({ eventId: i, payload: {} });
      expect(success).toBe(true);
    }

    // Verify queue length is 15 and first item is eventId 0
    let queue = getQueue();
    expect(queue.length).toBe(15);
    expect(queue[0].eventId).toBe(0);

    // Attempting to push 16th item should evict oldest (eventId 0)
    const success16 = await pushToQueue({ eventId: 16, payload: {} });
    expect(success16).toBe(true);

    // Verify queue length remains 15 and first item is now eventId 1
    queue = getQueue();
    expect(queue.length).toBe(15);
    expect(queue[0].eventId).toBe(1);
    expect(queue[14].eventId).toBe(16);
  });

  it('clears queue successfully', async () => {
    await pushToQueue({ eventId: 1, payload: {} });
    expect(getQueue().length).toBe(1);

    await clearQueue();
    expect(getQueue().length).toBe(0);
  });

  it('returns true when localStorage setItem fails but IndexedDB succeeds', async () => {
    // Mock localStorage.setItem to throw an error
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = jest.fn().mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const item = { eventId: 999, payload: { name: 'Resilient User' } };
    const success = await pushToQueue(item);

    expect(success).toBe(true);

    // Restore original setItem
    window.localStorage.setItem = originalSetItem;
  });
});
