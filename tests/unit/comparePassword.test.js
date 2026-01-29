import hashPassword from "../../utils/hashPassword";
import comparePassword from "../../utils/comparePassword";

describe("comparePassword", () => {
  it("compares password correctly", async () => {
    const plainPassword = "Plainpassword@123";
    const passwordHash = await hashPassword(plainPassword);

    expect(await comparePassword(plainPassword, passwordHash)).toBe(true);
  });
});
