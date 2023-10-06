const config = require("../../node_modules/electron/package.json");

module.exports = {
  appId: "management.text",
  productName: "Text Management",
  artifactName: "${name}-${version}-${arch}.${ext}",
  directories: {
    buildResources: "./resources",
  },
  linux: {
    category: "Development",
    target: ["deb", "rpm", "AppImage"],
    icon: "resources/icons",
  },
  mac: {
    category: "public.app-category.developer-tools",
    hardenedRuntime: true,
    entitlements: "resources/entitlements.mac.plist",
    entitlementsInherit: "resources/entitlements.mac.plist",
    gatekeeperAssess: false,
    target: {
      target: "default",
      arch: ["x64", "arm64"],
    },
  },
  win: {
    artifactName: "${name}-setup-${version}.${ext}",
  },
  files: ["./build/**/*", "./resources/**/*"],
  npmRebuild: false,
  extraMetadata: {
    name: "text.management",
  },
  electronVersion: config.version,
};
