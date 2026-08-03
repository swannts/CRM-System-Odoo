/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'cypress';

const baseUrl = process.env.CYPRESS_BASE_URL || process.env.BASE_URL || 'http://localhost:3034';

export default defineConfig({
  e2e: {
    baseUrl,
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      KEYCLOAK_URL: process.env.CYPRESS_KEYCLOAK_URL || 'http://localhost:8080',
      KEYCLOAK_USERNAME: process.env.CYPRESS_KEYCLOAK_USERNAME || 'org-owner',
      KEYCLOAK_PASSWORD: process.env.CYPRESS_KEYCLOAK_PASSWORD || 'password123',
    },
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
  },
});
