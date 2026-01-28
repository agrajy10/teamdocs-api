import bcrypt from "bcrypt";

async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export default comparePassword;
