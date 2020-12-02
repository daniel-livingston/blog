import app from "./app";
import User from "./db/users";

const port = process.env.PORT || 8080;

app.on("close", () => {
	User.endDispatcher();
});

app.listen(port, async () => {
	console.log("Server listening on port 8080");
});
