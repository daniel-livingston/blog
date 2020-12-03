import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import session, { SessionOptions } from "express-session";
import logger from "morgan";
import passport from "passport";
import passportLocal from "passport-local";

import User from "./db/users";
import userRouter from "./api/users";

const app = express();

app.use(express.static(path.join(__dirname, "../../dist")));
app.use(express.static(path.join(__dirname, "../../public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(logger("dev"));

// Express session config
const sess: SessionOptions = {
	secret: process.env.SECRET,
	cookie: {},
};
if (app.get("env") === "production") {
	app.set("trust proxy", 1);
	sess.cookie.secure = true;
}
app.use(session(sess));

// Passport config
const LocalStrategy = passportLocal.Strategy;
passport.use(
	new LocalStrategy((username, password, done) => {
		User.findByUsername(username)
			.then((user) => {
				if (!user) {
					return done(null, false, { message: "Incorrect username" });
				}
				if (!user.validPassword(password)) {
					return done(null, false, { message: "Incorrect password." });
				}
				return done(null, user);
			})
			.catch((e) => done(e));
	})
);
passport.serializeUser((user: User, done) => {
	done(null, { id: user.id, username: user.username });
});
passport.deserializeUser(({ id }, done) => {
	User.findById(id)
		.then((user) => done(null, user))
		.catch((e) => done(e));
});
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../../public/index.html"));
});

export default app;
