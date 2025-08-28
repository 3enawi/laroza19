import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ColorSizeGridProps {
  inventory: Record<string, Record<string, number>>;
  onInventoryChange: (inventory: Record<string, Record<string, number>>) => void;
}

interface InventoryItem {
  color: string;
  size: string;
  quantity: number;
}

export default function ColorSizeGrid({ inventory, onInventoryChange }: ColorSizeGridProps) {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const existingItems: InventoryItem[] = [];
    Object.keys(inventory).forEach(color => {
      Object.keys(inventory[color]).forEach(size => {
        if (inventory[color][size] > 0) {
          existingItems.push({
            color,
            size,
            quantity: inventory[color][size]
          });
        }
      });
    });
    return existingItems.length > 0 ? existingItems : [{ color: "", size: "", quantity: 0 }];
  });

  const updateInventoryFromItems = (newItems: InventoryItem[]) => {
    const newInventory: Record<string, Record<string, number>> = {};
    
    newItems.forEach(item => {
      if (item.color && item.size && item.quantity > 0) {
        if (!newInventory[item.color]) {
          newInventory[item.color] = {};
        }
        newInventory[item.color][item.size] = item.quantity;
      }
    });
    
    onInventoryChange(newInventory);
  };

  const handleItemChange = (index: number, field: keyof InventoryItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    updateInventoryFromItems(newItems);
  };

  const addItem = () => {
    const newItems = [...items, { color: "", size: "", quantity: 0 }];
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    updateInventoryFromItems(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-medium">إدخال الألوان والمقاسات</h5>
        <Button 
          type="button" 
          onClick={addItem}
          size="sm"
          data-testid="button-add-color-size"
        >
          <i className="fas fa-plus mr-2 ml-0"></i>
          إضافة لون ومقاس
        </Button>
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-3 p-3 border border-border rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">اللون</Label>
              <Input
                placeholder="مثال: أسود، أبيض، أحمر"
                value={item.color}
                onChange={(e) => handleItemChange(index, "color", e.target.value)}
                data-testid={`input-color-${index}`}
              />
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-1">المقاس</Label>
              <Input
                placeholder="مثال: 38، 40، L، XL"
                value={item.size}
                onChange={(e) => handleItemChange(index, "size", e.target.value)}
                data-testid={`input-size-${index}`}
              />
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-1">الكمية</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={item.quantity || ""}
                onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                data-testid={`input-quantity-${index}`}
              />
            </div>
            
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                data-testid={`button-remove-item-${index}`}
              >
                <i className="fas fa-trash text-destructive"></i>
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="text-center text-muted-foreground py-4">
          اضغط "إضافة لون ومقاس" لبدء إدخال المخزون
        </div>
      )}
    </div>
  );
}
