import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { jest } from "@jest/globals";

import type { Product, ProductListResponse } from "@/app/lib/product";

const PAGE_SIZE = 10;

type ProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  signal?: AbortSignal;
};

// Create the mock before loading ProductList.
const mockGetProducts =
  jest.fn<(params?: ProductQuery) => Promise<ProductListResponse>>();

// doMock is not hoisted like jest.mock.
jest.doMock("@/app/lib/product", () => ({
  getProducts: mockGetProducts,
}));

// Import the component only after registering the mock.
const ProductList = require("@/app/(store)/products/productsList").default;

const electronics = {
  id: "electronics",
  name: "Electronics",
  slug: "electronics",
};

const fashion = {
  id: "fashion",
  name: "Fashion",
  slug: "fashion",
};

const productData = [
  ["Wireless Headphones", "17500", electronics],
  ["Mechanical Keyboard", "25000", electronics],
  ["Wireless Mouse", "12000", electronics],
  ["Smart Watch", "45000", fashion],
  ["Laptop Stand", "18000", electronics],
  ["Bluetooth Speaker", "22000", electronics],
  ["USB-C Hub", "30000", electronics],
  ["Webcam HD", "35000", electronics],
  ["Power Bank", "20000", electronics],
  ["USB Flash Drive", "8000", electronics],
  ["Gaming Monitor", "150000", electronics],
  ["Noise Cancelling Headphones", "65000", electronics],
  ["Smart Watch Pro", "55000", fashion],
  ["Laptop Cooling Pad", "16000", electronics],
  ["USB Microphone", "40000", electronics],
  ["Wireless Earbuds", "28000", electronics],
  ["Gaming Controller", "32000", electronics],
  ["Smart Plug", "10000", electronics],
  ["SD Card 128GB", "14000", electronics],
  ["Portable SSD", "90000", electronics],
] as const;

const products: Product[] = productData.map(
  ([name, price, category], index) =>
    ({
      id: String(index + 1),
      name,
      slug: name.toLowerCase().replaceAll(" ", "-"),
      description: `${name} for everyday use.`,
      price,
      stock: 20,
      status: "ACTIVE",
      photoUrl: null,
      categoryId: category.id,
      category,
    }) as Product,
);

function createResponse(
  items: Product[],
  page: number,
  limit: number,
): ProductListResponse {
  const start = (page - 1) * limit;

  return {
    data: items.slice(start, start + limit),
    meta: {
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
    },
  };
}

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];

  readonly root = null;
  readonly rootMargin = "200px";
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {
    IntersectionObserverMock.instances.push(this);
  }

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn((): IntersectionObserverEntry[] => []);

  trigger(isIntersecting = true) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function renderList() {
  return render(<ProductList />);
}

describe("ProductList", () => {
  beforeEach(() => {
    mockGetProducts.mockReset();
    IntersectionObserverMock.instances = [];

    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: IntersectionObserverMock,
    });

    mockGetProducts.mockImplementation(async (params = {}) => {
      const search = params.search?.trim().toLowerCase() ?? "";
      const categoryId = params.categoryId;
      const page = params.page ?? 1;
      const limit = params.limit ?? PAGE_SIZE;

      const filtered = products.filter((product) => {
        const matchesSearch =
          !search ||
          product.name.toLowerCase().includes(search) ||
          (product.description ?? "").toLowerCase().includes(search);

        const matchesCategory =
          !categoryId || product.categoryId === categoryId;

        return matchesSearch && matchesCategory;
      });

      return createResponse(filtered, page, limit);
    });
  });

  it("loads and displays the first page", async () => {
    renderList();

    expect(
      await screen.findByRole("heading", {
        name: "Wireless Headphones",
      }),
    ).toBeInTheDocument();

    expect(mockGetProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: PAGE_SIZE,
      }),
    );

    expect(
      screen.getByRole("link", {
        name: /Wireless Headphones/i,
      }),
    ).toHaveAttribute("href", "/products/1");

    expect(screen.getAllByRole("link")).toHaveLength(PAGE_SIZE);
  });

  it("searches products case-insensitively", async () => {
    renderList();

    await screen.findByRole("heading", {
      name: "Wireless Headphones",
    });

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Search products",
      }),
      { target: { value: "HEADPHONES" } },
    );

    await waitFor(() => {
      expect(mockGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          search: "HEADPHONES",
        }),
      );
    });

    expect(
      await screen.findByRole("heading", {
        name: "Wireless Headphones",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: "Mechanical Keyboard",
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("filters by category and combines it with search", async () => {
    renderList();

    await screen.findByRole("heading", {
      name: "Wireless Headphones",
    });

    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Filter by category",
      }),
      { target: { value: "fashion" } },
    );

    expect(
      await screen.findByRole("heading", {
        name: "Smart Watch",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          categoryId: "fashion",
        }),
      );
    });

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Search products",
      }),
      { target: { value: "smart watch" } },
    );

    expect(
      await screen.findByRole("heading", {
        name: "Smart Watch",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          categoryId: "fashion",
          search: "smart watch",
        }),
      );
    });

    expect(
      screen.queryByRole("heading", {
        name: "Wireless Headphones",
      }),
    ).not.toBeInTheDocument();
  });

  it("sorts loaded products by price descending and ascending", async () => {
    renderList();

    await screen.findByRole("heading", {
      name: "Wireless Headphones",
    });

    const sortSelect = screen.getByRole("combobox", {
      name: "Sort products",
    });

    fireEvent.change(sortSelect, {
      target: { value: "price-desc" },
    });

    await waitFor(() => {
      const actual = screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent);

      const expected = [...products]
        .slice(0, PAGE_SIZE)
        .sort((a, b) => Number(b.price) - Number(a.price))
        .map((product) => product.name);

      expect(actual).toEqual(expected);
    });

    fireEvent.change(sortSelect, {
      target: { value: "price-asc" },
    });

    await waitFor(() => {
      const actual = screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent);

      const expected = [...products]
        .slice(0, PAGE_SIZE)
        .sort((a, b) => Number(a.price) - Number(b.price))
        .map((product) => product.name);

      expect(actual).toEqual(expected);
    });
  });

  it("shows an empty state when no products match", async () => {
    renderList();

    await screen.findByRole("heading", {
      name: "Wireless Headphones",
    });

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Search products",
      }),
      { target: { value: "not-a-real-product" } },
    );

    expect(await screen.findByText("No products found")).toBeInTheDocument();
  });

  it("clears the filters", async () => {
    renderList();

    await screen.findByRole("heading", {
      name: "Wireless Headphones",
    });

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Search products",
      }),
      { target: { value: "headphones" } },
    );

    await waitFor(() => {
      expect(mockGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: "headphones",
        }),
      );
    });

    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Sort products",
      }),
      { target: { value: "price-desc" } },
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(
      screen.getByRole("searchbox", {
        name: "Search products",
      }),
    ).toHaveValue("");

    expect(
      screen.getByRole("combobox", {
        name: "Filter by category",
      }),
    ).toHaveValue("");

    expect(
      screen.getByRole("combobox", {
        name: "Sort products",
      }),
    ).toHaveValue("default");

    await waitFor(() => {
      expect(mockGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          limit: PAGE_SIZE,
          search: "",
        }),
      );
    });
  });

  it("loads the next page when the sentinel intersects", async () => {
    renderList();

    await screen.findByRole("heading", {
      name: "Wireless Headphones",
    });

    await waitFor(() => {
      expect(IntersectionObserverMock.instances.length).toBeGreaterThan(0);
    });

    const observer =
      IntersectionObserverMock.instances[
        IntersectionObserverMock.instances.length - 1
      ];

    act(() => {
      observer.trigger();
    });

    expect(
      await screen.findByRole("heading", {
        name: "Noise Cancelling Headphones",
      }),
    ).toBeInTheDocument();

    expect(mockGetProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: PAGE_SIZE,
      }),
    );
  });

  it("shows an error when the API request fails", async () => {
    mockGetProducts.mockRejectedValueOnce(
      new Error("Unable to load products (500)"),
    );

    renderList();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load products (500)",
    );
  });
});
