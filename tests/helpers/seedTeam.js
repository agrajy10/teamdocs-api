import { getDb } from "../../db/index.js";

async function seedTeam() {
  const team = await getDb().one(
    "INSERT INTO teams (name) VALUES ($1) RETURNING id",
    ["Test Team"],
  );
  return team.id;
}

export default seedTeam;
