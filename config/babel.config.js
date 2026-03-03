module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      [
        "@babel/preset-env",
        {
          targets: {
            node: "current"
          }
        }
      ],
      "@babel/preset-typescript",
      ["@babel/preset-react", { runtime: "automatic" }]
    ],
    plugins: [
      [
        "module-resolver",
        {
          extensions: [
            ".ios.js",
            ".android.js",
            ".js",
            ".ts",
            ".tsx",
            ".json"
          ],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@navigation": "./src/navigation",
            "@services": "./src/services",
            "@store": "./src/store",
            "@types": "./src/types",
            "@utils": "./src/utils",
            "@hooks": "./src/hooks",
            "@constants": "./src/constants",
            "@api": "./src/api",
            "@assets": "./assets",
            "@config": "./src/config",
            "@middleware": "./src/middleware"
          }
        }
      ],
      [
        "@babel/plugin-proposal-decorators",
        {
          legacy: true
        }
      ],
      "react-native-reanimated/plugin",
      "react-native-gesture-handler/fallback",
      [
        "@babel/plugin-proposal-class-properties",
        {
          loose: true
        }
      ],
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-nullish-coalescing-operator",
      [
        "@babel/plugin-transform-runtime",
        {
          helpers: true,
          regenerator: true
        }
      ]
    ],
    env: {
      production: {
        plugins: [
          "transform-remove-console",
          "@babel/plugin-transform-runtime"
        ]
      },
      test: {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                node: "current"
              }
            }
          ]
        ]
      }
    }
  };
};
