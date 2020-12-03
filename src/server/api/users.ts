import { Router } from "express";
import passport from "passport";
import User from "../db/users";

const router = Router();

/**
 * Logs a user into a session.
 */
router.post("/login", passport.authenticate("local"), (req, res) => {
	res.redirect("/users/" + req.user.username);
});

/**
 * Logs a user out of a session.
 */
router.post("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
});

/**
 * Gets the logged in user's profile.
 */
router.get("/me", async (req, res) => {
	if (!req.user) {
		return res.status(401).send();
	}

	try {
		const user = await User.findById(req.user.id);
		res.send(user);
	} catch (e) {
		res.status(500).send();
	}
});

/**
 * Registers a user into the database and logs the user into a session.
 */
router.post("/register", async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.register({ username, password }, {});
		if (!user) {
			return res.status(400).send();
		}

		req.login(user, (e) => {
			if (e) {
				return res.status(500).send();
			}

			res.send(user);
		});
	} catch (e) {
		res.status(400).send(e);
	}
});

export default router;
