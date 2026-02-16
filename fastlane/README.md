fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios create_app

```sh
[bundle exec] fastlane ios create_app
```

Create app in App Store Connect (run once)

### ios certificates

```sh
[bundle exec] fastlane ios certificates
```

Sync certificates & provisioning profiles via Match

### ios build

```sh
[bundle exec] fastlane ios build
```

Build iOS app for App Store

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Upload to TestFlight

### ios upload

```sh
[bundle exec] fastlane ios upload
```

Upload existing IPA to TestFlight (skip rebuild)

### ios release

```sh
[bundle exec] fastlane ios release
```

Upload to App Store (production release)

----


## Android

### android build

```sh
[bundle exec] fastlane android build
```

Build Android AAB (release)

### android beta

```sh
[bundle exec] fastlane android beta
```

Upload to Google Play internal testing track

### android release

```sh
[bundle exec] fastlane android release
```

Upload to Google Play production

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
