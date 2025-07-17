module.exports = {
  "presets": [
    "babel-preset-expo"
  ],
  "plugins": [
    [
      "module-resolver",
      {
        "root": [
          "./src"
        ],
        "alias": {
          "@": "./src",
          "@/components": "./src/components",
          "@/services": "./src/services",
          "@/hooks": "./src/hooks",
          "@/utils": "./src/utils",
          "@/types": "./src/types"
        }
      }
    ],
    "react-native-reanimated/plugin"
  ]
};