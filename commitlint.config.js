// commitlint.config.js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "revert",
        "ci",
        "build",
      ],
    ],
    "subject-case": [0, "always"], // Không ép buộc lowercase toàn bộ vì tiếng Việt có dấu
  },
};
