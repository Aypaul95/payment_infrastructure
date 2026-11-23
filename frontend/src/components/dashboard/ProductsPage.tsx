
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Layers,
  MoreHorizontal,
} from "lucide-react";

import AddProductForm, {
  type ProductFormData,
} from "./AddProductForm";

const sampleProducts = [
  {
    id: "1",
    name: "Premium Rice 50kg",
    sku: "RICE-001",
    category: "Groceries",
    price: 85000,
    stock: 24,
    status: "Active",
  },
  {
    id: "2",
    name: "Vegetable Oil 5L",
    sku: "OIL-002",
    category: "Groceries",
    price: 12500,
    stock: 42,
    status: "Active",
  },
  {
    id: "3",
    name: "Indomie Carton",
    sku: "FOOD-003",
    category: "Food",
    price: 16500,
    stock: 8,
    status: "Active",
  },
  {
    id: "4",
    name: "Detergent 2kg",
    sku: "HOME-004",
    category: "Household",
    price: 7500,
    stock: 0,
    status: "Out of stock",
  },
  {
    id: "5",
    name: "Bottled Water Pack",
    sku: "DRINK-005",
    category: "Beverages",
    price: 3200,
    stock: 5,
    status: "Active",
  },
];

const defaultCategories = [
  "All Categories",
  "Groceries",
  "Food",
  "Household",
  "Beverages",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProductsPage() {
  const [products, setProducts] = useState(sampleProducts);
  const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<
        (typeof sampleProducts)[number] | null
    >(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");

  // Add a new product to the local product list.
  const handleAddProduct = (data: ProductFormData) => {
    const newProduct = {
      id: Date.now().toString(),
      name: data.name,
      sku: data.sku,
      category: data.category,
      price: data.price,
      stock: data.stock,
      status: "Active",
    };

    setProducts((previous) => [newProduct, ...previous]);
    setShowAddForm(false);
  };

    const handleEditProduct = (data: ProductFormData) => {
        if (!editingProduct) return;

        setProducts((previous) =>
            previous.map((product) =>
                product.id === editingProduct.id
                    ? {
                        ...product,
                        name: data.name,
                        sku: data.sku,
                        category: data.category,
                        price: data.price,
                        stock: data.stock,
                        status: data.stock === 0 ? "Out of stock" : "Active",
                    }
                    : product
            )
        );

        setEditingProduct(null);
    };

    const handleDeleteProduct = (productId: string) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmed) return;

        setProducts((previous) =>
            previous.filter((product) => product.id !== productId)
        );

        setOpenMenuId(null);
    };

  // Include newly created product categories in the filter.
  const categories = useMemo(() => {
    const productCategories = products.map(
      (product) => product.category
    );

    return [
      "All Categories",
      ...new Set([
        ...defaultCategories.slice(1),
        ...productCategories,
      ]),
    ];
  }, [products]);

  // Search and filter products.
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All Categories" ||
        product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  // Product summary calculations.
  const totalProducts = products.length;

  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your business products, prices and availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Sample data notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-semibold text-amber-800">
          Demonstration data
        </p>

        <p className="mt-1 text-xs text-amber-700">
          These products are examples. Actual products will be loaded
          from your business account through the backend API.
          Products added here are currently stored in temporary
          frontend state.
        </p>
      </div>

      {/* Product summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Products
            </p>

            <Package className="text-indigo-600" size={21} />
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {totalProducts}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Low Stock
            </p>

            <AlertTriangle className="text-amber-500" size={21} />
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {lowStock}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Out of Stock
            </p>

            <Layers className="text-rose-500" size={21} />
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {outOfStock}
          </p>
        </div>
      </div>

      {/* Product catalogue */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Product Catalogue
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage your listed products.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
              <Search size={17} className="text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="w-full text-sm outline-none sm:w-48"
              />
            </div>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Product",
                  "SKU",
                  "Category",
                  "Price",
                  "Stock",
                  "Status",
                  "",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {product.name}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    {product.sku}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {product.category}
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                    {formatCurrency(product.price)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {product.stock}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        product.stock === 0
                          ? "bg-rose-50 text-rose-700"
                          : product.stock <= 10
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {product.stock === 0
                        ? "Out of stock"
                        : product.stock <= 10
                          ? "Low stock"
                          : product.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    
                          <button
                              type="button"
                              aria-label={`More options for ${product.name}`}
                              onClick={() =>
                                  setOpenMenuId(
                                      openMenuId === product.id ? null : product.id
                                  )
                              }
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                          >
                              <MoreHorizontal size={19} />
                         
                          </button>

                          {openMenuId === product.id && (
                              <div className="absolute right-0 z-20 mt-2 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                  <button
                                      type="button"
                                      onClick={() => {
                                          setEditingProduct(product);
                                          setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                      Edit product
                                 
                              </button>

                                  <button
                                      type="button"
                                      onClick={() =>
                                          handleDeleteProduct(product.id)
                                      }
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                      Delete product
                                  </button>
                              </div>
                          )}


                      </td>

                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            Showing {filteredProducts.length} of {totalProducts} products
          </p>
        </div>
      </section>

      {/* Add product form */}
      
          {(showAddForm || editingProduct !== null) && (
              <AddProductForm
                  onClose={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                  }}
                  onSubmit={
                      editingProduct ? handleEditProduct : handleAddProduct
                  }
                  initialData={
                      editingProduct
                          ? {
                              name: editingProduct.name,
                              sku: editingProduct.sku,
                              category: editingProduct.category,
                              price: editingProduct.price,
                              stock: editingProduct.stock,
                              description: "",
                          }
                          : undefined
                  }
              />
          )}
    </div>
  );
}

export default ProductsPage;
