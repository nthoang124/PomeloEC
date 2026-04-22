-- src/inventory/lua/check_and_deduct.lua
-- KEYS: Array of Redis keys for inventory (e.g., "inventory:{variantId}")
-- ARGV: Array of required quantities corresponding to the KEYS

local num_keys = #KEYS
local sufficient_stock = true

-- Step 1: Check if all items have sufficient stock
for i = 1, num_keys do
    local key = KEYS[i]
    local required_qty = tonumber(ARGV[i])
    
    local current_stock_str = redis.call("HGET", key, "stock")
    if not current_stock_str then
        return {err = "INVENTORY_NOT_FOUND:" .. key}
    end
    
    local current_stock = tonumber(current_stock_str)
    if current_stock < required_qty then
        sufficient_stock = false
        break
    end
end

-- Step 2: If insufficient stock, abort transaction
if not sufficient_stock then
    return 0 -- Failed
end

-- Step 3: Deduct stock for all items
for i = 1, num_keys do
    local key = KEYS[i]
    local required_qty = tonumber(ARGV[i])
    redis.call("HINCRBY", key, "stock", -required_qty)
end

return 1 -- Success
