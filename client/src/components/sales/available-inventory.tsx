import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AvailableInventoryProps {
  productId: string;
  selectedColor?: string;
  selectedSize?: string;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
}

export default function AvailableInventory({ 
  productId, 
  selectedColor, 
  selectedSize, 
  onColorSelect, 
  onSizeSelect 
}: AvailableInventoryProps) {
  const { data: inventory } = useQuery({
    queryKey: ["/api/products", productId, "inventory"],
    enabled: !!productId,
  });

  const inventoryArray = (inventory as any) || [];

  if (!inventoryArray || inventoryArray.length === 0) {
    return (
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">لا توجد معلومات مخزون متاحة</p>
        </CardContent>
      </Card>
    );
  }

  // Group inventory by color
  const colorGroups = inventoryArray.reduce((groups: Record<string, any[]>, item: any) => {
    if (!groups[item.color]) {
      groups[item.color] = [];
    }
    groups[item.color].push(item);
    return groups;
  }, {});

  const availableColors = Object.keys(colorGroups);
  const selectedColorInventory = selectedColor ? colorGroups[selectedColor] || [] : [];

  const getColorTotal = (color: string) => {
    return colorGroups[color].reduce((sum: number, item: any) => sum + item.quantity, 0);
  };

  const getAvailableQuantity = () => {
    if (!selectedColor || !selectedSize) return 0;
    const item = inventoryArray.find((inv: any) => inv.color === selectedColor && inv.size === selectedSize);
    return item ? item.quantity : 0;
  };

  return (
    <Card className="bg-muted/20">
      <CardContent className="p-4">
        <h5 className="font-medium text-sm mb-4">المخزون المتوفر:</h5>
        
        {/* Available Colors */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-2 block">الألوان المتوفرة:</label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <Button
                key={color}
                type="button"
                variant={selectedColor === color ? "default" : "outline"}
                size="sm"
                onClick={() => onColorSelect(color)}
                data-testid={`button-select-color-${color}`}
              >
                {color} ({getColorTotal(color)})
              </Button>
            ))}
          </div>
        </div>

        {/* Available Sizes for Selected Color */}
        {selectedColor && selectedColorInventory.length > 0 && (
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-2 block">
              المقاسات المتوفرة لـ {selectedColor}:
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedColorInventory.map((item: any) => (
                <Button
                  key={item.size}
                  type="button"
                  variant={selectedSize === item.size ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSizeSelect(item.size)}
                  disabled={item.quantity === 0}
                  data-testid={`button-select-size-${item.size}`}
                >
                  {item.size} ({item.quantity})
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Info */}
        {selectedColor && selectedSize && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">الكمية المتوفرة:</span>
            <Badge variant={getAvailableQuantity() > 0 ? "default" : "destructive"}>
              {getAvailableQuantity()} قطعة
            </Badge>
          </div>
        )}

        {/* Summary */}
        <div className="text-xs text-muted-foreground">
          إجمالي: {availableColors.length} لون، {inventory.length} مقاس متوفر
        </div>
      </CardContent>
    </Card>
  );
}
