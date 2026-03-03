const { getDefaultConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const {
  resolver: { sourceExts, assetExts },
} = config;

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
};

config.resolver = {
  ...config.resolver,
  assetExts: assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
  extraNodeModules: {
    stream: require.resolve("stream-browserify"),
    crypto: require.resolve("crypto-browserify"),
    buffer: require.resolve("buffer"),
  },
};

config.projectRoot = __dirname;

config.watchFolders = [];

config.server = {
  rewriteRequestUrl: (url) => {
    if (!url.match(/^https?:\/\//)) {
      return url;
    }
    return url
      .match(/^https?:\/\/([^:]+)(:\d+)?\/(.*)$/)?.[3]
      .replace(/^(?:\.\/)?/, "./");
  },
  port: 8081,
};

module.exports = withNativeWind(config, { input: "./global.css" });
