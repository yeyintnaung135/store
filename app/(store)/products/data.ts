export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
};

const names = [
  "Wireless Headphones",
  "Smart Watch",
  "Running Shoes",
  "Travel Backpack",
  "Cotton T-Shirt",
  "Sunglasses",
  "Mechanical Keyboard",
  "Wireless Mouse",
  "Bluetooth Speaker",
  "Phone Case",
  "Power Bank",
  "USB-C Hub",
  "Laptop Stand",
  "Desk Lamp",
  "Water Bottle",
  "Sports Jacket",
  "Casual Sneakers",
  "Leather Wallet",
  "Digital Camera",
  "Gaming Headset",
  "Tablet Stand",
  "Fitness Tracker",
  "Portable SSD",
  "Webcam",
  "Monitor Light",
  "Travel Mug",
  "Hoodie",
  "Baseball Cap",
  "Crossbody Bag",
  "Smart Bulb",
  "Desk Mat",
  "Phone Holder",
  "Charging Cable",
  "Earbuds",
  "Mini Projector",
  "Tripod",
  "Yoga Mat",
  "Gym Bag",
  "Socks Pack",
  "Bluetooth Keyboard",
  "Laptop Sleeve",
  "Power Adapter",
  "Gaming Mouse",
  "Wireless Charger",
  "Travel Pillow",
  "Waterproof Watch",
  "Tote Bag",
  "Winter Gloves",
  "Portable Fan",
  "Storage Organizer",
];

const categories = ["Electronics", "Fashion", "Accessories"];

export const products: Product[] = names.map((name, index) => ({
  id: index + 1,
  name,
  price: (index + 1) * 2500 + 15000,
  category: categories[index % categories.length],
  image: `https://placehold.co/600x400/eef2ff/334155?text=${encodeURIComponent(name)}`,
}));
