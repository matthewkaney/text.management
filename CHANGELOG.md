# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.7.0]: https://github.com/mindofmatthew/text.management/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/mindofmatthew/text.management/releases/tag/v0.6.0