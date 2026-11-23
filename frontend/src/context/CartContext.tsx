
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

export interface CartItem {
    id: number;
    name: string;
    vendor: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Omit<CartItem, "quantity">, quantity: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    removeFromCart: (id: number) => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const savedCart = localStorage.getItem("commercehub_cart");

            return savedCart ? JSON.parse(savedCart) as CartItem[] : [];
        } catch {
            return [];
        }
    });

    const addToCart = (
        product: Omit<CartItem, "quantity">,
        quantity: number,
    ) => {
        setItems((currentItems) => {
            const existingItem = currentItems.find(
                (item) => item.id === product.id,
            );

            if (existingItem) {
                return currentItems.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item,
                );
            }

            return [...currentItems, { ...product, quantity }];
        });
    };
    const updateQuantity = (id: number, quantity: number) => {
        setItems((currentItems) =>
            currentItems.map((item) =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) }
                    : item,
            ),
        );
    };

    const removeFromCart = (id: number) => {
        setItems((currentItems) =>
            currentItems.filter((item) => item.id !== id),
        );
    };
    useEffect(() => {
        localStorage.setItem("commercehub_cart", JSON.stringify(items));
    }, [items]);

    const cartCount = items.reduce(
        (total, item) => total + item.quantity,
        0,
    );

    const cartTotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
    );

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                updateQuantity,
                removeFromCart,
                cartCount,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used inside a CartProvider");
    }

    return context;
}
