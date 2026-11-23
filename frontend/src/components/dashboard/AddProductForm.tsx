
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";

const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must contain at least 2 characters."),
  sku: z.string().trim().min(2, "SKU must contain at least 2 characters."),
  category: z.string().min(1, "Select a product category."),
  price: z.coerce.number().positive("Price must be greater than zero."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  description: z.string().max(500, "Description cannot exceed 500 characters."),
});

export type ProductFormData = z.output<typeof productSchema>;
type ProductFormInput = z.input<typeof productSchema>;

interface AddProductFormProps {
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: ProductFormData;
}

function AddProductForm({
  onClose,
  onSubmit,
  initialData,
}: AddProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      price: 0,
      stock: 0,
      description: "",
    },
  });

  // Load existing product details when editing.
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const errorClass = "mt-1 text-xs text-rose-600";

  const isEditing = Boolean(initialData);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? "Edit Product" : "Add New Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Update the details of this product."
                : "Enter the details of the product you want to sell."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 p-5"
        >
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Product Name *
            </label>

            <input
              {...register("name")}
              placeholder="e.g. Premium Rice 50kg"
              className={fieldClass}
            />

            {errors.name && (
              <p className={errorClass}>{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                SKU *
              </label>

              <input
                {...register("sku")}
                placeholder="e.g. RICE-001"
                className={fieldClass}
              />

              {errors.sku && (
                <p className={errorClass}>{errors.sku.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Category *
              </label>

              <select
                {...register("category")}
                className={fieldClass}
              >
                <option value="">Select category</option>
                <option value="Groceries">Groceries</option>
                <option value="Food">Food</option>
                <option value="Household">Household</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>

              {errors.category && (
                <p className={errorClass}>{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Selling Price (₦) *
              </label>

              <input
                type="number"
                min="0"
                step="1"
                {...register("price")}
                placeholder="85000"
                className={fieldClass}
              />

              {errors.price && (
                <p className={errorClass}>{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Stock Quantity *
              </label>

              <input
                type="number"
                min="0"
                step="1"
                {...register("stock")}
                placeholder="24"
                className={fieldClass}
              />

              {errors.stock && (
                <p className={errorClass}>{errors.stock.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Product Description
            </label>

            <textarea
              {...register("description")}
              rows={4}
              placeholder="Describe your product..."
              className={fieldClass}
            />

            {errors.description && (
              <p className={errorClass}>
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isEditing ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductForm;
