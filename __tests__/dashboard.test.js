const { formatTime } = require("../scripts/formatTime.js");

describe("formatTime()", () => {
  test("formats seconds to Xm Ys", () => {
    expect(formatTime(90)).toBe("1m 30s");
    expect(formatTime(45)).toBe("0m 45s");
  });
});