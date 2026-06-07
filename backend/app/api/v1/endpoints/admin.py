from fastapi import APIRouter, Depends, HTTPException, status
from app.db.mongodb import db
from app.core.security import get_current_admin_user
from bson import ObjectId
import datetime

router = APIRouter()

@router.get("/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_admin_user)):
    # 1. Total revenue & count
    orders_cursor = db.orders.find({})
    orders = await orders_cursor.to_list(length=1000)
    
    total_revenue = sum(o.get("total", 0) for o in orders if o.get("status") != "cancelled")
    orders_count = len(orders)
    
    # 2. Customers count
    customers_count = await db.users.count_documents({"role": "customer"})
    
    # 3. Products count
    products_count = await db.products.count_documents({})
    
    # 4. Revenue chart (last 7 days)
    today = datetime.datetime.now(datetime.timezone.utc).date()
    days = [today - datetime.timedelta(days=i) for i in range(6, -1, -1)]
    revenue_chart = []
    
    for d in days:
        day_start = datetime.datetime.combine(d, datetime.time.min, tzinfo=datetime.timezone.utc)
        day_end = datetime.datetime.combine(d, datetime.time.max, tzinfo=datetime.timezone.utc)
        
        day_orders = [
            o for o in orders 
            if o.get("status") != "cancelled" and day_start <= o.get("created_at").replace(tzinfo=datetime.timezone.utc) <= day_end
        ]
        revenue_chart.append({
            "date": d.strftime("%a"),
            "revenue": sum(o.get("total", 0) for o in day_orders)
        })
        
    # 5. Orders by status
    status_counts = {}
    for o in orders:
        s = o.get("status", "pending").capitalize()
        status_counts[s] = status_counts.get(s, 0) + 1
        
    orders_by_status = [{"status": k, "count": v} for k, v in status_counts.items()]
    if not orders_by_status:
        orders_by_status = [
            {"status": "Pending", "count": 0},
            {"status": "Processing", "count": 0},
            {"status": "Shipped", "count": 0},
            {"status": "Delivered", "count": 0},
            {"status": "Cancelled", "count": 0}
        ]
        
    # 6. Top products
    product_sales = {}
    for o in orders:
        if o.get("status") != "cancelled":
            for item in o.get("items", []):
                name = item.get("name")
                qty = item.get("quantity", 0)
                product_sales[name] = product_sales.get(name, 0) + qty
                
    top_products = [{"name": k, "sales": v} for k, v in product_sales.items()]
    top_products = sorted(top_products, key=lambda x: x["sales"], reverse=True)[:5]
    if not top_products:
        prod_cursor = db.products.find({}).limit(5)
        prods = await prod_cursor.to_list(length=5)
        top_products = [{"name": p["name"], "sales": 0} for p in prods]
        
    # 7. Recent orders
    recent = sorted(orders, key=lambda x: x.get("created_at", datetime.datetime.min), reverse=True)[:5]
    recent_orders = []
    
    for o in recent:
        user_id = o.get("user_id")
        user_name = "Unknown Customer"
        try:
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
            if user_doc:
                user_name = user_doc.get("name", "Unknown")
        except Exception:
            pass
            
        created_at = o.get("created_at")
        date_str = created_at.strftime("%b %d") if created_at else "Recently"
        
        recent_orders.append({
            "id": str(o["_id"]),
            "customer": user_name,
            "total": float(o.get("total", 0)),
            "status": o.get("status", "pending"),
            "date": date_str
        })
        
    return {
        "revenue": total_revenue,
        "orders_count": orders_count,
        "customers_count": customers_count,
        "products_count": products_count,
        "revenue_chart": revenue_chart,
        "orders_by_status": orders_by_status,
        "top_products": top_products,
        "recent_orders": recent_orders
    }
