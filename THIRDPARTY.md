# Third-Party Notices

Additional Context Menus is distributed under the MIT License. This notice summarizes key third-party development tools used to build, test, package, and maintain the extension.

For a current full dependency report, run:

```bash
pnpm licenses list --json
```

| Package                 | Version(s)              | License    | Project                                                                    |
| ----------------------- | ----------------------- | ---------- | -------------------------------------------------------------------------- |
| `@vitest/coverage-v8`   | 4.1.7                   | MIT        | https://github.com/vitest-dev/vitest/tree/main/packages/coverage-v8#readme |
| `@vscode/test-electron` | 2.5.2                   | MIT        | https://github.com/Microsoft/vscode-test#readme                            |
| `@vscode/vsce`          | 3.9.1                   | MIT        | https://code.visualstudio.com                                              |
| `all-contributors-cli`  | 6.26.1                  | MIT        | https://github.com/all-contributors/all-contributors-cli#readme            |
| `esbuild`               | 0.28.0                  | MIT        | https://github.com/evanw/esbuild#readme                                    |
| `eslint`                | 10.4.0                  | MIT        | https://eslint.org                                                         |
| `husky`                 | 9.1.7                   | MIT        | https://github.com/typicode/husky#readme                                   |
| `lint-staged`           | 17.0.5                  | MIT        | https://github.com/lint-staged/lint-staged#readme                          |
| `mocha`                 | 11.7.6                  | MIT        | https://mochajs.org/                                                       |
| `ovsx`                  | 0.10.12                 | EPL-2.0    | https://open-vsx.org                                                       |
| `prettier`              | 3.8.3                   | MIT        | https://prettier.io                                                        |
| `tsx`                   | 4.22.3                  | MIT        | https://tsx.is                                                             |
| `typescript`            | 5.9.3                   | Apache-2.0 | https://www.typescriptlang.org/                                            |
| `vitest`                | 4.1.7                   | MIT        | https://github.com/vitest-dev/vitest#readme                                |

This file is informational and does not replace individual package license texts.

## GitHub Actions Tooling

Repository automation also uses GitHub Actions maintained by GitHub and pnpm, including checkout, setup-node, cache, upload-artifact, dependency-review-action, github-script, and pnpm/action-setup.
