import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import CategoriesPage from "../(store)/categories/page";
import { products } from "../(store)/products/data";

describe("CategoriesPage", () => {
  beforeEach(() => {
    render(<CategoriesPage />);
  });

  it("renders the categories page heading", () => {
    expect(
      screen.getByRole("heading", { name: "Shop by Category" }),
    ).toBeInTheDocument();
  });

  it("renders all product categories", () => {
    expect(
      screen.getByRole("heading", { name: "Electronics" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Fashion" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Accessories" }),
    ).toBeInTheDocument();
  });

  it("displays the correct product count for each category", () => {
    const categories = ["Electronics", "Fashion", "Accessories"];

    for (const category of categories) {
      const expectedCount = products.filter(
        (product) => product.category === category,
      ).length;

      expect(
        screen.getAllByText(`${expectedCount} products`).length,
      ).toBeGreaterThan(0);
    }
  });

  it("links each category to the corresponding products filter", () => {
    const links = screen.getAllByRole("link", {
      name: /browse products/i,
    });

    expect(links).toHaveLength(3);

    expect(links[0]).toHaveAttribute("href", "/products?category=Electronics");

    expect(links[1]).toHaveAttribute("href", "/products?category=Fashion");

    expect(links[2]).toHaveAttribute("href", "/products?category=Accessories");
  });

  it("renders a browse link for every category", () => {
    const links = screen.getAllByRole("link", {
      name: /browse products/i,
    });

    expect(links).toHaveLength(3);
    expect(links[1]).toHaveAttribute("href", "/products?category=Fashion");
    expect(links[2]).toHaveAttribute("href", "/products?category=Accessories");
  });
});
