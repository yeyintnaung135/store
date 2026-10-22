import {
  cartReducer,
  initialCartState,
  type CartItem,
  type CartState,
} from "../store/cart-reducer";

const productA = {
  id: 1,
  name: "Wireless Headphones",
  price: 25000,
};

const productB = {
  id: 2,
  name: "Smart Watch",
  price: 40000,
};

function makeState(items: CartItem[]): CartState {
  return { items };
}

describe("cartReducer", () => {
  describe("ADD_TO_CART", () => {
    it("adds a new product with quantity 1", () => {
      const next = cartReducer(initialCartState, {
        type: "ADD_TO_CART",
        payload: productA,
      });

      expect(next.items).toEqual([{ ...productA, quantity: 1 }]);
    });

    it("increments quantity when the same product is added again", () => {
      const state = makeState([{ ...productA, quantity: 1 }]);

      const next = cartReducer(state, {
        type: "ADD_TO_CART",
        payload: productA,
      });

      expect(next.items).toEqual([{ ...productA, quantity: 2 }]);
      expect(next.items).toHaveLength(1);
    });

    it("adds a second distinct product without changing the first", () => {
      const state = makeState([{ ...productA, quantity: 2 }]);

      const next = cartReducer(state, {
        type: "ADD_TO_CART",
        payload: productB,
      });

      expect(next.items).toEqual([
        { ...productA, quantity: 2 },
        { ...productB, quantity: 1 },
      ]);
    });

    it("does not mutate the previous state", () => {
      const state = makeState([{ ...productA, quantity: 1 }]);
      const itemsBefore = state.items;
      const firstItemBefore = state.items[0];

      cartReducer(state, {
        type: "ADD_TO_CART",
        payload: productA,
      });

      expect(state.items).toBe(itemsBefore);
      expect(state.items[0]).toBe(firstItemBefore);
      expect(state.items[0].quantity).toBe(1);
    });
  });

  describe("INCREASE_QUANTITY", () => {
    it("increases quantity for a known product id", () => {
      const state = makeState([
        { ...productA, quantity: 1 },
        { ...productB, quantity: 3 },
      ]);

      const next = cartReducer(state, {
        type: "INCREASE_QUANTITY",
        payload: { id: productB.id },
      });

      expect(next.items).toEqual([
        { ...productA, quantity: 1 },
        { ...productB, quantity: 4 },
      ]);
    });

    it("leaves state unchanged for an unknown product id", () => {
      const state = makeState([{ ...productA, quantity: 2 }]);

      const next = cartReducer(state, {
        type: "INCREASE_QUANTITY",
        payload: { id: 999 },
      });

      expect(next.items).toEqual([{ ...productA, quantity: 2 }]);
      expect(next.items).not.toBe(state.items);
    });

    it("does not mutate the previous state", () => {
      const state = makeState([{ ...productA, quantity: 1 }]);
      const itemsBefore = state.items;

      cartReducer(state, {
        type: "INCREASE_QUANTITY",
        payload: { id: productA.id },
      });

      expect(state.items).toBe(itemsBefore);
      expect(state.items[0].quantity).toBe(1);
    });
  });

  describe("DECREASE_QUANTITY", () => {
    it("decreases quantity for a known product id", () => {
      const state = makeState([{ ...productA, quantity: 3 }]);

      const next = cartReducer(state, {
        type: "DECREASE_QUANTITY",
        payload: { id: productA.id },
      });

      expect(next.items).toEqual([{ ...productA, quantity: 2 }]);
    });

    it("removes the item when quantity decreases to zero", () => {
      const state = makeState([
        { ...productA, quantity: 1 },
        { ...productB, quantity: 2 },
      ]);

      const next = cartReducer(state, {
        type: "DECREASE_QUANTITY",
        payload: { id: productA.id },
      });

      expect(next.items).toEqual([{ ...productB, quantity: 2 }]);
    });

    it("leaves state unchanged for an unknown product id", () => {
      const state = makeState([{ ...productA, quantity: 2 }]);

      const next = cartReducer(state, {
        type: "DECREASE_QUANTITY",
        payload: { id: 999 },
      });

      expect(next.items).toEqual([{ ...productA, quantity: 2 }]);
    });

    it("does not mutate the previous state", () => {
      const state = makeState([{ ...productA, quantity: 2 }]);
      const itemsBefore = state.items;

      cartReducer(state, {
        type: "DECREASE_QUANTITY",
        payload: { id: productA.id },
      });

      expect(state.items).toBe(itemsBefore);
      expect(state.items[0].quantity).toBe(2);
    });
  });

  describe("REMOVE_FROM_CART", () => {
    it("removes a known product by id", () => {
      const state = makeState([
        { ...productA, quantity: 2 },
        { ...productB, quantity: 1 },
      ]);

      const next = cartReducer(state, {
        type: "REMOVE_FROM_CART",
        payload: { id: productA.id },
      });

      expect(next.items).toEqual([{ ...productB, quantity: 1 }]);
    });

    it("leaves state unchanged for an unknown product id", () => {
      const state = makeState([{ ...productA, quantity: 1 }]);

      const next = cartReducer(state, {
        type: "REMOVE_FROM_CART",
        payload: { id: 999 },
      });

      expect(next.items).toEqual([{ ...productA, quantity: 1 }]);
    });

    it("does not mutate the previous state", () => {
      const state = makeState([{ ...productA, quantity: 1 }]);
      const itemsBefore = state.items;

      cartReducer(state, {
        type: "REMOVE_FROM_CART",
        payload: { id: productA.id },
      });

      expect(state.items).toBe(itemsBefore);
      expect(state.items).toHaveLength(1);
    });
  });

  describe("CLEAR_CART", () => {
    it("resets to the initial empty cart state", () => {
      const state = makeState([
        { ...productA, quantity: 2 },
        { ...productB, quantity: 1 },
      ]);

      const next = cartReducer(state, { type: "CLEAR_CART" });

      expect(next).toEqual(initialCartState);
      expect(next.items).toHaveLength(0);
    });

    it("does not mutate the previous state", () => {
      const state = makeState([{ ...productA, quantity: 1 }]);
      const itemsBefore = state.items;

      cartReducer(state, { type: "CLEAR_CART" });

      expect(state.items).toBe(itemsBefore);
      expect(state.items).toHaveLength(1);
    });
  });

  describe("LOAD_CART", () => {
    it("replaces items with the loaded payload", () => {
      const state = makeState([{ ...productA, quantity: 1 }]);
      const payload = [
        { ...productB, quantity: 4 },
        { ...productA, quantity: 2 },
      ];

      const next = cartReducer(state, {
        type: "LOAD_CART",
        payload,
      });

      expect(next.items).toEqual(payload);
    });

    it("can load an empty cart", () => {
      const state = makeState([{ ...productA, quantity: 3 }]);

      const next = cartReducer(state, {
        type: "LOAD_CART",
        payload: [],
      });

      expect(next.items).toEqual([]);
    });

    it("does not mutate the previous state", () => {
      const state = makeState([{ ...productA, quantity: 1 }]);
      const itemsBefore = state.items;
      const payload = [{ ...productB, quantity: 2 }];

      cartReducer(state, {
        type: "LOAD_CART",
        payload,
      });

      expect(state.items).toBe(itemsBefore);
      expect(state.items).toEqual([{ ...productA, quantity: 1 }]);
    });
  });
});
