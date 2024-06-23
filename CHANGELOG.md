# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1]

- Update when an entry does not exist should create the entry

## [0.3.0]

- Added mongoDB support. A lot more functions are async now. This is a breaking change.

## [0.2.1]

### Added

- More asynchronous safeguards in entity.fetchAll

## [0.2.0]

### Changed

- Factories are now encouraged to return null rather than throwing an error if something doesn't load properly
- Entity.fetchAll returns a number of successes and failures in addition to the loaded entities

## [0.1.9]

### Changed

- Parallelized entity loading during fetchAll

## [0.1.8]

### Removed

- Removed uneeded files from the npm package

## [0.1.6]

### Added

- Publish script for npm

## [0.1.5]

### Changed

- Bug fix related to underscores in Google sheets.

## [0.1.3]

### Added

- README and CHANGELOG

## [0.1.2]

- Initial version. Base support for Google sheets and local JSON files.
