async function seedTeam(db, name = "Test Team") {
  const team = await db.one(
    "INSERT INTO teams (name) VALUES ($1) RETURNING id",
    [name],
  );
  return team.id;
}

export default seedTeam;
