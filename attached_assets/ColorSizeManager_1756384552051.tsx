import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SizeQuantityGrid from "./SizeQuantityGrid";

interface ColorSizeManagerProps {
  inventory: Record<string, Record<string, number>>;
  onInventoryChange: (inventory: Record<string, Record<string, number>>) => void;
}

export default function ColorSizeManager({ inventory, onInventoryChange }: ColorSizeManagerProps) {
  const [colors, setColors] = useState<string[]>(() => {
    const existingColors = Object.keys(inventory);
    return existingColors.length > 0 ? existingColors : ["افتراضي"];
  });
  
  const [newColor, setNewColor] = useState("");
  const [activeColor, setActiveColor] = useState<string>(colors[0] || "افتراضي");

  const addColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      const updatedColors = [...colors, newColor.trim()];
      setColors(updatedColors);
      setActiveColor(newColor.trim());
      setNewColor("");
      
      // Initialize empty inventory for new color
      const updatedInventory = { ...inventory };
      if (!updatedInventory[newColor.trim()]) {
        updatedInventory[newColor.trim()] = {};
      }
      onInventoryChange(updatedInventory);
    }
  };

  const removeColor = (colorToRemove: string) => {
    if (colors.length > 1) {
      const updatedColors = colors.filter(color => color !== colorToRemove);
      setColors(updatedColors);
      
      // Remove color from inventory
      const updatedInventory = { ...inventory };
      delete updatedInventory[colorToRemove];
      onInventoryChange(updatedInventory);
      
      // Set active color to first remaining color
      if (activeColor === colorToRemove) {
        setActiveColor(updatedColors[0]);
      }
    }
  };

  const getTotalQuantityForColor = (color: string): number => {
    if (!inventory[color]) return 0;
    return Object.values(inventory[color]).reduce((sum, qty) => sum + qty, 0);
  };

  const getAvailableSizesCount = (color: string): number => {
    if (!inventory[color]) return 0;
    return Object.values(inventory[color]).filter(qty => qty > 0).length;
  };

  return (
    <div className="space-y-6">
      {/* Color Management Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">إدارة الألوان والمقاسات</h4>
        <div className="flex items-center gap-2">
          <Input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="اسم اللون الجديد"
            className="w-40"
            data-testid="input-new-color"
          />
          <Button 
            onClick={addColor}
            disabled={!newColor.trim() || colors.includes(newColor.trim())}
            size="sm"
            data-testid="button-add-color"
          >
            <i className="fas fa-plus mr-2 ml-0"></i>
            إضافة لون
          </Button>
        </div>
      </div>

      {/* Color Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {colors.map((color) => (
          <div key={color} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="font-semibold text-lg mb-2">{color}</div>
            <div className="text-2xl font-bold text-primary mb-1">
              {getTotalQuantityForColor(color)}
            </div>
            <div className="text-sm text-muted-foreground mb-2">قطعة إجمالي</div>
            <div className="text-xs text-muted-foreground">
              {getAvailableSizesCount(color)} مقاس متوفر
            </div>
          </div>
        ))}
      </div>

      {/* Color Tabs */}
      <Tabs value={activeColor} onValueChange={setActiveColor} className="w-full">
        <div className="flex flex-wrap gap-2 mb-4">
          {colors.map((color) => (
            <div key={color} className="relative">
              <Button
                type="button"
                variant={activeColor === color ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveColor(color)}
                className="pr-8"
                data-testid={`button-color-tab-${color}`}
              >
                {color}
              </Button>
              {colors.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeColor(color);
                  }}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center hover:bg-destructive/80"
                  data-testid={`button-remove-color-${color}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        
        {colors.map((color) => (
          <TabsContent key={color} value={color} className="mt-6">
            <SizeQuantityGrid
              inventory={inventory}
              onInventoryChange={onInventoryChange}
              selectedColor={color}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}