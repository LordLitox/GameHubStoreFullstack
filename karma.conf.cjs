// Configuración de pruebas unitarias — Karma + Jasmine (EP2, DSY1104).
// Los archivos se transforman con Vite (karma-vite), por lo que el JSX y los
// módulos ES funcionan igual que en la aplicación.
module.exports = (config) => {
  config.set({
    basePath: "",
    frameworks: ["vite", "jasmine"],
    plugins: [
      "karma-vite",
      "karma-jasmine",
      "karma-chrome-launcher",
      "karma-coverage",
    ],
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
      // Cobertura con Istanbul. karma-vite instrumenta el código fuente solo
      // cuando el reporter incluye "coverage" (ver script `test:coverage`),
      // por lo que `npm test` sigue corriendo sin instrumentar.
      coverage: {
        include: ["src/**/*.{js,jsx}"],
        exclude: [
          "src/**/*.test.{js,jsx}",
          "src/__tests__/**",
          "src/main.jsx",
        ],
      },
    },
    // Reporte de cobertura: HTML navegable + resumen por consola + lcov.
    coverageReporter: {
      dir: "coverage/",
      subdir: ".",
      reporters: [
        { type: "html", subdir: "html" },
        { type: "lcovonly", subdir: "." },
        { type: "text-summary" },
      ],
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
