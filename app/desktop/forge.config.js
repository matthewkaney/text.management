const path = require("path");

module.exports = {
  packagerConfig: {
    icon: path.resolve(__dirname, "./assets/Icon"),
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "TextManagement"
      }
    }
  ],
};
