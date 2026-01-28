import { SALT_ROUNDS } from "../constants/constants.js";
import bcrypt from "bcrypt";

async function hashPassword(plainPassword) {
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
}

export default hashPassword;
