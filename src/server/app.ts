import path from "path";
import bodyParser from "body-parser";
import express from "express";
import logger from "morgan";

import userRouter from "./api/users";

const app = express();

app.use(express.static(path.join(__dirname, "../../dist")));
app.use(express.static(path.join(__dirname, "../../public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(logger("dev"));

app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../../public/index.html"));
});

export default app;
