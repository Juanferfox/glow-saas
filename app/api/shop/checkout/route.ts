import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";

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

  // 1. Verificar sesión
  const { data: { user } } = await supabase.auth.getUser();
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

  // 2. Cargar tenant
  const tenant = await getTenant(tenantSlug);
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  // 3. Simulación modo dev
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");
  if (isDevMode) {
    return NextResponse.json({ success: true, orderId: `mock-order-${Date.now()}` });
  }

  // 4. Crear pedido en Supabase
  const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  // Iniciar transacción (vía RPC o inserts manuales)
  // Nota: En un sistema real se debería usar una RPC para asegurar atomicidad y verificar stock.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      client_id: user.id,
      total,
      points_used: pointsToUse,
      status: "pending",
    })
    .select()
    .single();

  if (orderError) return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 });

  const orderItemsData = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData);
  if (itemsError) return NextResponse.json({ error: "Error al registrar items" }, { status: 500 });

  return NextResponse.json({ success: true, orderId: order.id });
}
