import { useState, useEffect, useRef } from "react";
import { Check, X, Minus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PopPeriodicidade } from "@/config/popsConfig";
import * as XLSX from "xlsx";

interface CellData {
  conforme: boolean | null;
  responsavel: string;
  funcao: string;
}

interface Props {
  planilhaId: string;
  periodicidade: PopPeriodicidade;
  userId: string;
}

export default function PopPlanilhaForm({ planilhaId, periodicidade, userId }: Props) {
  const [grid, setGrid] = useState<Record<string, CellData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cellKey = (periodo: string, area: string) => `${periodo}||${area}`;

  useEffect(() => {
    loadData();
  }, [planilhaId]);

  async function loadData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pop_planilha_itens")
      .select("periodo_label, area, conforme, responsavel, funcao")
      .eq("planilha_id", planilhaId);

    if (error) {
      toast.error("Erro ao carregar dados");
      setLoading(false);
      return;
    }

    const newGrid: Record<string, CellData> = {};
    (data || []).forEach((item) => {
      newGrid[cellKey(item.periodo_label, item.area)] = {
        conforme: item.conforme,
        responsavel: item.responsavel || "",
        funcao: item.funcao || "",
      };
    });
    setGrid(newGrid);
    setLoading(false);
  }

  function toggleCell(periodo: string, area: string) {
    const key = cellKey(periodo, area);
    const current = grid[key]?.conforme ?? null;
    const next = current === null ? true : current === true ? false : null;
    setGrid((prev) => ({
      ...prev,
      [key]: { ...prev[key], conforme: next, responsavel: prev[key]?.responsavel || "", funcao: prev[key]?.funcao || "" },
    }));
  }

  function updateField(periodo: string, field: "responsavel" | "funcao", value: string) {
    // Update all areas for this periodo
    periodicidade.areas.forEach((a) => {
      const key = cellKey(periodo, a.area);
      setGrid((prev) => ({
        ...prev,
        [key]: { ...prev[key], conforme: prev[key]?.conforme ?? null, responsavel: prev[key]?.responsavel || "", funcao: prev[key]?.funcao || "", [field]: value },
      }));
    });
  }

  function getFieldForPeriodo(periodo: string, field: "responsavel" | "funcao") {
    const firstArea = periodicidade.areas[0]?.area;
    if (!firstArea) return "";
    return grid[cellKey(periodo, firstArea)]?.[field] || "";
  }

  async function saveAll() {
    setSaving(true);

    // Delete existing items for this planilha
    await supabase.from("pop_planilha_itens").delete().eq("planilha_id", planilhaId);

    // Insert all non-empty items
    const inserts: any[] = [];
    for (const periodo of periodicidade.periodos) {
      for (const area of periodicidade.areas) {
        const key = cellKey(periodo, area.area);
        const cell = grid[key];
        if (cell && cell.conforme !== null) {
          inserts.push({
            user_id: userId,
            planilha_id: planilhaId,
            periodo_label: periodo,
            area: area.area,
            conforme: cell.conforme,
            responsavel: cell.responsavel,
            funcao: cell.funcao,
          });
        }
      }
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from("pop_planilha_itens").insert(inserts);
      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        setSaving(false);
        return;
      }
    }

    toast.success(`${inserts.length} registros salvos com sucesso!`);
    setSaving(false);
  }

  function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row (contains area names)
        let headerRowIdx = -1;
        const areaNames = periodicidade.areas.map((a) => a.area.toLowerCase().trim());

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const rowVals = (rows[i] || []).map((v: any) => String(v || "").toLowerCase().trim());
          const matches = areaNames.filter((a) => rowVals.some((v: string) => v.includes(a) || a.includes(v)));
          if (matches.length >= Math.min(2, areaNames.length)) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          // Fallback: assume first column is period, remaining are areas in order
          headerRowIdx = -1;
          const newGrid: Record<string, CellData> = { ...grid };
          let imported = 0;

          for (const row of rows) {
            if (!row || !row[0]) continue;
            const periodoRaw = String(row[0]).trim();
            const periodo = periodicidade.periodos.find(
              (p) => p === periodoRaw || p === periodoRaw.replace(/^0/, "")
            );
            if (!periodo) continue;

            periodicidade.areas.forEach((area, aIdx) => {
              const cellVal = String(row[aIdx + 1] || "").trim().toUpperCase();
              const key = cellKey(periodo, area.area);
              let conforme: boolean | null = null;
              if (cellVal === "C" || cellVal === "CONFORME" || cellVal === "OK" || cellVal === "SIM" || cellVal === "S") conforme = true;
              else if (cellVal === "NC" || cellVal === "NÃO CONFORME" || cellVal === "NAO CONFORME" || cellVal === "NÃO" || cellVal === "N") conforme = false;

              if (conforme !== null) {
                newGrid[key] = {
                  conforme,
                  responsavel: newGrid[key]?.responsavel || "",
                  funcao: newGrid[key]?.funcao || "",
                };
                imported++;
              }
            });

            // Check for responsavel/funcao in last columns
            const respIdx = periodicidade.areas.length + 1;
            const funcIdx = periodicidade.areas.length + 2;
            const resp = row[respIdx] ? String(row[respIdx]).trim() : "";
            const func = row[funcIdx] ? String(row[funcIdx]).trim() : "";
            if (resp || func) {
              periodicidade.areas.forEach((area) => {
                const key = cellKey(periodo, area.area);
                if (newGrid[key]) {
                  newGrid[key] = { ...newGrid[key], responsavel: resp, funcao: func };
                }
              });
            }
          }

          setGrid(newGrid);
          toast.success(`${imported} registros importados! Revise e salve.`);
          return;
        }

        // Map header columns to areas
        const headerRow = rows[headerRowIdx].map((v: any) => String(v || "").toLowerCase().trim());
        const areaColMap: Record<number, string> = {};
        let respCol = -1;
        let funcCol = -1;

        headerRow.forEach((val: string, colIdx: number) => {
          if (val.includes("responsável") || val.includes("responsavel")) { respCol = colIdx; return; }
          if (val.includes("função") || val.includes("funcao")) { funcCol = colIdx; return; }
          for (const area of periodicidade.areas) {
            const areaLower = area.area.toLowerCase().trim();
            if (val.includes(areaLower) || areaLower.includes(val)) {
              areaColMap[colIdx] = area.area;
              break;
            }
          }
        });

        const newGrid: Record<string, CellData> = { ...grid };
        let imported = 0;

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          const periodoRaw = String(row[0]).trim();
          const periodo = periodicidade.periodos.find(
            (p) => p === periodoRaw || p === periodoRaw.replace(/^0/, "")
          );
          if (!periodo) continue;

          const resp = respCol >= 0 && row[respCol] ? String(row[respCol]).trim() : "";
          const func = funcCol >= 0 && row[funcCol] ? String(row[funcCol]).trim() : "";

          for (const [colStr, areaName] of Object.entries(areaColMap)) {
            const colIdx = Number(colStr);
            const cellVal = String(row[colIdx] || "").trim().toUpperCase();
            const key = cellKey(periodo, areaName);
            let conforme: boolean | null = null;
            if (cellVal === "C" || cellVal === "CONFORME" || cellVal === "OK" || cellVal === "SIM" || cellVal === "S") conforme = true;
            else if (cellVal === "NC" || cellVal === "NÃO CONFORME" || cellVal === "NAO CONFORME" || cellVal === "NÃO" || cellVal === "N") conforme = false;

            if (conforme !== null) {
              newGrid[key] = { conforme, responsavel: resp, funcao: func };
              imported++;
            }
          }
        }

        setGrid(newGrid);
        toast.success(`${imported} registros importados! Revise e salve.`);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler o arquivo. Verifique se é um .xlsx válido.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/70">
              <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border sticky left-0 bg-muted/70 min-w-[80px]">
                Período
              </th>
              {periodicidade.areas.map((a) => (
                <th key={a.area} className="px-2 py-2 text-center font-semibold text-foreground border-b border-border min-w-[100px] text-xs">
                  {a.area}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold text-foreground border-b border-border min-w-[120px]">
                Responsável
              </th>
              <th className="px-2 py-2 text-center font-semibold text-foreground border-b border-border min-w-[100px]">
                Função
              </th>
            </tr>
          </thead>
          <tbody>
            {periodicidade.periodos.map((periodo, idx) => (
              <tr key={periodo} className={cn(idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                <td className={cn("px-3 py-1.5 font-medium text-foreground border-b border-border sticky left-0", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                  {periodo}
                </td>
                {periodicidade.areas.map((a) => {
                  const key = cellKey(periodo, a.area);
                  const val = grid[key]?.conforme ?? null;
                  return (
                    <td key={a.area} className="px-1 py-1 text-center border-b border-border">
                      <button
                        onClick={() => toggleCell(periodo, a.area)}
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center mx-auto transition-colors text-xs font-bold",
                          val === true && "bg-primary/15 text-primary border border-primary/30",
                          val === false && "bg-destructive/15 text-destructive border border-destructive/30",
                          val === null && "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                        )}
                      >
                        {val === true ? "C" : val === false ? "NC" : <Minus className="w-3 h-3" />}
                      </button>
                    </td>
                  );
                })}
                <td className="px-1 py-1 border-b border-border">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Nome"
                    value={getFieldForPeriodo(periodo, "responsavel")}
                    onChange={(e) => updateField(periodo, "responsavel", e.target.value)}
                  />
                </td>
                <td className="px-1 py-1 border-b border-border">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Função"
                    value={getFieldForPeriodo(periodo, "funcao")}
                    onChange={(e) => updateField(periodo, "funcao", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          *C = Conforme | NC = Não Conforme | Clique para alternar. Em caso de NC, emitir RNC.
        </p>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportExcel}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> Importar Excel
          </Button>
          <Button onClick={saveAll} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Registros"}
          </Button>
        </div>
      </div>
    </div>
  );
}
