
import { Button } from "@/components/ui/button";

interface ActionFooterProps {
  marcados: number;
  total: number;
  labelOk: string;
  labelNotOk: string;
  buttonText: string;
  disabled: boolean;
  onSave: () => void;
}

export const ActionFooter = ({
  marcados,
  total,
  labelOk,
  labelNotOk,
  buttonText,
  disabled,
  onSave
}: ActionFooterProps) => {
  const todosOk = marcados === total;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
      <div>
        <p className="text-sm font-semibold">{marcados}/{total} itens verificados</p>
        <p className="text-xs text-muted-foreground">{todosOk ? labelOk : labelNotOk}</p>
      </div>
      <Button disabled={disabled} onClick={onSave}>
        {buttonText}
      </Button>
    </div>
  );
};
