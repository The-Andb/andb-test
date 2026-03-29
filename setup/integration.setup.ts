import 'reflect-metadata';

/**
 * Integration Test Setup
 * 
 * Prerequisites:
 *   cd docker && docker-compose up -d
 */

beforeAll(async () => {
  // Give Docker containers time to be fully ready
  console.log('🐳 Integration tests starting - ensure Docker is running');
});

afterAll(async () => {
  // Cleanup if needed
  console.log('✅ Integration tests completed');
});
