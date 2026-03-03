module.exports = {
  displayName: "PuraEstate",
  testEnvironment: "node",
  preset: "react-native",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/build/",
    "/dist/",
    "/.expo/"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@screens/(.*)$": "<rootDir>/src/screens/$1",
    "^@navigation/(.*)$": "<rootDir>/src/navigation/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@store/(.*)$": "<rootDir>/src/store/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@constants/(.*)$": "<rootDir>/src/constants/$1",
    "^@api/(.*)$": "<rootDir>/src/api/$1",
    "^@assets/(.*)$": "<rootDir>/assets/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1"
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        presets: [
          "babel-preset-expo",
          "@babel/preset-typescript"
        ]
      }
    ]
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-native-async-storage|@react-native-firebase|@react-navigation|expo|lottie-react-native|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-svg)/)"
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.{ts,tsx}",
    "!src/types/**",
    "!src/constants/**",
    "!**/__tests__/**",
    "!**/node_modules/**"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/",
    "/dist/",
    "/build/"
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js"
  ],
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react-jsx"
      }
    }
  }
};
