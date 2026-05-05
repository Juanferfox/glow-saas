import { CartProvider } from "@/contexts/CartContext";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
