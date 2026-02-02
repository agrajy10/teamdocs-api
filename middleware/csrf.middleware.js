function csrfValidation(req, res, next) {
  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader) {
    return res.status(401).json({ error: "CSRF token missing" });
  }

  if (csrfCookie !== csrfHeader) {
    return res.status(401).json({ error: "Invalid CSRF token" });
  }

  next();
}

export default csrfValidation;
