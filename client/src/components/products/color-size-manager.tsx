import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus } from "lucide-react";
import { COLORS, SIZES } from "@shared/schema";

interface ColorSizeManagerProps {
  inventory: Record<string, Record<string, number>>;
  onInventoryChange: (inventory: Record<string, Record<string, number>>) => void;
}

export default function ColorSizeManager({ inventory, onInventoryChange }: ColorSizeManagerProps) {
  const [newColor, setNewColor] = useState("");
  const [activeColor, setActiveColor] = useState<string>("");
  const [newSize, setNewSize] = useState("");

  // Initialize inventory with default colors if empty
  const availableColors = Object.keys(inventory).length > 0 ? Object.keys(inventory) : [];

  const addColor = () => {
    if (newColor.trim() && !inventory[newColor.trim()]) {
      const updatedInventory = {
        ...inventory,
        [newColor.trim()]: {}
      };
      onInventoryChange(updatedInventory);
      if (!activeColor) {
        setActiveColor(newColor.trim());
      }
      setNewColor("");
    }
  };

  const removeColor = (color: string) => {
    const updatedInventory = { ...inventory };
    delete updatedInventory[color];
    onInventoryChange(updatedInventory);
    if (activeColor === color) {
      setActiveColor(Object.keys(updatedInventory)[0] || "");
    }
  };

  const addSize = (color: string) => {
    if (newSize.trim() && !inventory[color]?.[newSize.trim()]) {
      const updatedInventory = {
        ...inventory,
        [color]: {
          ...inventory[color],
          [newSize.trim()]: 0
        }
      };
      onInventoryChange(updatedInventory);
      setNewSize("");
    }
  };

  const removeSize = (color: string, size: string) => {
    const updatedInventory = { ...inventory };
    if (updatedInventory[color]) {
      delete updatedInventory[color][size];
      onInventoryChange(updatedInventory);
    }
  };

  const updateQuantity = (color: string, size: string, quantity: number) => {
    const updatedInventory = {
      ...inventory,
      [color]: {
        ...inventory[color],
        [size]: Math.max(0, quantity)
      }
    };
    onInventoryChange(updatedInventory);
  };

  const getColorTotal = (color: string) => {
    if (!inventory[color]) return 0;
    return Object.values(inventory[color]).reduce((sum, qty) => sum + qty, 0);
  };

  const getColorSizeCount = (color: string) => {
    if (!inventory[color]) return 0;
    return Object.keys(inventory[color]).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">إدارة الألوان والمقاسات</h4>
        <div className="flex items-center gap-2">
          <Input 
            type="text" 
            placeholder="اسم اللون الجديد" 
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-40"
            data-testid="input-new-color"
          />
          <Button 
            type="button" 
            onClick={addColor}
            size="sm"
            data-testid="button-add-color"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة لون
          </Button>
        </div>
      </div>

      {/* Color Overview Cards */}
      {availableColors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {availableColors.map((color) => (
            <Card key={color} className="text-center">
              <CardContent className="p-4">
                <div className="font-semibold text-lg mb-2">{color}</div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {getColorTotal(color)}
                </div>
                <div className="text-sm text-muted-foreground mb-2">قطعة إجمالي</div>
                <div className="text-xs text-muted-foreground">
                  {getColorSizeCount(color)} مقاس متوفر
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Color Tab Management */}
      {availableColors.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <div key={color} className="relative">
                <Button
                  type="button"
                  variant={activeColor === color ? "default" : "outline"}
                  className="relative pl-6"
                  onClick={() => setActiveColor(color)}
                  data-testid={`button-color-tab-${color}`}
                >
                  {color}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeColor(color);
                    }}
                    className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </Button>
              </div>
            ))}
          </div>

          {/* Size Quantity Grid */}
          {activeColor && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium">إدارة المقاسات والكميات</h5>
                  <Badge variant="secondary">({activeColor})</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="مقاس جديد"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSize(activeColor)}
                    data-testid="button-add-size"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مقاس
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory[activeColor] && Object.entries(inventory[activeColor]).map(([size, quantity], index) => (
                  <Card 
                    key={`${activeColor}-${size}`}
                    className={`${quantity > 0 ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'} transition-all`}
                  >
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-between">
                          <Input
                            value={size}
                            readOnly
                            className="text-center text-lg font-semibold border-none bg-transparent"
                            data-testid={`input-size-${index}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSize(activeColor, size)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-amber-600 mb-1">{quantity}</div>
                        <div className="text-sm text-muted-foreground">قطعة</div>
                      </div>

                      <div className="flex items-center justify-center mb-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(activeColor, size, quantity - 1)}
                          disabled={quantity <= 0}
                          data-testid={`button-decrement-${index}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => updateQuantity(activeColor, size, parseInt(e.target.value) || 0)}
                          className="text-center border-l-0 border-r-0 w-20 mx-2"
                          data-testid={`input-quantity-${index}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(activeColor, size, quantity + 1)}
                          data-testid={`button-increment-${index}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-center">
                        <span className={`text-sm ${quantity > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                          {quantity > 0 ? 'متوفر' : 'مخزون منتهي!'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
