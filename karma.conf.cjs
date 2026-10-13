// Configuración de pruebas unitarias — Karma + Jasmine (EP2, DSY1104).
// Los archivos se transforman con Vite (karma-vite), por lo que el JSX y los
// módulos ES funcionan igual que en la aplicación.
module.exports = (config) => {
  config.set({
    basePath: "",
    frameworks: ["vite", "jasmine"],
    plugins: ["karma-vite", "karma-jasmine", "karma-chrome-launcher"],
    // Un patrón por extensión: con la llave {js,jsx} el glob interno de Karma
    // no cachea el mtime de los .jsx y el servidor cae al iniciar.
    files: [
      {
        pattern: "src/**/*.test.js",
        type: "module",
        watched: false,
        served: false,
      },
      {
        pattern: "src/**/*.test.jsx",
        type: "module",
        watched: false,
        served: false,
      },
    ],
    exclude: [],
    // Dependencias pre-empaquetadas de forma explícita: si Vite las descubre
    // a mitad de la corrida, re-optimiza y quedan dos copias de React.
    vite: {
      config: {
        optimizeDeps: {
          include: [
            "react",
            "react-dom",
            "react-dom/client",
            "react/jsx-dev-runtime",
            "@testing-library/react",
            "@testing-library/dom",
            "react-router-dom",
          ],
        },
      },
    },
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
