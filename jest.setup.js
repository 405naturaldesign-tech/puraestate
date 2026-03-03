import "@testing-library/jest-native/extend-expect";

// Mock React Native modules
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter");

// Mock Expo modules
jest.mock("expo-constants", () => ({
  default: {
    manifest: {
      version: "1.0.0",
    },
    sessionId: "mock-session-id",
  },
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/documents/",
  cacheDirectory: "/mock/cache/",
}));

// Mock Firebase
jest.mock("@react-native-firebase/app", () => ({
  firebase: {
    app: jest.fn(),
  },
}));

jest.mock("@react-native-firebase/auth", () => ({
  auth: jest.fn(() => ({
    currentUser: null,
  })),
}));

jest.mock("@react-native-firebase/firestore", () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(),
  })),
}));

jest.mock("@react-native-firebase/storage", () => ({
  storage: jest.fn(() => ({
    ref: jest.fn(),
  })),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiSet: jest.fn(),
  multiGet: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

// Mock Redux
jest.mock("redux-persist", () => ({
  persistStore: jest.fn((store) => store),
  persistReducer: jest.fn((config, reducer) => reducer),
}));

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Set up timeout for tests
jest.setTimeout(10000);

// Mock fetch if needed
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock XMLHttpRequest
global.XMLHttpRequest = jest.fn();

// Setup screen dimensions
Object.defineProperty(require("react-native").Dimensions, "get", {
  value: jest.fn(() => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  })),
});
