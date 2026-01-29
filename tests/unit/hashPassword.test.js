import bcrypt from "bcrypt";
import hashPassword from "../../utils/hashPassword";

describe("hashPassword", () => {
  it("hashes password correctly", async () => {
    const hash = await hashPassword("StrongPass1!");
    expect(await bcrypt.compare("StrongPass1!", hash)).toBe(true);
  });
});
