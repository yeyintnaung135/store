import { render, screen } from "@testing-library/react";

function HomePage() {
  return <h1>Welcome to MM Store</h1>;
}

describe("HomePage", () => {
  it("renders the welcome heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Welcome to MM Store" })
    ).toBeInTheDocument();
  });
});
