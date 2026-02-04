import db from "../../db/index.js";

async function seedTeam() {
  const team = await db.one(
    "INSERT INTO teams (name) VALUES ($1) RETURNING id",
    ["Test Team"],
  );
  return team.id;
}

export default seedTeam;
