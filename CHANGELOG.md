# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.4]

- Fixed `MongoTable.crupdate` for MongoDB Node driver 6.x: wrap updates in `$set` for `findOneAndUpdate`, fixing `MongoInvalidArgumentError: Update document requires atomic operators` on save.

## [1.1.3]

- Republish after fixing npm Trusted Publishing CI workflow (OIDC + sigstore).

## [1.1.2]

- Fixed `SheetTable.crupdate` auto-id generation: `==` comparison replaced with `??=` assignment so entries without `_id` receive a new UUID.
- Removed debug `console.log` from `Entity.saveEntity`.

## [1.0.0]

- BETA release version 1.0.0. This version introduces a merge function to the save method of Entity, which allows updating documents without overriding the value in the database. This is a breaking change from previous versions.

## [0.3.9]

- Fixed broken build 🙏

## [0.3.8]

- Fixed broken build?

## [0.3.7]

- Fixed broken build

## [0.3.6]

- Updated most dependencies to reduce vulnerabilities. Updates to google-spreadsheet are still needed.

## [0.3.5]

- Fixed `SheetsTable.fetchAll()` now correctly reloads the whole table

## [0.3.4]

- Fixed `SheetsTable.fetchAll()` now correctly syncs rows

## [0.3.2]

- Added `Entity.deleteEntry` public static method

## [0.3.2]

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
