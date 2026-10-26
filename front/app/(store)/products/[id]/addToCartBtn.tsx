"use client";

import { useState } from "react";
import { useCart } from "@/app/store/cart-context";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    category?: string;
    description?: string;
  };
};

export default function AddToCartBtn({ product }: Props) {
  const { dispatch } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
    });

    setAdded(true);
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
    >
      {added ? "✓ Added to Cart" : "Add to Cart"}
    </button>
  );
}
