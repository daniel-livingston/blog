import express from "express";
import User from "../db/users";

const router = express.Router();

router.get("/", async (req, res) => {
	if (!req.body.username) {
		return res.status(400).send();
	}
	try {
		const user = await User.findByUsername(req.body.username);
		if (!user) {
			return res.status(404).send();
		}

		res.send(user);
	} catch (error) {
		res.status(500).send();
	}
});

router.get("/:id", async (req, res) => {
	console.log(req.params.id);
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).send();
		}

		res.send(user);
	} catch (error) {
		res.status(400).send({ error });
	}
});

router.post("/", async (req, res) => {
	try {
		const user = await User.register(
			{ username: req.body.username, password: req.body.password },
			{}
		);
		if (!user) {
			return res.status(400).send();
		}
		res.send(user);
	} catch (error) {
		res.status(400).send({ error });
	}
});

export default router;
