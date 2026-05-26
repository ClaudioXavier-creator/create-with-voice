
import React from "react";
import { format } from "date-fns";

interface PrintableTemplateProps {
  id: string;
  title: string;
  subtitle?: string;
  codigo?: string;
  revisao?: string;
  data: (string | number | boolean | null)[][];
  headerInfo?: { label: string; value: string }[];
  footerNote?: string;
  showSignatureBlocks?: boolean;
}

export const PrintableTemplate: React.FC<PrintableTemplateProps> = ({
  id,
  title,
  subtitle,
  codigo = "MOD-BPF-01",
  revisao = "00",
  data,
  headerInfo,
  footerNote,
  showSignatureBlocks = true
}) => {
  return (
    <div 
      id={id} 
      className="bg-white text-black min-h-[297mm] w-full max-w-[210mm] mx-auto print:p-0 p-8 shadow-md print:shadow-none"
      style={{ fontFamily: "'Inter', 'Arial', sans-serif" }}
    >
      {/* Cabeçalho Profissional */}
      <div className="border-[1.5pt] border-black mb-6">
        <div className="flex divide-x-[1.5pt] divide-black h-24">
          <div className="w-1/4 p-4 flex flex-col items-center justify-center text-center">
            <div className="font-bold text-primary text-sm tracking-tighter mb-1">BPF DIGITAL</div>
            <div className="text-[8px] uppercase font-semibold text-gray-500 leading-tight">
              Gestão da Qualidade &<br />Segurança Alimentar
            </div>
          </div>
          <div className="w-2/4 p-4 flex flex-col items-center justify-center text-center bg-gray-50/50 print-force-bg">
            <h1 className="text-lg font-bold uppercase leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-[10px] mt-1 uppercase font-bold text-primary italic">
                {subtitle}
              </p>
            )}
          </div>
          <div className="w-1/4 p-3 text-[9px] flex flex-col justify-between">
            <div className="flex justify-between">
              <span className="font-bold">CÓDIGO:</span>
              <span>{codigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">REVISÃO:</span>
              <span>{revisao}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">DATA:</span>
              <span>{format(new Date(), "dd/MM/yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">PÁGINA:</span>
              <span>1 de 1</span>
            </div>
          </div>
        </div>

        {headerInfo && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-[10px] border-t-[1.5pt] border-black bg-gray-50/30 print-force-bg">
            {headerInfo.map((info, idx) => (
              <div key={idx} className="flex gap-2 items-baseline">
                <span className="font-bold whitespace-nowrap uppercase text-[9px] text-gray-700">{info.label}:</span>
                <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                  {info.value || "___________________________"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de Dados Refinada */}
      <div className="mb-8">
        <table className="w-full border-collapse border-[1.5pt] border-black text-[10px]">
          <thead>
            <tr className="bg-gray-100 print-force-bg">
              {data[0]?.map((cell, idx) => (
                <th key={idx} className="border border-black p-2 text-center font-bold uppercase tracking-wide bg-gray-100">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.length > 1 ? data.slice(1) : Array.from({ length: 12 }).map(() => Array(data[0]?.length).fill(""))).map((row, rowIdx) => (
              <tr key={rowIdx} className="h-9">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-black p-1.5 text-center align-middle">
                    {typeof cell === "string" && (cell.includes("☐") || cell.includes("☑")) ? (
                      <div className="flex items-center justify-center gap-2">
                        {cell.split(" ").map((part, pIdx) => (
                          <span key={pIdx} className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center text-[10px]">
                              {part.startsWith("☑") ? "X" : ""}
                            </span>
                            <span className="text-[8px]">{part.replace(/[☐☑]/, "")}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="break-words leading-tight">{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé de Assinaturas Estilizado */}
      {showSignatureBlocks && (
        <div className="mt-auto pt-10 grid grid-cols-3 gap-6 text-center text-[9px]">
          <div className="space-y-1">
            <div className="border-t-[1pt] border-black pt-2 px-2">
              <p className="font-bold uppercase">Executor</p>
              <p className="text-[8px] text-gray-500 italic uppercase">Assinatura / Nome Legível</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="border-t-[1pt] border-black pt-2 px-2">
              <p className="font-bold uppercase">Supervisor</p>
              <p className="text-[8px] text-gray-500 italic uppercase">Assinatura / Data</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="border-t-[1pt] border-black pt-2 px-2">
              <p className="font-bold uppercase">Responsável Técnico</p>
              <p className="text-[8px] text-gray-500 italic uppercase">Assinatura / CRMV / Data</p>
            </div>
          </div>
        </div>
      )}

      {/* Notas de Rodapé e Controle */}
      <div className="mt-8 border-t-[0.5pt] border-gray-300 pt-3 flex justify-between items-center">
        <div className="text-[8px] text-gray-500 italic space-y-0.5">
          <p>Documento controlado pelo Sistema Digital de Gestão da Qualidade - BPF.</p>
          <p>Proibida a reprodução parcial ou total deste documento sem prévia autorização.</p>
          {footerNote && <p className="text-primary font-medium mt-1">{footerNote}</p>}
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded border border-gray-200 text-[8px] font-mono text-gray-400">
          ID: {id.split("-")[0]?.toUpperCase()} | BPF-DIGITAL-SYSTEM
        </div>
      </div>
    </div>
  );
};


