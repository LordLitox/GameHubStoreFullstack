// Configuración de pruebas unitarias — Karma + Jasmine (EP2, DSY1104).
// Los archivos se transforman con Vite (karma-vite), por lo que el JSX y los
// módulos ES funcionan igual que en la aplicación.
module.exports = (config) => {
  config.set({
    basePath: "",
    frameworks: ["vite", "jasmine"],
    plugins: ["karma-vite", "karma-jasmine", "karma-chrome-launcher"],
    files: [
      {
        pattern: "src/**/*.test.{js,jsx}",
        type: "module",
        watched: false,
        served: false,
      },
    ],
    exclude: [],
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["ChromeHeadless"],
    singleRun: true,
    concurrency: 1,
  });
};
