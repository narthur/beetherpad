"use strict";

const { shouldRewriteUrl } = require("./shouldRewriteUrl");

describe("shouldRewriteUrl", () => {
  it.each([
    ["/admin-auth", false],
    ["/admin", false],
    ["/api/404", false],
    ["/foo?public=true", true],
    ["/foo", true],
    ["/foo/export/txt", true],
    ["/foo/timeslider", true],
    ["/health", false],
    ["/p/foo?public=true", false],
    ["/p/foo", false],
    ["/p/foo/export/txt", false],
    ["/p/foo/timeslider", false],
    ["/post", false],
    ["/static/empty.html", false],
    ["foo.bar", false],
  ])("shouldRewriteUrl(%s) -> %s", (path, expected) => {
    expect(shouldRewriteUrl(path)).toBe(expected);
  });
});
