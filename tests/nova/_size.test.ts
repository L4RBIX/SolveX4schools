import { it } from "vitest";
import { cpp17PromptLines, cpp17PositionOf } from "@schools/nova/cpp17";
it("size", () => {
  for (const id of ["m1.l1.b1","m1.l7.b4","m1.as.b2","m4.l1.b1"]) {
    for (const loc of ["kk","ru"] as const) {
      const n = cpp17PromptLines(cpp17PositionOf(id), loc).join("\n").length;
      console.log(id, loc, n);
    }
  }
});
