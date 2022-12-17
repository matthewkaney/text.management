module.exports = {
  packagerConfig: {
    sourcedir: "dist"
  },
  makers: [
    {
      name: '@electron-forge/maker-zip'
    }
  ]
}