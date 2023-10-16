# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2023-10-15

### Added

- Better screenreader and keyboard navigation support (#51)
- Tidal boot options (#59)
- Tidal menu for rebooting (#54)
- Indicator for current cycle
- Auto-update mechanism
- Added RPM build for Fedora/RedHat/etc
- UI Button for opening new documents (#61) &mdash; @reckoner165

### Changed

- Added a Content Security Policy to prevent unwanted script execution (#53)
- Adjust release script logic
- General cleanup for app menu options

### Fixed

- Opening an already-open file doesn't open a second copy of it (#57)
- Linux installations should have icons now (#52)
- Dark mode tab styling bugs &mdash; @reckoner165

## [0.8.0] - 2023-07-11

### Added

- Ability to open multiple files at once in a tabbed interface (#22)
  - This involved some major rewriting of the underlying architecture in a way
    that should make it easier to develop on in the future
- Ability to show "About" window with current app version (#48)
- Added a bullet character next to unsaved files to indicate save state (#46)
- Mac builds are now signed and notarized

### Changed

- App no longer autosaves by default

## [0.7.0] - 2023-01-21

### Added

- Added some simple idiomatic Tidal auto-indentation
- App builds are now automatically generated
- App now supports file management: creating new files, loading files, and
  saving (with autosaving by default)

### Changed

- Console messages no longer display GHCi command prompts
- Updated the default theme, inheriting the OS preference for light/dark mode

### Fixed

- Issue on Windows with accessing the installed Tidal version
- Undo/Redo functionality works correctly now

## [0.6.0] - 2022-12-25

Initial release of Electron app with code editing and Tidal support.

## Early Versions

The first few versions existed to track changes in the NPM package version
of text.management. They were never tagged in the repository, and NPM updates
have been discontinued for the time being as I focus on an Electron/web app
distributed through GitHub releases.

[0.9.0]: https://github.com/mindofmatthew/text.management/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/mindofmatthew/text.management/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/mindofmatthew/text.management/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/mindofmatthew/text.management/releases/tag/v0.6.0
