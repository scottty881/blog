---
title: "Are your tests actually running?"
date: 2026-11-24
---

I was reminded the other day to run an audit of all of the test suite to confirm that the tests are all running and that they are all tests that are worth having. The second part of the audit is still outstanding but I ran this on one of the codebases I contribute to and thought I would share some fun reasons why parts of my test suite were not running.

- **Path filters that are too narrow or wrong.** - Three services only had their test suites run when their own folder changed, but those tests imported shared code from elsewhere in the repo. One of those jobs hadn't run once in the last 1,000 CI jobs and a change to the shared code could break them and we wouldn't have known.
- **A test list in code.** - One job ran Python tests from a list in code or docs. Nine files weren't on it, and one of those files had been failing for two months.
- **Skips that depend on the environment.** - A few dozen tests skip when a CLI tool is missing. The CI image doesn't have it, so they always skipped.
- **Tests without a runner.** - Infrastructure tests were written but they weren't included in any of the CI jobs.
- **No counts checks.** - CI passed with "0 tests", so a suite that shrank to nothing would still pass.

Still amazes me that this is the kind of task that would have taken a day or more of someone's time a year ago and now is something that I am going to automate to run on a recurring basis.
