import path from "path";
import express from "express";
import logger from "morgan";

const app = express();

app.use(express.static(path.join(__dirname, "../../dist")));
app.use(express.static(path.join(__dirname, "../../public")));

app.use(logger("dev"));

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../../public/index.html"));
});

export default app;
