const { defineConfig } = require("cypress");

module.exports = defineConfig({
  viewportHeight: 1080,
  viewportWidth: 1920,
  env:{
    email: "customer@practicesoftwaretesting.com",
    password: "welcome01"
  },
  e2e: {
    baseUrl: 'https://practicesoftwaretesting.com/#/',
    specPattern: 'cypress/e2e/**/*.{js, jsx, ts, tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
