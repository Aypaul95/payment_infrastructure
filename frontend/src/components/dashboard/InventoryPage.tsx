
import { useState } from "react";

import {
  AlertTriangle,
  Boxes,
  Package,
  TrendingDown,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react";

type InventoryStatus = "In stock" | "Low stock" | "Out of stock";

type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reserved: number;
  available: number;
  status: InventoryStatus;
};

type StockActionType = "IN" | "OUT" | "ADJUSTMENT";

type StockAction = {
  productId: string;
  type: StockActionType;
};

type InventoryMovement = {
  id: string;
  productName: string;
  type: StockActionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  createdAt: string;
};

const sampleInventory: InventoryProduct[] = [
  {
    id: "1",
    name: "Premium Rice 50kg",
    sku: "RICE-001",
    category: "Groceries",
    stock: 24,
    reserved: 3,
    available: 21,
    status: "In stock",
  },
  {
    id: "2",
    name: "Vegetable Oil 5L",
    sku: "OIL-002",
    category: "Groceries",
    stock: 42,
    reserved: 5,
    available: 37,
    status: "In stock",
  },
  {
    id: "3",
    name: "Indomie Carton",
    sku: "FOOD-003",
    category: "Food",
    stock: 8,
    reserved: 2,
    available: 6,
    status: "Low stock",
  },
  {
    id: "4",
    name: "Detergent 2kg",
    sku: "HOME-004",
    category: "Household",
    stock: 0,
    reserved: 0,
    available: 0,
    status: "Out of stock",
  },
  {
    id: "5",
    name: "Bottled Water Pack",
    sku: "DRINK-005",
    category: "Beverages",
    stock: 5,
    reserved: 1,
    available: 4,
    status: "Low stock",
  },
];

function getStockStatus(stock: number): InventoryStatus {
  if (stock === 0) return "Out of stock";
  if (stock <= 10) return "Low stock";
  return "In stock";
}

function InventoryPage() {
  const [inventory, setInventory] =
    useState<InventoryProduct[]>(sampleInventory);

  const [stockAction, setStockAction] =
    useState<StockAction | null>(null);

  const [stockQuantity, setStockQuantity] = useState("1");

  const [movementHistory, setMovementHistory] =
    useState<InventoryMovement[]>([]);

  const handleStockUpdate = () => {
    if (!stockAction) return;

    const quantity = Number(stockQuantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      (stockAction.type !== "ADJUSTMENT" && quantity === 0)
    ) {
      alert("Enter a valid quantity.");
      return;
    }

    const selectedProduct = inventory.find(
      (product) => product.id === stockAction.productId
    );

    if (!selectedProduct) return;

    let newStock = selectedProduct.stock;

    if (stockAction.type === "IN") {
      newStock += quantity;
    } else if (stockAction.type === "OUT") {
      if (quantity > selectedProduct.available) {
        alert("Cannot remove more stock than the available quantity.");
        return;
      }

      newStock -= quantity;
    } else {
      if (quantity < selectedProduct.reserved) {
        alert("New stock cannot be lower than the reserved quantity.");
        return;
      }

      newStock = quantity;
    }

    // Close the modal without recording a movement if stock is unchanged.
    if (newStock === selectedProduct.stock) {
      setStockAction(null);
      setStockQuantity("1");
      return;
    }

    // Update inventory.
    setInventory((previous) =>
      previous.map((product) =>
        product.id === stockAction.productId
          ? {
              ...product,
              stock: newStock,
              available: newStock - product.reserved,
              status: getStockStatus(newStock),
            }
          : product
      )
    );

    // Record the stock movement.
    setMovementHistory((previous) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        productName: selectedProduct.name,
        type: stockAction.type,
        quantity:
          stockAction.type === "ADJUSTMENT"
            ? Math.abs(newStock - selectedProduct.stock)
            : quantity,
        previousStock: selectedProduct.stock,
        newStock,
        createdAt: new Date().toLocaleString(),
      },
      ...previous,
    ]);

    setStockAction(null);
    setStockQuantity("1");
  };

  const totalProducts = inventory.length;

  const lowStockProducts = inventory.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;

  const outOfStockProducts = inventory.filter(
    (product) => product.stock === 0
  ).length;

  const totalUnits = inventory.reduce(
    (total, product) => total + product.stock,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Inventory Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor stock levels, reserved quantities, and product availability.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Products</p>
            <Package className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {totalProducts}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Units</p>
            <Boxes className="text-indigo-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {totalUnits}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Low Stock</p>
            <TrendingDown className="text-amber-500" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {lowStockProducts}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Out of Stock</p>
            <AlertTriangle className="text-red-500" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {outOfStockProducts}
          </p>
        </div>
      </div>

      {/* Stock Overview */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Stock Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current stock levels across your products.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Total Stock</th>
                <th className="px-5 py-4">Reserved</th>
                <th className="px-5 py-4">Available</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {inventory.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {product.name}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    {product.sku}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    {product.category}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {product.stock}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    {product.reserved}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {product.available}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        product.status === "In stock"
                          ? "bg-green-100 text-green-700"
                          : product.status === "Low stock"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStockAction({
                            productId: product.id,
                            type: "IN",
                          });
                          setStockQuantity("1");
                        }}
                        className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                        title="Stock In"
                      >
                        <Plus size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStockAction({
                            productId: product.id,
                            type: "OUT",
                          });
                          setStockQuantity("1");
                        }}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Stock Out"
                      >
                        <Minus size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStockAction({
                            productId: product.id,
                            type: "ADJUSTMENT",
                          });
                          setStockQuantity(product.stock.toString());
                        }}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        title="Adjust Stock"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Movement History */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Inventory Movement History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track stock additions, removals, and adjustments.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Date & Time</th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Movement</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Previous Stock</th>
                <th className="px-5 py-4">New Stock</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {movementHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                movementHistory.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                      {movement.createdAt}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {movement.productName}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          movement.type === "IN"
                            ? "bg-green-100 text-green-700"
                            : movement.type === "OUT"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {movement.type === "IN"
                          ? "Stock In"
                          : movement.type === "OUT"
                            ? "Stock Out"
                            : "Adjustment"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {movement.quantity}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {movement.previousStock}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {movement.newStock}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Action Modal */}
      {stockAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {stockAction.type === "IN"
                ? "Stock In"
                : stockAction.type === "OUT"
                  ? "Stock Out"
                  : "Adjust Stock"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {
                inventory.find(
                  (product) => product.id === stockAction.productId
                )?.name
              }
            </p>

            <label className="mt-5 block text-sm font-medium text-slate-700">
              {stockAction.type === "ADJUSTMENT"
                ? "New total stock quantity"
                : "Quantity"}
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStockAction(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStockUpdate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
