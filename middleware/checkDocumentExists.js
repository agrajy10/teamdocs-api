import documentExists from "../services/documentExists.js";

async function checkDocumentExists(req, res, next) {
  const documentId = req.params.id;
  const teamId = req.teamId;

  const document = await documentExists(documentId, teamId);

  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  req.document = document;
  next();
}

export default checkDocumentExists;
