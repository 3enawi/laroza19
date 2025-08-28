import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SizeQuantityItem {
  size: string;
  quantity: number;
  isAvailable: boolean;
}

interface SizeQuantityGridProps {
  inventory: Record<string, Record<string, number>>;
  onInventoryChange: (inventory: Record<string, Record<string, number>>) => void;
  selectedColor?: string;
}

export default function SizeQuantityGrid({ inventory, onInventoryChange, selectedColor = "افتراضي" }: SizeQuantityGridProps) {
  const [items, setItems] = useState<SizeQuantityItem[]>(() => {
    const existingItems: SizeQuantityItem[] = [];
    if (inventory[selectedColor]) {
      Object.keys(inventory[selectedColor]).forEach(size => {
        existingItems.push({
          size,
          quantity: inventory[selectedColor][size],
          isAvailable: inventory[selectedColor][size] > 0
        });
      });
    }
    return existingItems.length > 0 ? existingItems : [{ size: "", quantity: 0, isAvailable: false }];
  });

  const updateInventoryFromItems = (newItems: SizeQuantityItem[]) => {
    const newInventory = { ...inventory };
    
    if (!newInventory[selectedColor]) {
      newInventory[selectedColor] = {};
    }
    
    // Clear existing sizes for this color
    newInventory[selectedColor] = {};
    
    newItems.forEach(item => {
      if (item.size && item.quantity >= 0) {
        newInventory[selectedColor][item.size] = item.quantity;
      }
    });
    
    onInventoryChange(newInventory);
  };

  const handleSizeChange = (index: number, size: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], size };
    setItems(newItems);
    updateInventoryFromItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index] = { 
      ...newItems[index], 
      quantity: Math.max(0, quantity),
      isAvailable: quantity > 0
    };
    setItems(newItems);
    updateInventoryFromItems(newItems);
  };

  const incrementQuantity = (index: number) => {
    const newQuantity = items[index].quantity + 1;
    handleQuantityChange(index, newQuantity);
  };

  const decrementQuantity = (index: number) => {
    const newQuantity = Math.max(0, items[index].quantity - 1);
    handleQuantityChange(index, newQuantity);
  };

  const toggleAvailability = (index: number) => {
    const newItems = [...items];
    const newAvailability = !newItems[index].isAvailable;
    newItems[index] = { 
      ...newItems[index], 
      isAvailable: newAvailability,
      quantity: newAvailability ? Math.max(1, newItems[index].quantity) : 0
    };
    setItems(newItems);
    updateInventoryFromItems(newItems);
  };

  const addSizeItem = () => {
    const newItems = [...items, { size: "", quantity: 0, isAvailable: false }];
    setItems(newItems);
  };

  const removeSizeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      updateInventoryFromItems(newItems);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h5 className="font-medium">إدارة المقاسات والكميات</h5>
          <span className="text-sm text-muted-foreground">({selectedColor})</span>
        </div>
        <Button 
          type="button" 
          onClick={addSizeItem}
          size="sm"
          variant="outline"
          data-testid="button-add-size"
        >
          <i className="fas fa-plus mr-2 ml-0"></i>
          إضافة مقاس
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <div key={index} className={`border-2 rounded-lg p-4 transition-all ${
            item.isAvailable 
              ? 'border-green-200 bg-green-50/50' 
              : 'border-gray-200 bg-gray-50/50'
          }`}>
            {/* Size Header */}
            <div className="text-center mb-4">
              <Input
                value={item.size}
                onChange={(e) => handleSizeChange(index, e.target.value)}
                placeholder="مقاس 44"
                className="text-center text-lg font-semibold border-none bg-transparent"
                data-testid={`input-size-${index}`}
              />
            </div>

            {/* Quantity Display */}
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {item.quantity}
              </div>
              <div className="text-sm text-muted-foreground">قطعة</div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-center mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => decrementQuantity(index)}
                disabled={item.quantity <= 0}
                className="rounded-r-none"
                data-testid={`button-decrement-${index}`}
              >
                <i className="fas fa-minus"></i>
              </Button>
              
              <Input
                type="number"
                min="0"
                value={item.quantity || ""}
                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                className="text-center border-l-0 border-r-0 rounded-none w-20"
                data-testid={`input-quantity-${index}`}
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => incrementQuantity(index)}
                className="rounded-l-none"
                data-testid={`button-increment-${index}`}
              >
                <i className="fas fa-plus"></i>
              </Button>
            </div>

            {/* Availability Toggle */}
            <div className="space-y-2">
              <Button
                type="button"
                variant={item.isAvailable ? "destructive" : "default"}
                size="sm"
                onClick={() => toggleAvailability(index)}
                className="w-full"
                data-testid={`button-availability-${index}`}
              >
                <i className={`fas ${item.isAvailable ? 'fa-minus' : 'fa-plus'} mr-2 ml-0`}></i>
                {item.isAvailable ? 'نفد المخزون' : 'بيع قطعة'}
              </Button>
              
              <div className="text-center">
                <span className={`text-sm ${
                  item.isAvailable ? 'text-green-600' : 'text-orange-500'
                }`}>
                  {item.isAvailable ? 'متوفر' : 'مخزون منتهي!'}
                </span>
              </div>
            </div>

            {/* Remove Button */}
            {items.length > 1 && (
              <div className="mt-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSizeItem(index)}
                  className="w-full text-destructive hover:text-destructive"
                  data-testid={`button-remove-size-${index}`}
                >
                  <i className="fas fa-trash mr-2 ml-0"></i>
                  حذف المقاس
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <i className="fas fa-box-open text-4xl mb-4 block"></i>
          اضغط "إضافة مقاس" لبدء إضافة المقاسات والكميات
        </div>
      )}
    </div>
  );
}