
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChecklistItemProps {
  area: string;
  itens: string[];
  checkedItems: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
}

export const ChecklistSection = ({ area, itens, checkedItems, onChange }: ChecklistItemProps) => {
  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold">{area}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {itens.map((item) => {
          const id = `${area}-${item}`;
          return (
            <div key={id} className="flex items-start space-x-2">
              <Checkbox
                id={id}
                checked={checkedItems[id] || false}
                onCheckedChange={(checked) => onChange(id, !!checked)}
              />
              <Label
                htmlFor={id}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {item}
              </Label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

interface ChecklistContainerProps {
  checklistData: { area: string; itens: string[] }[];
  checkedItems: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
}

export const ChecklistContainer = ({ checklistData, checkedItems, onChange }: ChecklistContainerProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {checklistData.map((section) => (
        <ChecklistSection
          key={section.area}
          area={section.area}
          itens={section.itens}
          checkedItems={checkedItems}
          onChange={onChange}
        />
      ))}
    </div>
  );
};
