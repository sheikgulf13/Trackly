const jwt = require("jsonwebtoken");

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization token missing or incorrect" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || typeof decoded !== 'object') {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token" });
    }

    // Unknown error
    console.error("JWT Auth Error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};
