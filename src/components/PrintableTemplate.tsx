
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PrintableTemplateProps {
  id: string;
  title: string;
  subtitle?: string;
  data: (string | number | boolean | null)[][];
  headerInfo?: { label: string; value: string }[];
}

export const PrintableTemplate: React.FC<PrintableTemplateProps> = ({
  id,
  title,
  subtitle,
  data,
  headerInfo
}) => {
  return (
    <div id={id} className="p-8 bg-white text-black min-h-screen">
      <div className="border-2 border-black p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold uppercase">{title}</h1>
            {subtitle && <p className="text-sm">{subtitle}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold">SISTEMA DE GESTÃO BPF</p>
            <p className="text-xs">Documento Controlado</p>
          </div>
        </div>

        {headerInfo && (
          <div className="grid grid-cols-2 gap-4 border-t border-black pt-4 mb-4">
            {headerInfo.map((info, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="font-bold">{info.label}:</span>
                <span className="border-b border-black flex-1"></span>
              </div>
            ))}
          </div>
        )}
      </div>

      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr className="bg-gray-100">
            {data[0]?.map((cell, idx) => (
              <th key={idx} className="border border-black p-2 text-left font-bold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="border border-black p-2">
                  {cell === "☐" || cell === "☐C ☐NC" || cell === "☐S ☐N" ? (
                    <div className="w-4 h-4 border border-black inline-block mr-1"></div>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 grid grid-cols-2 gap-12">
        <div className="text-center">
          <div className="border-t border-black pt-2">
            <p className="font-bold">Responsável Técnico</p>
            <p className="text-xs">Assinatura / CRMV</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-2">
            <p className="font-bold">Supervisor / Qualidade</p>
            <p className="text-xs">Assinatura / Data</p>
          </div>
        </div>
      </div>
    </div>
  );
};
