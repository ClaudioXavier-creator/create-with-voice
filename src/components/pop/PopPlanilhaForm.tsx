import { useState, useEffect, useRef } from "react";
import { Check, X, Minus, Upload, Download, PenLine, Printer, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { PopPeriodicidade } from "@/config/popsConfig";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface CellData {
  conforme: boolean | null;
  responsavel: string;
  funcao: string;
  observacoes: string;
}

interface Signatures {
  executor: string;
  executorData: string | null;
  supervisor: string;
  supervisorData: string | null;
  rt: string;
  rtCrmv: string;
  rtData: string | null;
}

interface Props {
  planilhaId: string;
  periodicidade: PopPeriodicidade;
  userId: string;
  popCodigo?: string;
  popNome?: string;
  empresaId?: string;
}

export default function PopPlanilhaForm({ planilhaId, periodicidade, userId, popCodigo, popNome, empresaId }: Props) {
  const [grid, setGrid] = useState<Record<string, CellData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [planilhaStatus, setPlanilhaStatus] = useState<string>("em_andamento");
  const [signatures, setSignatures] = useState<Signatures>({
    executor: "", executorData: null,
    supervisor: "", supervisorData: null,
    rt: "", rtCrmv: "", rtData: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cellKey = (periodo: string, area: string) => `${periodo}||${area}`;

  useEffect(() => {
    loadData();
  }, [planilhaId]);

  async function loadData() {
    setLoading(true);

    const [itensRes, planilhaRes] = await Promise.all([
      supabase
        .from("pop_planilha_itens")
        .select("periodo_label, area, conforme, responsavel, funcao, observacoes")
        .eq("planilha_id", planilhaId),
      supabase
        .from("pop_planilhas")
        .select("status, assinatura_executor, assinatura_executor_data, assinatura_supervisor, assinatura_supervisor_data, assinatura_rt, assinatura_rt_crmv, assinatura_rt_data")
        .eq("id", planilhaId)
        .maybeSingle(),
    ]);

    if (itensRes.error) {
      toast.error("Erro ao carregar dados");
      setLoading(false);
      return;
    }

    const newGrid: Record<string, CellData> = {};
    (itensRes.data || []).forEach((item) => {
      newGrid[cellKey(item.periodo_label, item.area)] = {
        conforme: item.conforme,
        responsavel: item.responsavel || "",
        funcao: item.funcao || "",
        observacoes: item.observacoes || "",
      };
    });
    setGrid(newGrid);

    if (planilhaRes.data) {
      const p = planilhaRes.data;
      setPlanilhaStatus(p.status || "em_andamento");
      setSignatures({
        executor: p.assinatura_executor || "",
        executorData: p.assinatura_executor_data || null,
        supervisor: p.assinatura_supervisor || "",
        supervisorData: p.assinatura_supervisor_data || null,
        rt: p.assinatura_rt || "",
        rtCrmv: p.assinatura_rt_crmv || "",
        rtData: p.assinatura_rt_data || null,
      });
    }

    setLoading(false);
  }

  function toggleCell(periodo: string, area: string) {
    const key = cellKey(periodo, area);
    const current = grid[key]?.conforme ?? null;
    const next = current === null ? true : current === true ? false : null;
    setGrid((prev) => ({
      ...prev,
      [key]: { ...prev[key], conforme: next, responsavel: prev[key]?.responsavel || "", funcao: prev[key]?.funcao || "", observacoes: prev[key]?.observacoes || "" },
    }));
  }

  function updateField(periodo: string, field: "responsavel" | "funcao" | "observacoes", value: string) {
    periodicidade.areas.forEach((a) => {
      const key = cellKey(periodo, a.area);
      setGrid((prev) => ({
        ...prev,
        [key]: { ...prev[key], conforme: prev[key]?.conforme ?? null, responsavel: prev[key]?.responsavel || "", funcao: prev[key]?.funcao || "", observacoes: prev[key]?.observacoes || "", [field]: value },
      }));
    });
  }

  function getFieldForPeriodo(periodo: string, field: "responsavel" | "funcao" | "observacoes") {
    const firstArea = periodicidade.areas[0]?.area;
    if (!firstArea) return "";
    return grid[cellKey(periodo, firstArea)]?.[field] || "";
  }

  async function signField(field: "executor" | "supervisor" | "rt") {
    const now = new Date().toISOString();
    const nameField = field === "executor" ? "executor" : field === "supervisor" ? "supervisor" : "rt";
    if (!signatures[nameField]) {
      toast.error("Preencha o nome antes de assinar.");
      return;
    }

    const updateData: Record<string, string> = {};
    updateData[`assinatura_${field}`] = signatures[nameField];
    updateData[`assinatura_${field}_data`] = now;
    if (field === "rt") updateData.assinatura_rt_crmv = signatures.rtCrmv;

    const { error } = await supabase.from("pop_planilhas").update(updateData as any).eq("id", planilhaId);
    if (error) {
      toast.error("Erro ao registrar assinatura");
      return;
    }

    setSignatures((prev) => ({
      ...prev,
      [`${nameField}Data`]: now,
    }));
    toast.success(`Assinatura de ${field === "executor" ? "Executor" : field === "supervisor" ? "Supervisor" : "Responsável Técnico"} registrada!`);
  }

  async function saveAll() {
    setSaving(true);
    await supabase.from("pop_planilha_itens").delete().eq("planilha_id", planilhaId);

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
            observacoes: cell.observacoes,
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

  function printPlanilha() {
    const areas = periodicidade.areas.map((a) => a.area);
    const headerCells = areas.map((a) => `<th style="border:1px solid #333;padding:4px 6px;background:#d0d0d0;font-size:9px;text-align:center;white-space:nowrap">${a}</th>`).join("");

    const bodyRows = periodicidade.periodos.map((periodo, idx) => {
      const cells = areas.map((a) => {
        const key = cellKey(periodo, a);
        const val = grid[key]?.conforme ?? null;
        const text = val === true ? "C" : val === false ? "NC" : "";
        const bg = val === true ? "#d4edda" : val === false ? "#f8d7da" : "#fff";
        return `<td style="border:1px solid #333;padding:3px 6px;text-align:center;font-size:9px;font-weight:bold;background:${bg}">${text}</td>`;
      }).join("");
      const resp = getFieldForPeriodo(periodo, "responsavel");
      const func = getFieldForPeriodo(periodo, "funcao");
      const rowBg = idx % 2 === 0 ? "#fff" : "#f9f9f9";
      return `<tr style="background:${rowBg}">
        <td style="border:1px solid #333;padding:3px 6px;font-size:9px;font-weight:600;white-space:nowrap">${periodo}</td>
        ${cells}
        <td style="border:1px solid #333;padding:3px 6px;font-size:9px">${resp}</td>
        <td style="border:1px solid #333;padding:3px 6px;font-size:9px">${func}</td>
      </tr>`;
    }).join("");

    const signBlock = `
      <div style="margin-top:24px;display:flex;justify-content:space-between;gap:20px">
        <div style="flex:1;text-align:center">
          <div style="border-top:1px solid #000;margin-top:50px;padding-top:4px;font-size:9px">
            Responsável pela Execução${signatures.executor ? `<br><strong>${signatures.executor}</strong>` : ""}
            ${signatures.executorData ? `<br>${formatSignDate(signatures.executorData)}` : ""}
          </div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="border-top:1px solid #000;margin-top:50px;padding-top:4px;font-size:9px">
            Verificador / Supervisor${signatures.supervisor ? `<br><strong>${signatures.supervisor}</strong>` : ""}
            ${signatures.supervisorData ? `<br>${formatSignDate(signatures.supervisorData)}` : ""}
          </div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="border-top:1px solid #000;margin-top:50px;padding-top:4px;font-size:9px">
            Responsável Técnico${signatures.rt ? `<br><strong>${signatures.rt}</strong> — CRMV: ${signatures.rtCrmv}` : ""}
            ${signatures.rtData ? `<br>${formatSignDate(signatures.rtData)}` : ""}
          </div>
        </div>
      </div>
    `;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${popCodigo} - ${periodicidade.label}</title>
<style>
  @media print { @page { size: A4 landscape; margin: 10mm; } }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #000; margin: 0; }
  h2 { font-size: 13px; text-align: center; margin-bottom: 2px; }
  .sub { text-align: center; font-size: 10px; color: #555; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  .legenda { font-size: 8px; color: #555; margin-top: 8px; }
</style></head><body>
<h2>${popCodigo || "POP"} — ${popNome || ""}</h2>
<div class="sub">${periodicidade.label} | Mês/Ano: ___/___</div>
<table>
  <thead>
    <tr>
      <th style="border:1px solid #333;padding:4px 6px;background:#d0d0d0;font-size:9px;text-align:left;min-width:60px">Período</th>
      ${headerCells}
      <th style="border:1px solid #333;padding:4px 6px;background:#d0d0d0;font-size:9px;text-align:center">Responsável</th>
      <th style="border:1px solid #333;padding:4px 6px;background:#d0d0d0;font-size:9px;text-align:center">Função</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table>
<p class="legenda">*C = Conforme | NC = Não Conforme | Em caso de NC, emitir RNC (Registro de Não Conformidade).</p>
${signBlock}
</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.onload = () => { win.print(); };
    }
  }

  function downloadTemplate() {
    const areas = periodicidade.areas.map((a) => a.area);
    const header = ["Período", ...areas, "Responsável", "Função"];

    const rows: any[][] = [];

    // Title rows
    rows.push([`${popCodigo || "POP"} - ${popNome || ""}`]);
    rows.push([`${periodicidade.label} | Preencher com C (Conforme) ou NC (Não Conforme)`]);
    rows.push([]);
    rows.push(header);

    for (const p of periodicidade.periodos) {
      rows.push([p, ...areas.map(() => ""), "", ""]);
    }

    // Blank rows before signatures
    rows.push([]);
    rows.push([]);

    // Signature block
    rows.push(["ASSINATURAS"]);
    rows.push([]);
    rows.push(["Responsável pela Execução:", "", "", "Data: ____/____/________"]);
    rows.push(["Nome: ________________________________", "", "", "Assinatura: ________________________________"]);
    rows.push([]);
    rows.push(["Verificador / Supervisor:", "", "", "Data: ____/____/________"]);
    rows.push(["Nome: ________________________________", "", "", "Assinatura: ________________________________"]);
    rows.push([]);
    rows.push(["Responsável Técnico (RT):", "", "", "Data: ____/____/________"]);
    rows.push(["Nome: ________________________________", "", "", "CRMV: ____________"]);
    rows.push(["Assinatura: ________________________________"]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Merge title cells
    const totalCols = header.length;
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
    ];

    ws["!cols"] = header.map((h) => ({ wch: Math.max(h.length + 4, 16) }));

    const wb = XLSX.utils.book_new();
    const sheetName = periodicidade.label.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = `Template_${popCodigo || "POP"}_${periodicidade.key}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success("Template com campos de assinatura baixado!");
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
                newGrid[key] = { conforme, responsavel: newGrid[key]?.responsavel || "", funcao: newGrid[key]?.funcao || "", observacoes: newGrid[key]?.observacoes || "" };
                imported++;
              }
            });

            const respIdx = periodicidade.areas.length + 1;
            const funcIdx = periodicidade.areas.length + 2;
            const resp = row[respIdx] ? String(row[respIdx]).trim() : "";
            const func = row[funcIdx] ? String(row[funcIdx]).trim() : "";
            if (resp || func) {
              periodicidade.areas.forEach((area) => {
                const key = cellKey(periodo, area.area);
                if (newGrid[key]) newGrid[key] = { ...newGrid[key], responsavel: resp, funcao: func };
              });
            }
          }

          setGrid(newGrid);
          toast.success(`${imported} registros importados! Revise e salve.`);
          return;
        }

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
          if (periodoRaw.toUpperCase().startsWith("ASSINATURA")) break;
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
              newGrid[key] = { conforme, responsavel: resp, funcao: func, observacoes: newGrid[key]?.observacoes || "" };
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

  const formatSignDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy HH:mm") : null;

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
              <th className="px-2 py-2 text-center font-semibold text-foreground border-b border-border min-w-[140px]">
                Observações
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
                <td className="px-1 py-1 border-b border-border">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Obs. (NC)"
                    value={getFieldForPeriodo(periodo, "observacoes")}
                    onChange={(e) => updateField(periodo, "observacoes", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenLine className="w-4 h-4" /> Assinaturas Digitais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Executor */}
            <div className="space-y-2 p-3 border border-border rounded-lg">
              <Label className="text-xs font-semibold text-foreground">Responsável pela Execução</Label>
              <Input
                placeholder="Nome completo"
                value={signatures.executor}
                onChange={(e) => setSignatures((s) => ({ ...s, executor: e.target.value }))}
                className="h-8 text-xs"
                disabled={!!signatures.executorData}
              />
              {signatures.executorData ? (
                <p className="text-xs text-primary font-medium">
                  ✓ Assinado em {formatSignDate(signatures.executorData)}
                </p>
              ) : (
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => signField("executor")}>
                  <PenLine className="w-3 h-3 mr-1" /> Assinar
                </Button>
              )}
            </div>

            {/* Supervisor */}
            <div className="space-y-2 p-3 border border-border rounded-lg">
              <Label className="text-xs font-semibold text-foreground">Verificador / Supervisor</Label>
              <Input
                placeholder="Nome completo"
                value={signatures.supervisor}
                onChange={(e) => setSignatures((s) => ({ ...s, supervisor: e.target.value }))}
                className="h-8 text-xs"
                disabled={!!signatures.supervisorData}
              />
              {signatures.supervisorData ? (
                <p className="text-xs text-primary font-medium">
                  ✓ Assinado em {formatSignDate(signatures.supervisorData)}
                </p>
              ) : (
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => signField("supervisor")}>
                  <PenLine className="w-3 h-3 mr-1" /> Assinar
                </Button>
              )}
            </div>

            {/* RT */}
            <div className="space-y-2 p-3 border border-border rounded-lg">
              <Label className="text-xs font-semibold text-foreground">Responsável Técnico (RT)</Label>
              <Input
                placeholder="Nome completo"
                value={signatures.rt}
                onChange={(e) => setSignatures((s) => ({ ...s, rt: e.target.value }))}
                className="h-8 text-xs"
                disabled={!!signatures.rtData}
              />
              <Input
                placeholder="CRMV"
                value={signatures.rtCrmv}
                onChange={(e) => setSignatures((s) => ({ ...s, rtCrmv: e.target.value }))}
                className="h-8 text-xs"
                disabled={!!signatures.rtData}
              />
              {signatures.rtData ? (
                <p className="text-xs text-primary font-medium">
                  ✓ Assinado em {formatSignDate(signatures.rtData)}
                </p>
              ) : (
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => signField("rt")}>
                  <PenLine className="w-3 h-3 mr-1" /> Assinar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          *C = Conforme | NC = Não Conforme | Clique para alternar. Em caso de NC, emitir RNC.
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportExcel}
          />
           <Button variant="outline" onClick={printPlanilha}>
            <Printer className="w-4 h-4 mr-1" /> Imprimir PDF
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-1" /> Baixar Template
          </Button>
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
