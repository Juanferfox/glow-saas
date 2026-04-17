import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import type { OrderStatus } from "@/lib/supabase/types";

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * POST /api/shop/checkout
 * Crea un pedido de productos "apartados" (pago presencial).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { tenantSlug, items, pointsToUse = 0 } = body as {
    tenantSlug: string;
    items: OrderItem[];
    pointsToUse: number;
  };

  if (!tenantSlug || !items?.length) {
    return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });
  }

  const tenant = await getTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return NextResponse.json({ success: true, orderId: `mock-order-${Date.now()}` });
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      tenant_id:   tenant.id,
      client_id:   user.id,
      total,
      points_used: pointsToUse,
      status:      "pending" as OrderStatus,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 });
  }

  const orderItems = items.map((item) => ({
    order_id:   order.id,
    product_id: item.productId,
    quantity:   item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    return NextResponse.json({ error: "Error al registrar items" }, { status: 500 });
  }

  return NextResponse.json({ success: true, orderId: order.id });
}
