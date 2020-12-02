import bcrypt from "bcrypt";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import User from "../../../src/server/db/users";
import { InvalidUsernameError } from "../../../src/server/db/errors";

const userOneId = uuidv4();
const userOneUsername = "userOne";

beforeEach(async () => {
	await User.dispatchQuery("DROP TABLE IF EXISTS users", []);
	await User.dispatchQuery(
		"CREATE TABLE users (" +
			"id UUID PRIMARY KEY, " +
			"username VARCHAR(16), " +
			"hash TEXT," +
			"created_at TIMESTAMPTZ" +
			")",
		[]
	);
	await User.dispatchQuery(
		"INSERT INTO users(id, username, hash, created_at) VALUES($1, $2, $3, $4) RETURNING *",
		[userOneId, userOneUsername, "fakeHash", new Date()]
	);
});

afterAll(async () => {
	User.endDispatcher();
});

describe("User.findById()", () => {
	test("successfully finds user on valid id", async () => {
		const user = await User.findById(userOneId);
		expect(user).toBeInstanceOf(User);
		expect(user.id).toEqual(userOneId);
		expect(user.username).toEqual(userOneUsername);
	});

	test("does not find user on invalid id", async () => {
		const user = await User.findById(uuidv4());
		expect(user).toBeUndefined();
	});
});

describe("User.findByUsername", () => {
	test("successfully finds user on valid username", async () => {
		const user = await User.findByUsername(userOneUsername);
		expect(user).toBeInstanceOf(User);
		expect(user.id).toEqual(userOneId);
		expect(user.username).toEqual(userOneUsername);
	});

	test("does not find user on invalid id", async () => {
		const user = await User.findByUsername("invalidUsername");
		expect(user).toBeUndefined();
	});
});

describe("User.register()", () => {
	test("registers new user properly on valid input", async () => {
		const user = await User.register({ username: "username", password: "password" }, {});
		expect(user).toMatchCredentials("username", "password");

		const id = uuidv4();
		const userTwo = await User.register(
			{ username: "    username   ", password: "Password1234" },
			{ id }
		);
		expect(userTwo).toMatchCredentials("username", "Password1234");
		expect(userTwo.id).toEqual(id);
	});

	test("fails on invalid username", () => {
		expect(User.register({ username: "ab", password: "password" }, {})).rejects.toEqual(
			new InvalidUsernameError(["length"])
		);

		expect(
			User.register({ username: "abcdefgdsfasfdadf", password: "password" }, {})
		).rejects.toEqual(new InvalidUsernameError(["length"]));

		expect(User.register({ username: "abcdefg&", password: "password" }, {})).rejects.toEqual(
			new InvalidUsernameError(["alphanumeric"])
		);

		expect(User.register({ username: "a&", password: "password" }, {})).rejects.toEqual(
			new InvalidUsernameError(["length, alphanumeric"])
		);
	});
});

test("User.validateUsername() validates properly", () => {
	expect("abc").toBeValidUsername();
	expect("abcdefghijklmnop").toBeValidUsername();
	expect("123").toBeValidUsername();
	expect("123456789101112").toBeValidUsername();
	expect("ab1").toBeValidUsername();
	expect("a4cde2ghij3lmn1").toBeValidUsername();
	expect("acC1234Adf").toBeValidUsername();
	expect("   abc   ").toBeValidUsername();

	expect("ab").not.toBeValidUsername();
	expect("abcdefghijklmnopq").not.toBeValidUsername();
	expect("abcde_").not.toBeValidUsername();
	expect("     ab     ").not.toBeValidUsername();
});

declare global {
	namespace jest {
		interface Matchers<R> {
			toBeValidUsername(): CustomMatcherResult;
			toMatchCredentials(username: string, password: string): CustomMatcherResult;
		}
	}
}

expect.extend({
	toBeValidUsername(received) {
		let pass;
		try {
			User.validateUsername(received);
			pass = true;
		} catch (e) {
			pass = false;
		}
		if (pass) {
			return {
				message: () => `expected ${received} to be an invalid username`,
				pass: true,
			};
		} else {
			return {
				message: () => `expected ${received} to be a valid username`,
				pass: false,
			};
		}
	},
	toMatchCredentials(received, username, password) {
		const pass =
			received instanceof User &&
			received.username === username &&
			bcrypt.compareSync(password, received.hash);
		if (pass) {
			return {
				message: () => `expected ${received} to not match credentials`,
				pass: true,
			};
		} else {
			return {
				message: () => `expected ${received} to match credentials`,
				pass: false,
			};
		}
	},
});
