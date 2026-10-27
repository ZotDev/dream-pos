-- Idempotent demo catalog for Dream POS. All listed products are illustrative test data.
INSERT INTO categories(name,description) VALUES
 ('Grocery','Demo packaged grocery items'),
 ('Home & Kitchen','Demo household products'),
 ('Personal Care','Demo personal care items')
ON CONFLICT(name) DO NOTHING;

WITH demo(sku,barcode,name,category,selling_price,cost_price,tax_rate,unit,stock,reorder,description) AS (VALUES
 ('GRC-006','890100100006','Packaged Tea 250g','Grocery',145,92,5,'pcs',36,8,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('GRC-007','890100100007','Premium Rice 5kg','Grocery',420,330,5,'bag',24,6,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('GRC-008','890100100008','Sunflower Oil 1L','Grocery',165,128,5,'bottle',30,8,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('HOM-009','890100100009','Stainless Steel Lunch Box','Home & Kitchen',599,310,18,'pcs',18,4,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('HOM-010','890100100010','Ceramic Coffee Mug','Home & Kitchen',249,105,12,'pcs',25,5,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('HOM-011','890100100011','LED Desk Lamp','Home & Kitchen',899,520,18,'pcs',14,4,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('PER-012','890100100012','Herbal Shampoo 200ml','Personal Care',199,112,18,'bottle',28,6,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('PER-013','890100100013','Bath Soap Pack of 4','Personal Care',160,88,18,'pack',40,10,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('PER-014','890100100014','Toothpaste 150g','Personal Care',110,62,18,'pcs',32,8,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('ACC-015','890100100015','Reusable Shopping Bag','Accessories',79,24,5,'pcs',60,12,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('ELC-016','890100100016','USB-C Charging Cable','Electronics',299,120,18,'pcs',22,5,'DEMO DATA: verify HSN and GST rate before live sale'),
 ('ELC-017','890100100017','Wireless Mouse','Electronics',699,350,18,'pcs',16,4,'DEMO DATA: verify HSN and GST rate before live sale')
)
INSERT INTO products(sku,barcode,name,category_id,selling_price,cost_price,tax_rate,unit,description,stock_qty,reorder_level,is_active)
SELECT d.sku,d.barcode,d.name,c.id,d.selling_price,d.cost_price,d.tax_rate,d.unit,d.description,0,d.reorder,true
FROM demo d JOIN categories c ON c.name=d.category
ON CONFLICT(sku) DO NOTHING;

INSERT INTO store_inventory(store_id,product_id,quantity)
SELECT s.id,p.id,d.stock
FROM stores s
CROSS JOIN (VALUES
 ('GRC-006',36::numeric),('GRC-007',24::numeric),('GRC-008',30::numeric),
 ('HOM-009',18::numeric),('HOM-010',25::numeric),('HOM-011',14::numeric),
 ('PER-012',28::numeric),('PER-013',40::numeric),('PER-014',32::numeric),
 ('ACC-015',60::numeric),('ELC-016',22::numeric),('ELC-017',16::numeric)
) d(sku,stock)
JOIN products p ON p.sku=d.sku
WHERE s.id=(SELECT id FROM stores WHERE is_active=true ORDER BY id LIMIT 1)
ON CONFLICT(store_id,product_id) DO NOTHING;

UPDATE products p
SET stock_qty=(SELECT COALESCE(SUM(si.quantity),0) FROM store_inventory si WHERE si.product_id=p.id),updated_at=NOW()
WHERE p.sku IN ('GRC-006','GRC-007','GRC-008','HOM-009','HOM-010','HOM-011','PER-012','PER-013','PER-014','ACC-015','ELC-016','ELC-017');
