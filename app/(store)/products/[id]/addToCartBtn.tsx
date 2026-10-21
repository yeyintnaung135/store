"use client";

import { useCart } from "@/app/store/cart-context";

type Props = {
  product: {
    id: number;
    name: string;
    price: number;
  };
};

export default function AddToCartBtn({ product }: Props) {
  const { dispatch } = useCart();

  function handleAddToCart() {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
    >
      Add to Cart
    </button>
  );
}
