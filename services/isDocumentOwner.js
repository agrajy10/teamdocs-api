async function isDocumentOwner(ownerId, userId) {
  return ownerId === userId;
}

export default isDocumentOwner;
