import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface InventoryItem {
  id: string;
  productId: string;
  color: string;
  size: string;
  quantity: number;
}

interface AvailableInventoryProps {
  productId: string;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  selectedColor?: string;
  selectedSize?: string;
}

export default function AvailableInventory({ 
  productId, 
  onColorSelect, 
  onSizeSelect, 
  selectedColor, 
  selectedSize 
}: AvailableInventoryProps) {
  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/products", productId, "inventory"],
    queryFn: () => api.getProductInventory(productId),
    enabled: !!productId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">جاري تحميل المخزون...</div>;
  }

  if (!inventory || inventory.length === 0) {
    return <div className="text-sm text-muted-foreground">لا توجد كميات متوفرة لهذا المنتج</div>;
  }

  // Group inventory by colors
  const colorGroups = inventory.reduce((groups, item) => {
    if (!groups[item.color]) {
      groups[item.color] = [];
    }
    groups[item.color].push(item);
    return groups;
  }, {} as Record<string, InventoryItem[]>);

  // Get available colors (colors with quantity > 0)
  const availableColors = Object.keys(colorGroups).filter(color => 
    colorGroups[color].some(item => item.quantity > 0)
  );

  // Get available sizes for selected color
  const availableSizes = selectedColor && colorGroups[selectedColor] 
    ? colorGroups[selectedColor].filter(item => item.quantity > 0)
    : [];

  // Get quantity for selected color and size
  const getQuantity = (color: string, size: string): number => {
    const item = inventory.find(inv => inv.color === color && inv.size === size);
    return item ? item.quantity : 0;
  };

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
      <h5 className="font-medium text-sm">المخزون المتوفر:</h5>
      
      {/* Available Colors */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">الألوان المتوفرة:</label>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => {
            const totalQuantity = colorGroups[color].reduce((sum, item) => sum + item.quantity, 0);
            return (
              <button
                key={color}
                type="button"
                onClick={() => onColorSelect(color)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  selectedColor === color
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
                data-testid={`button-select-color-${color}`}
              >
                {color} ({totalQuantity})
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Sizes for Selected Color */}
      {selectedColor && availableSizes.length > 0 && (
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">المقاسات المتوفرة لـ {selectedColor}:</label>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((item) => (
              <button
                key={item.size}
                type="button"
                onClick={() => onSizeSelect(item.size)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  selectedSize === item.size
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
                data-testid={`button-select-size-${item.size}`}
              >
                {item.size} ({item.quantity})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Info */}
      {selectedColor && selectedSize && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">الكمية المتوفرة:</span>
          <Badge variant={getQuantity(selectedColor, selectedSize) > 0 ? "default" : "destructive"}>
            {getQuantity(selectedColor, selectedSize)} قطعة
          </Badge>
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-muted-foreground">
        إجمالي: {availableColors.length} لون، {inventory.filter(item => item.quantity > 0).length} مقاس متوفر
      </div>
    </div>
  );
}