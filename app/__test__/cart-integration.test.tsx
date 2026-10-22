import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import AddToCartBtn from "@/app/(store)/products/[id]/addToCartBtn";
import Navbar from "@/app/(store)/components/NavBarComponent";
import CartPage from "@/app/(store)/cart/page";
import { CartProvider } from "@/app/store/cart-context";

const CART_STORAGE_KEY = "mm-store-cart";

const product = {
  id: 1,
  name: "Wireless Headphones",
  price: 25000,
};

function renderCartExperience() {
  return render(
    <CartProvider>
      <Navbar />
      <AddToCartBtn product={product} />
      <CartPage />
    </CartProvider>,
  );
}

describe("cart integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("throws when useCart is used outside CartProvider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<Navbar />)).toThrow(
      "useCart must be used within CartProvider",
    );

    consoleError.mockRestore();
  });

  it("updates Navbar cart count when Add to Cart is clicked", async () => {
    renderCartExperience();

    expect(screen.getByRole("link", { name: "Cart (0)" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(
      await screen.findByRole("link", { name: "Cart (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Shopping Cart" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: product.name }),
    ).toBeInTheDocument();
  });

  it("increments quantity when the same product is added again", async () => {
    renderCartExperience();

    const addButton = screen.getByRole("button", { name: "Add to Cart" });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(
      await screen.findByRole("link", { name: "Cart (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const summary = screen.getByText("Total").parentElement as HTMLElement;
    expect(within(summary).getByText("50,000 MMK")).toBeInTheDocument();
    expect(screen.getAllByText("50,000 MMK")).toHaveLength(2);
  });

  it("updates quantity, line total, cart count, and grand total from cart controls", async () => {
    renderCartExperience();

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(
      await screen.findByRole("link", { name: "Cart (1)" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Increase ${product.name} quantity`,
      }),
    );

    expect(
      await screen.findByRole("link", { name: "Cart (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const summary = screen.getByText("Total").parentElement as HTMLElement;
    expect(within(summary).getByText("50,000 MMK")).toBeInTheDocument();
    expect(screen.getAllByText("50,000 MMK")).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", {
        name: `Decrease ${product.name} quantity`,
      }),
    );

    expect(
      await screen.findByRole("link", { name: "Cart (1)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(within(summary).getByText("25,000 MMK")).toBeInTheDocument();
  });

  it("removes the item and shows empty cart when quantity decreases to zero", async () => {
    renderCartExperience();

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(
      await screen.findByRole("link", { name: "Cart (1)" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Decrease ${product.name} quantity`,
      }),
    );

    expect(
      await screen.findByRole("link", { name: "Cart (0)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your Cart Is Empty" }),
    ).toBeInTheDocument();
  });

  it("persists cart changes to localStorage after hydration", async () => {
    renderCartExperience();

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    await waitFor(() => {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved as string);
      expect(parsed.items).toEqual([
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    });
  });

  it("restores cart items and Navbar count from localStorage on mount", async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: [
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 3,
          },
        ],
      }),
    );

    render(
      <CartProvider>
        <Navbar />
        <CartPage />
      </CartProvider>,
    );

    expect(
      await screen.findByRole("link", { name: "Cart (3)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: product.name }),
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    const summary = screen.getByText("Total").parentElement as HTMLElement;
    expect(within(summary).getByText("75,000 MMK")).toBeInTheDocument();
    expect(screen.getAllByText("75,000 MMK")).toHaveLength(2);
  });

  it("ignores invalid localStorage cart items during restore", async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: [
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 2,
          },
          {
            id: "bad",
            name: "",
            price: -1,
            quantity: 0,
          },
        ],
      }),
    );

    render(
      <CartProvider>
        <Navbar />
        <CartPage />
      </CartProvider>,
    );

    expect(
      await screen.findByRole("link", { name: "Cart (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("bad")).not.toBeInTheDocument();
  });
});
