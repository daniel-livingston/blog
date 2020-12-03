import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import User from "../../../src/server/db/users";
import {
	InvalidInputError,
	InvalidPasswordError,
	InvalidUsernameError,
	UsernameInUseError,
} from "../../../src/server/db/errors";
import { initializeUserDatabase } from "../../../src/server/db/utils";

const userOneId = uuidv4();
const userOneUsername = "userOne";
const userTwoId = uuidv4();
const userTwoUsername = "userTwo";

beforeEach(async () => {
	await initializeUserDatabase(User.dispatcher);
	await User.dispatchQuery(
		"INSERT INTO users(id, username, hash, created_at) VALUES($1, $2, $3, $4) RETURNING *",
		[userOneId, userOneUsername, "fakeHash", new Date()]
	);
	await User.dispatchQuery(
		"INSERT INTO users(id, username, hash, created_at) VALUES($1, $2, $3, $4) RETURNING *",
		[userTwoId, userTwoUsername, "fakeHash", new Date()]
	);
});

afterAll(async () => {
	User.endDispatcher();
});

describe("User.deleteById()", () => {
	test("successfully deletes user on valid id", async () => {
		const user = await User.deleteById(userOneId);
		expect(user).toBeInstanceOf(User);
		expect(user.id).toEqual(userOneId);
		expect(user.username).toEqual(userOneUsername);
		expect(userOneUsername).not.toBeInDatabase();
	});

	test("returns undefined on nonexistent id", async () => {
		const user = await User.deleteById(uuidv4());
		expect(user).toBeUndefined();
	});

	test("throws error on invalid id", async () => {
		expect(User.deleteById("12345")).rejects.toEqual(new InvalidInputError());
	});
});

describe("User.deleteByUsername()", () => {
	test("successfully deletes user on valid username", async () => {
		const user = await User.deleteByUsername(userOneUsername);
		expect(user).toBeInstanceOf(User);
		expect(user.id).toEqual(userOneId);
		expect(user.username).toEqual(userOneUsername);
		expect(userOneUsername).not.toBeInDatabase();
	});

	test("returns undefined on nonexistent username", async () => {
		const user = await User.deleteByUsername("otherUsername");
		expect(user).toBeUndefined();
	});
});

describe("User.findById()", () => {
	test("successfully finds user on valid id", async () => {
		const user = await User.findById(userOneId);
		expect(user).toBeInstanceOf(User);
		expect(user.id).toEqual(userOneId);
		expect(user.username).toEqual(userOneUsername);
	});

	test("throws error on invalid id", async () => {
		expect(User.findById("12345")).rejects.toEqual(new InvalidInputError());
	});

	test("does not find user on nonexistent id", async () => {
		const result = await User.findById(uuidv4());
		expect(result).toBeUndefined();
	});
});

describe("User.findByUsername()", () => {
	test("successfully finds user on valid username", async () => {
		const user = await User.findByUsername(userOneUsername);
		expect(user).toBeInstanceOf(User);
		expect(user.id).toEqual(userOneId);
		expect(user.username).toEqual(userOneUsername);
	});

	test("does not find user on nonexistent username", async () => {
		const user = await User.findByUsername("username21");
		expect(user).toBeUndefined();
	});
});

describe("User.register()", () => {
	test("registers new user properly on valid input", async () => {
		const user = await User.register({ username: "username", password: "password" }, {});
		expect(user).toMatchCredentials("username", "password");
		expect("username").toBeInDatabase();

		const id = uuidv4();
		const userTwo = await User.register(
			{ username: "    username1   ", password: "Password1234" },
			{ id }
		);
		expect(userTwo).toMatchCredentials("username1", "Password1234");
		expect(userTwo.id).toEqual(id);
		expect("username1").toBeInDatabase();
	});

	test("fails on invalid username", async () => {
		await expect(User.register({ username: "ab", password: "password" }, {})).rejects.toEqual(
			new InvalidUsernameError(["length"])
		);
		expect("ab").not.toBeInDatabase();

		await expect(
			User.register({ username: "abcdefgdsfasfdadf", password: "password" }, {})
		).rejects.toEqual(new InvalidUsernameError(["length"]));
		expect("abcdefgdsfasfdadf").not.toBeInDatabase();

		await expect(
			User.register({ username: "abcdefg&", password: "password" }, {})
		).rejects.toEqual(new InvalidUsernameError(["alphanumeric"]));
		expect("abcdefg&").not.toBeInDatabase();

		await expect(User.register({ username: "a&", password: "password" }, {})).rejects.toEqual(
			new InvalidUsernameError(["length, alphanumeric"])
		);
		expect("a&").not.toBeInDatabase();
	});

	test("fails on existing username", async () => {
		await expect(
			User.register({ username: userOneUsername, password: "password" }, {})
		).rejects.toEqual(new UsernameInUseError());
	});

	test("fails on invalid password", async () => {
		await expect(
			User.register({ username: "username", password: "passwo" }, {})
		).rejects.toEqual(new InvalidPasswordError(["min"]));
		expect("username").not.toBeInDatabase();

		await expect(
			User.register(
				{
					username: "username",
					password: "123456789012345678901234567890123456789012345678901",
				},
				{}
			)
		).rejects.toEqual(new InvalidPasswordError(["max"]));
		expect("username").not.toBeInDatabase();

		await expect(
			User.register({ username: "abcdefga", password: "pass word" }, {})
		).rejects.toEqual(new InvalidPasswordError(["spaces"]));
		expect("abcdefga").not.toBeInDatabase();
	});
});

describe("User.updateUsername()", () => {
	test("updates correctly on valid input", async () => {
		const newUsername = "newUsername";
		const user = await User.updateUsername(userOneId, newUsername);
		expect(user).toBeInstanceOf(User);
		expect(user.id).toEqual(userOneId);
		expect(user.username).toEqual(newUsername);
		expect(newUsername).toBeInDatabase();
	});

	test("throws error on invalid id", () => {
		expect(User.updateUsername("12345", "newUsername")).rejects.toEqual(
			new InvalidInputError()
		);
	});

	test("throws error on invalid username", () => {
		expect(User.updateUsername(userOneId, "ab")).rejects.toEqual(
			new InvalidUsernameError(["length"])
		);
	});

	test("throws error on existing username", () => {
		expect(User.updateUsername(userOneId, userTwoUsername)).rejects.toEqual(
			new InvalidInputError()
		);
	});

	test("returns undefined when nonexistent id provided", async () => {
		const result = await User.updateUsername(uuidv4(), "newUsername");
		expect(result).toBeUndefined();
		expect("newUsername").not.toBeInDatabase();
	});
});

describe("User.validatePassword()", () => {
	test("validates properly", () => {
		expect("password").toBeValidPassword(); // minimum 8 characters allowed
		expect("12345678901234567890123456789012345678901234567890").toBeValidPassword(); // max 50
		expect("password1234").toBeValidPassword(); // numbers allowed
		expect("password1234@#$").toBeValidPassword(); // symbols allowed
		expect("     password     ").toBeValidPassword(); // trims password

		expect("passwor").not.toBeValidPassword(); // lower than 8 not allowed
		expect("123456789012345678901234567890123456789012345678901").not.toBeValidPassword(); // over 50
		expect("pass word").not.toBeValidPassword(); // no spaces in the middle
		expect("     ab     ").not.toBeValidPassword(); // validates after trim
	});
});

describe("User.validateUsername()", () => {
	test("validates properly", () => {
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
});

declare global {
	namespace jest {
		interface Matchers<R> {
			toBeInDatabase(): CustomMatcherResult;
			toBeValidPassword(): CustomMatcherResult;
			toBeValidUsername(): CustomMatcherResult;
			toMatchCredentials(username: string, password: string): CustomMatcherResult;
		}
	}
}

expect.extend({
	async toBeInDatabase(received) {
		const result = await User.dispatchQuery("SELECT * FROM users WHERE username = $1", [
			received,
		]);
		const pass = result && result.rows.length > 0;
		if (pass) {
			return {
				message: () => `expected ${received} to not be in the database`,
				pass: true,
			};
		} else {
			return {
				message: () => `expected ${received} to be in the database`,
				pass: false,
			};
		}
	},
	toBeValidPassword(received) {
		let pass: boolean;
		try {
			User.validatePassword(received);
			pass = true;
		} catch (e) {
			pass = false;
		}
		if (pass) {
			return {
				message: () => `expected ${received} to be an invalid password`,
				pass: true,
			};
		} else {
			return {
				message: () => `expected ${received} to be a valid password`,
				pass: false,
			};
		}
	},
	toBeValidUsername(received) {
		let pass: boolean;
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
