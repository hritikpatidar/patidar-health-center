import jwt from "jsonwebtoken";

const authorize = (allowedUserTypes, invalidMessage = "Invalid user credintials!") => (
  req,
  res,
  next,
) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!token) {
      return res.status(401).json({ msg: "Invalid Token" });
    }

    const verify = jwt.verify(token, process.env.API_USER_AUTH_KEY);
    if (!allowedUserTypes.includes(verify.user?.user_type)) {
      return res.status(403).json({ msg: invalidMessage });
    }
    req.user = verify.user;
    return next();
  } catch {
    return res.status(401).json({ msg: "Invalid Token" });
  }
};

const suerAdmin = authorize(["Super_Admin"], "User is not SuperAdmin");
const normalUer = authorize(["normal_user"], "User is not normal_user");
const allUser = authorize(["normal_user", "Super_Admin", "doctor_user"]);
const doctorAuth = authorize(["doctor_user"]);
const doctorAndAsuperAdmin = authorize(["Super_Admin", "doctor_user"]);

export { suerAdmin, normalUer, allUser, doctorAuth, doctorAndAsuperAdmin };
