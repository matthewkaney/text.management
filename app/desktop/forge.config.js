const path = require("path");

module.exports = {
  packagerConfig: {
    icon: path.resolve(__dirname, "./assets/TextManagement"),
    executableName: "text.management",
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "text.management",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        name: "text.management",
        bin: "text.management",
        maintainer: "Matthew Kaney",
        homepage: "https://text.management",
      },
    },
  ],
};
