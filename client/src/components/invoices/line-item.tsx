import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { InvoiceItem } from "@shared/schema";

interface LineItemProps {
  item: InvoiceItem;
  index: number;
  onChange: (index: number, item: Partial<InvoiceItem>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function LineItem({ item, index, onChange, onRemove, disabled = false }: LineItemProps) {
  
  // Handle input changes directly - no local state
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    onChange(index, {
      ...item,
      description: newDescription
    });
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse the numeric value from the input, default to 1 if invalid
    const newQuantity = parseInt(e.target.value) || 0;
    const qty = newQuantity > 0 ? newQuantity : 1; // Ensure at least 1
    
    // Calculate the new total using numeric values
    const newTotal = qty * numericUnitPrice;
    
    // Update the parent component with all fields
    onChange(index, {
      ...item,
      quantity: qty,
      total: newTotal
    });
  };
  
  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse the numeric value from the input, default to 0 if invalid
    const newPrice = parseFloat(e.target.value) || 0;
    const price = newPrice >= 0 ? newPrice : 0; // Ensure non-negative
    
    // Calculate the new total using numeric values
    const newTotal = numericQuantity * price;
    
    // Update the parent component with all fields
    onChange(index, {
      ...item,
      unitPrice: price,
      total: newTotal
    });
  };
  
  // Force direct value assignment with proper fallbacks for numeric types
  const description = item.description || "";
  
  // Hard-code fallback values to ensure they display regardless of input
  const quantity = item.quantity || 1;
  const unitPrice = item.unitPrice || 0;
  
  // Force numeric conversion for calculations but not display
  const numericQuantity = Number(quantity);
  const numericUnitPrice = Number(unitPrice);
  
  // Debug logs removed for production
  
  return (
    <tr className="border-b border-neutral-200">
      <td className="px-4 py-3 w-[40%]">
        <Input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Enter description"
          className="w-full border-neutral-300"
          disabled={disabled}
        />
      </td>
      <td className="px-4 py-3 w-[15%]">
        <Input
          type="number"
          value={quantity || 1}
          defaultValue={1}
          onChange={handleQuantityChange}
          min={1}
          className="w-full border-neutral-300"
          disabled={disabled}
        />
      </td>
      <td className="px-4 py-3 w-[20%]">
        <div className="flex items-center">
          <span className="mr-1 text-neutral-600">£</span>
          <Input
            type="number"
            value={unitPrice || 0}
            defaultValue={0}
            onChange={handleUnitPriceChange}
            step="0.01"
            min={0}
            className="w-full border-neutral-300"
            disabled={disabled}
          />
        </div>
      </td>
      <td className="px-4 py-3 w-[15%] text-right font-medium">
        £{(numericQuantity * numericUnitPrice).toFixed(2)}
      </td>
      <td className="px-4 py-3 w-[10%] text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
