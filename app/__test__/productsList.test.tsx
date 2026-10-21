import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { products } from "@/app/(store)/products/data";
import ProductList from "@/app/(store)/products/productsList";

const PAGE_SIZE = 10;

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "200px";
  readonly scrollMargin = "0px";
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {
    IntersectionObserverMock.instances.push(this);
  }

  static instances: IntersectionObserverMock[] = [];

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);

  intersect() {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this,
    );
  }
}

function renderList() {
  return render(<ProductList />);
}

describe("ProductList", () => {
  beforeEach(() => {
    IntersectionObserverMock.instances = [];
    window.IntersectionObserver =
      IntersectionObserverMock as unknown as typeof IntersectionObserver;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the first page of products", () => {
    renderList();

    expect(
      screen.getByRole("heading", { name: "All Products" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(PAGE_SIZE);
    expect(
      screen.getByText(`Showing ${PAGE_SIZE} of ${products.length} products`),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: products[0].name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: products[PAGE_SIZE].name }),
    ).not.toBeInTheDocument();

    const firstCard = screen
      .getByRole("heading", { name: products[0].name })
      .closest("article") as HTMLElement;

    expect(within(firstCard).getByText("17,500 MMK")).toBeInTheDocument();
    expect(
      within(firstCard).getByRole("link", { name: "View Product" }),
    ).toHaveAttribute("href", "/products/1");
  });

  it("filters by search text without caring about case or extra spaces", () => {
    renderList();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search products" }),
      {
        target: { value: "  HEADPHONES  " },
      },
    );

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Wireless Headphones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 1 products")).toBeInTheDocument();
    expect(
      screen.getByText("You have viewed all 1 matching products."),
    ).toBeInTheDocument();
  });

  it("filters by category and can combine that filter with search", () => {
    renderList();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter by category" }),
      {
        target: { value: "Fashion" },
      },
    );

    const fashionProducts = products.filter(
      (product) => product.category === "Fashion",
    );

    expect(
      screen.getByText(
        `Showing ${PAGE_SIZE} of ${fashionProducts.length} products`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Smart Watch" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Wireless Headphones" }),
    ).not.toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search products" }),
      {
        target: { value: "smart watch" },
      },
    );

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Smart Watch" }),
    ).toBeInTheDocument();
  });

  it("sorts the visible products by price", () => {
    renderList();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Sort products by price" }),
      { target: { value: "price-desc" } },
    );

    const headings = screen.getAllByRole("heading", { level: 2 });
    const highestFirst = [...products]
      .sort((a, b) => b.price - a.price)
      .slice(0, PAGE_SIZE)
      .map((product) => product.name);

    expect(headings.map((heading) => heading.textContent)).toEqual(
      highestFirst,
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Sort products by price" }),
      { target: { value: "price-asc" } },
    );

    const lowestFirst = [...products]
      .sort((a, b) => a.price - b.price)
      .slice(0, PAGE_SIZE)
      .map((product) => product.name);

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(lowestFirst);
  });

  it("shows an empty state and restores the catalog when filters are cleared", () => {
    renderList();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search products" }),
      {
        target: { value: "not-a-real-product" },
      },
    );

    expect(screen.getByText("No products found")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Clear Filters" })[0],
    );

    expect(screen.getAllByRole("article")).toHaveLength(PAGE_SIZE);
    expect(
      screen.getByRole("searchbox", { name: "Search products" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: "Filter by category" }),
    ).toHaveValue("All");
  });

  it("loads the next page when the list sentinel intersects", () => {
    renderList();

    const observer = IntersectionObserverMock.instances.at(-1);
    expect(observer).toBeDefined();

    act(() => {
      observer?.intersect();
    });

    expect(screen.getByText("Loading more products...")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(screen.getAllByRole("article")).toHaveLength(PAGE_SIZE * 2);
    expect(
      screen.getByRole("heading", { name: products[PAGE_SIZE].name }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Showing ${PAGE_SIZE * 2} of ${products.length} products`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Loading more products..."),
    ).not.toBeInTheDocument();
  });
});
