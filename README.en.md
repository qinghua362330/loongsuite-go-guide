# LoongSuite Go Guide

An independent, community-maintained learning guide to Go instrumentation: seven introductory steps, thirteen chapters, twenty source walkthroughs, interactive diagrams, quizzes, and runnable labs.

**This is optional supplementary material, not the official LoongSuite Go documentation.** The [official documentation](https://alibaba.github.io/loongsuite-go/) is the authority for supported versions, installation, configuration and current usage.

- [Read in English](https://qinghua362330.github.io/loongsuite-go-guide/?lang=en)
- [Read in Simplified Chinese](https://qinghua362330.github.io/loongsuite-go-guide/?lang=zh)
- [中文 README](README.md)

Use the language buttons in the page header. Switching languages preserves the current lesson URL and saved progress/notes. Share a particular English lesson with a URL such as `?lang=en#/start/1`.

## Version scope

The source walkthroughs and recorded lab evidence deliberately use the fixed upstream v1.15.0 / `cac400935add57d8219122ba32857b8f55ac6eb1` snapshot. This is a reproducible teaching baseline, not a requirement for every current release. For another tool version, consult its official compatibility information and corresponding source revision. Code excerpts, executable examples and captured output retain their original text in both languages.

## Local preview

```sh
npm run build
npm run check
python3 -m http.server 8767 --bind 127.0.0.1 --directory dist
```

Visit `http://127.0.0.1:8767/?lang=en`. The website uses native JavaScript and has no framework dependencies. The generated `dist/offline.html` also includes both languages; source links still require a network connection.

## Editing translations

Chinese course data remains the canonical content. Static English dictionaries live in `dist/locales/en/`; renderer interface text uses `t(zh, en)` from `dist/i18n.js`. New narrative content must have an English translation. The localization check compares content structure, routes, quiz answers and executable/source evidence across languages, and fails on untranslated narrative leaves.

Run the build and checks before publishing. Browser checks should cover both languages, all course routes, navigation, search, exercises, language switching, saved state and narrow-screen layouts. See [CONTRIBUTING.md](CONTRIBUTING.md) and [VERIFICATION.md](VERIFICATION.md) for the teaching and verification boundaries.
