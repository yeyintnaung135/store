import http from "node:http";

const PORT = 4010;

const categorySeed = () => [
  {
    id: "cat-electronics",
    name: "Electronics",
    slug: "electronics",
    description: "Gadgets and everyday technology.",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-fashion",
    name: "Fashion",
    slug: "fashion",
    description: "Styles for every occasion.",
    createdAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "cat-accessories",
    name: "Accessories",
    slug: "accessories",
    description: "Useful accessories.",
    createdAt: "2026-01-03T00:00:00.000Z",
  },
];

const productNames = [
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
  "Leather Wallet",
];

function productSeed() {
  const categories = categorySeed();

  return productNames.map((name, index) => {
    const category = categories[index % categories.length];

    return {
      id: String(index + 1),
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: `${name} is ready for everyday use.`,
      price: (index + 1) * 2500 + 15000,
      stock: name === "Leather Wallet" ? 2 : 20,
      status: name === "Sunglasses" ? "DRAFT" : "ACTIVE",
      photoUrl: null,
      categoryId: category.id,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
    };
  });
}

function orderSeed() {
  return Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;
    const status = number === 1 ? "PENDING" : number === 2 ? "SHIPPED" : "DELIVERED";
    const name = number === 2 ? "Aye Aye" : `Customer ${number}`;

    return {
      id: `ord-${number}`,
      orderNumber: `ORD-A${String(number).padStart(2, "0")}`,
      userId: `user-${number}`,
      status,
      total: 10000 * number,
      createdAt: `2026-10-${String(number).padStart(2, "0")}T09:00:00.000Z`,
      updatedAt: `2026-10-${String(number).padStart(2, "0")}T09:00:00.000Z`,
      user: {
        id: `user-${number}`,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, "")}@example.com`,
        phone: "09123456789",
      },
      items: [
        {
          id: `item-${number}`,
          productId: "1",
          productName: "Wireless Headphones",
          unitPrice: 17500,
          quantity: 1,
          subtotal: 17500,
        },
      ],
    };
  });
}

const adminUser = {
  id: "admin-1",
  name: "Store Admin",
  email: "admin@example.com",
  phone: null,
  role: "ADMIN",
};

const customerUser = {
  id: "user-1",
  name: "Test Customer",
  email: "user@example.com",
  phone: "+959123456789",
  role: "CUSTOMER",
};

let categories = categorySeed();
let products = productSeed();
let orders = orderSeed();
let exportJobs = new Map();

function reset() {
  categories = categorySeed();
  products = productSeed();
  orders = orderSeed();
  exportJobs = new Map();
}

function send(req, res, status, body) {
  const origin = req.headers.origin || "http://localhost:3000";
  const payload = body === undefined ? "" : JSON.stringify(body);

  res.writeHead(status, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function tokenOf(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function userForToken(token) {
  if (token === "admin-token") return adminUser;
  if (token === "customer-token") return customerUser;
  return null;
}

function requireUser(req, res) {
  const user = userForToken(tokenOf(req));

  if (!user) {
    send(req, res, 401, { message: "Unauthorized" });
    return null;
  }

  return user;
}

function paginate(items, url) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.max(1, Number(url.searchParams.get("limit") || 10));
  const start = (page - 1) * limit;

  return {
    data: items.slice(start, start + limit),
    meta: {
      total: items.length,
      page,
      limit,
      totalPages: items.length === 0 ? 0 : Math.ceil(items.length / limit),
    },
  };
}

function filterProducts(url) {
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const categoryId = url.searchParams.get("categoryId") || "";

  return products.filter((product) => {
    const matchesSearch = !search || product.name.toLowerCase().includes(search);
    const matchesCategory = !categoryId || product.categoryId === categoryId;
    return matchesSearch && matchesCategory;
  });
}

function filterOrders(url) {
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const status = url.searchParams.get("status") || "";

  return orders.filter((order) => {
    const haystack = [
      order.orderNumber,
      order.id,
      order.user?.name,
      order.user?.email,
      order.user?.phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesStatus = !status || order.status === status;
    return matchesSearch && matchesStatus;
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    send(req, res, 400, { message: "Bad request" });
    return;
  }

  if (req.method === "OPTIONS") {
    send(req, res, 204);
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/health") {
    send(req, res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathname === "/__reset") {
    reset();
    send(req, res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathname === "/auth/refresh") {
    send(req, res, 401, { message: "Session expired. Please log in again." });
    return;
  }

  if (req.method === "POST" && pathname === "/auth/login") {
    const body = await readBody(req);
    const identifier = String(body.identifier || "").trim().toLowerCase();

    if (body.password !== "password123") {
      send(req, res, 401, { message: "Invalid email or password." });
      return;
    }

    const isAdmin = identifier === "admin@example.com";
    send(req, res, 200, {
      accessToken: isAdmin ? "admin-token" : "customer-token",
      user: isAdmin ? adminUser : { ...customerUser, email: identifier.includes("@") ? identifier : customerUser.email },
    });
    return;
  }

  if (req.method === "POST" && pathname === "/auth/register") {
    const body = await readBody(req);
    send(req, res, 201, {
      accessToken: "customer-token",
      user: {
        ...customerUser,
        name: body.name || customerUser.name,
        email: body.email || null,
        phone: body.phone || null,
      },
    });
    return;
  }

  if (req.method === "GET" && pathname === "/auth/me") {
    const user = requireUser(req, res);
    if (!user) return;
    send(req, res, 200, user);
    return;
  }

  if (req.method === "POST" && pathname === "/auth/logout") {
    send(req, res, 200, { message: "Logged out" });
    return;
  }

  if (pathname === "/categories") {
    if (req.method === "GET") {
      send(req, res, 200, categories);
      return;
    }

    if (req.method === "POST") {
      if (!requireUser(req, res)) return;
      const body = await readBody(req);
      const category = {
        id: `cat-${Date.now()}`,
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        createdAt: new Date().toISOString(),
      };
      categories = [category, ...categories];
      send(req, res, 201, category);
      return;
    }
  }

  const categoryMatch = pathname.match(/^\/categories\/([^/]+)$/);
  if (categoryMatch) {
    const id = decodeURIComponent(categoryMatch[1]);
    const category = categories.find((item) => item.id === id);

    if (!category) {
      send(req, res, 404, { message: "Category not found" });
      return;
    }

    if (req.method === "PATCH") {
      if (!requireUser(req, res)) return;
      const body = await readBody(req);
      Object.assign(category, {
        name: body.name ?? category.name,
        slug: body.slug ?? category.slug,
        description: body.description ?? category.description,
      });
      send(req, res, 200, category);
      return;
    }

    if (req.method === "DELETE") {
      if (!requireUser(req, res)) return;
      categories = categories.filter((item) => item.id !== id);
      send(req, res, 200, { message: "Category deleted" });
      return;
    }
  }

  if (pathname === "/products") {
    if (req.method === "GET") {
      send(req, res, 200, paginate(filterProducts(url), url));
      return;
    }

    if (req.method === "POST") {
      if (!requireUser(req, res)) return;
      const body = await readBody(req);
      const category = categories.find((item) => item.id === body.categoryId) || categories[0];
      const product = {
        id: `p-${Date.now()}`,
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        price: body.price,
        stock: body.stock,
        status: body.status || "ACTIVE",
        photoUrl: body.photoUrl ?? null,
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
      };
      products = [product, ...products];
      send(req, res, 201, product);
      return;
    }
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const id = decodeURIComponent(productMatch[1]);
    const product = products.find((item) => item.id === id);

    if (req.method === "GET") {
      if (!product) {
        send(req, res, 404, { message: "Product not found" });
        return;
      }
      send(req, res, 200, product);
      return;
    }

    if (req.method === "PATCH") {
      if (!requireUser(req, res)) return;
      if (!product) {
        send(req, res, 404, { message: "Product not found" });
        return;
      }
      const body = await readBody(req);
      const category = categories.find((item) => item.id === body.categoryId) || product.category;
      Object.assign(product, {
        name: body.name ?? product.name,
        slug: body.slug ?? product.slug,
        description: body.description ?? product.description,
        price: body.price ?? product.price,
        stock: body.stock ?? product.stock,
        status: body.status ?? product.status,
        photoUrl: body.photoUrl ?? product.photoUrl,
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
      });
      send(req, res, 200, product);
      return;
    }

    if (req.method === "DELETE") {
      if (!requireUser(req, res)) return;
      products = products.filter((item) => item.id !== id);
      send(req, res, 200, { message: "Product deleted" });
      return;
    }
  }

  if (req.method === "POST" && pathname === "/orders") {
    const user = requireUser(req, res);
    if (!user) return;
    const body = await readBody(req);
    const order = {
      id: `ord-new-${Date.now()}`,
      orderNumber: "ORD-E2E-001",
      userId: user.id,
      status: "PENDING",
      total: 20000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user,
      items: (body.items || []).map((item, index) => ({
        id: `new-item-${index}`,
        productId: String(item.productId),
        productName: "Test Product",
        unitPrice: 10000,
        quantity: item.quantity,
        subtotal: 10000 * item.quantity,
      })),
    };
    orders = [order, ...orders];
    send(req, res, 201, order);
    return;
  }

  if (pathname === "/admin/orders" && req.method === "GET") {
    if (!requireUser(req, res)) return;
    send(req, res, 200, paginate(filterOrders(url), url));
    return;
  }

  const orderStatusMatch = pathname.match(/^\/admin\/orders\/([^/]+)\/status$/);
  if (orderStatusMatch && req.method === "PATCH") {
    if (!requireUser(req, res)) return;
    const id = decodeURIComponent(orderStatusMatch[1]);
    const order = orders.find((item) => item.id === id);
    if (!order) {
      send(req, res, 404, { message: "Order not found" });
      return;
    }
    const body = await readBody(req);
    order.status = body.status;
    order.updatedAt = new Date().toISOString();
    send(req, res, 200, order);
    return;
  }

  const orderMatch = pathname.match(/^\/admin\/orders\/([^/]+)$/);
  if (orderMatch && req.method === "GET") {
    if (!requireUser(req, res)) return;
    const id = decodeURIComponent(orderMatch[1]);
    const order = orders.find((item) => item.id === id);
    if (!order) {
      send(req, res, 404, { message: "Order not found" });
      return;
    }
    send(req, res, 200, order);
    return;
  }

  if (req.method === "POST" && pathname === "/admin/products/export") {
    if (!requireUser(req, res)) return;
    const job = {
      jobId: "job-1",
      status: "completed",
      progress: 100,
      rowCount: products.length,
      failedReason: null,
      createdAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };
    exportJobs.set(job.jobId, job);
    send(req, res, 201, {
      jobId: job.jobId,
      status: job.status,
      message: "Export queued",
    });
    return;
  }

  const exportMatch = pathname.match(/^\/admin\/products\/export\/([^/]+)$/);
  if (exportMatch && req.method === "GET") {
    if (!requireUser(req, res)) return;
    const job = exportJobs.get(decodeURIComponent(exportMatch[1]));
    if (!job) {
      send(req, res, 404, { message: "Export job not found" });
      return;
    }
    send(req, res, 200, job);
    return;
  }

  const downloadMatch = pathname.match(
    /^\/admin\/products\/export\/([^/]+)\/download$/,
  );
  if (downloadMatch && req.method === "GET") {
    if (!requireUser(req, res)) return;
    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="products.xlsx"',
      "Access-Control-Allow-Origin": req.headers.origin || "http://localhost:3000",
      "Access-Control-Allow-Credentials": "true",
    });
    res.end("mock-excel");
    return;
  }

  send(req, res, 404, { message: `No mock route for ${req.method} ${pathname}` });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mock API listening on http://127.0.0.1:${PORT}`);
});
