// Creator middleware to verify creator role
const creatorMiddleware = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Please login first" });
  }

  // Check if user has creator role
  if (req.user.role !== "creator") {
    return res
      .status(403)
      .json({ message: "Forbidden - Creator access required" });
  }

  next();
};

export default creatorMiddleware;
