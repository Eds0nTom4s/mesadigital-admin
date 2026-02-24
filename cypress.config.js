import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // URL base da aplicação
    baseUrl: 'http://localhost:3003',
    
    // URL da API para testes
    env: {
      apiUrl: 'http://localhost:8080/api',
      wsUrl: 'http://localhost:8080/ws',
    },
    
    // Configurações de viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Configurações de vídeo e screenshots
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    screenshotOnRunFailure: true,
    
    // Retry automático em falhas
    retries: {
      runMode: 2,
      openMode: 0,
    },
    
    // Configurar testes E2E
    setupNodeEvents(on, config) {
      // Implementar event listeners aqui se necessário
      return config
    },
    
    // Padrão de arquivos de teste
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Suporte a navegadores modernos
    chromeWebSecurity: false,
  },
  
  // Configurações do Component Testing (opcional)
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
})
