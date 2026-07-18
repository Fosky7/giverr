// src/services/contact.ts
// Simulates sending a contact message via a stubbed network request.
// Replace the mock implementation with a real API call when the backend is ready.

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

/**
 * Mock toggle: set to `true` to simulate a successful submission,
 * `false` to simulate a server error.
 */
const MOCK_SUCCESS = true;

/**
 * Simulated network latency in milliseconds.
 */
const MOCK_DELAY_MS = 1500;

/**
 * Sends a contact message. Currently a stub that resolves or rejects
 * based on a toggle after a simulated timeout.
 */
export async function sendContactMessage(
  _payload: ContactMessage,
): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (MOCK_SUCCESS) {
        resolve();
      } else {
        reject(new Error("Server error: please try again later."));
      }
    }, MOCK_DELAY_MS);
  });
}
