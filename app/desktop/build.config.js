const config = require( "../../node_modules/electron/package.json");

module.exports = {
  appId: "management.text",
  productName: "Text Management",
  directories: {
    buildResources: "./resources",
  },
  linux: {
    category: "Development",
    target: ["AppImage", "deb"],
  },
  mac: {
    category: "public.app-category.developer-tools",
    hardenedRuntime: true,
    entitlements: "resources/entitlements.mac.plist",
    entitlementsInherit: "resources/entitlements.mac.plist",
    gatekeeperAssess: false,
    artifactName: "${name}-${version}-${arch}.${ext}",
    target: {
      target: "default",
      arch: ["x64", "arm64"],
    },
  },
  files: ["./build/**/*"],
  npmRebuild: false,
  extraMetadata: {
    name: "text.management",
  },
  electronVersion: config.version,
};
