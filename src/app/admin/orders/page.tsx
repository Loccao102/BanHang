import { redirect } from "next/navigation";

/**
 * Danh sách đơn hàng của admin nằm trong tab "orders" của /admin.
 * Route này tồn tại để các liên kết/URL trực tiếp dạng /admin/orders không bị 404.
 */
export default function AdminOrdersIndexPage() {
  redirect("/admin?tab=orders");
}
