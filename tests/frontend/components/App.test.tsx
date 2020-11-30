import * as React from "react";
import TestRenderer from "react-test-renderer";
import App from "../../../src/frontend/components/App";

test("renders snapshot correctly", () => {
	const wrapper = TestRenderer.create(<App />);

	expect(wrapper.toJSON()).toMatchSnapshot();
});
